# Mã nguồn Ruby hoàn chỉnh
module ChuChanNhomKhongGo
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuChanNhomKhongGo', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_width = 1200.mm
    frame_height = 400.mm
    frame_depth = 60.mm
    frame_thickness = 5.mm

    # Tạo nhóm khung
    grp_frame = entities.add_group
    grp_frame.name = "Khung sat do"
    pts_frame = [
      [0, 0, 0],
      [frame_width, 0, 0],
      [frame_width, frame_height, 0],
      [0, frame_height, 0]
    ]
    face_frame = grp_frame.entities.add_face(pts_frame)
    face_frame.pushpull(frame_thickness)

    # Gán màu cho khung
    grp_frame.material = "Gray"

    # Tạo bề mặt biển chính
    grp_surface = entities.add_group
    grp_surface.name = "Be mat bien"
    pts_surface = [
      [0, 0, frame_thickness],
      [frame_width, 0, frame_thickness],
      [frame_width, frame_height, frame_thickness],
      [0, frame_height, frame_thickness]
    ]
    face_surface = grp_surface.entities.add_face(pts_surface)
    face_surface.pushpull(-5.mm) # Tạo độ dày cho bề mặt

    # Gán màu cho bề mặt
    grp_surface.material = "White"

    # Tạo chữ nổi 3D
    text_height = 50.mm
    text_depth = 10.mm
    text_content = "Chữ chân nhôm không gờ"

    grp_text = entities.add_group
    grp_text.name = "Chu noi 3D"
    text_position = [100.mm, 100.mm, frame_thickness + 5.mm]
    text = grp_text.entities.add_3d_text(text_content, TextAlignCenter, text_position, text_height, false, false)
    text.pushpull(text_depth)

    # Gán màu cho chữ
    grp_text.material = "Blue"

    # Tạo đèn LED trang trí
    led_radius = 5.mm
    led_distance = 10.mm
    led_height = 5.mm

    grp_led = entities.add_group
    grp_led.name = "Den LED"
    led_positions = [
      [0, -led_distance, frame_thickness + 5.mm],
      [frame_width, -led_distance, frame_thickness + 5.mm]
    ]
    led_positions.each do |pos|
      led_circle = grp_led.entities.add_circle(pos, [0, 0, 1], led_radius)
      led_face = grp_led.entities.add_face(led_circle)
      led_face.pushpull(led_height)
    end

    # Gán màu cho đèn LED
    grp_led.material = "Yellow"

    model.commit_operation
  end
end
ChuChanNhomKhongGo.build