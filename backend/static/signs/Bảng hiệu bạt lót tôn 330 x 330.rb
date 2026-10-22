# Mã nguồn Ruby hoàn chỉnh
module BangHieuBatLotTon330X330
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuBatLotTon330X330', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_group = entities.add_group
    frame_group.name = "Khung Sat Do"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [3300.mm, 0.mm, 0.mm],
      [3300.mm, 3300.mm, 0.mm],
      [0.mm, 3300.mm, 0.mm]
    ]
    frame_face = frame_group.entities.add_face(frame_pts)
    frame_face.pushpull(30.mm)  # Độ dày của khung
    frame_group.material = "Gray"

    # Tạo bề mặt biển
    surface_group = entities.add_group
    surface_group.name = "Be Mat Bien"
    surface_pts = [
      [0.mm, 0.mm, 30.mm],
      [3300.mm, 0.mm, 30.mm],
      [3300.mm, 3300.mm, 30.mm],
      [0.mm, 3300.mm, 30.mm]
    ]
    surface_face = surface_group.entities.add_face(surface_pts)
    surface_face.pushpull(5.mm)  # Độ dày của bề mặt biển
    surface_group.material = "Blue"

    # Tạo chữ nổi 3D
    text_group = entities.add_group
    text_group.name = "Chu Noi 3D"
    text_position = [1000.mm, 1000.mm, 35.mm]
    text_face = text_group.entities.add_face([text_position, [text_position[0] + 2000.mm, text_position[1], text_position[2]], 
                                                [text_position[0] + 2000.mm, text_position[1] + 500.mm, text_position[2]], 
                                                [text_position[0], text_position[1] + 500.mm, text_position[2]]])
    text_face.pushpull(10.mm)  # Độ dày của chữ nổi
    text_group.material = "Yellow"

    # Tạo đèn LED viền
    led_group = entities.add_group
    led_group.name = "Den LED"
    led_pts = [
      [0.mm, 0.mm, 40.mm],
      [3300.mm, 0.mm, 40.mm],
      [3300.mm, 3300.mm, 40.mm],
      [0.mm, 3300.mm, 40.mm]
    ]
    led_face = led_group.entities.add_face(led_pts)
    led_face.pushpull(5.mm)  # Độ dày của đèn LED
    led_group.material = "White"

    model.commit_operation
  end
end
BangHieuBatLotTon330X330.build