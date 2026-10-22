# Mã nguồn Ruby hoàn chỉnh
module HopDenTonRiSet45X25
  def self.build
    model = Sketchup.active_model
    model.start_operation('HopDenTonRiSet45X25', true)
    entities = model.active_entities

    # Tạo khung đỡ
    base_pts = [
      [0.mm, 0.mm, 0.mm],
      [450.mm, 0.mm, 0.mm],
      [450.mm, 20.mm, 0.mm],
      [0.mm, 20.mm, 0.mm]
    ]
    base_face = entities.add_face(base_pts)
    base_face.reverse! # Đảo mặt nếu cần
    base_grp = entities.add_group(base_face)
    base_grp.name = "Khung Đỡ"
    base_grp.material = "Steel"

    # Tạo bề mặt biển quảng cáo
    surface_pts = [
      [0.mm, 0.mm, 0.mm],
      [450.mm, 0.mm, 0.mm],
      [450.mm, 250.mm, 0.mm],
      [0.mm, 250.mm, 0.mm]
    ]
    surface_face = entities.add_face(surface_pts)
    surface_face.reverse! # Đảo mặt nếu cần
    surface_grp = entities.add_group(surface_face)
    surface_grp.name = "Bề Mặt Biển"
    surface_grp.material = "Alu"

    # Tạo chữ nổi 3D
    text = "HỘP ĐÈN"
    text_grp = entities.add_group
    text_face = text_grp.entities.add_text(text, [50.mm, 50.mm, 0.mm], 100.mm)
    text_face.pushpull(10.mm) # Độ dày chữ nổi
    text_grp.name = "Chữ Nổi"
    text_grp.material = "White"

    # Tạo đèn LED
    led_grp = entities.add_group
    led_box = led_grp.entities.add_face([0.mm, 0.mm, 0.mm], [450.mm, 0.mm, 0.mm], [450.mm, 20.mm, 0.mm], [0.mm, 20.mm, 0.mm])
    led_box.pushpull(-5.mm) # Độ sâu của đèn LED
    led_grp.name = "Đèn LED"
    led_grp.material = "Yellow"

    # Tạo viền trang trí
    border_pts = [
      [0.mm, -5.mm, 0.mm],
      [450.mm, -5.mm, 0.mm],
      [450.mm, 0.mm, 0.mm],
      [0.mm, 0.mm, 0.mm]
    ]
    border_face = entities.add_face(border_pts)
    border_face.reverse! # Đảo mặt nếu cần
    border_grp = entities.add_group(border_face)
    border_grp.name = "Viền Trang Trí"
    border_grp.material = "Red"

    model.commit_operation
  end
end
HopDenTonRiSet45X25.build