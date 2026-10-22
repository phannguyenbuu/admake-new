# Mã nguồn Ruby hoàn chỉnh
module BangHieuAluChuNoi450X160
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuAluChuNoi450X160', true)
    entities = model.active_entities

    # Tạo khung đỡ
    frame_height = 30.mm
    frame_width = 4500.mm
    frame_depth = 30.mm

    frame_pts = [
      [0, 0, 0],
      [frame_width, 0, 0],
      [frame_width, frame_depth, 0],
      [0, frame_depth, 0]
    ]

    frame_face = entities.add_face(frame_pts)
    frame_face.pushpull(frame_height)

    frame_group = entities.add_group(frame_face)
    frame_group.name = "Khung Đỡ"
    frame_group.material = "Gray"

    # Tạo bề mặt biển
    surface_height = 1600.mm
    surface_depth = 30.mm

    surface_pts = [
      [0, 0, frame_height],
      [frame_width, 0, frame_height],
      [frame_width, surface_depth, frame_height],
      [0, surface_depth, frame_height]
    ]

    surface_face = entities.add_face(surface_pts)
    surface_face.pushpull(surface_height)

    surface_group = entities.add_group(surface_face)
    surface_group.name = "Bề Mặt Biển"
    surface_group.material = "Alu"

    # Tạo chữ nổi 3D
    letter_height = 100.mm
    letter_depth = 30.mm
    letter_width = 20.mm

    letter_pts = [
      [1000.mm, 15.mm, frame_height + surface_height],
      [1000.mm + letter_width, 15.mm, frame_height + surface_height],
      [1000.mm + letter_width, 15.mm + letter_depth, frame_height + surface_height],
      [1000.mm, 15.mm + letter_depth, frame_height + surface_height]
    ]

    letter_face = entities.add_face(letter_pts)
    letter_face.pushpull(letter_height)

    letter_group = entities.add_group(letter_face)
    letter_group.name = "Chữ Nổi"
    letter_group.material = "Red"

    # Tạo viền trang trí
    border_height = 5.mm
    border_pts = [
      [0, 0, frame_height + surface_height + letter_height],
      [frame_width, 0, frame_height + surface_height + letter_height],
      [frame_width, surface_depth, frame_height + surface_height + letter_height],
      [0, surface_depth, frame_height + surface_height + letter_height]
    ]

    border_face = entities.add_face(border_pts)
    border_face.pushpull(border_height)

    border_group = entities.add_group(border_face)
    border_group.name = "Viền Trang Trí"
    border_group.material = "Gold"

    model.commit_operation
  end
end
BangHieuAluChuNoi450X160.build