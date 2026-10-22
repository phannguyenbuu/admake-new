# Mã nguồn Ruby hoàn chỉnh
module HagtagsFomexCanDecal
  def self.build
    model = Sketchup.active_model
    model.start_operation('HagtagsFomexCanDecal', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_height = 1000.mm
    frame_width = 3000.mm
    frame_depth = 150.mm
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

    # Tạo bề mặt biển chính
    surface_height = 1000.mm
    surface_width = 3000.mm
    surface_depth = 10.mm
    surface_pts = [
      [0, 0, frame_height],
      [surface_width, 0, frame_height],
      [surface_width, surface_depth, frame_height],
      [0, surface_depth, frame_height]
    ]
    surface_grp = entities.add_group
    surface_face = surface_grp.entities.add_face(surface_pts)
    surface_face.pushpull(surface_depth)
    surface_grp.material = "White"

    # Tạo chữ nổi 3D
    text_height = 50.mm
    text_depth = 20.mm
    text_content = "Hagtags Fomex"
    text_grp = entities.add_group
    text_face = text_grp.entities.add_face([0, 0, frame_height + surface_depth])
    text_face.pushpull(text_depth)
    text_grp.material = "Blue"

    # Thêm đèn LED
    led_height = 10.mm
    led_depth = 5.mm
    led_grp = entities.add_group
    led_face = led_grp.entities.add_face([0, 0, frame_height + surface_depth + text_height])
    led_face.pushpull(led_depth)
    led_grp.material = "Yellow"

    model.commit_operation
  end
end
HagtagsFomexCanDecal.build