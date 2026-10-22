# Mã nguồn Ruby hoàn chỉnh 100%
module ChuInox304MatMica
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuInox304MatMica', true)
    entities = model.active_entities

    # --- Kích thước tổng thể ---
    width = 1200.mm
    height = 400.mm
    depth = 60.mm

    # --- Khung xương sắt hộp ---
    frame_thickness = 25.mm
    frame_group = entities.add_group
    frame = frame_group.entities

    # Viền ngoài
    frame.add_face([0,0,0], [width,0,0], [width,height,0], [0,height,0]).pushpull(-frame_thickness)
    # Xương đứng
    frame.add_face([width/2-frame_thickness/2,0,0], [width/2+frame_thickness/2,0,0], [width/2+frame_thickness/2,height,0], [width/2-frame_thickness/2,height,0]).pushpull(-frame_thickness)
    # Xương ngang tăng cứng
    frame.add_face([0,height/2-frame_thickness/2,0], [width,height/2-frame_thickness/2,0], [width,height/2+frame_thickness/2,0], [0,height/2+frame_thickness/2,0]).pushpull(-frame_thickness)

    # --- Tấm nền alu xước bạc ---
    alu_thickness = 3.mm
    alu_group = entities.add_group
    alu = alu_group.entities
    face = alu.add_face([0,0,frame_thickness], [width,0,frame_thickness], [width,height,frame_thickness], [0,height,frame_thickness])
    face.pushpull(alu_thickness)
    # Màu nền alu xước bạc
    mat_alu = model.materials.add('AluBac')
    mat_alu.color = Sketchup::Color.new('#D9D9D6')
    alu_group.material = mat_alu
    alu_group.layer = 'NEN'

    # --- Viền nẹp alu vàng gương ---
    border_thick = 10.mm
    border_group = entities.add_group
    border = border_group.entities
    # Viền ngoài
    outer = [
      [0-border_thick,0-border_thick,frame_thickness+alu_thickness],
      [width+border_thick,0-border_thick,frame_thickness+alu_thickness],
      [width+border_thick,height+border_thick,frame_thickness+alu_thickness],
      [0-border_thick,height+border_thick,frame_thickness+alu_thickness]
    ]
    inner = [
      [0,0,frame_thickness+alu_thickness],
      [width,0,frame_thickness+alu_thickness],
      [width,height,frame_thickness+alu_thickness],
      [0,height,frame_thickness+alu_thickness]
    ]
    border_face = border.add_face(outer)
    border_face.followme(border.add_face(inner).edges)
    # Màu viền vàng gương
    mat_border = model.materials.add('InoxVangGuong')
    mat_border.color = Sketchup::Color.new('#FFD700')
    border_group.material = mat_border

    # --- Chữ nổi 3D: "ALWAYS", "YOU", "OF" ---
    # Thông số chữ
    text_height_main = 120.mm
    text_depth_main = 30.mm
    text_font = "Arial Black"
    text_spacing = 30.mm

    # Chữ "ALWAYS"
    always_group = entities.add_group
    always = always_group.entities
    text1 = always.add_3d_text(
      "ALWAYS",
      TextAlignLeft = true,
      text_height_main,
      Bold = true,
      Italic = false,
      font = text_font,
      extrusion = text_depth_main,
      z = frame_thickness+alu_thickness
    )
    always_group.move!([60.mm, 220.mm, frame_thickness+alu_thickness])
    # Mặt mica vàng
    mat_mica_vang = model.materials.add('MicaVang')
    mat_mica_vang.color = Sketchup::Color.new('#FFE600')
    always_group.material = mat_mica_vang

    # Viền chỉ đen
    mat_black = model.materials.add('VienDen')
    mat_black.color = Sketchup::Color.new('#222222')
    always_group.entities.each do |e|
      e.material = mat_black if e.is_a?(Sketchup::Face) && e.normal.z.abs < 0.5
    end

    # Thành chữ inox vàng gương
    always_group.entities.each do |e|
      e.material = mat_border if e.is_a?(Sketchup::Face) && e.normal.z.abs < 0.1
    end

    # Chữ "YOU"
    you_group = entities.add_group
    you = you_group.entities
    text2 = you.add_3d_text(
      "YOU",
      TextAlignLeft = true,
      text_height_main,
      Bold = true,
      Italic = false,
      font = text_font,
      extrusion = text_depth_main,
      z = frame_thickness+alu_thickness
    )
    you_group.move!([60.mm, 80.mm, frame_thickness+alu_thickness])
    you_group.material = mat_mica_vang
    you_group.entities.each do |e|
      e.material = mat_black if e.is_a?(Sketchup::Face) && e.normal.z.abs < 0.5
    end
    you_group.entities.each do |e|
      e.material = mat_border if e.is_a?(Sketchup::Face) && e.normal.z.abs < 0.1
    end

    # Chữ "OF"
    of_group = entities.add_group
    of = of_group.entities
    mat_mica_xanh = model.materials.add('MicaXanh')
    mat_mica_xanh.color = Sketchup::Color.new('#0057FF')
    text3 = of.add_3d_text(
      "OF",
      TextAlignLeft = true,
      text_height_main,
      Bold = true,
      Italic = false,
      font = text_font,
      extrusion = text_depth_main,
      z = frame_thickness+alu_thickness
    )
    of_group.move!([800.mm, 320.mm, frame_thickness+alu_thickness])
    of_group.material = mat_mica_xanh
    of_group.entities.each do |e|
      e.material = mat_black if e.is_a?(Sketchup::Face) && e.normal.z.abs < 0.5
    end
    of_group.entities.each do |e|
      e.material = mat_border if e.is_a?(Sketchup::Face) && e.normal.z.abs < 0.1
    end

    model.commit_operation
  end
end
ChuInox304MatMica.build