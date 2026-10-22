# Mã nguồn Ruby hoàn chỉnh
module HopDenTonRiSet45X25
  def self.build
    model = Sketchup.active_model
    model.start_operation('HopDenTonRiSet45X25', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    grp_frame = entities.add_group
    grp_frame.name = "Khung Sắt Đỡ"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [450.mm, 0.mm, 0.mm],
      [450.mm, 250.mm, 0.mm],
      [0.mm, 250.mm, 0.mm]
    ]
    frame_face = grp_frame.entities.add_face(frame_pts)
    frame_face.pushpull(20.mm)
    grp_frame.material = "Gray"

    # Tạo bề mặt biển
    grp_surface = entities.add_group
    grp_surface.name = "Bề Mặt Biển"
    surface_pts = [
      [0.mm, 0.mm, 20.mm],
      [450.mm, 0.mm, 20.mm],
      [450.mm, 250.mm, 20.mm],
      [0.mm, 250.mm, 20.mm]
    ]
    surface_face = grp_surface.entities.add_face(surface_pts)
    surface_face.pushpull(-5.mm)  # Tạo độ dày cho bề mặt
    grp_surface.material = "White"

    # Tạo chữ nổi 3D
    grp_text = entities.add_group
    grp_text.name = "Chữ Nổi 3D"
    text_height = 15.mm
    text_depth = 5.mm
    text = "Hộp đèn"
    text_position = [50.mm, 100.mm, 20.mm]
    text_entity = grp_text.entities.add_text(text, text_position)
    text_entity.transform!(Geom::Transformation.new(text_position))
    text_entity.explode.each do |entity|
      entity.pushpull(text_depth)
    end
    grp_text.material = "Red"

    # Tạo đèn LED viền
    grp_led = entities.add_group
    grp_led.name = "Đèn LED"
    led_pts = [
      [0.mm, 0.mm, 25.mm],
      [450.mm, 0.mm, 25.mm],
      [450.mm, 250.mm, 25.mm],
      [0.mm, 250.mm, 25.mm]
    ]
    led_face = grp_led.entities.add_face(led_pts)
    led_face.pushpull(2.mm)
    grp_led.material = "Yellow"

    model.commit_operation
  end
end
HopDenTonRiSet45X25.build