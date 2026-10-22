# Mã nguồn Ruby hoàn chỉnh
module BienSoNhaNenAluChuNoiDong
  def self.build
    model = Sketchup.active_model
    model.start_operation('BienSoNhaNenAluChuNoiDong', true)
    entities = model.active_entities

    # Tạo khung đỡ
    base_pts = [
      [0.mm, 0.mm, 0.mm],
      [300.mm, 0.mm, 0.mm],
      [300.mm, 200.mm, 0.mm],
      [0.mm, 200.mm, 0.mm]
    ]
    base_grp = entities.add_group
    base_face = base_grp.entities.add_face(base_pts)
    base_face.pushpull(25.mm)
    base_grp.material = "Gray"

    # Tạo bề mặt biển
    surface_pts = [
      [5.mm, 5.mm, 25.mm],
      [295.mm, 5.mm, 25.mm],
      [295.mm, 195.mm, 25.mm],
      [5.mm, 195.mm, 25.mm]
    ]
    surface_grp = entities.add_group
    surface_face = surface_grp.entities.add_face(surface_pts)
    surface_face.pushpull(-5.mm) # Tạo độ dày cho bề mặt
    surface_grp.material = "Aluminum"

    # Tạo chữ nổi 3D
    text_grp = entities.add_group
    text = "Nhà Số 123"
    text_position = [10.mm, 10.mm, 25.mm]
    text_face = text_grp.entities.add_3d_text(text, TextAlignCenter, text_position, 10.mm, false)
    text_face.pushpull(5.mm) # Độ dày của chữ nổi
    text_grp.material = "Gold"

    # Tạo viền trang trí
    border_pts = [
      [0.mm, 0.mm, 25.mm],
      [300.mm, 0.mm, 25.mm],
      [300.mm, 200.mm, 25.mm],
      [0.mm, 200.mm, 25.mm]
    ]
    border_grp = entities.add_group
    border_face = border_grp.entities.add_face(border_pts)
    border_face.pushpull(2.mm) # Độ dày của viền
    border_grp.material = "Black"

    model.commit_operation
  end
end
BienSoNhaNenAluChuNoiDong.build