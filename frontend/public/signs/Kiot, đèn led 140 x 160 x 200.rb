# Mã nguồn Ruby hoàn chỉnh
module KiotDenLed140X160X200
  def self.build
    model = Sketchup.active_model
    model.start_operation('KiotDenLed140X160X200', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_height = 1600.mm
    frame_width = 1400.mm
    frame_depth = 2000.mm
    frame_thickness = 50.mm

    # Tạo nhóm khung
    grp_frame = entities.add_group
    grp_frame.name = "Khung Sắt Đỡ"
    pts_frame = [
      [0, 0, 0],
      [frame_width, 0, 0],
      [frame_width, frame_depth, 0],
      [0, frame_depth, 0]
    ]
    face_frame = grp_frame.entities.add_face(pts_frame)
    face_frame.pushpull(frame_height)

    # Gán màu cho khung
    grp_frame.material = "Gray"

    # Tạo bề mặt biển quảng cáo
    sign_height = 1600.mm
    sign_width = 1400.mm
    sign_depth = 20.mm

    # Tạo nhóm biển quảng cáo
    grp_sign = entities.add_group
    grp_sign.name = "Bề Mặt Biển Quảng Cáo"
    pts_sign = [
      [0, 0, frame_height],
      [sign_width, 0, frame_height],
      [sign_width, sign_depth, frame_height],
      [0, sign_depth, frame_height]
    ]
    face_sign = grp_sign.entities.add_face(pts_sign)
    face_sign.pushpull(sign_depth)

    # Gán màu cho biển quảng cáo
    grp_sign.material = "White"

    # Tạo chữ nổi 3D
    text_height = 100.mm
    text_depth = 20.mm
    text_content = "Kiot"

    # Tạo nhóm chữ nổi
    grp_text = entities.add_group
    grp_text.name = "Chữ Nổi"
    text_position = [200.mm, 10.mm, frame_height + 10.mm]
    text = grp_text.entities.add_text(text_content, text_position)
    text_face = grp_text.entities.add_face([text_position, [text_position[0] + 100.mm, text_position[1], text_position[2]], 
                                                  [text_position[0] + 100.mm, text_position[1] + text_height, text_position[2]], 
                                                  [text_position[0], text_position[1] + text_height, text_position[2]]])
    text_face.pushpull(text_depth)

    # Gán màu cho chữ nổi
    grp_text.material = "Red"

    # Tạo đèn LED
    led_height = 10.mm
    led_depth = 10.mm

    # Tạo nhóm đèn LED
    grp_led = entities.add_group
    grp_led.name = "Đèn LED"
    led_position = [0, 0, frame_height + 20.mm]
    led_face = grp_led.entities.add_face([led_position, [led_position[0] + frame_width, led_position[1], led_position[2]], 
                                                     [led_position[0] + frame_width, led_position[1] + led_depth, led_position[2]], 
                                                     [led_position[0], led_position[1] + led_depth, led_position[2]]])
    led_face.pushpull(led_height)

    # Gán màu cho đèn LED
    grp_led.material = "Yellow"

    model.commit_operation
  end
end
KiotDenLed140X160X200.build