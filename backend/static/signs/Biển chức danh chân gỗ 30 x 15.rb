# Mã nguồn Ruby hoàn chỉnh
module BienChucDanhChanGo30X15
  def self.build
    model = Sketchup.active_model
    model.start_operation('BienChucDanhChanGo30X15', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [300.mm, 0.mm, 0.mm],
      [300.mm, 20.mm, 0.mm],
      [0.mm, 20.mm, 0.mm]
    ]
    frame_grp = entities.add_group
    frame_face = frame_grp.entities.add_face(frame_pts)
    frame_face.pushpull(-10.mm) # Độ dày khung
    frame_grp.material = "Gray"

    # Tạo bề mặt biển
    surface_pts = [
      [0.mm, 0.mm, -10.mm],
      [300.mm, 0.mm, -10.mm],
      [300.mm, 150.mm, -10.mm],
      [0.mm, 150.mm, -10.mm]
    ]
    surface_grp = entities.add_group
    surface_face = surface_grp.entities.add_face(surface_pts)
    surface_face.pushpull(20.mm) # Độ dày bề mặt
    surface_grp.material = "White"

    # Tạo chữ nổi 3D
    text_grp = entities.add_group
    text = "Chức Danh"
    text_position = Geom::Point3d.new(10.mm, 10.mm, 0.mm)
    text_face = text_grp.entities.add_3d_text(text, TextAlignCenter, text_position, 1.mm, false, false)
    text_grp.material = "Blue"

    # Tạo chân đế
    base_pts = [
      [0.mm, 0.mm, -10.mm],
      [20.mm, 0.mm, -10.mm],
      [20.mm, 20.mm, -10.mm],
      [0.mm, 20.mm, -10.mm]
    ]
    base_grp = entities.add_group
    base_face = base_grp.entities.add_face(base_pts)
    base_face.pushpull(-10.mm) # Độ dày chân đế
    base_grp.material = "Brown"

    model.commit_operation
  end
end
BienChucDanhChanGo30X15.build