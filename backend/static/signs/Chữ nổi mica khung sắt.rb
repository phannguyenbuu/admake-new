# Mã nguồn Ruby hoàn chỉnh
module ChuNoiMicaKhungSat
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuNoiMicaKhungSat', true)
    entities = model.active_entities

    # Tạo khung sắt
    grp_frame = entities.add_group
    grp_frame.name = "Khung Sắt"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [1200.mm, 0.mm, 0.mm],
      [1200.mm, 400.mm, 0.mm],
      [0.mm, 400.mm, 0.mm]
    ]
    frame_face = grp_frame.entities.add_face(frame_pts)
    frame_face.pushpull(60.mm) # Độ dày khung
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
    surface_face.pushpull(5.mm) # Độ dày bề mặt
    grp_surface.material = "White"

    # Tạo chữ nổi
    grp_letter = entities.add_group
    grp_letter.name = "Chữ Nổi"
    letter_pts = [
      [100.mm, 100.mm, 65.mm],
      [200.mm, 100.mm, 65.mm],
      [200.mm, 300.mm, 65.mm],
      [100.mm, 300.mm, 65.mm]
    ]
    letter_face = grp_letter.entities.add_face(letter_pts)
    letter_face.pushpull(10.mm) # Độ dày chữ nổi
    grp_letter.material = "Red"

    # Tạo đèn LED
    grp_led = entities.add_group
    grp_led.name = "Đèn LED"
    led_pts = [
      [100.mm, 100.mm, 75.mm],
      [200.mm, 100.mm, 75.mm],
      [200.mm, 300.mm, 75.mm],
      [100.mm, 300.mm, 75.mm]
    ]
    led_face = grp_led.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Độ dày đèn LED
    grp_led.material = "Yellow"

    model.commit_operation
  end
end
ChuNoiMicaKhungSat.build