# Mã nguồn Ruby hoàn chỉnh
module BangHieuBatLotTon1300X120
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuBatLotTon1300X120', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_group = entities.add_group
    frame_group.name = "KhungSatDo"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [13000.mm, 0.mm, 0.mm],
      [13000.mm, 150.mm, 0.mm],
      [0.mm, 150.mm, 0.mm]
    ]
    frame_face = frame_group.entities.add_face(frame_pts)
    frame_face.pushpull(1200.mm)  # Chiều cao của khung
    frame_group.material = "Gray"

    # Tạo bề mặt biển
    surface_group = entities.add_group
    surface_group.name = "BeMatBien"
    surface_pts = [
      [0.mm, 0.mm, 0.mm],
      [13000.mm, 0.mm, 0.mm],
      [13000.mm, 150.mm, 0.mm],
      [0.mm, 150.mm, 0.mm]
    ]
    surface_face = surface_group.entities.add_face(surface_pts)
    surface_face.pushpull(-10.mm)  # Độ dày của bề mặt biển
    surface_group.material = "White"  # Màu sắc bề mặt biển

    # Tạo chữ nổi 3D
    text_group = entities.add_group
    text_group.name = "ChuNoi3D"
    text = "Bảng Hiệu"
    text_position = [6500.mm, 75.mm, 10.mm]  # Vị trí chữ nổi
    text_face = text_group.entities.add_text(text, text_position)
    text_group.entities.add_face(text_face.vertices.map(&:position)).pushpull(30.mm)  # Độ dày chữ nổi
    text_group.material = "Red"  # Màu chữ nổi

    # Tạo các chi tiết trang trí (đèn LED, viền nẹp)
    decoration_group = entities.add_group
    decoration_group.name = "ChiTietTrangTri"
    led_pts = [
      [0.mm, 0.mm, 120.mm],
      [13000.mm, 0.mm, 120.mm],
      [13000.mm, 150.mm, 120.mm],
      [0.mm, 150.mm, 120.mm]
    ]
    led_face = decoration_group.entities.add_face(led_pts)
    led_face.pushpull(10.mm)  # Độ dày của đèn LED
    decoration_group.material = "Yellow"  # Màu đèn LED

    model.commit_operation
  end
end
BangHieuBatLotTon1300X120.build