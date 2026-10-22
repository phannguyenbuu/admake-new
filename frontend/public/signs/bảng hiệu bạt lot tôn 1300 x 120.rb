# Mã nguồn Ruby hoàn chỉnh
module BangHieuBatLotTon1300X120
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuBatLotTon1300X120', true)
    entities = model.active_entities

    # Tạo khung đỡ
    base_width = 13000.mm
    base_height = 1200.mm
    base_depth = 150.mm

    # Tạo nhóm cho khung đỡ
    grp_frame = entities.add_group
    grp_frame.name = "Khung Do"
    frame_pts = [
      [0, 0, 0],
      [base_width, 0, 0],
      [base_width, base_depth, 0],
      [0, base_depth, 0]
    ]
    frame_face = grp_frame.entities.add_face(frame_pts)
    frame_face.pushpull(-base_height) # Kéo dài xuống dưới

    # Tạo bề mặt biển
    grp_surface = entities.add_group
    grp_surface.name = "Be Mat Bien"
    surface_pts = [
      [0, 0, -base_height],
      [base_width, 0, -base_height],
      [base_width, base_depth, -base_height],
      [0, base_depth, -base_height]
    ]
    surface_face = grp_surface.entities.add_face(surface_pts)
    surface_face.pushpull(-10.mm) # Độ dày của bạt lót tôn

    # Gán màu cho bề mặt biển
    grp_surface.material = "LightGray"

    # Tạo chữ nổi 3D
    grp_text = entities.add_group
    grp_text.name = "Chu Noi 3D"
    text_height = 100.mm
    text_depth = 20.mm
    text_content = "Bảng Hiệu Bạt Lot Tôn"
    text_position = [base_width / 2, base_depth / 2, -base_height - 10.mm]

    # Tạo chữ nổi
    text_entity = grp_text.entities.add_3d_text(text_content, TextAlignCenter, text_height, false, false, false, false)
    text_entity.transform!(Geom::Transformation.translation(text_position))
    text_entity.pushpull(text_depth)

    # Gán màu cho chữ nổi
    grp_text.material = "Red"

    # Tạo viền trang trí
    grp_border = entities.add_group
    grp_border.name = "Vien Trang Tri"
    border_thickness = 5.mm
    border_face = grp_border.entities.add_face(frame_pts)
    border_face.pushpull(border_thickness) # Kéo lên trên

    # Gán màu cho viền trang trí
    grp_border.material = "Gold"

    model.commit_operation
  end
end
BangHieuBatLotTon1300X120.build