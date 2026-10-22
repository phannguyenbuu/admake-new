# Mã nguồn Ruby hoàn chỉnh 100%
module ChuNoiAluDanTuong
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuNoiAluDanTuong', true)
    entities = model.active_entities

    # Kích thước tổng thể
    width = 1200.mm
    height = 400.mm
    depth = 60.mm

    # Tạo nền tường (giả bê tông)
    wall_face = entities.add_face([0,0,0], [width,0,0], [width,height,0], [0,height,0])
    wall_face.pushpull(-20.mm)
    wall_material = model.materials.add('WallConcrete')
    wall_material.color = Sketchup::Color.new('#888888')
    wall_face.material = wall_material
    wall_face.back_material = wall_material

    # Khung xương sắt hộp 25x25mm (ẩn phía sau)
    frame_group = entities.add_group
    frame = frame_group.entities
    box = 25.mm
    # Viền ngoài
    frame.add_face([0,0,-25.mm], [width,0,-25.mm], [width,box,-25.mm], [0,box,-25.mm]).pushpull(height-box)
    frame.add_face([0,height-box,-25.mm], [width,height-box,-25.mm], [width,height,-25.mm], [0,height,-25.mm]).pushpull(box)
    frame.add_face([0,0,-25.mm], [box,0,-25.mm], [box,height,-25.mm], [0,height,-25.mm]).pushpull(box)
    frame.add_face([width-box,0,-25.mm], [width,0,-25.mm], [width,height,-25.mm], [width-box,height,-25.mm]).pushpull(box)
    # Xương đứng
    (1..1).each do |i|
      x = i * width/2
      frame.add_face([x,0,-25.mm], [x+box,0,-25.mm], [x+box,height,-25.mm], [x,height,-25.mm]).pushpull(box)
    end
    # Xương ngang
    (1..1).each do |i|
      y = i * height/2
      frame.add_face([0,y,-25.mm], [width,y,-25.mm], [width,y+box,-25.mm], [0,y+box,-25.mm]).pushpull(box)
    end

    # Chữ nổi lớn "THẢO"
    text_group = entities.add_group
    text_entities = text_group.entities
    text1 = "THẢO"
    text1_material = model.materials.add('Text1Orange')
    text1_material.color = Sketchup::Color.new('#FF4B1F')
    text1_3d = text_entities.add_3d_text(
      text1,
      TextAlignLeft,
      "Arial Black",
      false, false,
      180.mm, # chiều cao chữ
      30.mm,  # độ dày nổi
      0,      # độ nghiêng
      true,   # filled
      false   # extruded
    )
    text1_3d.material = text1_material
    text1_3d.transformation = Geom::Transformation.new([80.mm, 200.mm, 20.mm])

    # Chữ nổi lớn "MIN"
    text2 = "MIN"
    text2_material = model.materials.add('Text2Black')
    text2_material.color = Sketchup::Color.new('#222222')
    text2_3d = text_entities.add_3d_text(
      text2,
      TextAlignLeft,
      "Arial Black",
      false, false,
      180.mm,
      30.mm,
      0,
      true,
      false
    )
    text2_3d.material = text2_material
    text2_3d.transformation = Geom::Transformation.new([420.mm, 200.mm, 20.mm])

    # Chữ phụ "StepHi - BodyFit"
    text3 = "StepHi - BodyFit"
    text3_material = model.materials.add('Text3Black')
    text3_material.color = Sketchup::Color.new('#222222')
    text3_3d = text_entities.add_3d_text(
      text3,
      TextAlignLeft,
      "Arial",
      false, false,
      60.mm,
      15.mm,
      0,
      true,
      false
    )
    text3_3d.material = text3_material
    text3_3d.transformation = Geom::Transformation.new([100.mm, 80.mm, 20.mm])

    # Gạch cam dưới chữ phụ
    underline_group = entities.add_group
    underline = underline_group.entities
    underline_face = underline.add_face([80.mm, 70.mm, 20.mm], [220.mm, 70.mm, 20.mm], [220.mm, 85.mm, 20.mm], [80.mm, 85.mm, 20.mm])
    underline_face.pushpull(8.mm)
    underline_material = model.materials.add('UnderlineOrange')
    underline_material.color = Sketchup::Color.new('#FF4B1F')
    underline_face.material = underline_material

    # Đèn LED mũi tên hai bên (mô phỏng bằng khối hộp vàng)
    led_group = entities.add_group
    led = led_group.entities
    led_material = model.materials.add('LEDYellow')
    led_material.color = Sketchup::Color.new('#FFD700')
    # Bên trái
    led.add_face([20.mm, 350.mm, 10.mm], [60.mm, 390.mm, 10.mm], [70.mm, 380.mm, 10.mm], [30.mm, 340.mm, 10.mm]).pushpull(5.mm)
    led.add_face([60.mm, 390.mm, 10.mm], [120.mm, 330.mm, 10.mm], [130.mm, 340.mm, 10.mm], [70.mm, 380.mm, 10.mm]).pushpull(5.mm)
    # Bên phải
    led.add_face([width-20.mm, 350.mm, 10.mm], [width-60.mm, 390.mm, 10.mm], [width-70.mm, 380.mm, 10.mm], [width-30.mm, 340.mm, 10.mm]).pushpull(5.mm)
    led.add_face([width-60.mm, 390.mm, 10.mm], [width-120.mm, 330.mm, 10.mm], [width-130.mm, 340.mm, 10.mm], [width-70.mm, 380.mm, 10.mm]).pushpull(5.mm)
    led_group.material = led_material

    model.commit_operation
  end
end
ChuNoiAluDanTuong.build