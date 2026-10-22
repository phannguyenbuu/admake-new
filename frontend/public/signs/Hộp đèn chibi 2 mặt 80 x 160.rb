# Mã nguồn Ruby hoàn chỉnh 100%
module HopDenChibi2Mat80X160
  def self.build
    model = Sketchup.active_model
    model.start_operation('HopDenChibi2Mat80X160', true)
    entities = model.active_entities

    # Thông số chính
    width = 800.mm
    height = 1600.mm
    depth = 30.mm
    frame_thick = 30.mm
    base_width = 500.mm
    base_depth = 400.mm
    base_height = 100.mm
    leg_height = 400.mm

    # === Khung chân đế sắt hộp ===
    base_group = entities.add_group
    base = base_group.entities
    # Đế vuông
    base.add_face([0,0,0], [base_width,0,0], [base_width,base_depth,0], [0,base_depth,0]).pushpull(frame_thick)
    # Hai chân đứng
    leg1 = base.add_face([base_width*0.25, base_depth/2, frame_thick], [base_width*0.25+frame_thick, base_depth/2, frame_thick], [base_width*0.25+frame_thick, base_depth/2, frame_thick+leg_height], [base_width*0.25, base_depth/2, frame_thick+leg_height])
    leg1.pushpull(frame_thick)
    leg2 = base.add_face([base_width*0.75, base_depth/2, frame_thick], [base_width*0.75+frame_thick, base_depth/2, frame_thick], [base_width*0.75+frame_thick, base_depth/2, frame_thick+leg_height], [base_width*0.75, base_depth/2, frame_thick+leg_height])
    leg2.pushpull(frame_thick)
    # Thanh giằng chéo
    base.add_line([base_width*0.25+frame_thick/2, base_depth/2, frame_thick+leg_height], [base_width*0.75+frame_thick/2, base_depth/2, frame_thick+leg_height])

    # Di chuyển chân đế về gốc
    base_group.move! Geom::Transformation.translation([width/2-base_width/2, -base_depth/2, 0])

    # === Khung xương hộp đèn (sắt hộp viền ngoài) ===
    frame_group = entities.add_group
    frame = frame_group.entities
    # Dạng viền ngoài theo hình hộp chữ nhật bo góc (giả lập hình chibi)
    # Đơn giản hóa: bo góc lớn phía trên, phía dưới tạo 2 khối tròn nhỏ (ly nước ép)
    # Tạo mặt chính
    main_face_pts = []
    r_top = 300.mm
    r_bot = 120.mm
    # Vẽ cung tròn trên
    16.times do |i|
      angle = Math::PI * (i/15.0)
      main_face_pts << Geom::Point3d.new(width/2 + r_top*Math.cos(angle), height - r_top + r_top*Math.sin(angle), leg_height+frame_thick)
    end
    # Hai bên thân
    main_face_pts << Geom::Point3d.new(width - r_bot, r_bot, leg_height+frame_thick)
    # Cung tròn trái dưới
    8.times do |i|
      angle = Math::PI + Math::PI*(i/7.0)
      main_face_pts << Geom::Point3d.new(r_bot + r_bot*Math.cos(angle), r_bot + r_bot*Math.sin(angle), leg_height+frame_thick)
    end
    # Cung tròn phải dưới
    8.times do |i|
      angle = Math::PI + Math::PI*(i/7.0)
      main_face_pts << Geom::Point3d.new(width - r_bot + r_bot*Math.cos(angle), r_bot + r_bot*Math.sin(angle), leg_height+frame_thick)
    end
    # Đóng kín
    main_face = frame.add_face(main_face_pts)
    main_face.pushpull(depth)

    # Viền hộp alu/nhôm
    edge_group = entities.add_group
    edge = edge_group.entities
    offset = 10.mm
    edge_face_pts = main_face_pts.map{|pt| Geom::Point3d.new(pt.x, pt.y, pt.z+depth+offset)}
    edge_face = edge.add_face(edge_face_pts)
    edge_face.reverse!
    edge_face.pushpull(-offset)

    # Di chuyển khung lên trên chân đế
    frame_group.move! Geom::Transformation.translation([0,0,leg_height+frame_thick])
    edge_group.move! Geom::Transformation.translation([0,0,leg_height+frame_thick])

    # Tô màu vật liệu
    materials = model.materials
    mat_mica = materials.add('MicaTrang')
    mat_mica.color = Sketchup::Color.new('#F9FAFB')
    mat_vien = materials.add('VienDen')
    mat_vien.color = Sketchup::Color.new('#222222')
    mat_sathop = materials.add('SatHopDen')
    mat_sathop.color = Sketchup::Color.new('#222222')
    main_face.material = mat_mica
    main_face.back_material = mat_mica
    edge_face.material = mat_vien
    edge_face.back_material = mat_vien
    base_group.material = mat_sathop

    # === Chữ nổi 3D "Sachijuice" ===
    text_group = entities.add_group
    # Chữ lớn "Sachijuice"
    text1 = text_group.entities.add_3d_text(
      "Sachijuice",
      TextAlignCenter,
      "Arial Rounded MT Bold",
      false, false,
      120.mm, 30.mm, 0, true, 0
    )
    # Gradient: chỉ lấy màu vàng
    mat_text1 = materials.add('Sachijuice')
    mat_text1.color = Sketchup::Color.new('#F9D923')
    text1.material = mat_text1
    text1.move! Geom::Transformation.translation([width/2-180.mm, height-350.mm, leg_height+frame_thick+depth+5.mm])

    # Chữ phụ "Thức uống Healthy, ngại gì không Thử"
    text2 = text_group.entities.add_3d_text(
      "Thức uống Healthy,\nngại gì không Thử",
      TextAlignCenter,
      "Arial",
      false, false,
      40.mm, 10.mm, 0, true, 0
    )
    mat_text2 = materials.add('TextPhu')
    mat_text2.color = Sketchup::Color.new('#F2994A')
    text2.material = mat_text2
    text2.move! Geom::Transformation.translation([width/2-180.mm, height-420.mm, leg_height+frame_thick+depth+5.mm])

    # Chữ "Healthy" màu xanh lá
    text3 = text_group.entities.add_3d_text(
      "Healthy",
      TextAlignLeft,
      "Arial",
      false, false,
      40.mm, 10.mm, 0, true, 0
    )
    mat_text3 = materials.add('TextHealthy')
    mat_text3.color = Sketchup::Color.new('#6FCF97')
    text3.material = mat_text3
    text3.move! Geom::Transformation.translation([width/2-60.mm, height-400.mm, leg_height+frame_thick+depth+5.mm])

    # Các khối chữ nổi nhỏ nền đỏ (giả lập hình lá)
    def self.add_red_label(entities, text, x, y, z)
      label = entities.add_group
      face = label.entities.add_face([x, y, z], [x+120.mm, y, z], [x+120.mm, y+40.mm, z], [x, y+40.mm, z])
      face.pushpull(10.mm)
      mat_red = Sketchup.active_model.materials.add('RedLabel')
      mat_red.color = Sketchup::Color.new('#E63946')
      face.material = mat_red
      txt = label.entities.add_3d_text(text, TextAlignCenter, "Arial", false, false, 28.mm, 5.mm, 0, true, 0)
      mat_white = Sketchup.active_model.materials.add('WhiteText')
      mat_white.color = Sketchup::Color.new('#FFFFFF')
      txt.material = mat_white
      txt.move! Geom::Transformation.translation([x+10.mm, y+5.mm, z+10.mm])
      label
    end
    add_red_label(text_group.entities, "Nước ép Detox", width/2-60.mm, height-600.mm, leg_height+frame_thick+depth+5.mm)
    add_red_label(text_group.entities, "Nước ép Thơm Táo", width/2-180.mm, height-800.mm, leg_height+frame_thick+depth+5.mm)
    add_red_label(text_group.entities, "Trà Bí Đao Hạt Chia", width/2+60.mm, height-800.mm, leg_height+frame_thick+depth+5.mm)

    # === Logo nhỏ góc phải ===
    logo_group = entities.add_group
    logo_face = logo_group.entities.add_circle([width-80.mm, height-120.mm, leg_height+frame_thick+depth+5.mm], [0,0,1], 30.mm)
    logo = logo_group.entities.add_face(logo_face)
    mat_logo = materials.add('Logo')
    mat_logo.color = Sketchup::Color.new('#E63946')
    logo.material = mat_logo
    logo.pushpull(5.mm)

    # === Hình minh họa trái cây (giả lập khối tròn) ===
    fruit_group = entities.add_group
    fruit1 = fruit_group.entities.add_circle([width/2-100.mm, 120.mm, leg_height+frame_thick+depth+5.mm], [0,0,1], 40.mm)
    fruit1f = fruit_group.entities.add_face(fruit1)
    mat_fruit1 = materials.add('FruitRed')
    mat_fruit1.color = Sketchup::Color.new('#E63946')
    fruit1f.material = mat_fruit1
    fruit1f.pushpull(10.mm)
    fruit2 = fruit_group.entities.add_circle([width/2+100.mm, 120.mm, leg_height+frame_thick+depth+5.mm], [0,0,1], 40.mm)
    fruit2f = fruit_group.entities.add_face(fruit2)
    mat_fruit2 = materials.add('FruitYellow')
    mat_fruit2.color = Sketchup::Color.new('#F9D923')
    fruit2f.material = mat_fruit2
    fruit2f.pushpull(10.mm)

    model.commit_operation
  end
end
HopDenChibi2Mat80X160.build