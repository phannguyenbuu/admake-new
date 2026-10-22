# Mã nguồn Ruby hoàn chỉnh
module ChuInox304ChanChaoLed
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuInox304ChanChaoLed', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    grp_frame = entities.add_group
    grp_frame.name = "Khung Sắt Đỡ"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [1200.mm, 0.mm, 0.mm],
      [1200.mm, 400.mm, 0.mm],
      [0.mm, 400.mm, 0.mm]
    ]
    frame_face = grp_frame.entities.add_face(frame_pts)
    frame_face.pushpull(60.mm) # Độ dày của khung
    grp_frame.material = "Gray"

    # Tạo bề mặt biển
    grp_surface = entities.add_group
    grp_surface.name = "Bề Mặt Biển"
    surface_pts = [
      [0.mm, 0.mm, 60.mm],
      [1200.mm, 0.mm, 60.mm],
      [1200.mm, 400.mm, 60.mm],
      [0.mm, 400.mm, 60.mm]
    ]
    surface_face = grp_surface.entities.add_face(surface_pts)
    surface_face.pushpull(5.mm) # Độ dày của bề mặt biển
    grp_surface.material = "White"

    # Tạo chữ nổi 3D
    grp_text = entities.add_group
    grp_text.name = "Chữ Nổi 3D"
    text_pts = [
      [100.mm, 100.mm, 65.mm],
      [1100.mm, 100.mm, 65.mm],
      [1100.mm, 300.mm, 65.mm],
      [100.mm, 300.mm, 65.mm]
    ]
    text_face = grp_text.entities.add_face(text_pts)
    text_face.pushpull(20.mm) # Độ dày chữ nổi
    grp_text.material = "Silver"

    # Tạo đèn LED
    grp_led = entities.add_group
    grp_led.name = "Đèn LED"
    led_pts = [
      [100.mm, 100.mm, 85.mm],
      [1100.mm, 100.mm, 85.mm],
      [1100.mm, 300.mm, 85.mm],
      [100.mm, 300.mm, 85.mm]
    ]
    led_face = grp_led.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Độ dày của đèn LED
    grp_led.material = "Yellow"

    model.commit_operation
  end
end
ChuInox304ChanChaoLed.build