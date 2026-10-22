# Mã nguồn Ruby hoàn chỉnh 100%
module BangHieuAluChuNoi450X160
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuAluChuNoi450X160', true)
    entities = model.active_entities

    # Thông số chính
    width = 4500.mm
    height = 1600.mm
    depth = 30.mm
    frame_thick = 30.mm
    frame_size = 30.mm

    # Màu sắc
    color_alu = Sketchup::Color.new("#F7F7F7")
    color_frame = Sketchup::Color.new("#E6E6E6")
    color_text = Sketchup::Color.new("#222222")
    color_led = Sketchup::Color.new("#FFFFFF")

    # 1. Khung xương sắt hộp 30x30mm
    frame_group = entities.add_group
    frame = frame_group.entities

    # Khung viền ngoài
    [
      [0,0,0], [width,0,0], [width,height,0], [0,height,0]
    ].each_with_index do |pt, i|
      next_pt = [
        [width,0,0], [width,height,0], [0,height,0], [0,0,0]
      ][i]
      frame.add_face(pt, [pt[0], pt[1], pt[2]+frame_size], [next_pt[0], next_pt[1], next_pt[2]+frame_size], next_pt).pushpull(frame_thick)
    end

    # Xương đứng cách nhau ~500mm
    (1..8).each do |i|
      x = i * (width/9)
      frame.add_face([x,0,0], [x,0,frame_size], [x,height,frame_size], [x,height,0]).pushpull(frame_thick)
    end

    # Xương ngang tăng cứng
    [height/3, 2*height/3].each do |y|
      frame.add_face([0,y,0], [0,y,frame_size], [width,y,frame_size], [width,y,0]).pushpull(frame_thick)
    end

    frame_group.material = color_frame

    # 2. Tấm nền alu composite
    alu_face = entities.add_face [0,0,frame_thick], [width,0,frame_thick], [width,height,frame_thick], [0,height,frame_thick]
    alu_face.pushpull(depth)
    alu_face.all_connected.each { |e| e.material = color_alu }

    # 3. Viền nẹp alu (bo quanh)
    border_group = entities.add_group
    border = border_group.entities
    border_width = 10.mm
    # Trên
    border.add_face([0,0,frame_thick+depth], [width,0,frame_thick+depth], [width,-border_width,frame_thick+depth], [0,-border_width,frame_thick+depth]).pushpull(border_width)
    # Dưới
    border.add_face([0,height,frame_thick+depth], [width,height,frame_thick+depth], [width,height+border_width,frame_thick+depth], [0,height+border_width,frame_thick+depth]).pushpull(border_width)
    # Trái
    border.add_face([-border_width,0,frame_thick+depth], [0,0,frame_thick+depth], [0,height,frame_thick+depth], [-border_width,height,frame_thick+depth]).pushpull(border_width)
    # Phải
    border.add_face([width,0,frame_thick+depth], [width+border_width,0,frame_thick+depth], [width+border_width,height,frame_thick+depth], [width,height,frame_thick+depth]).pushpull(border_width)
    border_group.material = color_frame

    # 4. Chữ nổi 3D: "THỦY NaBi"
    text_group = entities.add_group
    # "THỦY"
    text_group.entities.add_3d_text(
      "THỦY",
      TextAlignCenter,
      "Times New Roman",
      false, false,
      400.mm, # chiều cao chữ
      30.mm,  # độ dày chữ
      0,      # độ nghiêng
      true,   # filled
      0
    ).transform!(Geom::Transformation.new([width*0.27, height*0.65, frame_thick+depth+2.mm]))
    # "NaBi"
    text_group.entities.add_3d_text(
      "NaBi",
      TextAlignLeft,
      "Brush Script MT",
      false, false,
      250.mm,
      30.mm,
      0,
      true,
      0
    ).transform!(Geom::Transformation.new([width*0.53, height*0.65, frame_thick+depth+2.mm]))
    # Đặt màu chữ nổi
    text_group.material = color_text

    # 5. Dòng chữ phụ: "Tiệm thuê đồ bmt"
    text_group.entities.add_3d_text(
      "Tiệm thuê đồ bmt",
      TextAlignCenter,
      "Arial",
      false, false,
      110.mm,
      15.mm,
      0,
      true,
      0
    ).transform!(Geom::Transformation.new([width*0.5, height*0.45, frame_thick+depth+2.mm]))
    
    # 6. Nội dung phụ, icon, số điện thoại, địa chỉ
    # Địa chỉ
    text_group.entities.add_3d_text(
      "Đc: 09 Bà Triệu",
      TextAlignLeft,
      "Arial",
      false, false,
      60.mm,
      10.mm,
      0,
      true,
      0
    ).transform!(Geom::Transformation.new([width*0.08, height*0.18, frame_thick+depth+2.mm]))
    text_group.entities.add_3d_text(
      "P. Buôn Ma Thuột",
      TextAlignLeft,
      "Arial",
      false, false,
      60.mm,
      10.mm,
      0,
      true,
      0
    ).transform!(Geom::Transformation.new([width*0.08, height*0.11, frame_thick+depth+2.mm]))
    # Số điện thoại
    text_group.entities.add_3d_text(
      "Sđt: 0962085179",
      TextAlignCenter,
      "Arial",
      false, false,
      60.mm,
      10.mm,
      0,
      true,
      0
    ).transform!(Geom::Transformation.new([width*0.5, height*0.145, frame_thick+depth+2.mm]))
    # Facebook
    text_group.entities.add_3d_text(
      "Thủy NaBi",
      TextAlignRight,
      "Arial",
      false, false,
      60.mm,
      10.mm,
      0,
      true,
      0
    ).transform!(Geom::Transformation.new([width*0.92, height*0.145, frame_thick+depth+2.mm]))

    # Icon location
    icon_group = entities.add_group
    center_icon = [width*0.045, height*0.16, frame_thick+depth+2.mm]
    icon_radius = 30.mm
    icon_face = icon_group.entities.add_circle(center_icon, [0,0,1], icon_radius)
    icon_group.entities.add_face(icon_face).pushpull(5.mm)
    icon_group.material = color_text

    # Icon phone
    center_icon2 = [width*0.37, height*0.16, frame_thick+depth+2.mm]
    icon2_face = icon_group.entities.add_circle(center_icon2, [0,0,1], icon_radius)
    icon_group.entities.add_face(icon2_face).pushpull(5.mm)
    icon_group.material = color_text

    # Icon facebook
    center_icon3 = [width*0.82, height*0.16, frame_thick+depth+2.mm]
    icon3_face = icon_group.entities.add_circle(center_icon3, [0,0,1], icon_radius)
    icon_group.entities.add_face(icon3_face).pushpull(5.mm)
    icon_group.material = color_text

    # 7. LED hắt chân chữ (mô phỏng viền sáng)
    led_group = entities.add_group
    led_rect = led_group.entities.add_face(
      [width*0.18, height*0.6, frame_thick+depth+1.mm],
      [width*0.82, height*0.6, frame_thick+depth+1.mm],
      [width*0.82, height*0.75, frame_thick+depth+1.mm],
      [width*0.18, height*0.75, frame_thick+depth+1.mm]
    )
    led_rect.pushpull(2.mm)
    led_group.material = color_led
    led_group.material.alpha = 0.2

    model.commit_operation
  end
end
BangHieuAluChuNoi450X160.build