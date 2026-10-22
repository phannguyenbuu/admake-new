# Mã nguồn Ruby hoàn chỉnh
module XeBanHangDenLedKinh60X150X200
  def self.build
    model = Sketchup.active_model
    model.start_operation('XeBanHangDenLedKinh60X150X200', true)
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
    frame_face.pushpull(1500.mm) # Kéo nổi khung lên 1500mm
    grp_frame.material = "Gray"

    # Tạo bề mặt biển quảng cáo
    grp_surface = entities.add_group
    grp_surface.name = "Be Mat Bien Quang Cao"
    surface_pts = [
      [0, 0, 1500.mm],
      [600.mm, 0, 1500.mm],
      [600.mm, 2000.mm, 1500.mm],
      [0, 2000.mm, 1500.mm]
    ]
    surface_face = grp_surface.entities.add_face(surface_pts)
    surface_face.pushpull(10.mm) # Độ dày bề mặt biển
    grp_surface.material = "White"

    # Tạo chữ nổi 3D
    grp_text = entities.add_group
    grp_text.name = "Chu Noi 3D"
    text_pts = [
      [100.mm, 1000.mm, 1510.mm],
      [500.mm, 1000.mm, 1510.mm],
      [500.mm, 1100.mm, 1510.mm],
      [100.mm, 1100.mm, 1510.mm]
    ]
    text_face = grp_text.entities.add_face(text_pts)
    text_face.pushpull(20.mm) # Kéo nổi chữ lên 20mm
    grp_text.material = "Red"

    # Tạo đèn LED
    grp_led = entities.add_group
    grp_led.name = "Den LED"
    led_pts = [
      [0, 0, 1530.mm],
      [600.mm, 0, 1530.mm],
      [600.mm, 2000.mm, 1530.mm],
      [0, 2000.mm, 1530.mm]
    ]
    led_face = grp_led.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Độ dày của đèn LED
    grp_led.material = "Yellow"

    model.commit_operation
  end
end
XeBanHangDenLedKinh60X150X200.build