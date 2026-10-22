# Mã nguồn Ruby hoàn chỉnh
module HopDenBatKhongGanInUvVienNhomNhetCanh
  def self.build
    model = Sketchup.active_model
    model.start_operation('HopDenBatKhongGanInUvVienNhomNhetCanh', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_grp = entities.add_group
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [3000.mm, 0.mm, 0.mm],
      [3000.mm, 1000.mm, 0.mm],
      [0.mm, 1000.mm, 0.mm]
    ]
    frame_face = frame_grp.entities.add_face(frame_pts)
    frame_face.pushpull(150.mm) # Độ dày của khung
    frame_grp.material = "Gray"

    # Tạo bề mặt biển
    surface_grp = entities.add_group
    surface_pts = [
      [0.mm, 0.mm, 150.mm],
      [3000.mm, 0.mm, 150.mm],
      [3000.mm, 1000.mm, 150.mm],
      [0.mm, 1000.mm, 150.mm]
    ]
    surface_face = surface_grp.entities.add_face(surface_pts)
    surface_face.pushpull(-5.mm) # Độ dày của bề mặt
    surface_grp.material = "White"

    # Tạo chữ nổi 3D
    text_grp = entities.add_group
    text = "Hộp đèn bạt không gân"
    text_position = [1500.mm, 500.mm, 155.mm] # Vị trí chữ nổi
    text_face = text_grp.entities.add_text(text, text_position)
    text_face.pushpull(10.mm) # Độ dày chữ nổi
    text_grp.material = "Red"

    # Tạo đèn LED viền
    led_grp = entities.add_group
    led_pts = [
      [0.mm, 0.mm, 160.mm],
      [3000.mm, 0.mm, 160.mm],
      [3000.mm, 1000.mm, 160.mm],
      [0.mm, 1000.mm, 160.mm]
    ]
    led_face = led_grp.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Độ dày của viền đèn LED
    led_grp.material = "Yellow"

    model.commit_operation
  end
end
HopDenBatKhongGanInUvVienNhomNhetCanh.build