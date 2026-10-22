# Mã nguồn Ruby hoàn chỉnh
module TranAluGuongBongBubVienKhungNhom
  def self.build
    model = Sketchup.active_model
    model.start_operation('TranAluGuongBongBubVienKhungNhom', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_grp = entities.add_group
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [3000.mm, 0.mm, 0.mm],
      [3000.mm, 150.mm, 0.mm],
      [0.mm, 150.mm, 0.mm]
    ]
    frame_face = frame_grp.entities.add_face(frame_pts)
    frame_face.pushpull(-50.mm) # Độ dày khung
    frame_grp.material = "Gray"

    # Tạo bề mặt biển
    surface_grp = entities.add_group
    surface_pts = [
      [0.mm, 0.mm, -50.mm],
      [3000.mm, 0.mm, -50.mm],
      [3000.mm, 1000.mm, -50.mm],
      [0.mm, 1000.mm, -50.mm]
    ]
    surface_face = surface_grp.entities.add_face(surface_pts)
    surface_face.pushpull(150.mm) # Độ dày bề mặt
    surface_grp.material = "Mirror"

    # Tạo chữ nổi 3D
    text_grp = entities.add_group
    text = "Trần alu gương bóng BUB"
    text_position = [1500.mm, 500.mm, -50.mm]
    text_face = text_grp.entities.add_text(text, text_position)
    text_face.pushpull(10.mm) # Độ dày chữ nổi
    text_grp.material = "Gold"

    # Tạo đèn LED viền
    led_grp = entities.add_group
    led_pts = [
      [0.mm, 0.mm, -60.mm],
      [3000.mm, 0.mm, -60.mm],
      [3000.mm, 1000.mm, -60.mm],
      [0.mm, 1000.mm, -60.mm]
    ]
    led_face = led_grp.entities.add_face(led_pts)
    led_face.pushpull(-5.mm) # Độ dày đèn LED
    led_grp.material = "Yellow"

    model.commit_operation
  end
end
TranAluGuongBongBubVienKhungNhom.build