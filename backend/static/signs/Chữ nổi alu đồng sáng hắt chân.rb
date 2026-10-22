# Mã nguồn Ruby hoàn chỉnh
module ChuNoiAluDongSangHatChan
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuNoiAluDongSangHatChan', true)
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
    frame_face.pushpull(400.mm) # Chiều cao khung
    grp_frame.material = "Gray"

    # Tạo bề mặt biển chính
    grp_surface = entities.add_group
    grp_surface.name = "Bề Mặt Biển"
    surface_pts = [
      [0.mm, 0.mm, 400.mm],
      [1200.mm, 0.mm, 400.mm],
      [1200.mm, 60.mm, 400.mm],
      [0.mm, 60.mm, 400.mm]
    ]
    surface_face = grp_surface.entities.add_face(surface_pts)
    surface_face.pushpull(-5.mm) # Độ dày bề mặt
    grp_surface.material = "Aluminum"

    # Tạo chữ nổi 3D
    grp_text = entities.add_group
    grp_text.name = "Chữ Nổi 3D"
    text_pts = [
      [100.mm, 10.mm, 405.mm],
      [1100.mm, 10.mm, 405.mm],
      [1100.mm, 50.mm, 405.mm],
      [100.mm, 50.mm, 405.mm]
    ]
    text_face = grp_text.entities.add_face(text_pts)
    text_face.pushpull(20.mm) # Độ dày chữ nổi
    grp_text.material = "Gold"

    # Tạo đèn LED
    grp_led = entities.add_group
    grp_led.name = "Đèn LED"
    led_pts = [
      [0.mm, 0.mm, 420.mm],
      [1200.mm, 0.mm, 420.mm],
      [1200.mm, 10.mm, 420.mm],
      [0.mm, 10.mm, 420.mm]
    ]
    led_face = grp_led.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Độ dày đèn LED
    grp_led.material = "Yellow"

    # Gán các thuộc tính khác nếu cần thiết
    # ...

    model.commit_operation
  end
end
ChuNoiAluDongSangHatChan.build