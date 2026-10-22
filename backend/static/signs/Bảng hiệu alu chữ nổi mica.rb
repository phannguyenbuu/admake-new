# Mã nguồn Ruby hoàn chỉnh
module BangHieuAluChuNoiMica
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuAluChuNoiMica', true)
    entities = model.active_entities

    # Tạo khung đỡ
    base_pts = [
      [0.mm, 0.mm, 0.mm],
      [1200.mm, 0.mm, 0.mm],
      [1200.mm, 60.mm, 0.mm],
      [0.mm, 60.mm, 0.mm]
    ]
    base_face = entities.add_face(base_pts)
    base_face.reverse! # Đảo mặt nếu cần
    base_face.pushpull(20.mm) # Độ dày của khung đỡ
    base_group = entities.add_group(base_face)
    base_group.material = "Gray"

    # Tạo bề mặt biển
    sign_pts = [
      [0.mm, 0.mm, 20.mm],
      [1200.mm, 0.mm, 20.mm],
      [1200.mm, 400.mm, 20.mm],
      [0.mm, 400.mm, 20.mm]
    ]
    sign_face = entities.add_face(sign_pts)
    sign_face.reverse!
    sign_face.pushpull(40.mm) # Độ dày của biển
    sign_group = entities.add_group(sign_face)
    sign_group.material = "White"

    # Tạo chữ nổi 3D
    text = "Chữ Nổi"
    text_group = entities.add_group
    text_face = text_group.entities.add_3d_text(text, TextAlignCenter, "Arial", true, false, 100.mm, 10.mm)
    text_face.pushpull(10.mm) # Độ dày của chữ
    text_group.transform!(Geom::Transformation.new([100.mm, 150.mm, 20.mm])) # Đặt vị trí chữ
    text_group.material = "Red"

    # Tạo đèn LED (hình trụ)
    led_group = entities.add_group
    led_circle = led_group.entities.add_circle([600.mm, 200.mm, 20.mm], [0, 0, 1], 5.mm)
    led_face = led_group.entities.add_face(led_circle)
    led_face.pushpull(20.mm) # Độ cao của đèn LED
    led_group.material = "Yellow"

    # Gọi commit operation
    model.commit_operation
  end
end
BangHieuAluChuNoiMica.build