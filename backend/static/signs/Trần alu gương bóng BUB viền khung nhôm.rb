# Mã nguồn Ruby hoàn chỉnh
module TranAluGuongBongBubVienKhungNhom
  def self.build
    model = Sketchup.active_model
    model.start_operation('TranAluGuongBongBubVienKhungNhom', true)
    entities = model.active_entities

    # Tạo khung nhôm
    frame_height = 150.mm
    frame_width = 3000.mm
    frame_depth = 1000.mm
    frame_pts = [
      [0, 0, 0],
      [frame_width, 0, 0],
      [frame_width, frame_depth, 0],
      [0, frame_depth, 0]
    ]
    
    frame_grp = entities.add_group
    frame_face = frame_grp.entities.add_face(frame_pts)
    frame_face.pushpull(frame_height)
    frame_grp.material = "Gray"

    # Tạo bề mặt alu gương bóng
    alu_surface_height = 5.mm
    alu_surface_grp = entities.add_group
    alu_surface_face = alu_surface_grp.entities.add_face(frame_pts)
    alu_surface_face.pushpull(alu_surface_height)
    alu_surface_grp.material = "Mirror"

    # Tạo chữ nổi 3D
    text_height = 20.mm
    text_depth = 10.mm
    text_grp = entities.add_group
    text_position = [frame_width / 2, frame_depth / 2, frame_height + 10.mm]
    text_face = text_grp.entities.add_face([text_position, [text_position[0] + 200.mm, text_position[1], text_position[2]], 
                                                   [text_position[0] + 200.mm, text_position[1] + 50.mm, text_position[2]], 
                                                   [text_position[0], text_position[1] + 50.mm, text_position[2]]])
    text_face.pushpull(text_depth)
    text_grp.material = "Gold"

    # Tạo đèn LED
    led_height = 5.mm
    led_depth = 5.mm
    led_grp = entities.add_group
    led_position = [0, frame_depth / 2 - 10.mm, frame_height + 5.mm]
    led_face = led_grp.entities.add_face([led_position, [led_position[0] + frame_width, led_position[1], led_position[2]], 
                                                      [led_position[0] + frame_width, led_position[1] + led_depth, led_position[2]], 
                                                      [led_position[0], led_position[1] + led_depth, led_position[2]]])
    led_face.pushpull(led_height)
    led_grp.material = "Yellow"

    model.commit_operation
  end
end
TranAluGuongBongBubVienKhungNhom.build