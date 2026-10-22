# Mã nguồn Ruby hoàn chỉnh
module XeBanHangDenLedKinh60X150X200
  def self.build
    model = Sketchup.active_model
    model.start_operation('XeBanHangDenLedKinh60X150X200', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    grp_frame = entities.add_group
    grp_frame.name = "Khung Sắt Đỡ"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [600.mm, 0.mm, 0.mm],
      [600.mm, 2000.mm, 0.mm],
      [0.mm, 2000.mm, 0.mm]
    ]
    frame_face = grp_frame.entities.add_face(frame_pts)
    frame_face.pushpull(50.mm) # Độ dày của khung
    grp_frame.material = "Gray"

    # Tạo bề mặt biển quảng cáo
    grp_sign = entities.add_group
    grp_sign.name = "Bề Mặt Biển Quảng Cáo"
    sign_pts = [
      [0.mm, 0.mm, 50.mm],
      [600.mm, 0.mm, 50.mm],
      [600.mm, 1500.mm, 50.mm],
      [0.mm, 1500.mm, 50.mm]
    ]
    sign_face = grp_sign.entities.add_face(sign_pts)
    sign_face.pushpull(10.mm) # Độ dày của biển
    grp_sign.material = "White"

    # Tạo chữ nổi 3D
    grp_text = entities.add_group
    grp_text.name = "Chữ Nổi"
    text_pts = [
      [50.mm, 50.mm, 60.mm],
      [550.mm, 50.mm, 60.mm],
      [550.mm, 100.mm, 60.mm],
      [50.mm, 100.mm, 60.mm]
    ]
    text_face = grp_text.entities.add_face(text_pts)
    text_face.pushpull(20.mm) # Độ dày của chữ
    grp_text.material = "Red"

    # Tạo đèn LED
    grp_led = entities.add_group
    grp_led.name = "Đèn LED"
    led_pts = [
      [0.mm, 0.mm, 70.mm],
      [600.mm, 0.mm, 70.mm],
      [600.mm, 10.mm, 70.mm],
      [0.mm, 10.mm, 70.mm]
    ]
    led_face = grp_led.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Độ dày của đèn LED
    grp_led.material = "Yellow"

    model.commit_operation
  end
end
XeBanHangDenLedKinh60X150X200.build