# Mã nguồn Ruby hoàn chỉnh
module BangMicaTenPhong20X10
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangMicaTenPhong20X10', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_group = entities.add_group
    frame_group.name = "KhungSat"
    frame_points = [
      [0.mm, 0.mm, 0.mm],
      [200.mm, 0.mm, 0.mm],
      [200.mm, 100.mm, 0.mm],
      [0.mm, 100.mm, 0.mm]
    ]
    frame_face = frame_group.entities.add_face(frame_points)
    frame_face.pushpull(20.mm) # Độ dày của khung
    frame_group.material = "Gray"

    # Tạo bề mặt biển mica
    surface_group = entities.add_group
    surface_group.name = "BeMatMica"
    surface_points = [
      [0.mm, 0.mm, 20.mm],
      [200.mm, 0.mm, 20.mm],
      [200.mm, 100.mm, 20.mm],
      [0.mm, 100.mm, 20.mm]
    ]
    surface_face = surface_group.entities.add_face(surface_points)
    surface_face.pushpull(5.mm) # Độ dày của mica
    surface_group.material = "LightBlue"

    # Tạo chữ nổi 3D
    text_group = entities.add_group
    text_group.name = "ChuNoi"
    text = "PHÒNG 101"
    text_position = [10.mm, 10.mm, 25.mm]
    text_entity = text_group.entities.add_text(text, text_position)
    text_group.material = "White"

    # Tạo đèn LED viền
    led_group = entities.add_group
    led_group.name = "DenLED"
    led_points = [
      [0.mm, 0.mm, 25.mm],
      [200.mm, 0.mm, 25.mm],
      [200.mm, 100.mm, 25.mm],
      [0.mm, 100.mm, 25.mm]
    ]
    led_face = led_group.entities.add_face(led_points)
    led_face.pushpull(5.mm) # Độ dày của đèn LED
    led_group.material = "Yellow"

    model.commit_operation
  end
end
BangMicaTenPhong20X10.build