# Mã nguồn Ruby hoàn chỉnh 100%
module BienTenCongTyInoxAnMon40X30
  def self.build
    model = Sketchup.active_model
    model.start_operation('BienTenCongTyInoxAnMon40X30', true)
    entities = model.active_entities

    # Kích thước tổng thể
    width = 400.mm
    height = 300.mm
    depth = 20.mm
    face_thickness = 1.mm
    border_thickness = 10.mm

    # Màu sắc
    inox_vang = Sketchup::Color.new("#FFD700")
    chu_do = Sketchup::Color.new("#C62828")
    chu_den = Sketchup::Color.new("#222222")

    # Tạo nhóm tổng thể
    group = entities.add_group
    ents = group.entities

    # 1. Tạo tấm nền inox vàng gương
    base = ents.add_face([0,0,0], [width,0,0], [width,height,0], [0,height,0])
    base.pushpull(-face_thickness)
    base.material = inox_vang
    base.back_material = inox_vang

    # 2. Tạo viền nẹp inox vàng gương (4 cạnh)
    # Trên
    ents.add_face(
      [0,0,0], 
      [width,0,0], 
      [width,-border_thickness,0], 
      [0,-border_thickness,0]
    ).pushpull(-depth)
    # Dưới
    ents.add_face(
      [0,height,0], 
      [width,height,0], 
      [width,height+border_thickness,0], 
      [0,height+border_thickness,0]
    ).pushpull(-depth)
    # Trái
    ents.add_face(
      [0,0,0], 
      [0,height,0], 
      [-border_thickness,height,0], 
      [-border_thickness,0,0]
    ).pushpull(-depth)
    # Phải
    ents.add_face(
      [width,0,0], 
      [width,height,0], 
      [width+border_thickness,height,0], 
      [width+border_thickness,0,0]
    ).pushpull(-depth)
    # Gán màu viền
    group.entities.grep(Sketchup::Face).each do |f|
      if f.normal.parallel?(Z_AXIS)
        f.material = inox_vang
        f.back_material = inox_vang
      end
    end

    # 3. Thêm chữ ăn mòn (dùng add_3d_text, độ dày nhỏ)
    # Dòng 1: CÔNG TY TNHH MỘT THÀNH VIÊN
    text1 = ents.add_3d_text(
      "CÔNG TY TNHH MỘT THÀNH VIÊN",
      TextAlignCenter,
      "Arial",
      false, false,
      25.mm, 2.mm, 0, true, 0
    )
    text1.material = chu_den
    text1.transformation = Geom::Transformation.new([width/2, height-35.mm, face_thickness+0.1.mm])
    text1.move!([-(text1.bounds.width/2), 0, 0])

    # Dòng 2: TM - DV CHUNG LÝ (chữ lớn, đỏ)
    text2 = ents.add_3d_text(
      "TM - DV CHUNG LÝ",
      TextAlignCenter,
      "Arial Black",
      false, false,
      40.mm, 3.mm, 0, true, 0
    )
    text2.material = chu_do
    text2.transformation = Geom::Transformation.new([width/2, height-90.mm, face_thickness+0.1.mm])
    text2.move!([-(text2.bounds.width/2), 0, 0])

    # Dòng 3: MST: 6001802511
    text3 = ents.add_3d_text(
      "MST: 6001802511",
      TextAlignCenter,
      "Arial",
      false, false,
      22.mm, 2.mm, 0, true, 0
    )
    text3.material = chu_den
    text3.transformation = Geom::Transformation.new([width/2, height-135.mm, face_thickness+0.1.mm])
    text3.move!([-(text3.bounds.width/2), 0, 0])

    # Dòng 4: ĐC: THÔN 2, XÃ EA KIẾT, T. ĐẮK LẮK
    text4 = ents.add_3d_text(
      "ĐC: THÔN 2, XÃ EA KIẾT, T. ĐẮK LẮK",
      TextAlignLeft,
      "Arial",
      false, false,
      16.mm, 1.5.mm, 0, true, 0
    )
    text4.material = chu_den
    text4.transformation = Geom::Transformation.new([15.mm, 30.mm, face_thickness+0.1.mm])

    # Dòng 5: ĐT: 0985 177 457
    text5 = ents.add_3d_text(
      "ĐT: 0985 177 457",
      TextAlignRight,
      "Arial",
      false, false,
      16.mm, 1.5.mm, 0, true, 0
    )
    text5.material = chu_den
    text5.transformation = Geom::Transformation.new([width-15.mm, 30.mm, face_thickness+0.1.mm])
    text5.move!([-text5.bounds.width, 0, 0])

    # 4. Tai treo (giả lập 2 lỗ khoan treo phía trên, mỗi bên 30mm)
    hole_radius = 4.mm
    hole_offset_x = 30.mm
    hole_y = -border_thickness/2
    [hole_offset_x, width-hole_offset_x].each do |x|
      circle = ents.add_circle([x, hole_y, face_thickness/2], Z_AXIS, hole_radius, 24)
      ents.add_face(circle)
    end

    model.commit_operation
  end
end
BienTenCongTyInoxAnMon40X30.build