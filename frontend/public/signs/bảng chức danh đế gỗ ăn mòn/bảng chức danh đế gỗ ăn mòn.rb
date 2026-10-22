# Mã nguồn Ruby hoàn chỉnh 100%
module BangChucDanhDeGoAnMon
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangChucDanhDeGoAnMon', true)
    entities = model.active_entities

    # Kích thước tổng thể
    width = 300.mm
    height = 150.mm
    depth = 10.mm # độ dày mặt bảng kim loại
    base_depth = 40.mm

    # Đế gỗ tầng dưới
    base1_height = 20.mm
    base1_depth = base_depth
    base1_width = width + 20.mm
    base1 = entities.add_group
    base1_face = base1.entities.add_face(
      [-(base1_width/2), -base1_depth/2, 0],
      [ (base1_width/2), -base1_depth/2, 0],
      [ (base1_width/2),  (base1_depth/2), 0],
      [-(base1_width/2),  (base1_depth/2), 0]
    )
    base1_face.pushpull(base1_height)
    base1.material = "#7B2E1D"

    # Đế gỗ tầng trên
    base2_height = 20.mm
    base2_depth = 25.mm
    base2_width = width + 10.mm
    base2 = entities.add_group
    base2_face = base2.entities.add_face(
      [-(base2_width/2), -base2_depth/2, base1_height],
      [ (base2_width/2), -base2_depth/2, base1_height],
      [ (base2_width/2),  (base2_depth/2), base1_height],
      [-(base2_width/2),  (base2_depth/2), base1_height]
    )
    base2_face.pushpull(base2_height)
    base2.material = "#7B2E1D"

    # Mặt bảng kim loại ăn mòn
    board = entities.add_group
    board_z = base1_height + base2_height
    board_face = board.entities.add_face(
      [-(width/2), -depth/2, board_z],
      [ (width/2), -depth/2, board_z],
      [ (width/2),  (depth/2), board_z],
      [-(width/2),  (depth/2), board_z]
    )
    board_face.pushpull(height)
    board.material = "#D8C75A"

    # Viền bảng (viền đỏ nâu)
    border = entities.add_group
    border_thick = 3.mm
    border_face = border.entities.add_face(
      [-(width/2 + border_thick), -(depth/2 + border_thick), board_z - border_thick],
      [ (width/2 + border_thick), -(depth/2 + border_thick), board_z - border_thick],
      [ (width/2 + border_thick),  (depth/2 + border_thick), board_z - border_thick],
      [-(width/2 + border_thick),  (depth/2 + border_thick), board_z - border_thick]
    )
    border_face.pushpull(height + 2*border_thick)
    border.material = "#7B2E1D"

    # Viền họa tiết vàng (chỉ mô phỏng khối)
    pattern = entities.add_group
    pattern_thick = 2.mm
    pattern_offset = 7.mm
    pattern_face = pattern.entities.add_face(
      [-(width/2 - pattern_offset), -(depth/2 - pattern_thick), board_z + pattern_thick],
      [ (width/2 - pattern_offset), -(depth/2 - pattern_thick), board_z + pattern_thick],
      [ (width/2 - pattern_offset),  (depth/2 - pattern_thick), board_z + pattern_thick],
      [-(width/2 - pattern_offset),  (depth/2 - pattern_thick), board_z + pattern_thick]
    )
    pattern_face.pushpull(height - 2*pattern_offset)
    pattern.material = "#F5D76E"

    # Viền họa tiết vàng ở đế
    base_pattern = entities.add_group
    base_pattern_face = base_pattern.entities.add_face(
      [-(base2_width/2 - 7.mm), -base2_depth/2 + 2.mm, base1_height + 1.mm],
      [ (base2_width/2 - 7.mm), -base2_depth/2 + 2.mm, base1_height + 1.mm],
      [ (base2_width/2 - 7.mm),  (base2_depth/2) - 2.mm, base1_height + 1.mm],
      [-(base2_width/2 - 7.mm),  (base2_depth/2) - 2.mm, base1_height + 1.mm]
    )
    base_pattern_face.pushpull(2.mm)
    base_pattern.material = "#F5D76E"

    # Logo (mô phỏng khối tròn, không chi tiết)
    logo = entities.add_group
    logo_radius = 28.mm
    logo_center = [-(width/2) + 45.mm, 0, board_z + height/2]
    logo_face = logo.entities.add_circle(logo_center, [0,0,1], logo_radius)
    logo.entities.add_face(logo_face).pushpull(2.mm)
    logo.material = "#D32F2F"

    # Chữ nổi "LUẬT SƯ"
    text1 = entities.add_group
    text1.entities.add_3d_text(
      "Luật sư",
      TextAlignLeft,
      "Arial",
      false,
      false,
      18.mm,
      2.mm,
      0,
      true,
      "#E53935"
    ).move!([-(width/2) + 100.mm, 0, board_z + height - 40.mm])

    # Chữ nổi "HUỲNH TẤN ĐÔ"
    text2 = entities.add_group
    text2.entities.add_3d_text(
      "HUỲNH TẤN ĐÔ",
      TextAlignLeft,
      "Arial Black",
      false,
      false,
      28.mm,
      6.mm,
      0,
      true,
      "#E53935"
    ).move!([-(width/2) + 100.mm, 0, board_z + height - 80.mm])

    model.commit_operation
  end
end
BangChucDanhDeGoAnMon.build