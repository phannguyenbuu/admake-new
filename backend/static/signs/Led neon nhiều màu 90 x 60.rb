# Mã nguồn Ruby hoàn chỉnh
module LedNeonNhieuMau90X60
  def self.build
    model = Sketchup.active_model
    model.start_operation('LedNeonNhieuMau90X60', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [900.mm, 0.mm, 0.mm],
      [900.mm, 600.mm, 0.mm],
      [0.mm, 600.mm, 0.mm]
    ]
    frame_grp = entities.add_group
    frame_face = frame_grp.entities.add_face(frame_pts)
    frame_face.pushpull(20.mm) # Độ dày của khung
    frame_grp.material = "Gray"

    # Tạo bề mặt biển
    surface_pts = [
      [0.mm, 0.mm, 20.mm],
      [900.mm, 0.mm, 20.mm],
      [900.mm, 600.mm, 20.mm],
      [0.mm, 600.mm, 20.mm]
    ]
    surface_grp = entities.add_group
    surface_face = surface_grp.entities.add_face(surface_pts)
    surface_face.pushpull(-2.mm) # Độ dày của bề mặt
    surface_grp.material = "White"

    # Tạo chữ nổi 3D
    text_grp = entities.add_group
    text = "Led Neon"
    text_position = [50.mm, 50.mm, 22.mm]
    text_face = text_grp.entities.add_text(text, text_position, 100.mm)
    text_face.pushpull(10.mm) # Độ dày của chữ
    text_grp.material = "Red"

    # Tạo viền nẹp trang trí
    border_grp = entities.add_group
    border_face = border_grp.entities.add_face(surface_pts)
    border_face.pushpull(5.mm) # Độ dày của viền
    border_grp.material = "Gold"

    model.commit_operation
  end
end
LedNeonNhieuMau90X60.build