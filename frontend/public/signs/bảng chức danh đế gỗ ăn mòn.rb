# Mã nguồn Ruby hoàn chỉnh
module BangChucDanhDeGoAnMon
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangChucDanhDeGoAnMon', true)
    entities = model.active_entities

    # Tạo khung đỡ
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [300.mm, 0.mm, 0.mm],
      [300.mm, 40.mm, 0.mm],
      [0.mm, 40.mm, 0.mm]
    ]
    frame_grp = entities.add_group
    frame_face = frame_grp.entities.add_face(frame_pts)
    frame_face.pushpull(150.mm) # Kéo khối lên cao 150mm
    frame_grp.material = "Gray" # Màu khung

    # Tạo bề mặt biển
    surface_pts = [
      [5.mm, 5.mm, 150.mm],
      [295.mm, 5.mm, 150.mm],
      [295.mm, 35.mm, 150.mm],
      [5.mm, 35.mm, 150.mm]
    ]
    surface_grp = entities.add_group
    surface_face = surface_grp.entities.add_face(surface_pts)
    surface_face.pushpull(5.mm) # Kéo bề mặt lên cao 5mm
    surface_grp.material = "White" # Màu bề mặt biển

    # Tạo chữ nổi 3D
    text_grp = entities.add_group
    text = text_grp.entities.add_text("Chức Danh", [10.mm, 10.mm, 155.mm], 20.mm)
    text_grp.material = "Blue" # Màu chữ nổi

    # Tạo đèn LED viền
    led_grp = entities.add_group
    led_pts = [
      [0.mm, 0.mm, 155.mm],
      [300.mm, 0.mm, 155.mm],
      [300.mm, 5.mm, 155.mm],
      [0.mm, 5.mm, 155.mm]
    ]
    led_face = led_grp.entities.add_face(led_pts)
    led_face.pushpull(2.mm) # Kéo đèn LED lên cao 2mm
    led_grp.material = "Yellow" # Màu đèn LED

    model.commit_operation
  end
end
BangChucDanhDeGoAnMon.build