# Mã nguồn Ruby hoàn chỉnh
module BienChucDanhChanGo30X15
  def self.build
    model = Sketchup.active_model
    model.start_operation('BienChucDanhChanGo30X15', true)
    entities = model.active_entities

    # Tạo khung đỡ
    base_pts = [
      [0.mm, 0.mm, 0.mm],
      [300.mm, 0.mm, 0.mm],
      [300.mm, 20.mm, 0.mm],
      [0.mm, 20.mm, 0.mm]
    ]
    base_face = entities.add_face(base_pts)
    base_face.reverse!
    base_grp = entities.add_group(base_face)
    base_grp.name = "Khung Đỡ"
    base_grp.material = "Brown"

    # Tạo bề mặt biển
    sign_pts = [
      [0.mm, 20.mm, 0.mm],
      [300.mm, 20.mm, 0.mm],
      [300.mm, 170.mm, 0.mm],
      [0.mm, 170.mm, 0.mm]
    ]
    sign_face = entities.add_face(sign_pts)
    sign_face.reverse!
    sign_grp = entities.add_group(sign_face)
    sign_grp.name = "Bề Mặt Biển"
    sign_grp.material = "LightWood"

    # Tạo chữ nổi 3D
    text = "Chức Danh"
    text_grp = entities.add_group
    text_face = text_grp.entities.add_3d_text(text, TextAlignCenter, "Arial", true, false, 100.mm, 1.mm)
    text_grp.transform!(Geom::Transformation.new([50.mm, 50.mm, 1.mm]))
    text_grp.name = "Chữ Nổi"
    text_grp.material = "Gold"

    # Tạo viền trang trí
    border_pts = [
      [-5.mm, 15.mm, 0.mm],
      [305.mm, 15.mm, 0.mm],
      [305.mm, 175.mm, 0.mm],
      [-5.mm, 175.mm, 0.mm]
    ]
    border_face = entities.add_face(border_pts)
    border_face.reverse!
    border_grp = entities.add_group(border_face)
    border_grp.name = "Viền Trang Trí"
    border_grp.material = "DarkGray"

    # Kết thúc thao tác
    model.commit_operation
  end
end
BienChucDanhChanGo30X15.build