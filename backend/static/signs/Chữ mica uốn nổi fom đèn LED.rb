# Mã nguồn Ruby hoàn chỉnh
module ChuMicaUonNoiFomDenLed
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuMicaUonNoiFomDenLed', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    grp_frame = entities.add_group
    grp_frame.name = "KhungSatDo"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [1200.mm, 0.mm, 0.mm],
      [1200.mm, 400.mm, 0.mm],
      [0.mm, 400.mm, 0.mm]
    ]
    frame_face = grp_frame.entities.add_face(frame_pts)
    frame_face.pushpull(60.mm) # Độ dày của khung
    grp_frame.material = "Gray"

    # Tạo bề mặt biển
    grp_surface = entities.add_group
    grp_surface.name = "BeMatBien"
    surface_pts = [
      [0.mm, 0.mm, 0.mm],
      [1200.mm, 0.mm, 0.mm],
      [1200.mm, 400.mm, 0.mm],
      [0.mm, 400.mm, 0.mm]
    ]
    surface_face = grp_surface.entities.add_face(surface_pts)
    surface_face.pushpull(-5.mm) # Độ dày của bề mặt biển
    grp_surface.material = "White" # Màu trắng cho bề mặt biển

    # Tạo chữ nổi 3D
    grp_text = entities.add_group
    grp_text.name = "ChuNoi"
    text = "LED"
    text_position = Geom::Point3d.new(100.mm, 100.mm, 0.mm)
    text_entity = grp_text.entities.add_text(text, text_position)
    text_entity.transform!(Geom::Transformation.new([0, 0, 5.mm])) # Nâng chữ lên 5mm
    grp_text.material = "Red" # Màu đỏ cho chữ nổi

    # Tạo đèn LED
    grp_led = entities.add_group
    grp_led.name = "DenLED"
    led_pts = [
      [0.mm, 0.mm, 5.mm],
      [1200.mm, 0.mm, 5.mm],
      [1200.mm, 400.mm, 5.mm],
      [0.mm, 400.mm, 5.mm]
    ]
    led_face = grp_led.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Độ dày của đèn LED
    grp_led.material = "Yellow" # Màu vàng cho đèn LED

    model.commit_operation
  end
end
ChuMicaUonNoiFomDenLed.build