# Mã nguồn Ruby hoàn chỉnh
module MenuA4FomexCanDecal
  def self.build
    model = Sketchup.active_model
    model.start_operation('MenuA4FomexCanDecal', true)
    entities = model.active_entities

    # Tạo khung đỡ
    base_pts = [
      [0.mm, 0.mm, 0.mm],
      [210.mm, 0.mm, 0.mm],
      [210.mm, 297.mm, 0.mm],
      [0.mm, 297.mm, 0.mm]
    ]
    base_face = entities.add_face(base_pts)
    base_face.reverse!
    base_grp = entities.add_group(base_face)
    base_grp.name = "Khung Đỡ"
    base_grp.material = "Gray"

    # Tạo bề mặt biển
    surface_pts = [
      [0.mm, 0.mm, 10.mm],
      [210.mm, 0.mm, 10.mm],
      [210.mm, 297.mm, 10.mm],
      [0.mm, 297.mm, 10.mm]
    ]
    surface_face = entities.add_face(surface_pts)
    surface_face.reverse!
    surface_grp = entities.add_group(surface_face)
    surface_grp.name = "Bề Mặt Biển"
    surface_grp.material = "White"

    # Tạo chữ nổi 3D
    text_grp = entities.add_group
    text = "Menu A4"
    text_position = [10.mm, 10.mm, 10.mm]
    text_entity = text_grp.entities.add_3d_text(text, TextAlignCenter, text_position, 10.mm)
    text_grp.name = "Chữ Nổi"
    text_grp.material = "Red"

    # Tạo viền trang trí
    border_pts = [
      [0.mm, 0.mm, 10.mm],
      [210.mm, 0.mm, 10.mm],
      [210.mm, 297.mm, 10.mm],
      [0.mm, 297.mm, 10.mm]
    ]
    border_face = entities.add_face(border_pts)
    border_face.reverse!
    border_grp = entities.add_group(border_face)
    border_grp.name = "Viền Trang Trí"
    border_grp.material = "Gold"

    model.commit_operation
  end
end
MenuA4FomexCanDecal.build