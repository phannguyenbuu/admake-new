# Mã nguồn Ruby hoàn chỉnh
module BangHieuTonDanDecal600X120
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuTonDanDecal600X120', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [6000.mm, 0.mm, 0.mm],
      [6000.mm, 150.mm, 0.mm],
      [0.mm, 150.mm, 0.mm]
    ]
    frame_face = entities.add_face(frame_pts)
    frame_face.pushpull(1200.mm) # Kéo khối 3D cho khung
    frame_group = entities.add_group(frame_face.all_connected)
    frame_group.name = "Khung Sắt Đỡ"
    frame_group.material = "Gray"

    # Tạo bề mặt biển
    surface_pts = [
      [0.mm, 0.mm, 1200.mm],
      [6000.mm, 0.mm, 1200.mm],
      [6000.mm, 150.mm, 1200.mm],
      [0.mm, 150.mm, 1200.mm]
    ]
    surface_face = entities.add_face(surface_pts)
    surface_face.pushpull(-5.mm) # Tạo độ dày cho bề mặt
    surface_group = entities.add_group(surface_face.all_connected)
    surface_group.name = "Bề Mặt Biển"
    surface_group.material = "White"

    # Tạo chữ nổi
    text_group = entities.add_group
    text = "Bảng Hiệu Tôn Dán Decal"
    text_position = [3000.mm, 75.mm, 1200.mm]
    text_entity = text_group.entities.add_3d_text(text, TextAlignCenter, "Arial", true, false, 100.mm, 1)
    text_group.transform!(Geom::Transformation.new(text_position))
    text_group.material = "Red"

    # Tạo đèn LED viền
    led_group = entities.add_group
    led_pts = [
      [0.mm, 0.mm, 1205.mm],
      [6000.mm, 0.mm, 1205.mm],
      [6000.mm, 150.mm, 1205.mm],
      [0.mm, 150.mm, 1205.mm]
    ]
    led_face = led_group.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Tạo độ dày cho đèn LED
    led_group.name = "Đèn LED Viền"
    led_group.material = "Yellow"

    model.commit_operation
  end
end
BangHieuTonDanDecal600X120.build