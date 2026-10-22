# Mã nguồn Ruby hoàn chỉnh
module BangHieuVachPvcVanDa
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuVachPvcVanDa', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_pts = [
      [0, 0, 0],
      [3000.mm, 0, 0],
      [3000.mm, 150.mm, 0],
      [0, 150.mm, 0]
    ]
    frame_grp = entities.add_group
    frame_face = frame_grp.entities.add_face(frame_pts)
    frame_face.pushpull(100.mm)  # Chiều cao khung
    frame_grp.material = "Gray"  # Màu khung sắt

    # Tạo bề mặt biển
    surface_pts = [
      [0, 0, 100.mm],
      [3000.mm, 0, 100.mm],
      [3000.mm, 150.mm, 100.mm],
      [0, 150.mm, 100.mm]
    ]
    surface_grp = entities.add_group
    surface_face = surface_grp.entities.add_face(surface_pts)
    surface_face.pushpull(10.mm)  # Độ dày bề mặt
    surface_grp.material = "White"  # Màu bề mặt biển

    # Tạo chữ nổi 3D
    text_grp = entities.add_group
    text = "Bảng hiệu vách PVC vân đá"
    text_position = [1500.mm, 75.mm, 110.mm]  # Vị trí chữ
    text_face = text_grp.entities.add_text(text, text_position)
    text_face.pushpull(10.mm)  # Độ dày chữ nổi
    text_grp.material = "Blue"  # Màu chữ

    # Tạo đèn LED viền
    led_grp = entities.add_group
    led_pts = [
      [0, -10.mm, 100.mm],
      [3000.mm, -10.mm, 100.mm],
      [3000.mm, 0, 100.mm],
      [0, 0, 100.mm]
    ]
    led_face = led_grp.entities.add_face(led_pts)
    led_face.pushpull(5.mm)  # Độ dày đèn LED
    led_grp.material = "Yellow"  # Màu đèn LED

    model.commit_operation
  end
end
BangHieuVachPvcVanDa.build