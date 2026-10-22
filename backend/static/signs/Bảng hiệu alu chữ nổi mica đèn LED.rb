# Mã nguồn Ruby hoàn chỉnh
module BangHieuAluChuNoiMicaDenLed
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuAluChuNoiMicaDenLed', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_group = entities.add_group
    frame_group.name = "Khung Sat Do"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [1200.mm, 0.mm, 0.mm],
      [1200.mm, 400.mm, 0.mm],
      [0.mm, 400.mm, 0.mm]
    ]
    frame_face = frame_group.entities.add_face(frame_pts)
    frame_face.pushpull(60.mm) # Độ dày khung
    frame_group.material = "Gray"

    # Tạo bề mặt biển
    surface_group = entities.add_group
    surface_group.name = "Be Mat Bien"
    surface_pts = [
      [0.mm, 0.mm, 60.mm],
      [1200.mm, 0.mm, 60.mm],
      [1200.mm, 400.mm, 60.mm],
      [0.mm, 400.mm, 60.mm]
    ]
    surface_face = surface_group.entities.add_face(surface_pts)
    surface_face.pushpull(-5.mm) # Độ dày bề mặt
    surface_group.material = "White"

    # Tạo chữ nổi 3D
    text_group = entities.add_group
    text_group.name = "Chu Noi 3D"
    text = "LED SIGN"
    text_position = [100.mm, 100.mm, 65.mm]
    text_face = text_group.entities.add_3d_text(text, TextAlignCenter, text_position, 20.mm)
    text_group.material = "Red"

    # Tạo đèn LED
    led_group = entities.add_group
    led_group.name = "Den LED"
    led_pts = [
      [100.mm, 100.mm, 60.mm],
      [1200.mm - 100.mm, 100.mm, 60.mm],
      [1200.mm - 100.mm, 400.mm - 20.mm, 60.mm],
      [100.mm, 400.mm - 20.mm, 60.mm]
    ]
    led_face = led_group.entities.add_face(led_pts)
    led_face.pushpull(10.mm) # Độ dày đèn LED
    led_group.material = "Yellow"

    model.commit_operation
  end
end
BangHieuAluChuNoiMicaDenLed.build