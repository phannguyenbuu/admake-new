# Mã nguồn Ruby hoàn chỉnh
module ChuInoxHongLoGanDaArylicLed
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuInoxHongLoGanDaArylicLed', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    grp_frame = entities.add_group
    grp_frame.name = "Khung Sắt Đỡ"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [1200.mm, 0.mm, 0.mm],
      [1200.mm, 60.mm, 0.mm],
      [0.mm, 60.mm, 0.mm]
    ]
    frame_face = grp_frame.entities.add_face(frame_pts)
    frame_face.pushpull(-60.mm) # Độ dày khung
    grp_frame.material = "Gray"

    # Tạo bề mặt biển chính
    grp_surface = entities.add_group
    grp_surface.name = "Bề Mặt Biển"
    surface_pts = [
      [0.mm, 0.mm, -60.mm],
      [1200.mm, 0.mm, -60.mm],
      [1200.mm, 400.mm, -60.mm],
      [0.mm, 400.mm, -60.mm]
    ]
    surface_face = grp_surface.entities.add_face(surface_pts)
    surface_face.pushpull(5.mm) # Độ dày bề mặt
    grp_surface.material = "White"

    # Tạo chữ nổi 3D
    grp_text = entities.add_group
    grp_text.name = "Chữ Nổi 3D"
    text_pts = [
      [100.mm, 100.mm, -60.mm],
      [200.mm, 100.mm, -60.mm],
      [200.mm, 200.mm, -60.mm],
      [100.mm, 200.mm, -60.mm]
    ]
    text_face = grp_text.entities.add_face(text_pts)
    text_face.pushpull(20.mm) # Độ dày chữ
    grp_text.material = "Silver"

    # Tạo hệ thống đèn LED
    grp_led = entities.add_group
    grp_led.name = "Hệ Thống Đèn LED"
    led_pts = [
      [0.mm, 0.mm, -65.mm],
      [1200.mm, 0.mm, -65.mm],
      [1200.mm, -10.mm, -65.mm],
      [0.mm, -10.mm, -65.mm]
    ]
    led_face = grp_led.entities.add_face(led_pts)
    led_face.pushpull(-5.mm) # Độ dày đèn LED
    grp_led.material = "Yellow"

    model.commit_operation
  end
end
ChuInoxHongLoGanDaArylicLed.build