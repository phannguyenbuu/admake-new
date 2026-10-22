# Mã nguồn Ruby hoàn chỉnh 100%
module BienChucDanhChanGo30X15
  def self.build
    model = Sketchup.active_model
    model.start_operation('BienChucDanhChanGo30X15', true)
    entities = model.active_entities

    # Kích thước chính
    width = 300.mm
    height = 150.mm
    thickness = 5.mm

    # Đế gỗ (3 bậc tam cấp)
    base1_w = 320.mm
    base1_d = 80.mm
    base1_h = 15.mm

    base2_w = 300.mm
    base2_d = 60.mm
    base2_h = 12.mm

    base3_w = 280.mm
    base3_d = 45.mm
    base3_h = 10.mm

    # Mặt biển chức danh
    plate_z = base1_h + base2_h + base3_h

    # Màu sắc
    color_gold = Sketchup::Color.new("#E7C873")
    color_wood = Sketchup::Color.new("#7B2D1D")
    color_border = Sketchup::Color.new("#C7A43A")
    color_text = Sketchup::Color.new("#3B2B1B")
    color_logo_red = Sketchup::Color.new("#D32F2F")
    color_logo_yellow = Sketchup::Color.new("#FFD700")

    # 1. Đế gỗ bậc 1
    base1 = entities.add_group
    pts1 = [
      [-(base1_w/2), -(base1_d/2), 0],
      [ (base1_w/2), -(base1_d/2), 0],
      [ (base1_w/2),  (base1_d/2), 0],
      [-(base1_w/2),  (base1_d/2), 0]
    ]
    face1 = base1.entities.add_face(pts1)
    face1.pushpull(base1_h)
    base1.material = color_wood

    # 2. Đế gỗ bậc 2
    base2 = entities.add_group
    pts2 = [
      [-(base2_w/2), -(base2_d/2), base1_h],
      [ (base2_w/2), -(base2_d/2), base1_h],
      [ (base2_w/2),  (base2_d/2), base1_h],
      [-(base2_w/2),  (base2_d/2), base1_h]
    ]
    face2 = base2.entities.add_face(pts2)
    face2.pushpull(base2_h)
    base2.material = color_wood

    # 3. Đế gỗ bậc 3
    base3 = entities.add_group
    pts3 = [
      [-(base3_w/2), -(base3_d/2), base1_h+base2_h],
      [ (base3_w/2), -(base3_d/2), base1_h+base2_h],
      [ (base3_w/2),  (base3_d/2), base1_h+base2_h],
      [-(base3_w/2),  (base3_d/2), base1_h+base2_h]
    ]
    face3 = base3.entities.add_face(pts3)
    face3.pushpull(base3_h)
    base3.material = color_wood

    # 4. Nẹp vàng trang trí trên bậc 2 và 3
    # Nẹp bậc 2
    border2 = entities.add_group
    border2_w = base2_w - 10.mm
    border2_d = base2_d - 10.mm
    border2_h = 2.mm
    ptsb2 = [
      [-(border2_w/2), -(border2_d/2), base1_h+base2_h-2.mm],
      [ (border2_w/2), -(border2_d/2), base1_h+base2_h-2.mm],
      [ (border2_w/2),  (border2_d/2), base1_h+base2_h-2.mm],
      [-(border2_w/2),  (border2_d/2), base1_h+base2_h-2.mm]
    ]
    faceb2 = border2.entities.add_face(ptsb2)
    faceb2.pushpull(border2_h)
    border2.material = color_border

    # Nẹp bậc 3
    border3 = entities.add_group
    border3_w = base3_w - 8.mm
    border3_d = base3_d - 8.mm
    border3_h = 2.mm
    ptsb3 = [
      [-(border3_w/2), -(border3_d/2), base1_h+base2_h+base3_h-2.mm],
      [ (border3_w/2), -(border3_d/2), base1_h+base2_h+base3_h-2.mm],
      [ (border3_w/2),  (border3_d/2), base1_h+base2_h+base3_h-2.mm],
      [-(border3_w/2),  (border3_d/2), base1_h+base2_h+base3_h-2.mm]
    ]
    faceb3 = border3.entities.add_face(ptsb3)
    faceb3.pushpull(border3_h)
    border3.material = color_border

    # 5. Mặt biển chức danh (inox vàng)
    plate = entities.add_group
    pts_plate = [
      [-(width/2), -(thickness/2), plate_z],
      [ (width/2), -(thickness/2), plate_z],
      [ (width/2),  (thickness/2), plate_z],
      [-(width/2),  (thickness/2), plate_z]
    ]
    face_plate = plate.entities.add_face(pts_plate)
    face_plate.pushpull(height)
    plate.material = color_gold
    plate.transformation = Geom::Transformation.translation([0, 0, plate_z])

    # 6. Viền hoa văn nổi (giả lập bằng khung vàng mỏng)
    border_w = width - 8.mm
    border_h = height - 8.mm
    border_t = 2.mm
    border = entities.add_group
    pts_border = [
      [-(border_w/2), -(thickness/2)-0.1.mm, plate_z+4.mm],
      [ (border_w/2), -(thickness/2)-0.1.mm, plate_z+4.mm],
      [ (border_w/2),  (thickness/2)+0.1.mm, plate_z+4.mm],
      [-(border_w/2),  (thickness/2)+0.1.mm, plate_z+4.mm]
    ]
    face_border = border.entities.add_face(pts_border)
    face_border.pushpull(border_h)
    border.material = color_border

    # 7. Logo quốc huy (giả lập hình tròn đỏ vàng)
    logo = entities.add_group
    logo_radius = 22.mm
    logo_center = [-(width/2)+logo_radius+12.mm, 0, plate_z+height/2]
    logo_face = logo.entities.add_circle([logo_center[0], logo_center[1], logo_center[2]-logo_radius], [0,0,1], logo_radius)
    logo.entities.add_face(logo_face).pushpull(2.mm)
    logo.material = color_logo_red
    # Vòng tròn vàng nhỏ bên trong
    logo_inner = logo.entities.add_circle([logo_center[0], logo_center[1], logo_center[2]-logo_radius+3.mm], [0,0,1], logo_radius-7.mm)
    logo.entities.add_face(logo_inner).pushpull(2.5.mm)
    logo.material = color_logo_yellow

    # 8. Chữ nội dung (dùng add_3d_text)
    # Dòng 1: "ỦY BAN NHÂN DÂN PHƯỜNG DĨ AN"
    text1 = entities.add_group
    text1.entities.add_3d_text(
      "ỦY BAN NHÂN DÂN PHƯỜNG DĨ AN",
      TextAlignCenter = true,
      "Arial",
      12.mm,
      false,
      false,
      2.mm
    )
    text1.material = color_text
    text1.transform!(Geom::Transformation.translation([0, 0, plate_z+height-20.mm]))

    # Dòng 2: "TĂNG NGỌC ĐĂNG TÂM"
    text2 = entities.add_group
    text2.entities.add_3d_text(
      "TĂNG NGỌC ĐĂNG TÂM",
      TextAlignCenter = true,
      "Arial Black",
      18.mm,
      true,
      false,
      3.mm
    )
    text2.material = color_text
    text2.transform!(Geom::Transformation.translation([0, 0, plate_z+height-55.mm]))

    # Dòng 3: "PHÓ CHÁNH VĂN PHÒNG"
    text3 = entities.add_group
    text3.entities.add_3d_text(
      "PHÓ CHÁNH VĂN PHÒNG",
      TextAlignCenter = true,
      "Arial",
      10.mm,
      false,
      false,
      1.5.mm
    )
    text3.material = color_text
    text3.transform!(Geom::Transformation.translation([0, 0, plate_z+height-85.mm]))

    # Dòng 4: "VĂN PHÒNG HĐND VÀ UBND PHƯỜNG"
    text4 = entities.add_group
    text4.entities.add_3d_text(
      "VĂN PHÒNG HĐND VÀ UBND PHƯỜNG",
      TextAlignCenter = true,
      "Arial",
      10.mm,
      false,
      false,
      1.5.mm
    )
    text4.material = color_text
    text4.transform!(Geom::Transformation.translation([0, 0, plate_z+height-100.mm]))

    model.commit_operation
  end
end
BienChucDanhChanGo30X15.build