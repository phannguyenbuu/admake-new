# Mã nguồn Ruby hoàn chỉnh
module BienSoNhaNenAluChuNoiDong
  def self.build
    model = Sketchup.active_model
    model.start_operation('BienSoNhaNenAluChuNoiDong', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [300.mm, 0.mm, 0.mm],
      [300.mm, 200.mm, 0.mm],
      [0.mm, 200.mm, 0.mm]
    ]
    frame_grp = entities.add_group
    frame_face = frame_grp.entities.add_face(frame_pts)
    frame_face.pushpull(5.mm)  # Độ dày khung
    frame_grp.material = "Gray"

    # Tạo bề mặt biển
    surface_pts = [
      [5.mm, 5.mm, 5.mm],
      [295.mm, 5.mm, 5.mm],
      [295.mm, 195.mm, 5.mm],
      [5.mm, 195.mm, 5.mm]
    ]
    surface_grp = entities.add_group
    surface_face = surface_grp.entities.add_face(surface_pts)
    surface_face.pushpull(20.mm)  # Độ dày bề mặt
    surface_grp.material = "Aluminum"

    # Tạo chữ nổi 3D
    text = "123"
    text_height = 10.mm
    text_depth = 5.mm
    text_position = [50.mm, 50.mm, 25.mm]  # Vị trí chữ nổi

    text_grp = entities.add_group
    text_face = text_grp.entities.add_3d_text(text, TextAlignCenter, text_position, text_height, false, false, false, false)
    text_face.pushpull(text_depth)  # Độ dày chữ nổi
    text_grp.material = "Copper"

    # Tạo viền nẹp trang trí
    border_pts = [
      [0.mm, 0.mm, 25.mm],
      [300.mm, 0.mm, 25.mm],
      [300.mm, 200.mm, 25.mm],
      [0.mm, 200.mm, 25.mm]
    ]
    border_grp = entities.add_group
    border_face = border_grp.entities.add_face(border_pts)
    border_face.pushpull(2.mm)  # Độ dày viền
    border_grp.material = "Gold"

    model.commit_operation
  end
end
BienSoNhaNenAluChuNoiDong.build