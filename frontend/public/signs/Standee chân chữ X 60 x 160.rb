# Mã nguồn Ruby hoàn chỉnh
module StandeeChanChuX60X160
  def self.build
    model = Sketchup.active_model
    model.start_operation('StandeeChanChuX60X160', true)
    entities = model.active_entities

    # Tạo khung chân chữ X
    x_frame = entities.add_group
    x_frame.name = "Khung Chân Chữ X"
    frame_material = "Gray"

    # Tạo các điểm cho khung
    pts = [
      [0.mm, 0.mm, 0.mm],
      [600.mm, 0.mm, 0.mm],
      [600.mm, 30.mm, 0.mm],
      [0.mm, 30.mm, 0.mm]
    ]
    face = x_frame.entities.add_face(pts)
    face.pushpull(-1600.mm) # Kéo dài khung

    x_frame.material = frame_material

    # Tạo bề mặt biển
    surface = entities.add_group
    surface.name = "Bề Mặt Biển"
    surface_material = "White"

    # Tạo các điểm cho bề mặt biển
    surface_pts = [
      [0.mm, 0.mm, -1600.mm],
      [600.mm, 0.mm, -1600.mm],
      [600.mm, 30.mm, -1600.mm],
      [0.mm, 30.mm, -1600.mm]
    ]
    surface_face = surface.entities.add_face(surface_pts)
    surface_face.pushpull(30.mm) # Độ dày của biển

    surface.material = surface_material

    # Tạo chữ nổi 3D
    text_group = entities.add_group
    text_group.name = "Chữ Nổi 3D"
    text_material = "Red"

    # Tạo chữ nổi
    text = "Standee"
    text_position = [50.mm, 10.mm, -1600.mm]
    text_entity = text_group.entities.add_3d_text(text, TextAlignCenter, text_position, 100.mm, 0, 0)
    text_group.entities.transform_entities(Geom::Transformation.translation([0, 0, -30.mm]), text_entity)

    text_group.material = text_material

    # Gán màu cho các nhóm
    x_frame.material = frame_material
    surface.material = surface_material
    text_group.material = text_material

    model.commit_operation
  end
end
StandeeChanChuX60X160.build