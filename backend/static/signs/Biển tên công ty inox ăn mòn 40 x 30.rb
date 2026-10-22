# Mã nguồn Ruby hoàn chỉnh
module BienTenCongTyInoxAnMon40X30
  def self.build
    model = Sketchup.active_model
    model.start_operation('BienTenCongTyInoxAnMon40X30', true)
    entities = model.active_entities

    # Tạo khung đỡ
    base_height = 20.mm
    base_width = 400.mm
    base_depth = 300.mm
    base_pts = [
      [0, 0, 0],
      [base_width, 0, 0],
      [base_width, base_depth, 0],
      [0, base_depth, 0]
    ]
    base_face = entities.add_face(base_pts)
    base_face.pushpull(base_height)
    base_group = entities.add_group(base_face)
    base_group.name = "KhungDo"

    # Tạo bề mặt biển
    surface_height = 5.mm
    surface_pts = [
      [0, 0, base_height],
      [base_width, 0, base_height],
      [base_width, base_depth, base_height],
      [0, base_depth, base_height]
    ]
    surface_face = entities.add_face(surface_pts)
    surface_face.pushpull(surface_height)
    surface_group = entities.add_group(surface_face)
    surface_group.name = "BeMatBien"
    surface_group.material = "Aluminum"

    # Tạo chữ nổi 3D
    text = "CÔNG TY ABC"
    text_height = 10.mm
    text_depth = 5.mm
    text_position = [50.mm, 50.mm, base_height + surface_height]
    text_group = entities.add_group
    text_group.name = "ChuNoi"
    text_group.entities.add_text(text, text_position, text_height)
    text_face = text_group.entities.add_face([
      [text_position[0], text_position[1], text_position[2]],
      [text_position[0] + 100.mm, text_position[1], text_position[2]],
      [text_position[0] + 100.mm, text_position[1] + 20.mm, text_position[2]],
      [text_position[0], text_position[1] + 20.mm, text_position[2]]
    ])
    text_face.pushpull(text_depth)

    # Tạo đèn LED
    led_height = 2.mm
    led_depth = 5.mm
    led_position = [0, 0, base_height + surface_height + text_depth]
    led_group = entities.add_group
    led_group.name = "DenLED"
    led_face = led_group.entities.add_face([
      [led_position[0], led_position[1], led_position[2]],
      [led_position[0] + base_width, led_position[1], led_position[2]],
      [led_position[0] + base_width, led_position[1] + led_depth, led_position[2]],
      [led_position[0], led_position[1] + led_depth, led_position[2]]
    ])
    led_face.pushpull(led_height)
    led_group.material = "Yellow"

    model.commit_operation
  end
end
BienTenCongTyInoxAnMon40X30.build