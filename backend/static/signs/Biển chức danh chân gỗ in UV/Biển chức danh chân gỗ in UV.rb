# Mã nguồn Ruby hoàn chỉnh 100%
module BienChucDanhChanGoInUv
  def self.build
    model = Sketchup.active_model
    model.start_operation('BienChucDanhChanGoInUv', true)
    entities = model.active_entities

    # Thông số kích thước
    width = 300.mm
    height = 150.mm
    depth = 40.mm
    base_height1 = 20.mm
    base_height2 = 20.mm
    base_depth1 = 90.mm
    base_depth2 = 70.mm
    base_offset = 10.mm

    # Màu sắc
    color_gold = Sketchup::Color.new("#FFD700")
    color_gold_dark = Sketchup::Color.new("#E6B800")
    color_red = Sketchup::Color.new("#D32F2F")
    color_blue = Sketchup::Color.new("#0D47A1")
    color_green = Sketchup::Color.new("#388E3C")
    color_wood = Sketchup::Color.new("#7B3F00")
    color_white = Sketchup::Color.new("#FFFFFF")

    # 1. Đế gỗ bậc 1 (dưới cùng)
    base1 = entities.add_group
    pts1 = [
      [0, 0, 0],
      [width, 0, 0],
      [width, base_depth1, 0],
      [0, base_depth1, 0]
    ]
    face1 = base1.entities.add_face(pts1)
    face1.pushpull(base_height1)
    base1.material = color_wood

    # 2. Đế gỗ bậc 2 (trên)
    base2 = entities.add_group
    pts2 = [
      [base_offset, base_offset, base_height1],
      [width - base_offset, base_offset, base_height1],
      [width - base_offset, base_depth2 + base_offset, base_height1],
      [base_offset, base_depth2 + base_offset, base_height1]
    ]
    face2 = base2.entities.add_face(pts2)
    face2.pushpull(base_height2)
    base2.material = color_wood

    # 3. Mặt bảng mica vàng in UV
    board = entities.add_group
    board_z = base_height1 + base_height2
    board_y = (base_depth2 + base_offset - depth) / 2 + base_offset
    pts3 = [
      [0, board_y, board_z],
      [width, board_y, board_z],
      [width, board_y + depth, board_z],
      [0, board_y + depth, board_z]
    ]
    face3 = board.entities.add_face(pts3)
    face3.pushpull(height)
    board.material = color_gold

    # 4. Viền nẹp vàng (hoa văn)
    border = entities.add_group
    border_width = 5.mm
    # Viền ngoài
    border_pts = [
      [-border_width, board_y - border_width, board_z - border_width],
      [width + border_width, board_y - border_width, board_z - border_width],
      [width + border_width, board_y + depth + border_width, board_z - border_width],
      [-border_width, board_y + depth + border_width, board_z - border_width]
    ]
    border_face = border.entities.add_face(border_pts)
    border_face.pushpull(height + 2*border_width)
    border.material = color_gold_dark

    # 5. Logo (khối tròn + hoa văn cách điệu)
    logo = entities.add_group
    logo_radius = 18.mm
    logo_center = [25.mm, board_y + depth/2, board_z + height/2]
    logo_face = logo.entities.add_circle(logo_center, [0,0,1], logo_radius)
    logo.entities.add_face(logo_face).pushpull(2.mm)
    logo.material = color_green

    # 6. Chữ "NHẬT KHOA HƯNG"
    text1 = entities.add_group
    text1.entities.add_3d_text(
      "NHẬT KHOA HƯNG",
      TextAlignCenter,
      "Arial Black",
      false,
      false,
      18.mm,
      2.mm,
      0,
      true,
      0
    ).transform!(Geom::Transformation.translation([width/2, board_y + depth/2, board_z + height - 38.mm]))
    text1.material = color_blue

    # 7. Chữ "CHI NHÁNH VĨNH LONG"
    text2 = entities.add_group
    text2.entities.add_3d_text(
      "CHI NHÁNH VĨNH LONG",
      TextAlignCenter,
      "Arial",
      false,
      false,
      10.mm,
      1.5.mm,
      0,
      true,
      0
    ).transform!(Geom::Transformation.translation([width/2, board_y + depth/2, board_z + height - 55.mm]))
    text2.material = color_blue

    # 8. Chữ "GIÁM ĐỐC"
    text3 = entities.add_group
    text3.entities.add_3d_text(
      "GIÁM ĐỐC",
      TextAlignCenter,
      "Arial",
      false,
      false,
      10.mm,
      1.5.mm,
      0,
      true,
      0
    ).transform!(Geom::Transformation.translation([width/2, board_y + depth/2, board_z + height - 75.mm]))
    text3.material = color_blue

    # 9. Chữ lớn "KIM NHỚ"
    text4 = entities.add_group
    text4.entities.add_3d_text(
      "KIM NHỚ",
      TextAlignCenter,
      "Arial Black",
      false,
      false,
      24.mm,
      4.mm,
      0,
      true,
      0
    ).transform!(Geom::Transformation.translation([width/2, board_y + depth/2, board_z + height - 105.mm]))
    text4.material = color_red

    # 10. Chữ nhỏ dưới logo: "NHAT KHOA HUNG"
    text5 = entities.add_group
    text5.entities.add_3d_text(
      "NHAT KHOA HUNG",
      TextAlignCenter,
      "Arial",
      false,
      false,
      6.mm,
      1.mm,
      0,
      true,
      0
    ).transform!(Geom::Transformation.translation([25.mm, board_y + depth/2, board_z + height - 20.mm]))
    text5.material = color_blue

    model.commit_operation
  end
end
BienChucDanhChanGoInUv.build