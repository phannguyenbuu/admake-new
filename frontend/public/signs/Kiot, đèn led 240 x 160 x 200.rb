# Mã nguồn Ruby hoàn chỉnh
module KiotDenLed240X160X200
  def self.build
    model = Sketchup.active_model
    model.start_operation('KiotDenLed240X160X200', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_group = entities.add_group
    frame_group.name = "Khung Sắt Đỡ"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [2400.mm, 0.mm, 0.mm],
      [2400.mm, 2000.mm, 0.mm],
      [0.mm, 2000.mm, 0.mm]
    ]
    frame_face = frame_group.entities.add_face(frame_pts)
    frame_face.pushpull(1600.mm) # Kéo cao 1600mm
    frame_group.material = "Gray"

    # Tạo bề mặt biển
    surface_group = entities.add_group
    surface_group.name = "Bề Mặt Biển"
    surface_pts = [
      [0.mm, 0.mm, 1600.mm],
      [2400.mm, 0.mm, 1600.mm],
      [2400.mm, 2000.mm, 1600.mm],
      [0.mm, 2000.mm, 1600.mm]
    ]
    surface_face = surface_group.entities.add_face(surface_pts)
    surface_face.pushpull(20.mm) # Độ dày 20mm
    surface_group.material = "White"

    # Tạo chữ nổi 3D
    text_group = entities.add_group
    text_group.name = "Chữ Nổi"
    text_pts = [
      [1000.mm, 1000.mm, 1620.mm],
      [1400.mm, 1000.mm, 1620.mm],
      [1400.mm, 1200.mm, 1620.mm],
      [1000.mm, 1200.mm, 1620.mm]
    ]
    text_face = text_group.entities.add_face(text_pts)
    text_face.pushpull(50.mm) # Kéo cao 50mm
    text_group.material = "Red"

    # Tạo đèn LED
    led_group = entities.add_group
    led_group.name = "Đèn LED"
    led_pts = [
      [0.mm, 0.mm, 1580.mm],
      [2400.mm, 0.mm, 1580.mm],
      [2400.mm, 2000.mm, 1580.mm],
      [0.mm, 2000.mm, 1580.mm]
    ]
    led_face = led_group.entities.add_face(led_pts)
    led_face.pushpull(10.mm) # Độ dày 10mm
    led_group.material = "Yellow"

    model.commit_operation
  end
end
KiotDenLed240X160X200.build