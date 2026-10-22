# Mã nguồn Ruby hoàn chỉnh 100%
module LedXinhanMuiTen120X50
  def self.build
    model = Sketchup.active_model
    model.start_operation('LedXinhanMuiTen120X50', true)
    entities = model.active_entities

    # Thông số chính
    width = 1200.mm
    height = 500.mm
    depth = 30.mm
    frame_thickness = 25.mm
    border_width = 20.mm
    led_radius = 5.mm
    led_spacing = 35.mm
    text_thickness = 20.mm

    # Tạo nhóm tổng thể
    group = entities.add_group
    ents = group.entities

    # 1. Khung xương sắt hộp (25x25mm)
    frame = ents.add_group
    fw = frame_thickness
    # Khung ngoài
    frame.entities.add_face([0,0,0],[width,0,0],[width,height,0],[0,height,0]).pushpull(-fw)
    # Xương đứng
    frame.entities.add_face([fw+500.mm,fw,0],[fw+500.mm,fw,height-fw],[fw+500.mm+fw,fw,height-fw],[fw+500.mm+fw,fw,0]).pushpull(-fw)
    # Xương ngang tăng cứng
    frame.entities.add_face([fw,fw+250.mm,0],[width-fw,fw+250.mm,0],[width-fw,fw+250.mm,fw],[fw,fw+250.mm,fw])
    # Chân đế
    leg1 = frame.entities.add_group
    leg1.entities.add_face([width-80.mm, -fw-40.mm, 0], [width-50.mm, -fw-40.mm, 0], [width-50.mm, -fw, 0], [width-80.mm, -fw, 0]).pushpull(-70.mm)
    leg2 = frame.entities.add_group
    leg2.entities.add_face([80.mm, -fw-40.mm, 0], [50.mm, -fw-40.mm, 0], [50.mm, -fw, 0], [80.mm, -fw, 0]).pushpull(-70.mm)

    # 2. Tấm nền mặt biển (mũi tên)
    # Vẽ hình mũi tên bằng các điểm polyline
    arrow_pts = [
      [0, height/2, fw],                 # Đầu mũi tên trái
      [100.mm, height, fw],              # Góc trên mũi tên
      [width-100.mm, height, fw],        # Đỉnh trên phải
      [width-100.mm, height-120.mm, fw], # Gấp xuống
      [width, height-120.mm, fw],        # Đầu phải
      [width, 120.mm, fw],               # Gấp lên
      [width-100.mm, 120.mm, fw],        # Đỉnh dưới phải
      [width-100.mm, 0, fw],             # Góc dưới
      [100.mm, 0, fw],                   # Đuôi dưới
    ]
    arrow_face = ents.add_face(arrow_pts)
    arrow_face.pushpull(depth-fw)

    # Tô màu nền xanh dương
    mat_bg = model.materials.add('BG_BLUE')
    mat_bg.color = Sketchup::Color.new('#0018A8')
    arrow_face.material = mat_bg
    arrow_face.back_material = mat_bg

    # 3. Viền nẹp alu trắng xám
    border = ents.add_group
    offset = 0
    border_pts = arrow_pts.map { |pt| [pt[0]+offset, pt[1]+offset, pt[2]+depth-fw] }
    border_face = border.entities.add_face(border_pts)
    border_face.pushpull(border_width)

    mat_border = model.materials.add('BORDER_WHITE')
    mat_border.color = Sketchup::Color.new('#E6E6E6')
    border_face.material = mat_border
    border_face.back_material = mat_border

    # 4. Chữ nổi "AN LAND GARDEN"
    text = ents.add_group
    text_string = "AN LAND GARDEN"
    text_pos = Geom::Point3d.new(width/2-230.mm, height/2-30.mm, fw+10.mm)
    text.entities.add_3d_text(
      text_string,
      TextAlignCenter,
      "Arial Rounded MT Bold",
      false, false,
      100.mm, text_thickness, 0, true, text_pos
    )
    mat_text = model.materials.add('TEXT_YELLOW')
    mat_text.color = Sketchup::Color.new('#FFE600')
    text.entities.grep(Sketchup::Face).each { |f| f.material = mat_text; f.back_material = mat_text }

    # 5. LED viền (đỏ + xanh dương)
    led_group = ents.add_group
    # LED chạy viền ngoài (đỏ)
    led_pts = []
    (0..8).each do |i|
      led_pts << arrow_pts[i]
      next_pt = arrow_pts[(i+1)%arrow_pts.size]
      dist = Math.sqrt((next_pt[0]-arrow_pts[i][0])**2 + (next_pt[1]-arrow_pts[i][1])**2)
      steps = (dist / led_spacing).to_i
      (1..steps).each do |s|
        led_pts << [
          arrow_pts[i][0] + (next_pt[0]-arrow_pts[i][0])*s/steps,
          arrow_pts[i][1] + (next_pt[1]-arrow_pts[i][1])*s/steps,
          fw+depth+border_width/2
        ]
      end
    end
    led_pts.each do |pt|
      led = led_group.entities.add_circle([pt[0], pt[1], pt[2]], [0,0,1], led_radius)
      led_face = led_group.entities.add_face(led)
      led_face.pushpull(led_radius)
    end
    mat_led_red = model.materials.add('LED_RED')
    mat_led_red.color = Sketchup::Color.new('#FF0000')
    led_group.entities.grep(Sketchup::Face).each { |f| f.material = mat_led_red; f.back_material = mat_led_red }

    # LED chạy viền trong (xanh dương)
    led_group2 = ents.add_group
    inner_offset = 40.mm
    inner_pts = arrow_pts.map { |pt| [pt[0]+inner_offset, pt[1]+(pt[1]<height/2 ? inner_offset : -inner_offset), pt[2]+fw+depth/2] }
    led_pts2 = []
    (0..8).each do |i|
      led_pts2 << inner_pts[i]
      next_pt = inner_pts[(i+1)%inner_pts.size]
      dist = Math.sqrt((next_pt[0]-inner_pts[i][0])**2 + (next_pt[1]-inner_pts[i][1])**2)
      steps = (dist / led_spacing).to_i
      (1..steps).each do |s|
        led_pts2 << [
          inner_pts[i][0] + (next_pt[0]-inner_pts[i][0])*s/steps,
          inner_pts[i][1] + (next_pt[1]-inner_pts[i][1])*s/steps,
          fw+depth/2
        ]
      end
    end
    led_pts2.each do |pt|
      led = led_group2.entities.add_circle([pt[0], pt[1], pt[2]], [0,0,1], led_radius)
      led_face = led_group2.entities.add_face(led)
      led_face.pushpull(led_radius)
    end
    mat_led_blue = model.materials.add('LED_BLUE')
    mat_led_blue.color = Sketchup::Color.new('#00BFFF')
    led_group2.entities.grep(Sketchup::Face).each { |f| f.material = mat_led_blue; f.back_material = mat_led_blue }

    model.commit_operation
  end
end
LedXinhanMuiTen120X50.build