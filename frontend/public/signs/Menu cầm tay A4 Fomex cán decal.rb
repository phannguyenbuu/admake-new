# Mã nguồn Ruby hoàn chỉnh
module MenuCamTayA4FomexCanDecal
  def self.build
    model = Sketchup.active_model
    model.start_operation('MenuCamTayA4FomexCanDecal', true)
    entities = model.active_entities

    # Tạo khung đỡ
    base_width = 210.mm
    base_height = 297.mm
    base_depth = 10.mm

    # Tạo nhóm cho khung
    frame_group = entities.add_group
    frame_group.name = "Khung"

    # Tạo mặt phẳng cho khung
    frame_pts = [
      [0, 0, 0],
      [base_width, 0, 0],
      [base_width, base_height, 0],
      [0, base_height, 0]
    ]
    frame_face = frame_group.entities.add_face(frame_pts)
    frame_face.pushpull(base_depth) # Kéo nổi khung

    # Gán màu cho khung
    frame_group.material = "Gray"

    # Tạo bề mặt biển
    surface_group = entities.add_group
    surface_group.name = "Bề mặt biển"

    # Tạo mặt phẳng cho bề mặt biển
    surface_face = surface_group.entities.add_face(frame_pts)
    surface_face.pushpull(-base_depth) # Kéo ngược để tạo độ dày

    # Gán vật liệu cho bề mặt biển
    surface_group.material = "White"

    # Tạo chữ nổi 3D
    text_group = entities.add_group
    text_group.name = "Chữ nổi"

    # Tạo chữ nổi
    text = "Menu"
    text_position = [base_width / 4, base_height / 2, base_depth]
    text_face = text_group.entities.add_3d_text(text, TextAlignCenter, text_position, 1.mm, false, false)
    text_face.pushpull(5.mm) # Kéo nổi chữ

    # Gán màu cho chữ nổi
    text_group.material = "Red"

    # Tạo viền trang trí
    border_group = entities.add_group
    border_group.name = "Viền trang trí"

    # Tạo viền
    border_face = border_group.entities.add_face(frame_pts)
    border_face.pushpull(2.mm) # Kéo nổi viền

    # Gán màu cho viền
    border_group.material = "Gold"

    model.commit_operation
  end
end
MenuCamTayA4FomexCanDecal.build