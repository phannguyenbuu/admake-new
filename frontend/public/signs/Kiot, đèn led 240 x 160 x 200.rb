# Mã nguồn Ruby hoàn chỉnh
module KiotDenLed240X160X200
  def self.build
    model = Sketchup.active_model
    model.start_operation('KiotDenLed240X160X200', true)
    entities = model.active_entities

    # Tạo khung đỡ
    base_pts = [
      [0, 0, 0],
      [2400.mm, 0, 0],
      [2400.mm, 2000.mm, 0],
      [0, 2000.mm, 0]
    ]
    base_face = entities.add_face(base_pts)
    base_face.reverse! # Đảo mặt nếu cần
    base = entities.add_group(base_face)
    base.material = "Gray"

    # Tạo bề mặt biển quảng cáo
    sign_pts = [
      [0, 0, 1600.mm],
      [2400.mm, 0, 1600.mm],
      [2400.mm, 2000.mm, 1600.mm],
      [0, 2000.mm, 1600.mm]
    ]
    sign_face = entities.add_face(sign_pts)
    sign_face.reverse! # Đảo mặt nếu cần
    sign = entities.add_group(sign_face)
    sign.material = "White"

    # Tạo chữ nổi 3D
    text = "Đèn LED"
    text_group = entities.add_group
    text_face = text_group.entities.add_3d_text(text, TextAlignCenter, "Arial", true, false, 100.mm, 0, 0)
    text_group.transform!(Geom::Transformation.new([1200.mm, 1000.mm, 1600.mm])) # Đặt vị trí chữ
    text_group.material = "Red"

    # Tạo đèn LED
    led_group = entities.add_group
    led_box = led_group.entities.add_box(0, 0, 1600.mm, 2400.mm, 2000.mm, 50.mm)
    led_group.material = "Yellow"

    # Tạo viền trang trí
    border_pts = [
      [0, 0, 1600.mm + 10.mm],
      [2400.mm, 0, 1600.mm + 10.mm],
      [2400.mm, 2000.mm, 1600.mm + 10.mm],
      [0, 2000.mm, 1600.mm + 10.mm]
    ]
    border_face = entities.add_face(border_pts)
    border_face.reverse! # Đảo mặt nếu cần
    border = entities.add_group(border_face)
    border.material = "Black"

    model.commit_operation
  end
end
KiotDenLed240X160X200.build