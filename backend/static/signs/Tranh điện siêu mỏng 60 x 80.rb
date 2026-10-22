# Mã nguồn Ruby hoàn chỉnh
module TranhDienSieuMong60X80
  def self.build
    model = Sketchup.active_model
    model.start_operation('TranhDienSieuMong60X80', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_width = 600.mm
    frame_height = 800.mm
    frame_depth = 20.mm

    # Tạo khung
    frame_pts = [
      [0, 0, 0],
      [frame_width, 0, 0],
      [frame_width, frame_height, 0],
      [0, frame_height, 0]
    ]
    frame_grp = entities.add_group
    frame_face = frame_grp.entities.add_face(frame_pts)
    frame_face.pushpull(frame_depth) # Kéo khung lên
    frame_grp.material = "Gray" # Màu khung

    # Tạo bề mặt biển
    surface_grp = entities.add_group
    surface_face = surface_grp.entities.add_face(frame_pts)
    surface_face.pushpull(-frame_depth) # Đẩy bề mặt vào trong
    surface_grp.material = "White" # Màu bề mặt

    # Tạo chữ nổi 3D
    text_height = 10.mm
    text_depth = 5.mm
    text_content = "Tranh điện siêu mỏng"
    text_position = [frame_width / 2, frame_height / 2, frame_depth]

    text_grp = entities.add_group
    text_face = text_grp.entities.add_face([text_position, [text_position[0] + 200.mm, text_position[1], text_position[2]], 
                                                  [text_position[0] + 200.mm, text_position[1] + text_height, text_position[2]], 
                                                  [text_position[0], text_position[1] + text_height, text_position[2]]])
    text_face.pushpull(text_depth) # Kéo chữ nổi lên
    text_grp.material = "Blue" # Màu chữ

    # Tạo đèn LED viền
    led_grp = entities.add_group
    led_face = led_grp.entities.add_face(frame_pts)
    led_face.pushpull(5.mm) # Kéo đèn LED ra ngoài
    led_grp.material = "Yellow" # Màu đèn LED

    model.commit_operation
  end
end
TranhDienSieuMong60X80.build