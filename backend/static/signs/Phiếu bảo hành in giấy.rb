# Mã nguồn Ruby hoàn chỉnh
module PhieuBaoHanhInGiay
  def self.build
    model = Sketchup.active_model
    model.start_operation('PhieuBaoHanhInGiay', true)
    entities = model.active_entities

    # Tạo khung đỡ cho phiếu bảo hành
    base_pts = [
      [0.mm, 0.mm, 0.mm],
      [200.mm, 0.mm, 0.mm],
      [200.mm, 100.mm, 0.mm],
      [0.mm, 100.mm, 0.mm]
    ]
    base_face = entities.add_face(base_pts)
    base_face.reverse! # Đảo mặt nếu cần
    base_face.pushpull(2.mm) # Độ dày 2mm
    base_group = entities.add_group(base_face)
    base_group.name = "Khung Phiếu Bảo Hành"
    base_group.material = "White" # Màu trắng cho khung

    # Tạo bề mặt biển
    surface_pts = [
      [0.mm, 0.mm, 0.mm],
      [200.mm, 0.mm, 0.mm],
      [200.mm, 100.mm, 0.mm],
      [0.mm, 100.mm, 0.mm]
    ]
    surface_face = entities.add_face(surface_pts)
    surface_face.reverse! # Đảo mặt nếu cần
    surface_group = entities.add_group(surface_face)
    surface_group.name = "Bề Mặt Biển"
    surface_group.material = "Mica" # Màu mica

    # Tạo chữ nổi 3D
    text = "Phiếu Bảo Hành"
    text_group = entities.add_group
    text_face = text_group.entities.add_3d_text(text, TextAlignCenter, "Arial", true, false, 10.mm, 0.mm, 0.mm)
    text_group.transform!(Geom::Transformation.translation([50.mm, 50.mm, 2.mm])) # Đặt chữ nổi lên bề mặt
    text_group.name = "Chữ Nổi 3D"
    text_group.material = "Gold" # Màu vàng cho chữ nổi

    # Tạo viền trang trí
    border_pts = [
      [-2.mm, -2.mm, 0.mm],
      [202.mm, -2.mm, 0.mm],
      [202.mm, 102.mm, 0.mm],
      [-2.mm, 102.mm, 0.mm]
    ]
    border_face = entities.add_face(border_pts)
    border_face.reverse! # Đảo mặt nếu cần
    border_face.pushpull(1.mm) # Độ dày 1mm cho viền
    border_group = entities.add_group(border_face)
    border_group.name = "Viền Trang Trí"
    border_group.material = "Black" # Màu đen cho viền

    model.commit_operation
  end
end
PhieuBaoHanhInGiay.build