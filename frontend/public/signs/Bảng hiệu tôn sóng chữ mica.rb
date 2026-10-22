# Mã nguồn Ruby hoàn chỉnh
module BangHieuTonSongChuMica
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuTonSongChuMica', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_group = entities.add_group
    frame_group.name = "KhungSatDo"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [1200.mm, 0.mm, 0.mm],
      [1200.mm, 400.mm, 0.mm],
      [0.mm, 400.mm, 0.mm]
    ]
    frame_face = frame_group.entities.add_face(frame_pts)
    frame_face.pushpull(60.mm)  # Độ dày khung
    frame_group.material = "Gray"

    # Tạo bề mặt biển
    surface_group = entities.add_group
    surface_group.name = "BeMatBien"
    surface_pts = [
      [0.mm, 0.mm, 60.mm],
      [1200.mm, 0.mm, 60.mm],
      [1200.mm, 400.mm, 60.mm],
      [0.mm, 400.mm, 60.mm]
    ]
    surface_face = surface_group.entities.add_face(surface_pts)
    surface_face.pushpull(5.mm)  # Độ dày bề mặt
    surface_group.material = "White"

    # Tạo chữ nổi 3D
    text_group = entities.add_group
    text_group.name = "ChuNoi"
    text = "Bảng Hiệu"
    text_position = [100.mm, 100.mm, 65.mm]  # Vị trí chữ nổi
    text_face = text_group.entities.add_text(text, text_position)
    text_group.entities.add_face(text_face.vertices.map { |v| v.position })
    text_group.entities.each { |e| e.transform!(Geom::Transformation.new([0, 0, 0])) }
    text_group.material = "Red"

    # Tạo đèn LED viền
    led_group = entities.add_group
    led_group.name = "DenLED"
    led_pts = [
      [0.mm, 0.mm, 65.mm],
      [1200.mm, 0.mm, 65.mm],
      [1200.mm, 400.mm, 65.mm],
      [0.mm, 400.mm, 65.mm]
    ]
    led_face = led_group.entities.add_face(led_pts)
    led_face.pushpull(5.mm)  # Độ dày đèn LED
    led_group.material = "Yellow"

    model.commit_operation
  end
end
BangHieuTonSongChuMica.build