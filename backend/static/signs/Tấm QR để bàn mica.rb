# Mã nguồn Ruby hoàn chỉnh
module TamQrDeBanMica
  def self.build
    model = Sketchup.active_model
    model.start_operation('TamQrDeBanMica', true)
    entities = model.active_entities

    # Tạo chân đế
    base_height = 10.mm
    base_width = 120.mm
    base_depth = 50.mm
    base_pts = [
      [0, 0, 0],
      [base_width, 0, 0],
      [base_width, base_depth, 0],
      [0, base_depth, 0]
    ]
    base_face = entities.add_face(base_pts)
    base_face.pushpull(base_height)
    base_group = entities.add_group(base_face)
    base_group.name = "ChanDe"

    # Tạo bề mặt tấm nền
    surface_height = 180.mm
    surface_thickness = 5.mm
    surface_pts = [
      [0, 0, base_height],
      [base_width, 0, base_height],
      [base_width, base_depth, base_height],
      [0, base_depth, base_height]
    ]
    surface_face = entities.add_face(surface_pts)
    surface_face.pushpull(surface_thickness)
    surface_group = entities.add_group(surface_face)
    surface_group.name = "TamNen"
    surface_group.material = "Mica"

    # Tạo chữ nổi 3D
    text_height = 10.mm
    text_depth = 5.mm
    text_content = "QR CODE"
    text_position = [base_width / 2, base_depth / 2, base_height + surface_thickness]
    text_group = entities.add_group
    text_face = text_group.entities.add_face([text_position, [text_position[0] + 30.mm, text_position[1], text_position[2]], 
                                                   [text_position[0] + 30.mm, text_position[1] + 10.mm, text_position[2]], 
                                                   [text_position[0], text_position[1] + 10.mm, text_position[2]]])
    text_face.pushpull(text_depth)
    text_group.name = "ChuNoi"
    text_group.material = "White"

    # Tạo viền trang trí
    border_thickness = 2.mm
    border_pts = [
      [-border_thickness, -border_thickness, base_height + surface_thickness],
      [base_width + border_thickness, -border_thickness, base_height + surface_thickness],
      [base_width + border_thickness, base_depth + border_thickness, base_height + surface_thickness],
      [-border_thickness, base_depth + border_thickness, base_height + surface_thickness]
    ]
    border_face = entities.add_face(border_pts)
    border_face.pushpull(border_thickness)
    border_group = entities.add_group(border_face)
    border_group.name = "VienTrangTri"
    border_group.material = "Gold"

    model.commit_operation
  end
end
TamQrDeBanMica.build