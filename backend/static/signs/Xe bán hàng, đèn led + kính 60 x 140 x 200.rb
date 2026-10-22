# Mã nguồn Ruby hoàn chỉnh
module XeBanHangDenLedKinh60X140X200
  def self.build
    model = Sketchup.active_model
    model.start_operation('XeBanHangDenLedKinh60X140X200', true)
    entities = model.active_entities

    # Tạo khung đỡ
    grp_frame = entities.add_group
    grp_frame.name = "Khung Do"
    frame_pts = [
      [0, 0, 0],
      [600.mm, 0, 0],
      [600.mm, 2000.mm, 0],
      [0, 2000.mm, 0]
    ]
    frame_face = grp_frame.entities.add_face(frame_pts)
    frame_face.pushpull(1400.mm) # Kéo nổi khung
    grp_frame.material = "Gray"

    # Tạo bề mặt biển quảng cáo
    grp_surface = entities.add_group
    grp_surface.name = "Be Mat Bien Quang Cao"
    surface_pts = [
      [0, 0, 1400.mm],
      [600.mm, 0, 1400.mm],
      [600.mm, 2000.mm, 1400.mm],
      [0, 2000.mm, 1400.mm]
    ]
    surface_face = grp_surface.entities.add_face(surface_pts)
    surface_face.pushpull(10.mm) # Kéo nổi bề mặt biển
    grp_surface.material = "White"

    # Tạo chữ nổi 3D
    grp_text = entities.add_group
    grp_text.name = "Chu Noi 3D"
    text_pts = [
      [50.mm, 50.mm, 1410.mm],
      [550.mm, 50.mm, 1410.mm],
      [550.mm, 150.mm, 1410.mm],
      [50.mm, 150.mm, 1410.mm]
    ]
    text_face = grp_text.entities.add_face(text_pts)
    text_face.pushpull(5.mm) # Kéo nổi chữ
    grp_text.material = "Blue"

    # Tạo đèn LED
    grp_led = entities.add_group
    grp_led.name = "Den LED"
    led_pts = [
      [10.mm, 10.mm, 1420.mm],
      [590.mm, 10.mm, 1420.mm],
      [590.mm, 10.mm, 1430.mm],
      [10.mm, 10.mm, 1430.mm]
    ]
    led_face = grp_led.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Kéo nổi đèn LED
    grp_led.material = "Yellow"

    model.commit_operation
  end
end
XeBanHangDenLedKinh60X140X200.build