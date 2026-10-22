# Mã nguồn Ruby hoàn chỉnh
module BangHieuBatLotTon400X130
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuBatLotTon400X130', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [4000.mm, 0.mm, 0.mm],
      [4000.mm, 30.mm, 0.mm],
      [0.mm, 30.mm, 0.mm]
    ]
    frame_face = entities.add_face(frame_pts)
    frame_face.pushpull(1300.mm) # Kéo khối 3D cho khung
    frame_group = entities.add_group(frame_face)
    frame_group.name = "Khung Sắt Đỡ"
    frame_group.material = "Gray"

    # Tạo bề mặt biển
    surface_pts = [
      [0.mm, 0.mm, 30.mm],
      [4000.mm, 0.mm, 30.mm],
      [4000.mm, 1300.mm, 30.mm],
      [0.mm, 1300.mm, 30.mm]
    ]
    surface_face = entities.add_face(surface_pts)
    surface_face.pushpull(-5.mm) # Tạo độ dày cho bề mặt
    surface_group = entities.add_group(surface_face)
    surface_group.name = "Bề Mặt Biển"
    surface_group.material = "White"

    # Tạo chữ nổi 3D
    text = "Bảng Hiệu"
    text_group = entities.add_group
    text_entity = text_group.entities.add_3d_text(text, TextAlignCenter, "Arial", true, false, 100.mm, 0.mm, 0.mm)
    text_group.transform!(Geom::Transformation.new([2000.mm, 650.mm, 30.mm])) # Đặt chữ vào vị trí
    text_group.name = "Chữ Nổi"
    text_group.material = "Red"

    # Tạo viền nẹp trang trí
    trim_pts = [
      [0.mm, 0.mm, 30.mm],
      [4000.mm, 0.mm, 30.mm],
      [4000.mm, 30.mm, 30.mm],
      [0.mm, 30.mm, 30.mm]
    ]
    trim_face = entities.add_face(trim_pts)
    trim_face.pushpull(5.mm) # Tạo viền nẹp
    trim_group = entities.add_group(trim_face)
    trim_group.name = "Viền Nẹp"
    trim_group.material = "Black"

    model.commit_operation
  end
end
BangHieuBatLotTon400X130.build