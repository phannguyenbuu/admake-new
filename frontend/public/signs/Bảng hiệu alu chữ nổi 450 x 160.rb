# Mã nguồn Ruby hoàn chỉnh
module BangHieuAluChuNoi450X160
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuAluChuNoi450X160', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [4500.mm, 0.mm, 0.mm],
      [4500.mm, 30.mm, 0.mm],
      [0.mm, 30.mm, 0.mm]
    ]
    frame_grp = entities.add_group
    frame_face = frame_grp.entities.add_face(frame_pts)
    frame_face.pushpull(30.mm) # Độ dày khung
    frame_grp.material = "Gray"

    # Tạo bề mặt biển
    surface_pts = [
      [0.mm, 0.mm, 30.mm],
      [4500.mm, 0.mm, 30.mm],
      [4500.mm, 1600.mm, 30.mm],
      [0.mm, 1600.mm, 30.mm]
    ]
    surface_grp = entities.add_group
    surface_face = surface_grp.entities.add_face(surface_pts)
    surface_face.pushpull(5.mm) # Độ dày bề mặt
    surface_grp.material = "Aluminum"

    # Tạo chữ nổi 3D
    text_grp = entities.add_group
    text = "Bảng hiệu alu chữ nổi"
    text_pts = [0.mm, 1000.mm, 35.mm] # Vị trí chữ nổi
    text_face = text_grp.entities.add_text(text, text_pts)
    text_grp.material = "White"

    # Tạo đèn LED viền
    led_grp = entities.add_group
    led_pts = [
      [0.mm, 0.mm, 30.mm],
      [4500.mm, 0.mm, 30.mm],
      [4500.mm, 30.mm, 30.mm],
      [0.mm, 30.mm, 30.mm]
    ]
    led_face = led_grp.entities.add_face(led_pts)
    led_face.pushpull(10.mm) # Độ dày đèn LED
    led_grp.material = "Yellow"

    model.commit_operation
  end
end
BangHieuAluChuNoi450X160.build