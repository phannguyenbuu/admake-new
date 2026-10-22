# Mã nguồn Ruby hoàn chỉnh
module BangHieuBatLotTon2MatCoTru250X150
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuBatLotTon2MatCoTru250X150', true)
    entities = model.active_entities

    # Tạo khung đỡ
    base_pts = [
      [0.mm, 0.mm, 0.mm],
      [2500.mm, 0.mm, 0.mm],
      [2500.mm, 30.mm, 0.mm],
      [0.mm, 30.mm, 0.mm]
    ]
    base_face = entities.add_face(base_pts)
    base_face.reverse! # Đảo mặt nếu cần
    base_face.pushpull(1500.mm) # Kéo lên cao 1500mm
    base_group = entities.add_group(base_face)
    base_group.name = "KhungDo"

    # Tạo bề mặt biển
    sign_pts = [
      [0.mm, 0.mm, 1500.mm],
      [2500.mm, 0.mm, 1500.mm],
      [2500.mm, 30.mm, 1500.mm],
      [0.mm, 30.mm, 1500.mm]
    ]
    sign_face = entities.add_face(sign_pts)
    sign_face.reverse! # Đảo mặt nếu cần
    sign_face.pushpull(-30.mm) # Kéo xuống 30mm để tạo độ dày
    sign_group = entities.add_group(sign_face)
    sign_group.material = "White" # Màu trắng cho bề mặt biển
    sign_group.name = "BeMatBien"

    # Tạo chữ nổi 3D
    text = "QUẢNG CÁO"
    text_group = entities.add_group
    text_face = text_group.entities.add_3d_text(text, TextAlignCenter, "Arial", true, false, 100.mm, 0.mm, 0.mm)
    text_group.transform!(Geom::Transformation.new([1000.mm, 15.mm, 1500.mm])) # Đặt chữ nổi ở giữa
    text_group.material = "Red" # Màu đỏ cho chữ nổi
    text_group.name = "ChuNoi"

    # Tạo đèn LED
    led_group = entities.add_group
    led_face = led_group.entities.add_face([0.mm, 0.mm, 1500.mm], [2500.mm, 0.mm, 1500.mm], [2500.mm, 30.mm, 1500.mm], [0.mm, 30.mm, 1500.mm])
    led_face.reverse!
    led_face.pushpull(-5.mm) # Kéo xuống để tạo độ dày cho đèn LED
    led_group.material = "Yellow" # Màu vàng cho đèn LED
    led_group.name = "DenLED"

    model.commit_operation
  end
end
BangHieuBatLotTon2MatCoTru250X150.build