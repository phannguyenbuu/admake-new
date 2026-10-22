# Mã nguồn Ruby hoàn chỉnh
module BienSoNhaMica
  def self.build
    model = Sketchup.active_model
    model.start_operation('BienSoNhaMica', true)
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
    frame_face.pushpull(25.mm) # Độ dày khung
    frame_grp.material = "Gray" # Màu khung sắt

    # Tạo bề mặt biển
    surface_pts = [
      [5.mm, 5.mm, 25.mm],
      [295.mm, 5.mm, 25.mm],
      [295.mm, 195.mm, 25.mm],
      [5.mm, 195.mm, 25.mm]
    ]
    surface_grp = entities.add_group
    surface_face = surface_grp.entities.add_face(surface_pts)
    surface_face.pushpull(5.mm) # Độ dày bề mặt
    surface_grp.material = "White" # Màu bề mặt biển

    # Tạo chữ nổi 3D
    text_grp = entities.add_group
    text = text_grp.entities.add_text("Số nhà", [50.mm, 100.mm, 30.mm], 30.mm)
    text_grp.material = "Blue" # Màu chữ nổi

    # Tạo viền nẹp trang trí
    border_pts = [
      [0.mm, 0.mm, 30.mm],
      [300.mm, 0.mm, 30.mm],
      [300.mm, 200.mm, 30.mm],
      [0.mm, 200.mm, 30.mm]
    ]
    border_grp = entities.add_group
    border_face = border_grp.entities.add_face(border_pts)
    border_face.pushpull(5.mm) # Độ dày viền
    border_grp.material = "Gold" # Màu viền nẹp

    model.commit_operation
  end
end
BienSoNhaMica.build