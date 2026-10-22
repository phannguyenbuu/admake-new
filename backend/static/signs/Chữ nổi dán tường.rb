# Mã nguồn Ruby hoàn chỉnh
module ChuNoiDanTuong
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuNoiDanTuong', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_height = 400.mm
    frame_width = 1200.mm
    frame_depth = 60.mm
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
    surface_height = 400.mm
    surface_width = 1200.mm
    surface_depth = 10.mm
    surface_pts = [
      [0, 0, frame_height],
      [surface_width, 0, frame_height],
      [surface_width, surface_depth, frame_height],
      [0, surface_depth, frame_height]
    ]
    
    surface_grp = entities.add_group
    surface_face = surface_grp.entities.add_face(surface_pts)
    surface_face.pushpull(-surface_depth)
    surface_grp.material = "White"

    # Tạo chữ nổi 3D
    letter_height = 50.mm
    letter_depth = 20.mm
    letter_pts = [
      [100.mm, 20.mm, frame_height + surface_depth],
      [200.mm, 20.mm, frame_height + surface_depth],
      [200.mm, 20.mm + letter_depth, frame_height + surface_depth],
      [100.mm, 20.mm + letter_depth, frame_height + surface_depth]
    ]
    
    letter_grp = entities.add_group
    letter_face = letter_grp.entities.add_face(letter_pts)
    letter_face.pushpull(letter_height)
    letter_grp.material = "Red"

    # Tạo đèn LED viền
    led_height = 10.mm
    led_depth = 5.mm
    led_pts = [
      [100.mm, 20.mm + letter_depth, frame_height + surface_depth],
      [200.mm, 20.mm + letter_depth, frame_height + surface_depth],
      [200.mm, 20.mm + letter_depth + led_depth, frame_height + surface_depth],
      [100.mm, 20.mm + letter_depth + led_depth, frame_height + surface_depth]
    ]
    
    led_grp = entities.add_group
    led_face = led_grp.entities.add_face(led_pts)
    led_face.pushpull(led_height)
    led_grp.material = "Yellow"

    model.commit_operation
  end
end
ChuNoiDanTuong.build