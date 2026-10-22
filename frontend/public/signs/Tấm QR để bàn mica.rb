# Mã nguồn Ruby hoàn chỉnh
module TamQrDeBanMica
  def self.build
    model = Sketchup.active_model
    model.start_operation('TamQrDeBanMica', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_group = entities.add_group
    frame_group.name = "Khung Sắt Đỡ"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [120.mm, 0.mm, 0.mm],
      [120.mm, 180.mm, 0.mm],
      [0.mm, 180.mm, 0.mm]
    ]
    frame_face = frame_group.entities.add_face(frame_pts)
    frame_face.pushpull(5.mm) # Độ dày của khung
    frame_group.material = "Gray"

    # Tạo bề mặt biển chính
    surface_group = entities.add_group
    surface_group.name = "Bề Mặt Biển Chính"
    surface_pts = [
      [0.mm, 0.mm, 5.mm],
      [120.mm, 0.mm, 5.mm],
      [120.mm, 180.mm, 5.mm],
      [0.mm, 180.mm, 5.mm]
    ]
    surface_face = surface_group.entities.add_face(surface_pts)
    surface_face.pushpull(50.mm) # Độ dày của bề mặt
    surface_group.material = "White"

    # Tạo chữ nổi 3D
    text_group = entities.add_group
    text_group.name = "Chữ Nổi"
    text_position = [10.mm, 10.mm, 55.mm]
    text = "QR Code"
    text_face = text_group.entities.add_text(text, text_position)
    text_face.pushpull(5.mm) # Độ dày của chữ nổi
    text_group.material = "Black"

    # Tạo đèn LED viền
    led_group = entities.add_group
    led_group.name = "Đèn LED"
    led_pts = [
      [0.mm, 0.mm, 60.mm],
      [120.mm, 0.mm, 60.mm],
      [120.mm, 180.mm, 60.mm],
      [0.mm, 180.mm, 60.mm]
    ]
    led_face = led_group.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Độ dày của đèn LED
    led_group.material = "Yellow"

    model.commit_operation
  end
end
TamQrDeBanMica.build