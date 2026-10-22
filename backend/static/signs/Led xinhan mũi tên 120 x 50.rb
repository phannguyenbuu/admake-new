# Mã nguồn Ruby hoàn chỉnh
module LedXinhanMuiTen120X50
  def self.build
    model = Sketchup.active_model
    model.start_operation('LedXinhanMuiTen120X50', true)
    entities = model.active_entities

    # Tạo khung đỡ
    base_pts = [
      [0.mm, 0.mm, 0.mm],
      [1200.mm, 0.mm, 0.mm],
      [1200.mm, 30.mm, 0.mm],
      [0.mm, 30.mm, 0.mm]
    ]
    base_face = entities.add_face(base_pts)
    base_face.reverse!
    base_grp = entities.add_group(base_face)
    base_grp.name = "Khung Đỡ"
    base_grp.material = "Gray"

    # Tạo bề mặt biển
    surface_pts = [
      [0.mm, 0.mm, 0.mm],
      [1200.mm, 0.mm, 0.mm],
      [1200.mm, 500.mm, 0.mm],
      [0.mm, 500.mm, 0.mm]
    ]
    surface_face = entities.add_face(surface_pts)
    surface_face.reverse!
    surface_grp = entities.add_group(surface_face)
    surface_grp.name = "Bề Mặt Biển"
    surface_grp.material = "White"

    # Tạo chữ nổi 3D
    text_grp = entities.add_group
    text = "LED"
    text_position = [100.mm, 150.mm, 1.mm]
    text_face = text_grp.entities.add_3d_text(text, TextAlignCenter, text_position, 10.mm)
    text_grp.name = "Chữ Nổi"
    text_grp.material = "Red"

    # Tạo đèn LED
    led_grp = entities.add_group
    led_pts = [
      [0.mm, 0.mm, 0.mm],
      [10.mm, 0.mm, 0.mm],
      [10.mm, 10.mm, 0.mm],
      [0.mm, 10.mm, 0.mm]
    ]
    led_face = led_grp.entities.add_face(led_pts)
    led_face.reverse!
    led_grp.name = "Đèn LED"
    led_grp.material = "Yellow"
    led_grp.transform!(Geom::Transformation.translation([1000.mm, 250.mm, 0.mm]))

    # Tạo viền trang trí
    border_pts = [
      [-5.mm, -5.mm, 0.mm],
      [1205.mm, -5.mm, 0.mm],
      [1205.mm, 505.mm, 0.mm],
      [-5.mm, 505.mm, 0.mm]
    ]
    border_face = entities.add_face(border_pts)
    border_face.reverse!
    border_grp = entities.add_group(border_face)
    border_grp.name = "Viền Trang Trí"
    border_grp.material = "Black"

    model.commit_operation
  end
end
LedXinhanMuiTen120X50.build