# Mã nguồn Ruby hoàn chỉnh
module BangHieuXinhanBat2Mat80X120
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuXinhanBat2Mat80X120', true)
    entities = model.active_entities

    # Tạo khung đỡ
    grp_frame = entities.add_group
    grp_frame.name = "Khung Đỡ"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [800.mm, 0.mm, 0.mm],
      [800.mm, 30.mm, 0.mm],
      [0.mm, 30.mm, 0.mm]
    ]
    frame_face = grp_frame.entities.add_face(frame_pts)
    frame_face.pushpull(1200.mm)
    grp_frame.material = "Gray"

    # Tạo bề mặt biển
    grp_surface = entities.add_group
    grp_surface.name = "Bề Mặt Biển"
    surface_pts = [
      [0.mm, 0.mm, 30.mm],
      [800.mm, 0.mm, 30.mm],
      [800.mm, 1200.mm, 30.mm],
      [0.mm, 1200.mm, 30.mm]
    ]
    surface_face = grp_surface.entities.add_face(surface_pts)
    surface_face.pushpull(30.mm)
    grp_surface.material = "White"

    # Tạo chữ nổi 3D
    grp_text = entities.add_group
    grp_text.name = "Chữ Nổi"
    text_pts = [
      [100.mm, 100.mm, 30.mm],
      [700.mm, 100.mm, 30.mm],
      [700.mm, 200.mm, 30.mm],
      [100.mm, 200.mm, 30.mm]
    ]
    text_face = grp_text.entities.add_face(text_pts)
    text_face.pushpull(10.mm)
    grp_text.material = "Red"

    # Tạo đèn LED
    grp_led = entities.add_group
    grp_led.name = "Đèn LED"
    led_pts = [
      [0.mm, 0.mm, 30.mm],
      [800.mm, 0.mm, 30.mm],
      [800.mm, 10.mm, 30.mm],
      [0.mm, 10.mm, 30.mm]
    ]
    led_face = grp_led.entities.add_face(led_pts)
    led_face.pushpull(10.mm)
    grp_led.material = "Yellow"

    model.commit_operation
  end
end
BangHieuXinhanBat2Mat80X120.build