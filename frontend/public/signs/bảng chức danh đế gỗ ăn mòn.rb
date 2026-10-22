# Mã nguồn Ruby hoàn chỉnh
module BangChucDanhDeGoAnMon
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangChucDanhDeGoAnMon', true)
    entities = model.active_entities

    # Tạo khung đỡ
    base_pts = [
      [0.mm, 0.mm, 0.mm],
      [300.mm, 0.mm, 0.mm],
      [300.mm, 40.mm, 0.mm],
      [0.mm, 40.mm, 0.mm]
    ]
    base_face = entities.add_face(base_pts)
    base_face.reverse! # Đảo mặt nếu cần
    base_face.pushpull(10.mm) # Độ dày của khung đỡ
    base_group = entities.add_group(base_face)
    base_group.material = "Brown"

    # Tạo bề mặt biển
    surface_pts = [
      [0.mm, 0.mm, 10.mm],
      [300.mm, 0.mm, 10.mm],
      [300.mm, 40.mm, 10.mm],
      [0.mm, 40.mm, 10.mm]
    ]
    surface_face = entities.add_face(surface_pts)
    surface_face.reverse! # Đảo mặt nếu cần
    surface_face.pushpull(5.mm) # Độ dày của bề mặt biển
    surface_group = entities.add_group(surface_face)
    surface_group.material = "LightWood"

    # Tạo chữ nổi 3D
    text = "Chức Danh"
    text_group = entities.add_group
    text_face = text_group.entities.add_3d_text(text, TextAlignCenter, "Arial", true, false, 10.mm, 0.mm, 0.mm)
    text_group.transform!(Geom::Transformation.new([50.mm, 10.mm, 15.mm])) # Đặt vị trí chữ nổi
    text_group.material = "Gold"

    # Tạo viền trang trí
    border_pts = [
      [-5.mm, -5.mm, 10.mm],
      [305.mm, -5.mm, 10.mm],
      [305.mm, 45.mm, 10.mm],
      [-5.mm, 45.mm, 10.mm]
    ]
    border_face = entities.add_face(border_pts)
    border_face.reverse! # Đảo mặt nếu cần
    border_face.pushpull(2.mm) # Độ dày của viền
    border_group = entities.add_group(border_face)
    border_group.material = "DarkBrown"

    model.commit_operation
  end
end
BangChucDanhDeGoAnMon.build