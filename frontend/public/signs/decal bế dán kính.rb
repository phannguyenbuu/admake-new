# Mã nguồn Ruby hoàn chỉnh
module DecalBeDanKinh
  def self.build
    model = Sketchup.active_model
    model.start_operation('DecalBeDanKinh', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_group = entities.add_group
    frame_group.name = "Khung Sắt Đỡ"
    frame_pts = [
      [0, 0, 0],
      [3000.mm, 0, 0],
      [3000.mm, 1000.mm, 0],
      [0, 1000.mm, 0]
    ]
    frame_face = frame_group.entities.add_face(frame_pts)
    frame_face.pushpull(150.mm)  # Độ dày của khung
    frame_group.material = "Gray"

    # Tạo bề mặt biển chính
    surface_group = entities.add_group
    surface_group.name = "Bề Mặt Biển"
    surface_pts = [
      [0, 0, 150.mm],
      [3000.mm, 0, 150.mm],
      [3000.mm, 1000.mm, 150.mm],
      [0, 1000.mm, 150.mm]
    ]
    surface_face = surface_group.entities.add_face(surface_pts)
    surface_face.pushpull(-5.mm)  # Độ dày của bề mặt
    surface_group.material = "White"  # Màu sắc bề mặt

    # Tạo chữ nổi 3D
    text_group = entities.add_group
    text_group.name = "Chữ Nổi"
    text_position = [1000.mm, 500.mm, 155.mm]  # Vị trí chữ
    text_face = text_group.entities.add_face([text_position, [text_position[0] + 200.mm, text_position[1], text_position[2]], 
                                               [text_position[0] + 200.mm, text_position[1] + 50.mm, text_position[2]], 
                                               [text_position[0], text_position[1] + 50.mm, text_position[2]]])
    text_face.pushpull(10.mm)  # Độ dày chữ
    text_group.material = "Red"  # Màu chữ

    # Tạo đèn LED viền
    led_group = entities.add_group
    led_group.name = "Đèn LED"
    led_pts = [
      [0, 0, 160.mm],
      [3000.mm, 0, 160.mm],
      [3000.mm, 1000.mm, 160.mm],
      [0, 1000.mm, 160.mm]
    ]
    led_face = led_group.entities.add_face(led_pts)
    led_face.pushpull(5.mm)  # Độ dày của đèn LED
    led_group.material = "Yellow"  # Màu đèn LED

    model.commit_operation
  end
end
DecalBeDanKinh.build