# Mã nguồn Ruby hoàn chỉnh 100%
module KiotDenLed240X160X200
  def self.build
    model = Sketchup.active_model
    model.start_operation('KiotDenLed240X160X200', true)
    entities = model.active_entities

    # Thông số chính
    width = 2400.mm
    height = 1600.mm
    depth = 2000.mm
    frame_thickness = 30.mm
    alu_thickness = 3.mm
    wood_thickness = 18.mm
    panel_orange = 400.mm
    logo_radius = 200.mm
    wheel_radius = 60.mm

    # Màu sắc
    color_alu = "#f5f5f5"
    color_orange = "#ff6600"
    color_white = "#ffffff"
    color_red = "#e53935"
    color_wood = "#8d6748"
    color_frame = "#b0b0b0"
    color_logo = "#ff6600"
    color_wheel = "#666666"

    # 1. Khung sắt hộp 30x30mm
    frame_group = entities.add_group
    frame = frame_group.entities

    # Khung ngoài
    frame.add_face([0,0,0],[width,0,0],[width,depth,0],[0,depth,0]).pushpull(frame_thickness)
    frame.add_face([0,0,height-frame_thickness],[width,0,height-frame_thickness],[width,depth,height-frame_thickness],[0,depth,height-frame_thickness]).pushpull(frame_thickness)
    frame.add_face([0,0,0],[frame_thickness,0,0],[frame_thickness,0,height],[0,0,height]).pushpull(depth)
    frame.add_face([width-frame_thickness,0,0],[width,0,0],[width,0,height],[width-frame_thickness,0,height]).pushpull(depth)
    frame.add_face([0,depth,0],[frame_thickness,depth,0],[frame_thickness,depth,height],[0,depth,height]).pushpull(-frame_thickness)
    frame.add_face([width-frame_thickness,depth,0],[width,depth,0],[width,depth,height],[width-frame_thickness,depth,height]).pushpull(-frame_thickness)

    # Xương đứng chia đều mỗi 500mm
    (1..3).each do |i|
      x = i * (width/4)
      frame.add_face([x,0,frame_thickness],[x+frame_thickness,0,frame_thickness],[x+frame_thickness,0,height-frame_thickness],[x,0,height-frame_thickness]).pushpull(depth-frame_thickness*2)
    end

    # Xương ngang tăng cứng
    [height/2, height*0.75].each do |z|
      frame.add_face([0,0,z],[width,0,z],[width,frame_thickness,z],[0,frame_thickness,z]).pushpull(depth-frame_thickness*2)
    end

    # 2. Tấm nền alu composite
    alu_group = entities.add_group
    alu = alu_group.entities
    # Mặt trước
    face = alu.add_face([frame_thickness,frame_thickness,frame_thickness],[width-frame_thickness,frame_thickness,frame_thickness],[width-frame_thickness,frame_thickness,height-frame_thickness],[frame_thickness,frame_thickness,height-frame_thickness])
    face.pushpull(-alu_thickness)
    alu_group.material = color_alu

    # 3. Mảng alu cam trang trí hai bên
    orange_group = entities.add_group
    orange = orange_group.entities
    # Bên trái
    face = orange.add_face([frame_thickness+alu_thickness,frame_thickness+alu_thickness,frame_thickness+1.mm],
                           [frame_thickness+panel_orange,frame_thickness+alu_thickness,frame_thickness+1.mm],
                           [frame_thickness+panel_orange,frame_thickness+alu_thickness,height-frame_thickness-alu_thickness],
                           [frame_thickness+alu_thickness,frame_thickness+alu_thickness,height-frame_thickness-alu_thickness])
    face.pushpull(-alu_thickness)
    # Bên phải
    face = orange.add_face([width-frame_thickness-panel_orange,frame_thickness+alu_thickness,frame_thickness+1.mm],
                           [width-frame_thickness-alu_thickness,frame_thickness+alu_thickness,frame_thickness+1.mm],
                           [width-frame_thickness-alu_thickness,frame_thickness+alu_thickness,height-frame_thickness-alu_thickness],
                           [width-frame_thickness-panel_orange,frame_thickness+alu_thickness,height-frame_thickness-alu_thickness])
    face.pushpull(-alu_thickness)
    orange_group.material = color_orange

    # 4. Mặt ốp gỗ phía trước
    wood_group = entities.add_group
    wood = wood_group.entities
    wood_height = 350.mm
    wood_top = 600.mm
    face = wood.add_face([frame_thickness+alu_thickness,frame_thickness+alu_thickness,wood_top],
                         [width-frame_thickness-alu_thickness,frame_thickness+alu_thickness,wood_top],
                         [width-frame_thickness-alu_thickness,frame_thickness+alu_thickness,wood_top+wood_height],
                         [frame_thickness+alu_thickness,frame_thickness+alu_thickness,wood_top+wood_height])
    face.pushpull(-wood_thickness)
    wood_group.material = color_wood

    # 5. Logo tròn mặt trước
    logo_group = entities.add_group
    logo = logo_group.entities
    center_x = width/2
    center_y = frame_thickness+alu_thickness+wood_thickness+1.mm
    center_z = wood_top + wood_height/2
    circle = logo.add_circle([center_x, center_y, center_z], [0,1,0], logo_radius, 48)
    face = logo.add_face(circle)
    face.pushpull(10.mm)
    logo_group.material = color_white
    # Vẽ viền cam cho logo
    circle2 = logo.add_circle([center_x, center_y, center_z+10.mm], [0,1,0], logo_radius-10.mm, 48)
    face2 = logo.add_face(circle2)
    face2.pushpull(2.mm)
    face2.material = color_logo

    # 6. Chữ nổi "PHỞ THU" trên nóc
    text_group = entities.add_group
    text = text_group.entities
    text_height = 200.mm
    text_depth = 60.mm
    text_x = width/2 - 350.mm
    text_y = depth/2 - 100.mm
    text_z = height + 100.mm
    phothu = text.add_3d_text("PHỞ THU",
      TextAlignCenter,
      "Arial Black",
      false, false,
      text_height,
      text_depth,
      0, true, 0)
    phothu_group = text_group.entities.add_group(phothu)
    phothu_group.material = color_white
    phothu_group.move!([width/2, depth/2, height+100.mm])
    # Viền cam cho chữ (tạo offset khối chữ)
    # (Đơn giản hóa: tạo khối cam phía sau chữ)
    cam_bg = text.add_face([width/2-400.mm, depth/2-40.mm, height+90.mm],
                          [width/2+400.mm, depth/2-40.mm, height+90.mm],
                          [width/2+400.mm, depth/2+40.mm, height+90.mm],
                          [width/2-400.mm, depth/2+40.mm, height+90.mm])
    cam_bg.pushpull(20.mm)
    cam_bg.material = color_orange

    # 7. Chữ nổi "GIA TRUYỀN NAM ĐỊNH"
    text2_group = entities.add_group
    text2 = text2_group.entities
    text2_height = 90.mm
    text2_depth = 20.mm
    text2_obj = text2.add_3d_text("GIA TRUYỀN NAM ĐỊNH",
      TextAlignCenter,
      "Arial Black",
      false, false,
      text2_height,
      text2_depth,
      0, true, 0)
    text2_group.entities.add_group(text2_obj)
    text2_group.material = color_red
    text2_group.move!([width/2, frame_thickness+alu_thickness+10.mm, height-220.mm])

    # 8. Bánh xe di động
    4.times do |i|
      wheel_group = entities.add_group
      wheel = wheel_group.entities
      x = i < 2 ? frame_thickness+wheel_radius : width-frame_thickness-wheel_radius
      y = i.even? ? frame_thickness+wheel_radius : depth-frame_thickness-wheel_radius
      circle = wheel.add_circle([x, y, 0], [0,0,1], wheel_radius, 24)
      face = wheel.add_face(circle)
      face.pushpull(20.mm)
      wheel_group.material = color_wheel
    end

    model.commit_operation
  end
end
KiotDenLed240X160X200.build