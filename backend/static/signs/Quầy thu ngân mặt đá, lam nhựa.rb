# Mã nguồn Ruby hoàn chỉnh
module QuayThuNganMatDaLamNhua
  def self.build
    model = Sketchup.active_model
    model.start_operation('QuayThuNganMatDaLamNhua', true)
    entities = model.active_entities

    # Tạo khung đỡ
    base_height = 700.mm
    base_width = 1500.mm
    base_depth = 1200.mm
    base_pts = [
      [0, 0, 0],
      [base_width, 0, 0],
      [base_width, base_depth, 0],
      [0, base_depth, 0]
    ]
    
    base_grp = entities.add_group
    base_face = base_grp.entities.add_face(base_pts)
    base_face.pushpull(base_height)
    base_grp.material = "Gray"

    # Tạo bề mặt quầy
    surface_height = 30.mm
    surface_pts = [
      [0, 0, base_height],
      [base_width, 0, base_height],
      [base_width, base_depth, base_height],
      [0, base_depth, base_height]
    ]

    surface_grp = entities.add_group
    surface_face = surface_grp.entities.add_face(surface_pts)
    surface_face.pushpull(surface_height)
    surface_grp.material = "Stone"

    # Tạo chữ nổi 3D
    text_grp = entities.add_group
    text = "QUẦY THU NGÂN"
    text_position = [base_width / 2, base_depth / 2, base_height + surface_height + 10.mm]
    text_grp.entities.add_3d_text(text, TextAlignCenter, text_position, false, 1.mm)
    text_grp.material = "Gold"

    # Tạo đèn LED
    led_grp = entities.add_group
    led_pts = [
      [0, 0, base_height + surface_height + 5.mm],
      [base_width, 0, base_height + surface_height + 5.mm],
      [base_width, base_depth, base_height + surface_height + 5.mm],
      [0, base_depth, base_height + surface_height + 5.mm]
    ]
    led_face = led_grp.entities.add_face(led_pts)
    led_face.pushpull(5.mm)
    led_grp.material = "Yellow"

    model.commit_operation
  end
end
QuayThuNganMatDaLamNhua.build