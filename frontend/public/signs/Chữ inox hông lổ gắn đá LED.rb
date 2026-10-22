# Mã nguồn Ruby hoàn chỉnh
module ChuInoxHongLoGanDaLed
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuInoxHongLoGanDaLed', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    grp_frame = entities.add_group
    grp_frame.name = "Khung sat do"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [1200.mm, 0.mm, 0.mm],
      [1200.mm, 400.mm, 0.mm],
      [0.mm, 400.mm, 0.mm]
    ]
    frame_face = grp_frame.entities.add_face(frame_pts)
    frame_face.pushpull(60.mm)
    grp_frame.material = "Gray"

    # Tạo bề mặt biển
    grp_surface = entities.add_group
    grp_surface.name = "Be mat bien"
    surface_pts = [
      [0.mm, 0.mm, 60.mm],
      [1200.mm, 0.mm, 60.mm],
      [1200.mm, 400.mm, 60.mm],
      [0.mm, 400.mm, 60.mm]
    ]
    surface_face = grp_surface.entities.add_face(surface_pts)
    surface_face.pushpull(-5.mm)  # Tạo độ dày cho bề mặt
    grp_surface.material = "White"

    # Tạo chữ nổi 3D
    grp_text = entities.add_group
    grp_text.name = "Chu noi 3D"
    text = "Chữ inox"
    text_position = [100.mm, 100.mm, 60.mm]
    text_entity = grp_text.entities.add_text(text, text_position)
    text_entity.transform!(Geom::Transformation.new([0, 0, 0]))
    grp_text.material = "Silver"

    # Tạo đèn LED
    grp_led = entities.add_group
    grp_led.name = "Den LED"
    led_pts = [
      [0.mm, 0.mm, 65.mm],
      [1200.mm, 0.mm, 65.mm],
      [1200.mm, 10.mm, 65.mm],
      [0.mm, 10.mm, 65.mm]
    ]
    led_face = grp_led.entities.add_face(led_pts)
    led_face.pushpull(5.mm)
    grp_led.material = "Yellow"

    model.commit_operation
  end
end
ChuInoxHongLoGanDaLed.build