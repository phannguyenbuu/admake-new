# Mã nguồn Ruby hoàn chỉnh
module PhieuBaoHanhInGiay
  def self.build
    model = Sketchup.active_model
    model.start_operation('PhieuBaoHanhInGiay', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_grp = entities.add_group
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [200.mm, 0.mm, 0.mm],
      [200.mm, 100.mm, 0.mm],
      [0.mm, 100.mm, 0.mm]
    ]
    frame_face = frame_grp.entities.add_face(frame_pts)
    frame_face.pushpull(2.mm)  # Độ dày khung
    frame_grp.material = "Gray"

    # Tạo bề mặt biển chính
    surface_grp = entities.add_group
    surface_pts = [
      [0.mm, 0.mm, 2.mm],
      [200.mm, 0.mm, 2.mm],
      [200.mm, 100.mm, 2.mm],
      [0.mm, 100.mm, 2.mm]
    ]
    surface_face = surface_grp.entities.add_face(surface_pts)
    surface_face.pushpull(-2.mm)  # Độ dày bề mặt
    surface_grp.material = "White"

    # Tạo chữ nổi 3D
    text_grp = entities.add_group
    text = "Phiếu bảo hành"
    text_position = [10.mm, 10.mm, 2.mm]
    text_face = text_grp.entities.add_text(text, text_position)
    text_face.pushpull(5.mm)  # Độ dày chữ nổi
    text_grp.material = "Blue"

    # Tạo đèn LED viền
    led_grp = entities.add_group
    led_pts = [
      [0.mm, -5.mm, 2.mm],
      [200.mm, -5.mm, 2.mm],
      [200.mm, -5.mm, 5.mm],
      [0.mm, -5.mm, 5.mm]
    ]
    led_face = led_grp.entities.add_face(led_pts)
    led_face.pushpull(2.mm)  # Độ dày đèn LED
    led_grp.material = "Yellow"

    model.commit_operation
  end
end
PhieuBaoHanhInGiay.build