# Mã nguồn Ruby hoàn chỉnh
module BanHieuLedVienSangMat60X80
  def self.build
    model = Sketchup.active_model
    model.start_operation('BanHieuLedVienSangMat60X80', true)
    entities = model.active_entities

    # Tạo khung đỡ
    grp_frame = entities.add_group
    grp_frame.name = "Khung Đỡ"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [600.mm, 0.mm, 0.mm],
      [600.mm, 20.mm, 0.mm],
      [0.mm, 20.mm, 0.mm]
    ]
    frame_face = grp_frame.entities.add_face(frame_pts)
    frame_face.pushpull(800.mm) # Kéo nổi khung đỡ
    grp_frame.material = "Gray"

    # Tạo bề mặt biển
    grp_surface = entities.add_group
    grp_surface.name = "Bề Mặt Biển"
    surface_pts = [
      [0.mm, 0.mm, 0.mm],
      [600.mm, 0.mm, 0.mm],
      [600.mm, 800.mm, 0.mm],
      [0.mm, 800.mm, 0.mm]
    ]
    surface_face = grp_surface.entities.add_face(surface_pts)
    surface_face.pushpull(20.mm) # Kéo nổi bề mặt biển
    grp_surface.material = "White"

    # Tạo chữ nổi 3D
    grp_text = entities.add_group
    grp_text.name = "Chữ Nổi 3D"
    text_pts = [
      [50.mm, 50.mm, 20.mm],
      [550.mm, 50.mm, 20.mm],
      [550.mm, 150.mm, 20.mm],
      [50.mm, 150.mm, 20.mm]
    ]
    text_face = grp_text.entities.add_face(text_pts)
    text_face.pushpull(10.mm) # Kéo nổi chữ
    grp_text.material = "Blue"

    # Tạo viền trang trí
    grp_border = entities.add_group
    grp_border.name = "Viền Trang Trí"
    border_pts = [
      [0.mm, 0.mm, 20.mm],
      [600.mm, 0.mm, 20.mm],
      [600.mm, 20.mm, 20.mm],
      [0.mm, 20.mm, 20.mm]
    ]
    border_face = grp_border.entities.add_face(border_pts)
    border_face.pushpull(800.mm) # Kéo nổi viền
    grp_border.material = "Gold"

    # Tạo đèn LED
    grp_led = entities.add_group
    grp_led.name = "Đèn LED"
    led_pts = [
      [10.mm, 10.mm, 20.mm],
      [590.mm, 10.mm, 20.mm],
      [590.mm, 30.mm, 20.mm],
      [10.mm, 30.mm, 20.mm]
    ]
    led_face = grp_led.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Kéo nổi đèn LED
    grp_led.material = "Yellow"

    model.commit_operation
  end
end
BanHieuLedVienSangMat60X80.build