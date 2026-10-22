# Mã nguồn Ruby hoàn chỉnh
module TranhDienSieuMong
  def self.build
    model = Sketchup.active_model
    model.start_operation('TranhDienSieuMong', true)
    entities = model.active_entities

    # Tạo khung đỡ
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [600.mm, 0.mm, 0.mm],
      [600.mm, 20.mm, 0.mm],
      [0.mm, 20.mm, 0.mm]
    ]
    frame_grp = entities.add_group
    frame_face = frame_grp.entities.add_face(frame_pts)
    frame_face.pushpull(-20.mm) # Độ dày khung
    frame_grp.material = "Gray"

    # Tạo bề mặt biển quảng cáo
    surface_pts = [
      [0.mm, 0.mm, -20.mm],
      [600.mm, 0.mm, -20.mm],
      [600.mm, -900.mm, -20.mm],
      [0.mm, -900.mm, -20.mm]
    ]
    surface_grp = entities.add_group
    surface_face = surface_grp.entities.add_face(surface_pts)
    surface_face.pushpull(20.mm) # Độ dày bề mặt
    surface_grp.material = "White"

    # Tạo chữ nổi 3D
    text_grp = entities.add_group
    text = "Tranh Điện"
    text_position = [50.mm, -100.mm, -20.mm]
    text_face = text_grp.entities.add_3d_text(text, TextAlignCenter, text_position, 1.mm, 0, 0)
    text_face.pushpull(5.mm) # Độ dày chữ nổi
    text_grp.material = "Red"

    # Tạo đèn LED
    led_grp = entities.add_group
    led_pts = [
      [0.mm, -900.mm, -20.mm],
      [600.mm, -900.mm, -20.mm],
      [600.mm, -900.mm, -25.mm],
      [0.mm, -900.mm, -25.mm]
    ]
    led_face = led_grp.entities.add_face(led_pts)
    led_face.pushpull(-5.mm) # Độ dày đèn LED
    led_grp.material = "Yellow"

    model.commit_operation
  end
end
TranhDienSieuMong.build