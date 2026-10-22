# Mã nguồn Ruby hoàn chỉnh 100% dựng trần alu gương bóng BUB viền khung nhôm, có đèn LED
module TranAluGuongBongBubVienKhungNhom
  def self.build
    model = Sketchup.active_model
    model.start_operation('TranAluGuongBongBubVienKhungNhom', true)
    entities = model.active_entities

    # Kích thước tổng thể
    width = 3000.mm
    height = 1000.mm
    depth = 150.mm
    alu_thickness = 3.mm
    frame_thickness = 50.mm
    frame_width = frame_thickness
    led_radius = 25.mm
    led_height = 30.mm

    # Tạo khung xương sắt hộp (25x25mm)
    khung_group = entities.add_group
    khung = khung_group.entities
    sắt = 25.mm

    # Khung viền ngoài
    [
      [0,0,0], [width,0,0], [width,height,0], [0,height,0]
    ].each_with_index do |pt, i|
      next_pt = [
        [width,0,0], [width,height,0], [0,height,0], [0,0,0]
      ][i]
      khung.add_face(pt, [pt[0],pt[1],sắt], [next_pt[0],next_pt[1],sắt], next_pt).pushpull(sắt)
    end

    # Xương ngang tăng cứng (cách nhau ~500mm)
    (1..5).each do |i|
      x = i * width/6
      khung.add_face([x,0,0],[x,0,sắt],[x,height,sắt],[x,height,0]).pushpull(sắt)
    end

    # Xương dọc tăng cứng (cách nhau ~500mm)
    (1..1).each do |i|
      y = i * height/2
      khung.add_face([0,y,0],[0,y,sắt],[width,y,sắt],[width,y,0]).pushpull(sắt)
    end

    # Tai treo trần (4 góc)
    4.times do |i|
      x = (i==1 || i==2) ? width : 0
      y = (i>=2) ? height : 0
      khung.add_face([x,y,sắt],[x+50.mm,y,sắt],[x+50.mm,y+50.mm,sắt],[x,y+50.mm,sắt]).pushpull(10.mm)
    end

    # Tạo tấm alu gương bóng (nền)
    alu_group = entities.add_group
    alu = alu_group.entities
    alu_face = alu.add_face([0,0,sắt],[width,0,sắt],[width,height,sắt],[0,height,sắt])
    alu_face.pushpull(alu_thickness)
    # Màu gương bóng
    mat_alu = model.materials.add('AluMirror')
    mat_alu.color = Sketchup::Color.new('#E5E5E5')
    mat_alu.alpha = 0.7
    alu_face.material = mat_alu
    alu_face.back_material = mat_alu

    # Tạo viền khung nhôm hộp (50mm)
    frame_group = entities.add_group
    frame = frame_group.entities
    # 4 cạnh viền
    [
      [[0,0,sắt+alu_thickness],[width,0,sắt+alu_thickness],[width,0,sắt+alu_thickness+frame_thickness],[0,0,sắt+alu_thickness+frame_thickness]],
      [[width,0,sắt+alu_thickness],[width,height,sắt+alu_thickness],[width,height,sắt+alu_thickness+frame_thickness],[width,0,sắt+alu_thickness+frame_thickness]],
      [[width,height,sắt+alu_thickness],[0,height,sắt+alu_thickness],[0,height,sắt+alu_thickness+frame_thickness],[width,height,sắt+alu_thickness+frame_thickness]],
      [[0,height,sắt+alu_thickness],[0,0,sắt+alu_thickness],[0,0,sắt+alu_thickness+frame_thickness],[0,height,sắt+alu_thickness+frame_thickness]]
    ].each do |pts|
      f = frame.add_face(pts)
      f.pushpull(frame_width)
    end
    # Màu viền nhôm
    mat_frame = model.materials.add('FrameAlu')
    mat_frame.color = Sketchup::Color.new('#F5F5F5')
    frame_group.material = mat_frame

    # Đèn LED bulb tròn (bố trí lưới đều)
    led_group = entities.add_group
    led = led_group.entities
    led_rows = 4
    led_cols = 10
    x0 = width/(led_cols+1)
    y0 = height/(led_rows+1)
    (1..led_cols).each do |i|
      (1..led_rows).each do |j|
        cx = i*x0
        cy = j*y0
        center = Geom::Point3d.new(cx, cy, sắt+alu_thickness+10.mm)
        led_face = led.add_circle(center, [0,0,1], led_radius, 24)
        led_cyl = led.add_face(led_face)
        led_cyl.pushpull(led_height)
        # Màu đèn LED
        mat_led = model.materials.add("LED_#{i}_#{j}")
        mat_led.color = Sketchup::Color.new('#F8FCFF')
        mat_led.alpha = 0.85
        led_cyl.material = mat_led
        led_cyl.back_material = mat_led
      end
    end

    # Đặt tên nhóm cho dễ quản lý
    khung_group.name = "Khung xương sắt hộp"
    alu_group.name = "Tấm alu gương bóng"
    frame_group.name = "Viền khung nhôm"
    led_group.name = "Đèn LED bulb"

    model.commit_operation
  end
end
TranAluGuongBongBubVienKhungNhom.build