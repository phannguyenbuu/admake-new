# Mã nguồn Ruby hoàn chỉnh
module BangHieuXinhanBat2MatCoTru150X150
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuXinhanBat2MatCoTru150X150', true)
    entities = model.active_entities

    # Tạo khung đỡ
    base_height = 1500.mm
    base_width = 1500.mm
    base_depth = 30.mm
    post_size = 150.mm

    # Tạo trụ
    post_pts = [
      [0, 0, 0],
      [0, post_size, 0],
      [post_size, post_size, 0],
      [post_size, 0, 0]
    ]
    post_face = entities.add_face(post_pts)
    post_face.pushpull(base_height)

    # Tạo khung biển
    frame_pts = [
      [0, 0, base_height],
      [0, base_width, base_height],
      [base_depth, base_width, base_height],
      [base_depth, 0, base_height]
    ]
    frame_face = entities.add_face(frame_pts)
    frame_face.pushpull(-base_depth)

    # Tạo bề mặt biển
    surface_pts = [
      [0, 0, base_height],
      [0, base_width, base_height],
      [base_depth, base_width, base_height],
      [base_depth, 0, base_height]
    ]
    surface_face = entities.add_face(surface_pts)
    surface_face.pushpull(-5.mm) # Độ dày của bề mặt biển

    # Gán màu cho bề mặt biển
    surface_group = entities.add_group(surface_face)
    surface_group.material = "White"

    # Tạo chữ nổi 3D
    text_height = 50.mm
    text_depth = 10.mm
    text = "Xinhan"
    text_group = entities.add_group
    text_group.entities.add_3d_text(text, TextAlignCenter, text_height, false, false, false, false)
    text_group.transform!(Geom::Transformation.new([base_depth/2, base_width/2, base_height + 5.mm]))

    # Gán màu cho chữ
    text_group.material = "Red"

    model.commit_operation
  end
end
BangHieuXinhanBat2MatCoTru150X150.build