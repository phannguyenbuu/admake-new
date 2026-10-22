# Mã nguồn Ruby hoàn chỉnh
module HopDenDuongXinhanDenLed
  def self.build
    model = Sketchup.active_model
    model.start_operation('HopDenDuongXinhanDenLed', true)
    entities = model.active_entities

    # Tạo khung đỡ
    base_pts = [
      [0.mm, 0.mm, 0.mm],
      [3000.mm, 0.mm, 0.mm],
      [3000.mm, 150.mm, 0.mm],
      [0.mm, 150.mm, 0.mm]
    ]
    base_face = entities.add_face(base_pts)
    base_face.pushpull(100.mm) # Độ dày khung đỡ
    base_group = entities.add_group(base_face)
    base_group.name = "Khung Đỡ"
    base_group.material = "Gray"

    # Tạo bề mặt biển quảng cáo
    sign_pts = [
      [0.mm, 0.mm, 100.mm],
      [3000.mm, 0.mm, 100.mm],
      [3000.mm, 150.mm, 100.mm],
      [0.mm, 150.mm, 100.mm]
    ]
    sign_face = entities.add_face(sign_pts)
    sign_face.pushpull(50.mm) # Độ dày bề mặt biển
    sign_group = entities.add_group(sign_face)
    sign_group.name = "Bề Mặt Biển"
    sign_group.material = "White"

    # Tạo chữ nổi 3D
    text_group = entities.add_group
    text = "HỘP ĐÈN"
    text_position = [1500.mm, 75.mm, 100.mm]
    text_face = text_group.entities.add_face([text_position, text_position.map { |p| p + 100.mm }])
    text_face.pushpull(10.mm) # Độ dày chữ nổi
    text_group.name = "Chữ Nổi"
    text_group.material = "Red"

    # Tạo đèn LED
    led_group = entities.add_group
    led_pts = [
      [100.mm, 10.mm, 100.mm],
      [200.mm, 10.mm, 100.mm],
      [200.mm, 30.mm, 100.mm],
      [100.mm, 30.mm, 100.mm]
    ]
    led_face = led_group.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Độ dày đèn LED
    led_group.name = "Đèn LED"
    led_group.material = "Yellow"

    # Tạo viền trang trí
    border_group = entities.add_group
    border_face = border_group.entities.add_face(base_pts)
    border_face.pushpull(5.mm) # Độ dày viền
    border_group.name = "Viền Trang Trí"
    border_group.material = "Black"

    model.commit_operation
  end
end
HopDenDuongXinhanDenLed.build