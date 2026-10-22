# Mã nguồn Ruby hoàn chỉnh
module BienSoNhaMica
  def self.build
    model = Sketchup.active_model
    model.start_operation('BienSoNhaMica', true)
    entities = model.active_entities

    # Tạo khung đỡ
    base_pts = [
      [0.mm, 0.mm, 0.mm],
      [300.mm, 0.mm, 0.mm],
      [300.mm, 200.mm, 0.mm],
      [0.mm, 200.mm, 0.mm]
    ]
    base_face = entities.add_face(base_pts)
    base_face.pushpull(-25.mm) # Độ dày khung đỡ
    base_group = entities.add_group(base_face)
    base_group.material = "Gray"

    # Tạo bề mặt biển
    surface_pts = [
      [0.mm, 0.mm, -25.mm],
      [300.mm, 0.mm, -25.mm],
      [300.mm, 200.mm, -25.mm],
      [0.mm, 200.mm, -25.mm]
    ]
    surface_face = entities.add_face(surface_pts)
    surface_face.pushpull(5.mm) # Độ dày bề mặt biển
    surface_group = entities.add_group(surface_face)
    surface_group.material = "White"

    # Tạo chữ nổi 3D
    text_group = entities.add_group
    text_face = text_group.entities.add_face([50.mm, 50.mm, -20.mm], [250.mm, 50.mm, -20.mm], [250.mm, 150.mm, -20.mm], [50.mm, 150.mm, -20.mm])
    text_face.pushpull(5.mm) # Độ dày chữ nổi
    text_group.material = "Blue"

    # Tạo viền trang trí
    border_pts = [
      [-5.mm, -5.mm, -25.mm],
      [305.mm, -5.mm, -25.mm],
      [305.mm, 205.mm, -25.mm],
      [-5.mm, 205.mm, -25.mm]
    ]
    border_face = entities.add_face(border_pts)
    border_face.pushpull(-2.mm) # Độ dày viền trang trí
    border_group = entities.add_group(border_face)
    border_group.material = "Gold"

    model.commit_operation
  end
end
BienSoNhaMica.build