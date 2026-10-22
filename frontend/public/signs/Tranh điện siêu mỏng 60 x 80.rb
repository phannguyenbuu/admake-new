# Mã nguồn Ruby hoàn chỉnh
module TranhDienSieuMong60X80
  def self.build
    model = Sketchup.active_model
    model.start_operation('TranhDienSieuMong60X80', true)
    entities = model.active_entities

    # Tạo khung đỡ
    frame_group = entities.add_group
    frame_group.name = "Khung Đỡ"
    frame_points = [
      [0.mm, 0.mm, 0.mm],
      [600.mm, 0.mm, 0.mm],
      [600.mm, 800.mm, 0.mm],
      [0.mm, 800.mm, 0.mm]
    ]
    frame_face = frame_group.entities.add_face(frame_points)
    frame_face.reverse! # Đảo mặt nếu cần
    frame_face.pushpull(20.mm) # Độ dày khung
    frame_group.material = "Gray"

    # Tạo bề mặt biển quảng cáo
    surface_group = entities.add_group
    surface_group.name = "Bề Mặt Biển"
    surface_points = [
      [0.mm, 0.mm, 20.mm],
      [600.mm, 0.mm, 20.mm],
      [600.mm, 800.mm, 20.mm],
      [0.mm, 800.mm, 20.mm]
    ]
    surface_face = surface_group.entities.add_face(surface_points)
    surface_face.reverse! # Đảo mặt nếu cần
    surface_face.pushpull(-20.mm) # Độ dày bề mặt
    surface_group.material = "White"

    # Tạo chữ nổi 3D
    text_group = entities.add_group
    text_group.name = "Chữ Nổi 3D"
    text_position = [100.mm, 100.mm, 20.mm]
    text_face = text_group.entities.add_face([text_position, [text_position[0] + 200.mm, text_position[1], text_position[2]], 
                                                [text_position[0] + 200.mm, text_position[1] + 50.mm, text_position[2]], 
                                                [text_position[0], text_position[1] + 50.mm, text_position[2]]])
    text_face.pushpull(5.mm) # Độ dày chữ nổi
    text_group.material = "Red"

    # Tạo đèn LED
    led_group = entities.add_group
    led_group.name = "Đèn LED"
    led_position = [0.mm, 0.mm, 25.mm]
    led_face = led_group.entities.add_face([led_position, [led_position[0] + 600.mm, led_position[1], led_position[2]], 
                                                          [led_position[0] + 600.mm, led_position[1] + 10.mm, led_position[2]], 
                                                          [led_position[0], led_position[1] + 10.mm, led_position[2]]])
    led_face.pushpull(1.mm) # Độ dày đèn LED
    led_group.material = "Yellow"

    model.commit_operation
  end
end
TranhDienSieuMong60X80.build