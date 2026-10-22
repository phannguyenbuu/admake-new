# Mã nguồn Ruby hoàn chỉnh
module ChuInox304GanNenDa
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuInox304GanNenDa', true)
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
    
    frame_group = entities.add_group
    frame_face = frame_group.entities.add_face(frame_pts)
    frame_face.pushpull(frame_height)
    frame_group.material = "Gray"

    # Tạo tấm nền chính
    base_height = 10.mm
    base_pts = [
      [0, 0, frame_height],
      [frame_width, 0, frame_height],
      [frame_width, frame_depth, frame_height],
      [0, frame_depth, frame_height]
    ]
    
    base_group = entities.add_group
    base_face = base_group.entities.add_face(base_pts)
    base_face.pushpull(base_height)
    base_group.material = "White"

    # Tạo chữ nổi 3D
    letter_height = 50.mm
    letter_depth = 20.mm
    letter_pts = [
      [100.mm, 100.mm, frame_height + base_height],
      [200.mm, 100.mm, frame_height + base_height],
      [200.mm, 100.mm + letter_depth, frame_height + base_height],
      [100.mm, 100.mm + letter_depth, frame_height + base_height]
    ]
    
    letter_group = entities.add_group
    letter_face = letter_group.entities.add_face(letter_pts)
    letter_face.pushpull(letter_height)
    letter_group.material = "Silver"

    # Tạo đèn LED
    led_height = 5.mm
    led_pts = [
      [100.mm, 100.mm + letter_depth + 5.mm, frame_height + base_height + letter_height],
      [200.mm, 100.mm + letter_depth + 5.mm, frame_height + base_height + letter_height],
      [200.mm, 100.mm + letter_depth + 5.mm + 10.mm, frame_height + base_height + letter_height],
      [100.mm, 100.mm + letter_depth + 5.mm + 10.mm, frame_height + base_height + letter_height]
    ]
    
    led_group = entities.add_group
    led_face = led_group.entities.add_face(led_pts)
    led_face.pushpull(led_height)
    led_group.material = "Yellow"

    model.commit_operation
  end
end
ChuInox304GanNenDa.build