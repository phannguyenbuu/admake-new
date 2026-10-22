# Mã nguồn Ruby hoàn chỉnh
module XeBanHangDenLedKinh60X140X200
  def self.build
    model = Sketchup.active_model
    model.start_operation('XeBanHangDenLedKinh60X140X200', true)
    entities = model.active_entities

    # Tạo khung sắt
    grp_frame = entities.add_group
    grp_frame.name = "Khung Sắt"
    frame_pts = [
      [0, 0, 0],
      [600.mm, 0, 0],
      [600.mm, 2000.mm, 0],
      [0, 2000.mm, 0]
    ]
    frame_face = grp_frame.entities.add_face(frame_pts)
    frame_face.pushpull(1400.mm) # Kéo khối lên cao 1400mm
    grp_frame.material = "Gray"

    # Tạo bề mặt biển hiệu
    grp_sign = entities.add_group
    grp_sign.name = "Bề Mặt Biển Hiệu"
    sign_pts = [
      [0, 0, 1400.mm],
      [600.mm, 0, 1400.mm],
      [600.mm, 2000.mm, 1400.mm],
      [0, 2000.mm, 1400.mm]
    ]
    sign_face = grp_sign.entities.add_face(sign_pts)
    sign_face.pushpull(20.mm) # Độ dày 20mm
    grp_sign.material = "White"

    # Tạo chữ nổi 3D
    grp_text = entities.add_group
    grp_text.name = "Chữ Nổi"
    text_pts = [
      [50.mm, 100.mm, 1420.mm],
      [550.mm, 100.mm, 1420.mm],
      [550.mm, 200.mm, 1420.mm],
      [50.mm, 200.mm, 1420.mm]
    ]
    text_face = grp_text.entities.add_face(text_pts)
    text_face.pushpull(10.mm) # Độ dày chữ nổi 10mm
    grp_text.material = "Red"

    # Tạo đèn LED
    grp_led = entities.add_group
    grp_led.name = "Đèn LED"
    led_pts = [
      [0, 0, 1420.mm],
      [600.mm, 0, 1420.mm],
      [600.mm, 10.mm, 1420.mm],
      [0, 10.mm, 1420.mm]
    ]
    led_face = grp_led.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Độ dày đèn LED 5mm
    grp_led.material = "Yellow"

    model.commit_operation
  end
end
XeBanHangDenLedKinh60X140X200.build