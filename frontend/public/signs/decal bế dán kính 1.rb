# Mã nguồn Ruby hoàn chỉnh
module DecalBeDanKinh1
  def self.build
    model = Sketchup.active_model
    model.start_operation('DecalBeDanKinh1', true)
    entities = model.active_entities

    # Tạo khung đỡ
    base_pts = [
      [0, 0, 0],
      [3000.mm, 0, 0],
      [3000.mm, 150.mm, 0],
      [0, 150.mm, 0]
    ]
    base_face = entities.add_face(base_pts)
    base_face.reverse! # Đảo mặt nếu cần
    base_face.pushpull(100.mm) # Kéo lên 100mm để tạo khung

    base_group = entities.add_group(base_face)
    base_group.name = "Khung Đỡ"
    base_group.material = "Gray"

    # Tạo bề mặt biển
    surface_pts = [
      [0, 0, 100.mm],
      [3000.mm, 0, 100.mm],
      [3000.mm, 1000.mm, 100.mm],
      [0, 1000.mm, 100.mm]
    ]
    surface_face = entities.add_face(surface_pts)
    surface_face.reverse! # Đảo mặt nếu cần
    surface_face.pushpull(10.mm) # Kéo lên 10mm để tạo bề mặt

    surface_group = entities.add_group(surface_face)
    surface_group.name = "Bề Mặt Biển"
    surface_group.material = "Mica"

    # Tạo chữ nổi 3D
    text_group = entities.add_group
    text = "Decal Bế Dán Kính 1"
    text_position = [1500.mm, 500.mm, 110.mm]
    text_face = entities.add_face([text_position, [text_position[0] + 1000.mm, text_position[1], text_position[2]], 
                                        [text_position[0] + 1000.mm, text_position[1] + 200.mm, text_position[2]], 
                                        [text_position[0], text_position[1] + 200.mm, text_position[2]]])
    text_face.pushpull(20.mm) # Kéo lên 20mm để tạo chữ nổi
    text_group.name = "Chữ Nổi"
    text_group.material = "Red"

    # Tạo đèn LED
    led_group = entities.add_group
    led_pts = [
      [0, 0, 120.mm],
      [3000.mm, 0, 120.mm],
      [3000.mm, 10.mm, 120.mm],
      [0, 10.mm, 120.mm]
    ]
    led_face = entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Kéo lên 5mm để tạo đèn LED
    led_group.name = "Đèn LED"
    led_group.material = "Yellow"

    model.commit_operation
  end
end
DecalBeDanKinh1.build