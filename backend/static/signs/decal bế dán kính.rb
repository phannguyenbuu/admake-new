# Mã nguồn Ruby hoàn chỉnh
module DecalBeDanKinh
  def self.build
    model = Sketchup.active_model
    model.start_operation('DecalBeDanKinh', true)
    entities = model.active_entities

    # Tạo khung đỡ
    base_pts = [
      [0.mm, 0.mm, 0.mm],
      [3000.mm, 0.mm, 0.mm],
      [3000.mm, 150.mm, 0.mm],
      [0.mm, 150.mm, 0.mm]
    ]
    base_face = entities.add_face(base_pts)
    base_face.reverse! # Đảo mặt nếu cần
    base_grp = entities.add_group(base_face)
    base_grp.name = "Khung Đỡ"
    base_grp.material = "Gray"

    # Tạo bề mặt biển
    surface_pts = [
      [0.mm, 0.mm, 150.mm],
      [3000.mm, 0.mm, 150.mm],
      [3000.mm, 1000.mm, 150.mm],
      [0.mm, 1000.mm, 150.mm]
    ]
    surface_face = entities.add_face(surface_pts)
    surface_face.reverse! # Đảo mặt nếu cần
    surface_grp = entities.add_group(surface_face)
    surface_grp.name = "Bề Mặt Biển"
    surface_grp.material = "White"

    # Tạo chữ nổi 3D
    text_height = 50.mm
    text_depth = 10.mm
    text_grp = entities.add_group
    text_grp.name = "Chữ Nổi 3D"
    text = "DECAL BẾ DÁN KÍNH"
    text_position = [1500.mm, 500.mm, 150.mm]
    
    # Tạo chữ nổi
    text_face = entities.add_face([text_position, text_position.map { |p| p + text_height }])
    text_face.pushpull(text_depth)
    text_grp.entities.add_face(text_face)
    text_grp.material = "Red"

    # Tạo đèn LED (mô phỏng)
    led_grp = entities.add_group
    led_grp.name = "Đèn LED"
    led_position = [1500.mm, 1000.mm, 160.mm]
    led_box = entities.add_group
    led_box_face = entities.add_face([led_position, led_position.map { |p| p + 100.mm }])
    led_box_face.pushpull(10.mm)
    led_grp.entities.add_face(led_box_face)
    led_grp.material = "Yellow"

    model.commit_operation
  end
end
DecalBeDanKinh.build