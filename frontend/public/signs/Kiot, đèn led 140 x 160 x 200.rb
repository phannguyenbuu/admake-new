# Mã nguồn Ruby hoàn chỉnh
module KiotDenLed140X160X200
  def self.build
    model = Sketchup.active_model
    model.start_operation('KiotDenLed140X160X200', true)
    entities = model.active_entities

    # Khung đỡ
    base_pts = [
      [0, 0, 0],
      [1400.mm, 0, 0],
      [1400.mm, 2000.mm, 0],
      [0, 2000.mm, 0]
    ]
    base_face = entities.add_face(base_pts)
    base_face.reverse!
    base_grp = entities.add_group(base_face)
    base_grp.name = "Khung Đỡ"
    base_grp.material = "Gray"

    # Tạo chiều cao cho khung
    base_face.pushpull(1600.mm)

    # Bề mặt biển quảng cáo
    surface_pts = [
      [0, 0, 1600.mm],
      [1400.mm, 0, 1600.mm],
      [1400.mm, 2000.mm, 1600.mm],
      [0, 2000.mm, 1600.mm]
    ]
    surface_face = entities.add_face(surface_pts)
    surface_face.reverse!
    surface_grp = entities.add_group(surface_face)
    surface_grp.name = "Bề Mặt Biển"
    surface_grp.material = "White"

    # Chữ nổi 3D
    text_grp = entities.add_group
    text_face = text_grp.entities.add_face([0, 0, 1600.mm])
    text_face.pushpull(50.mm)
    text_grp.name = "Chữ Nổi"
    text_grp.material = "Red"
    text_grp.transform!(Geom::Transformation.translation([600.mm, 1000.mm, 0]))

    # Đèn LED
    led_grp = entities.add_group
    led_box = led_grp.entities.add_box([0, 0, 0], 100.mm, 2000.mm, 50.mm)
    led_grp.name = "Đèn LED"
    led_grp.material = "Yellow"
    led_grp.transform!(Geom::Transformation.translation([1300.mm, 0, 1550.mm]))

    # Viền trang trí
    trim_pts = [
      [0, 0, 1600.mm],
      [1400.mm, 0, 1600.mm],
      [1400.mm, 0, 1650.mm],
      [0, 0, 1650.mm]
    ]
    trim_face = entities.add_face(trim_pts)
    trim_face.reverse!
    trim_grp = entities.add_group(trim_face)
    trim_grp.name = "Viền Trang Trí"
    trim_grp.material = "Gold"

    model.commit_operation
  end
end
KiotDenLed140X160X200.build