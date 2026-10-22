# Mã nguồn Ruby hoàn chỉnh
module TranhDienSieuMong
  def self.build
    model = Sketchup.active_model
    model.start_operation('TranhDienSieuMong', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [600.mm, 0.mm, 0.mm],
      [600.mm, 20.mm, 0.mm],
      [0.mm, 20.mm, 0.mm]
    ]
    frame_grp = entities.add_group
    frame_face = frame_grp.entities.add_face(frame_pts)
    frame_face.pushpull(900.mm) # Kéo khối lên cao 900mm
    frame_grp.material = "Gray" # Màu khung sắt

    # Tạo bề mặt biển chính
    surface_pts = [
      [0.mm, 0.mm, 20.mm],
      [600.mm, 0.mm, 20.mm],
      [600.mm, 20.mm, 20.mm],
      [0.mm, 20.mm, 20.mm]
    ]
    surface_grp = entities.add_group
    surface_face = surface_grp.entities.add_face(surface_pts)
    surface_face.pushpull(900.mm) # Kéo khối lên cao 900mm
    surface_grp.material = "White" # Màu bề mặt biển

    # Tạo chữ nổi 3D
    text_grp = entities.add_group
    text = "Tranh điện siêu mỏng"
    text_position = [50.mm, 50.mm, 20.mm]
    text_face = text_grp.entities.add_text(text, text_position)
    text_face.pushpull(5.mm) # Kéo chữ nổi lên 5mm
    text_grp.material = "Red" # Màu chữ nổi

    # Tạo đèn LED viền
    led_grp = entities.add_group
    led_pts = [
      [0.mm, -5.mm, 20.mm],
      [600.mm, -5.mm, 20.mm],
      [600.mm, 0.mm, 20.mm],
      [0.mm, 0.mm, 20.mm]
    ]
    led_face = led_grp.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Kéo đèn LED lên 5mm
    led_grp.material = "Yellow" # Màu đèn LED

    model.commit_operation
  end
end
TranhDienSieuMong.build