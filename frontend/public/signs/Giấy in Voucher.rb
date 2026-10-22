# Mã nguồn Ruby hoàn chỉnh
module GiayInVoucher
  def self.build
    model = Sketchup.active_model
    model.start_operation('GiayInVoucher', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_height = 100.mm
    frame_width = 200.mm
    frame_depth = 2.mm
    frame_pts = [
      [0, 0, 0],
      [frame_width, 0, 0],
      [frame_width, frame_depth, 0],
      [0, frame_depth, 0]
    ]
    
    # Tạo nhóm khung
    frame_group = entities.add_group
    frame_face = frame_group.entities.add_face(frame_pts)
    frame_face.pushpull(frame_height)
    frame_group.material = "Gray"

    # Tạo bề mặt biển chính
    surface_height = 100.mm
    surface_width = 200.mm
    surface_depth = 2.mm
    surface_pts = [
      [0, 0, frame_height],
      [surface_width, 0, frame_height],
      [surface_width, surface_depth, frame_height],
      [0, surface_depth, frame_height]
    ]
    
    # Tạo nhóm bề mặt
    surface_group = entities.add_group
    surface_face = surface_group.entities.add_face(surface_pts)
    surface_face.pushpull(-frame_depth)
    surface_group.material = "White"

    # Tạo chữ nổi 3D
    text_height = 10.mm
    text_depth = 5.mm
    text_group = entities.add_group
    text = "Giấy in Voucher"
    text_position = [50.mm, 10.mm, frame_height + 2.mm]
    text_entity = text_group.entities.add_3d_text(text, TextAlignCenter, text_position, text_height, false, false)
    text_group.material = "Blue"

    # Tạo đèn LED viền
    led_group = entities.add_group
    led_pts = [
      [0, -5.mm, frame_height + 5.mm],
      [200.mm, -5.mm, frame_height + 5.mm],
      [200.mm, 5.mm, frame_height + 5.mm],
      [0, 5.mm, frame_height + 5.mm]
    ]
    
    led_face = led_group.entities.add_face(led_pts)
    led_face.pushpull(2.mm)
    led_group.material = "Yellow"

    model.commit_operation
  end
end
GiayInVoucher.build