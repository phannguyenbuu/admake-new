# Mã nguồn Ruby hoàn chỉnh
module HopDenChibi2Mat60X140
  def self.build
    model = Sketchup.active_model
    model.start_operation('HopDenChibi2Mat60X140', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    grp_frame = entities.add_group
    grp_frame.name = "Khung Sắt Đỡ"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [600.mm, 0.mm, 0.mm],
      [600.mm, 30.mm, 0.mm],
      [0.mm, 30.mm, 0.mm]
    ]
    frame_face = grp_frame.entities.add_face(frame_pts)
    frame_face.pushpull(1400.mm)
    grp_frame.material = "Gray"

    # Tạo bề mặt biển
    grp_surface = entities.add_group
    grp_surface.name = "Bề Mặt Biển"
    surface_pts = [
      [0.mm, 0.mm, 0.mm],
      [600.mm, 0.mm, 0.mm],
      [600.mm, 30.mm, 0.mm],
      [0.mm, 30.mm, 0.mm]
    ]
    surface_face = grp_surface.entities.add_face(surface_pts)
    surface_face.pushpull(1400.mm)
    grp_surface.material = "White"

    # Tạo chữ nổi 3D
    grp_text = entities.add_group
    grp_text.name = "Chữ Nổi 3D"
    text_pts = [
      [50.mm, 10.mm, 0.mm],
      [550.mm, 10.mm, 0.mm],
      [550.mm, 30.mm, 0.mm],
      [50.mm, 30.mm, 0.mm]
    ]
    text_face = grp_text.entities.add_face(text_pts)
    text_face.pushpull(10.mm)
    grp_text.material = "Red"

    # Tạo đèn LED
    grp_led = entities.add_group
    grp_led.name = "Đèn LED"
    led_pts = [
      [0.mm, 0.mm, 30.mm],
      [600.mm, 0.mm, 30.mm],
      [600.mm, 30.mm, 30.mm],
      [0.mm, 30.mm, 30.mm]
    ]
    led_face = grp_led.entities.add_face(led_pts)
    led_face.pushpull(1400.mm)
    grp_led.material = "Yellow"

    model.commit_operation
  end
end
HopDenChibi2Mat60X140.build