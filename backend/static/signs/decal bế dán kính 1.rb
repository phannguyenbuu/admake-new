# Mã nguồn Ruby hoàn chỉnh
module DecalBeDanKinh1
  def self.build
    model = Sketchup.active_model
    model.start_operation('DecalBeDanKinh1', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_group = entities.add_group
    frame_group.name = "Khung Sắt Đỡ"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [3000.mm, 0.mm, 0.mm],
      [3000.mm, 150.mm, 0.mm],
      [0.mm, 150.mm, 0.mm]
    ]
    frame_face = frame_group.entities.add_face(frame_pts)
    frame_face.pushpull(100.mm) # Độ dày của khung
    frame_group.material = "Gray"

    # Tạo bề mặt biển
    surface_group = entities.add_group
    surface_group.name = "Bề Mặt Biển"
    surface_pts = [
      [0.mm, 0.mm, 100.mm],
      [3000.mm, 0.mm, 100.mm],
      [3000.mm, 150.mm, 100.mm],
      [0.mm, 150.mm, 100.mm]
    ]
    surface_face = surface_group.entities.add_face(surface_pts)
    surface_face.pushpull(-10.mm) # Độ dày của bề mặt
    surface_group.material = "White"

    # Tạo chữ nổi 3D
    text_group = entities.add_group
    text_group.name = "Chữ Nổi 3D"
    text = "Decal Bế Dán Kính 1"
    text_position = [100.mm, 50.mm, 110.mm]
    text_entity = text_group.entities.add_text(text, text_position)
    text_group.entities.add_face(text_entity.bounds)
    text_group.entities.each { |entity| entity.pushpull(10.mm) } # Độ dày của chữ
    text_group.material = "Red"

    # Tạo đèn LED viền
    led_group = entities.add_group
    led_group.name = "Đèn LED Viền"
    led_pts = [
      [0.mm, -10.mm, 100.mm],
      [3000.mm, -10.mm, 100.mm],
      [3000.mm, -10.mm, 120.mm],
      [0.mm, -10.mm, 120.mm]
    ]
    led_face = led_group.entities.add_face(led_pts)
    led_face.pushpull(10.mm) # Độ dày của đèn LED
    led_group.material = "Yellow"

    model.commit_operation
  end
end
DecalBeDanKinh1.build