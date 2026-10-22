# Mã nguồn Ruby hoàn chỉnh
module ChuMicaSangHatChan
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuMicaSangHatChan', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [1200.mm, 0.mm, 0.mm],
      [1200.mm, 60.mm, 0.mm],
      [0.mm, 60.mm, 0.mm]
    ]
    frame_face = entities.add_face(frame_pts)
    frame_face.reverse!
    frame_group = entities.add_group(frame_face)
    frame_group.material = "Gray"
    frame_group.name = "Khung Sắt Đỡ"
    frame_face.pushpull(20.mm)  # Độ dày của khung

    # Tạo bề mặt biển
    surface_pts = [
      [0.mm, 0.mm, 20.mm],
      [1200.mm, 0.mm, 20.mm],
      [1200.mm, 400.mm, 20.mm],
      [0.mm, 400.mm, 20.mm]
    ]
    surface_face = entities.add_face(surface_pts)
    surface_group = entities.add_group(surface_face)
    surface_group.material = "White"
    surface_group.name = "Bề Mặt Biển"
    surface_face.pushpull(5.mm)  # Độ dày của bề mặt

    # Tạo chữ nổi 3D
    text = "Chữ Mica Sáng"
    text_group = entities.add_group
    text_face = text_group.entities.add_3d_text(text, TextAlignCenter, "Arial", true, false, 120.mm, 0.mm)
    text_group.material = "Yellow"
    text_group.name = "Chữ Nổi 3D"
    text_face.pushpull(10.mm)  # Độ dày của chữ

    # Đặt vị trí chữ nổi
    text_group.transform!(Geom::Transformation.translation([0.mm, 100.mm, 25.mm]))

    # Tạo đèn LED viền
    led_group = entities.add_group
    led_pts = [
      [0.mm, 0.mm, 25.mm],
      [1200.mm, 0.mm, 25.mm],
      [1200.mm, 400.mm, 25.mm],
      [0.mm, 400.mm, 25.mm]
    ]
    led_face = led_group.entities.add_face(led_pts)
    led_group.material = "Red"
    led_group.name = "Đèn LED Viền"
    led_face.pushpull(5.mm)  # Độ dày của đèn LED

    model.commit_operation
  end
end
ChuMicaSangHatChan.build