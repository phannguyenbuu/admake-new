# Mã nguồn Ruby hoàn chỉnh
module BangHieuBatLotTon2MatCoTru300X150
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuBatLotTon2MatCoTru300X150', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_height = 1500.mm
    frame_width = 3000.mm
    frame_thickness = 30.mm

    # Khung chính
    frame_pts = [
      [0, 0, 0],
      [frame_width, 0, 0],
      [frame_width, frame_thickness, 0],
      [0, frame_thickness, 0]
    ]
    grp_frame = entities.add_group
    face_frame = grp_frame.entities.add_face(frame_pts)
    face_frame.pushpull(frame_height)
    grp_frame.material = "Gray"

    # Tạo bề mặt biển
    surface_pts = [
      [0, 0, frame_height],
      [frame_width, 0, frame_height],
      [frame_width, frame_thickness, frame_height],
      [0, frame_thickness, frame_height]
    ]
    grp_surface = entities.add_group
    face_surface = grp_surface.entities.add_face(surface_pts)
    face_surface.pushpull(-30.mm) # Độ dày của bề mặt biển
    grp_surface.material = "White"

    # Tạo chữ nổi 3D
    text_height = 100.mm
    text_depth = 10.mm
    text = "QUẢNG CÁO"
    text_group = entities.add_group
    text_entity = text_group.entities.add_3d_text(text, TextAlignCenter, "Arial", true, false, text_height, false)
    text_group.transform!(Geom::Transformation.new([frame_width / 2, frame_thickness / 2, frame_height + text_height]))

    # Tạo đèn LED
    led_width = 10.mm
    led_height = 5.mm
    led_depth = 3000.mm
    led_group = entities.add_group
    led_face = led_group.entities.add_face([0, 0, frame_height + text_height + 10.mm], [led_width, 0, frame_height + text_height + 10.mm], [led_width, led_depth, frame_height + text_height + 10.mm], [0, led_depth, frame_height + text_height + 10.mm])
    led_face.pushpull(led_height)
    led_group.material = "Yellow"

    # Gán tên cho các nhóm
    grp_frame.name = "Khung Sắt Đỡ"
    grp_surface.name = "Bề Mặt Biển"
    text_group.name = "Chữ Nổi 3D"
    led_group.name = "Đèn LED"

    model.commit_operation
  end
end
BangHieuBatLotTon2MatCoTru300X150.build