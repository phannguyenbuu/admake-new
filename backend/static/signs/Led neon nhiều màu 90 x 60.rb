# Mã nguồn Ruby hoàn chỉnh
module LedNeonNhieuMau90X60
  def self.build
    model = Sketchup.active_model
    model.start_operation('LedNeonNhieuMau90X60', true)
    entities = model.active_entities

    # Tạo khung đỡ
    base_pts = [
      [0.mm, 0.mm, 0.mm],
      [900.mm, 0.mm, 0.mm],
      [900.mm, 20.mm, 0.mm],
      [0.mm, 20.mm, 0.mm]
    ]
    base_face = entities.add_face(base_pts)
    base_face.reverse! # Đảo mặt nếu cần
    base_grp = entities.add_group(base_face)
    base_grp.material = "Gray"

    # Tạo bề mặt biển quảng cáo
    surface_pts = [
      [0.mm, 0.mm, 20.mm],
      [900.mm, 0.mm, 20.mm],
      [900.mm, 600.mm, 20.mm],
      [0.mm, 600.mm, 20.mm]
    ]
    surface_face = entities.add_face(surface_pts)
    surface_face.reverse! # Đảo mặt nếu cần
    surface_grp = entities.add_group(surface_face)
    surface_grp.material = "White"

    # Tạo chữ nổi 3D
    text = "LED NEON"
    text_grp = entities.add_group
    text_face = text_grp.entities.add_3d_text(text, TextAlignCenter, "Arial", true, false, 100.mm, 0.mm, 0.mm)
    text_face.pushpull(10.mm) # Độ dày chữ nổi
    text_grp.material = "Yellow"

    # Tạo viền trang trí
    border_pts = [
      [0.mm, 0.mm, 30.mm],
      [900.mm, 0.mm, 30.mm],
      [900.mm, 600.mm, 30.mm],
      [0.mm, 600.mm, 30.mm]
    ]
    border_face = entities.add_face(border_pts)
    border_face.reverse! # Đảo mặt nếu cần
    border_grp = entities.add_group(border_face)
    border_grp.material = "Red"

    model.commit_operation
  end
end
LedNeonNhieuMau90X60.build