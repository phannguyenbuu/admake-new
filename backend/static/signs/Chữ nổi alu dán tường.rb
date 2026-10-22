# Mã nguồn Ruby hoàn chỉnh
module ChuNoiAluDanTuong
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuNoiAluDanTuong', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_grp = entities.add_group
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [1200.mm, 0.mm, 0.mm],
      [1200.mm, 400.mm, 0.mm],
      [0.mm, 400.mm, 0.mm]
    ]
    frame_face = frame_grp.entities.add_face(frame_pts)
    frame_face.pushpull(60.mm)  # Độ dày khung
    frame_grp.material = "Gray"

    # Tạo bề mặt biển chính
    surface_grp = entities.add_group
    surface_face = surface_grp.entities.add_face(frame_pts)
    surface_face.pushpull(-5.mm)  # Độ dày bề mặt
    surface_grp.material = "Aluminum"

    # Tạo chữ nổi 3D
    text_grp = entities.add_group
    text = "Chữ nổi alu"
    text_pts = [0.mm, 0.mm, 5.mm]  # Đặt chữ nổi trên bề mặt
    text_face = text_grp.entities.add_3d_text(text, TextAlignCenter, text_pts, 100.mm, 0.mm, true, false)
    text_face.pushpull(20.mm)  # Độ dày chữ nổi
    text_grp.material = "Gold"

    # Tạo đèn LED viền
    led_grp = entities.add_group
    led_pts = [
      [0.mm, 0.mm, 25.mm],
      [1200.mm, 0.mm, 25.mm],
      [1200.mm, 400.mm, 25.mm],
      [0.mm, 400.mm, 25.mm]
    ]
    led_face = led_grp.entities.add_face(led_pts)
    led_face.pushpull(5.mm)  # Độ dày đèn LED
    led_grp.material = "Yellow"

    model.commit_operation
  end
end
ChuNoiAluDanTuong.build