# Mã nguồn Ruby hoàn chỉnh
module HopDenBatInUv1Mat400X90
  def self.build
    model = Sketchup.active_model
    model.start_operation('HopDenBatInUv1Mat400X90', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    grp_frame = entities.add_group
    grp_frame.name = "Khung Sat Do"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [4000.mm, 0.mm, 0.mm],
      [4000.mm, 30.mm, 0.mm],
      [0.mm, 30.mm, 0.mm]
    ]
    frame_face = grp_frame.entities.add_face(frame_pts)
    frame_face.pushpull(900.mm) # Kéo lên cao 900mm
    grp_frame.material = "Gray"

    # Tạo bề mặt biển
    grp_surface = entities.add_group
    grp_surface.name = "Be Mat Bien"
    surface_pts = [
      [0.mm, 0.mm, 900.mm],
      [4000.mm, 0.mm, 900.mm],
      [4000.mm, 30.mm, 900.mm],
      [0.mm, 30.mm, 900.mm]
    ]
    surface_face = grp_surface.entities.add_face(surface_pts)
    surface_face.pushpull(-30.mm) # Kéo xuống 30mm
    grp_surface.material = "White"

    # Tạo chữ nổi 3D
    grp_text = entities.add_group
    grp_text.name = "Chu Noi 3D"
    text_pts = [
      [1000.mm, 10.mm, 900.mm],
      [3000.mm, 10.mm, 900.mm],
      [3000.mm, 100.mm, 900.mm],
      [1000.mm, 100.mm, 900.mm]
    ]
    text_face = grp_text.entities.add_face(text_pts)
    text_face.pushpull(10.mm) # Kéo lên 10mm
    grp_text.material = "Red"

    # Tạo đèn LED
    grp_led = entities.add_group
    grp_led.name = "Den LED"
    led_pts = [
      [0.mm, 0.mm, 900.mm],
      [4000.mm, 0.mm, 900.mm],
      [4000.mm, 10.mm, 900.mm],
      [0.mm, 10.mm, 900.mm]
    ]
    led_face = grp_led.entities.add_face(led_pts)
    led_face.pushpull(10.mm) # Kéo lên 10mm
    grp_led.material = "Yellow"

    model.commit_operation
  end
end
HopDenBatInUv1Mat400X90.build