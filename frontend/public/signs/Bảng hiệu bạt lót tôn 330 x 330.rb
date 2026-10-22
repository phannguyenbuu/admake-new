# Mã nguồn Ruby hoàn chỉnh
module BangHieuBatLotTon330X330
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuBatLotTon330X330', true)
    entities = model.active_entities

    # Tạo khung đỡ
    base_pts = [
      [0.mm, 0.mm, 0.mm],
      [3300.mm, 0.mm, 0.mm],
      [3300.mm, 3300.mm, 0.mm],
      [0.mm, 3300.mm, 0.mm]
    ]
    base_face = entities.add_face(base_pts)
    base_face.reverse!
    base_group = entities.add_group(base_face)
    base_group.name = "Khung Đỡ"
    base_group.material = "Gray"

    # Tạo bề mặt biển
    surface_pts = [
      [0.mm, 0.mm, 30.mm],
      [3300.mm, 0.mm, 30.mm],
      [3300.mm, 3300.mm, 30.mm],
      [0.mm, 3300.mm, 30.mm]
    ]
    surface_face = entities.add_face(surface_pts)
    surface_face.reverse!
    surface_group = entities.add_group(surface_face)
    surface_group.name = "Bề Mặt Biển"
    surface_group.material = "White"

    # Tạo chữ nổi 3D
    text_group = entities.add_group
    text = "Bảng Hiệu"
    text_position = [100.mm, 100.mm, 30.mm]
    text_entity = text_group.entities.add_3d_text(text, TextAlignCenter, text_position, 100.mm, 0)
    text_group.name = "Chữ Nổi 3D"
    text_group.material = "Red"

    # Tạo viền trang trí
    border_pts = [
      [0.mm, 0.mm, 30.mm],
      [3300.mm, 0.mm, 30.mm],
      [3300.mm, 3300.mm, 30.mm],
      [0.mm, 3300.mm, 30.mm]
    ]
    border_face = entities.add_face(border_pts)
    border_face.reverse!
    border_group = entities.add_group(border_face)
    border_group.name = "Viền Trang Trí"
    border_group.material = "Gold"

    model.commit_operation
  end
end
BangHieuBatLotTon330X330.build