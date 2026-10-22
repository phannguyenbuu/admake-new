# Mã nguồn Ruby hoàn chỉnh
module MicaHutNoiNgoiSaoBuaLiem
  def self.build
    model = Sketchup.active_model
    model.start_operation('MicaHutNoiNgoiSaoBuaLiem', true)
    entities = model.active_entities

    # Tạo khung đỡ
    base_pts = [
      [0.mm, 0.mm, 0.mm],
      [3000.mm, 0.mm, 0.mm],
      [3000.mm, 150.mm, 0.mm],
      [0.mm, 150.mm, 0.mm]
    ]
    base_face = entities.add_face(base_pts)
    base_face.pushpull(-50.mm) # Độ dày của khung đỡ
    base_group = entities.add_group(base_face)
    base_group.material = "Gray"

    # Tạo bề mặt biển
    surface_pts = [
      [0.mm, 0.mm, 0.mm],
      [3000.mm, 0.mm, 0.mm],
      [3000.mm, 1000.mm, 0.mm],
      [0.mm, 1000.mm, 0.mm]
    ]
    surface_face = entities.add_face(surface_pts)
    surface_face.pushpull(150.mm) # Độ dày của bề mặt biển
    surface_group = entities.add_group(surface_face)
    surface_group.material = "White"

    # Tạo chữ nổi 3D
    text_group = entities.add_group
    text_face = text_group.entities.add_face([0.mm, 0.mm, 150.mm], [3000.mm, 0.mm, 150.mm], [3000.mm, 1000.mm, 150.mm], [0.mm, 1000.mm, 150.mm])
    text_face.pushpull(20.mm) # Độ dày của chữ nổi
    text_group.material = "Red"

    # Tạo đèn LED
    led_group = entities.add_group
    led_face = led_group.entities.add_face([0.mm, 0.mm, 170.mm], [3000.mm, 0.mm, 170.mm], [3000.mm, 10.mm, 170.mm], [0.mm, 10.mm, 170.mm])
    led_face.pushpull(5.mm) # Độ dày của đèn LED
    led_group.material = "Yellow"

    model.commit_operation
  end
end
MicaHutNoiNgoiSaoBuaLiem.build