# Mã nguồn Ruby hoàn chỉnh 100%
module BangHieuXinhanBat2MatCoTru150X150
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuXinhanBat2MatCoTru150X150', true)
    entities = model.active_entities

    # Thông số chính
    width = 1500.mm
    height = 1500.mm
    depth = 30.mm
    truss_size = 40.mm
    truss_height = 1700.mm
    truss_offset = 50.mm # khoảng cách trụ ra ngoài bảng
    frame_size = 25.mm

    # Màu sắc
    color_yellow = Sketchup::Color.new("#F9C846")
    color_brown = Sketchup::Color.new("#7B4B13")
    color_green = Sketchup::Color.new("#217A3B")
    color_gray = Sketchup::Color.new("#B0B0B0")
    color_black = Sketchup::Color.new("#222222")

    # 1. Dựng 2 trụ đứng
    truss_group = entities.add_group
    # Trụ trái
    truss1 = truss_group.entities.add_face(
      [0, 0, 0],
      [truss_size, 0, 0],
      [truss_size, depth, 0],
      [0, depth, 0]
    )
    truss1.pushpull(truss_height)
    # Trụ phải
    truss2 = truss_group.entities.add_face(
      [width + 2*truss_offset, 0, 0],
      [width + 2*truss_offset + truss_size, 0, 0],
      [width + 2*truss_offset + truss_size, depth, 0],
      [width + 2*truss_offset, depth, 0]
    )
    truss2.pushpull(truss_height)
    truss_group.material = color_gray

    # 2. Dựng khung viền bảng hiệu (sắt hộp 25x25)
    frame_group = entities.add_group
    # Khung ngoài
    frame_origin = [truss_offset + truss_size, 0, truss_height - height - 100.mm]
    # 4 cạnh khung
    # Trên
    frame_group.entities.add_face(
      [frame_origin[0], frame_origin[1], frame_origin[2] + height],
      [frame_origin[0] + width, frame_origin[1], frame_origin[2] + height],
      [frame_origin[0] + width, frame_origin[1] + frame_size, frame_origin[2] + height],
      [frame_origin[0], frame_origin[1] + frame_size, frame_origin[2] + height]
    ).pushpull(frame_size)
    # Dưới
    frame_group.entities.add_face(
      [frame_origin[0], frame_origin[1], frame_origin[2]],
      [frame_origin[0] + width, frame_origin[1], frame_origin[2]],
      [frame_origin[0] + width, frame_origin[1] + frame_size, frame_origin[2]],
      [frame_origin[0], frame_origin[1] + frame_size, frame_origin[2]]
    ).pushpull(frame_size)
    # Trái
    frame_group.entities.add_face(
      [frame_origin[0], frame_origin[1], frame_origin[2]],
      [frame_origin[0] + frame_size, frame_origin[1], frame_origin[2]],
      [frame_origin[0] + frame_size, frame_origin[1], frame_origin[2] + height],
      [frame_origin[0], frame_origin[1], frame_origin[2] + height]
    ).pushpull(frame_size)
    # Phải
    frame_group.entities.add_face(
      [frame_origin[0] + width - frame_size, frame_origin[1], frame_origin[2]],
      [frame_origin[0] + width, frame_origin[1], frame_origin[2]],
      [frame_origin[0] + width, frame_origin[1], frame_origin[2] + height],
      [frame_origin[0] + width - frame_size, frame_origin[1], frame_origin[2] + height]
    ).pushpull(frame_size)
    frame_group.material = color_gray

    # 3. Dựng tấm nền bảng hiệu (bạt vàng)
    sign_group = entities.add_group
    sign_face = sign_group.entities.add_face(
      [frame_origin[0] + frame_size, frame_origin[1] + frame_size, frame_origin[2] + frame_size],
      [frame_origin[0] + width - frame_size, frame_origin[1] + frame_size, frame_origin[2] + frame_size],
      [frame_origin[0] + width - frame_size, frame_origin[1] + frame_size, frame_origin[2] + height - frame_size],
      [frame_origin[0] + frame_size, frame_origin[1] + frame_size, frame_origin[2] + height - frame_size]
    )
    sign_face.pushpull(depth - 2*frame_size)
    sign_group.material = color_yellow

    # 4. Dựng chữ nổi 3D (dùng add_3d_text)
    text_group = entities.add_group

    # "VỰA SẦU RIÊNG"
    text1 = text_group.entities.add_3d_text(
      "VỰA SẦU RIÊNG",
      TextAlignCenter,
      "Arial",
      false, false,
      100.mm, 15.mm, 0, true, 0
    )
    text1_group = text_group.entities.add_group(text1)
    text1_group.material = color_brown
    text1_group.move!([
      frame_origin[0] + width/2,
      frame_origin[1] + depth/2,
      frame_origin[2] + height - 200.mm
    ])

    # "Phúc Thuận"
    text2 = text_group.entities.add_3d_text(
      "Phúc Thuận",
      TextAlignCenter,
      "Arial",
      false, false,
      180.mm, 30.mm, 0, true, 0
    )
    text2_group = text_group.entities.add_group(text2)
    text2_group.material = color_green
    text2_group.move!([
      frame_origin[0] + width/2,
      frame_origin[1] + depth/2,
      frame_origin[2] + height/2 + 50.mm
    ])

    # "Km14 - QL14 - CUÔR ĐĂNG - DAKLAK"
    text3 = text_group.entities.add_3d_text(
      "Km14 - QL14 - CUÔR ĐĂNG - DAKLAK",
      TextAlignCenter,
      "Arial",
      false, false,
      60.mm, 10.mm, 0, true, 0
    )
    text3_group = text_group.entities.add_group(text3)
    text3_group.material = color_black
    text3_group.move!([
      frame_origin[0] + width/2,
      frame_origin[1] + depth/2,
      frame_origin[2] + 120.mm
    ])

    # "0764.39 68 68 - 0934.53 22 55"
    text4 = text_group.entities.add_3d_text(
      "0764.39 68 68 - 0934.53 22 55",
      TextAlignCenter,
      "Arial",
      false, false,
      60.mm, 10.mm, 0, true, 0
    )
    text4_group = text_group.entities.add_group(text4)
    text4_group.material = color_black
    text4_group.move!([
      frame_origin[0] + width/2,
      frame_origin[1] + depth/2,
      frame_origin[2] + 70.mm
    ])

    model.commit_operation
  end
end
BangHieuXinhanBat2MatCoTru150X150.build