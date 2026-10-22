# Mã nguồn Ruby hoàn chỉnh
module ChuTonRiSetGanLedBub
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuTonRiSetGanLedBub', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_group = entities.add_group
    frame_group.name = "Khung Sắt Đỡ"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [1200.mm, 0.mm, 0.mm],
      [1200.mm, 60.mm, 0.mm],
      [0.mm, 60.mm, 0.mm]
    ]
    frame_face = frame_group.entities.add_face(frame_pts)
    frame_face.pushpull(-20.mm) # Độ dày của khung
    frame_group.material = "Gray"

    # Tạo bề mặt biển
    surface_group = entities.add_group
    surface_group.name = "Bề Mặt Biển"
    surface_pts = [
      [0.mm, 0.mm, -20.mm],
      [1200.mm, 0.mm, -20.mm],
      [1200.mm, 400.mm, -20.mm],
      [0.mm, 400.mm, -20.mm]
    ]
    surface_face = surface_group.entities.add_face(surface_pts)
    surface_face.pushpull(5.mm) # Độ dày của bề mặt
    surface_group.material = "White"

    # Tạo chữ nổi 3D
    text_group = entities.add_group
    text_group.name = "Chữ Nổi 3D"
    text = "Chữ Tôn Rỉ"
    text_position = [100.mm, 100.mm, -15.mm]
    text_entity = text_group.entities.add_3d_text(text, TextAlignCenter, text_position, 100.mm, 1.mm)
    text_group.material = "Red"

    # Tạo hệ thống đèn LED
    led_group = entities.add_group
    led_group.name = "Hệ Thống Đèn LED"
    led_pts = [
      [0.mm, 0.mm, -25.mm],
      [1200.mm, 0.mm, -25.mm],
      [1200.mm, 400.mm, -25.mm],
      [0.mm, 400.mm, -25.mm]
    ]
    led_face = led_group.entities.add_face(led_pts)
    led_face.pushpull(-5.mm) # Độ dày của đèn LED
    led_group.material = "Yellow"

    model.commit_operation
  end
end
ChuTonRiSetGanLedBub.build