# Mã nguồn Ruby hoàn chỉnh
module HopDenSang5Mat
  def self.build
    model = Sketchup.active_model
    model.start_operation('HopDenSang5Mat', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [3000.mm, 0.mm, 0.mm],
      [3000.mm, 150.mm, 0.mm],
      [0.mm, 150.mm, 0.mm]
    ]
    frame_face = entities.add_face(frame_pts)
    frame_face.pushpull(100.mm) # Chiều cao khung 100mm
    frame_group = entities.add_group(frame_face)
    frame_group.material = "Gray"

    # Tạo mặt biển
    sign_pts = [
      [0.mm, 0.mm, 100.mm],
      [3000.mm, 0.mm, 100.mm],
      [3000.mm, 150.mm, 100.mm],
      [0.mm, 150.mm, 100.mm]
    ]
    sign_face = entities.add_face(sign_pts)
    sign_face.pushpull(5.mm) # Độ dày của biển
    sign_group = entities.add_group(sign_face)
    sign_group.material = "White"

    # Tạo chữ nổi 3D
    text = "HỘP ĐÈN SÁNG"
    text_group = entities.add_group
    text_entity = text_group.entities.add_3d_text(text, TextAlignCenter, "Arial", true, false, 100.mm, 0.mm, 0.mm)
    text_group.transform!(Geom::Transformation.new([1500.mm, 75.mm, 105.mm])) # Đặt chữ nổi lên biển

    # Tạo đèn LED
    led_group = entities.add_group
    led_pts = [
      [0.mm, 0.mm, 95.mm],
      [3000.mm, 0.mm, 95.mm],
      [3000.mm, 5.mm, 95.mm],
      [0.mm, 5.mm, 95.mm]
    ]
    led_face = led_group.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Độ dày của đèn LED
    led_group.material = "Yellow"

    # Gán màu cho chữ nổi
    text_group.material = "Red"

    model.commit_operation
  end
end
HopDenSang5Mat.build