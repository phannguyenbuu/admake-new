# Mã nguồn Ruby hoàn chỉnh
module HopDenBatInUv1Mat400X90
  def self.build
    model = Sketchup.active_model
    model.start_operation('HopDenBatInUv1Mat400X90', true)
    entities = model.active_entities

    # Tạo khung đỡ
    grp_frame = entities.add_group
    grp_frame.name = "Khung Đỡ"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [4000.mm, 0.mm, 0.mm],
      [4000.mm, 30.mm, 0.mm],
      [0.mm, 30.mm, 0.mm]
    ]
    frame_face = grp_frame.entities.add_face(frame_pts)
    frame_face.pushpull(900.mm) # Kéo nổi khung lên 900mm
    grp_frame.material = "Gray"

    # Tạo bề mặt biển quảng cáo
    grp_surface = entities.add_group
    grp_surface.name = "Bề Mặt Biển"
    surface_pts = [
      [0.mm, 0.mm, 900.mm],
      [4000.mm, 0.mm, 900.mm],
      [4000.mm, 30.mm, 900.mm],
      [0.mm, 30.mm, 900.mm]
    ]
    surface_face = grp_surface.entities.add_face(surface_pts)
    surface_face.pushpull(-30.mm) # Kéo xuống để tạo bề mặt
    grp_surface.material = "White"

    # Tạo chữ nổi 3D
    grp_text = entities.add_group
    grp_text.name = "Chữ Nổi 3D"
    text_pts = [
      [1000.mm, 15.mm, 900.mm],
      [3000.mm, 15.mm, 900.mm],
      [3000.mm, 15.mm, 950.mm],
      [1000.mm, 15.mm, 950.mm]
    ]
    text_face = grp_text.entities.add_face(text_pts)
    text_face.pushpull(10.mm) # Kéo nổi chữ lên 10mm
    grp_text.material = "Red"

    # Tạo đèn LED
    grp_led = entities.add_group
    grp_led.name = "Đèn LED"
    led_pts = [
      [0.mm, 15.mm, 900.mm],
      [4000.mm, 15.mm, 900.mm],
      [4000.mm, 15.mm, 880.mm],
      [0.mm, 15.mm, 880.mm]
    ]
    led_face = grp_led.entities.add_face(led_pts)
    led_face.pushpull(-20.mm) # Kéo xuống để tạo đèn LED
    grp_led.material = "Yellow"

    model.commit_operation
  end
end
HopDenBatInUv1Mat400X90.build