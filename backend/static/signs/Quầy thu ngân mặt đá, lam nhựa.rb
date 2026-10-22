# Mã nguồn Ruby hoàn chỉnh
module QuayThuNganMatDaLamNhua
  def self.build
    model = Sketchup.active_model
    model.start_operation('QuayThuNganMatDaLamNhua', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_height = 700.mm
    frame_width = 1500.mm
    frame_depth = 1200.mm
    frame_thickness = 50.mm

    # Tạo mặt đá
    top_surface_height = 20.mm

    # Tạo khung
    frame_pts = [
      [0, 0, 0],
      [frame_width, 0, 0],
      [frame_width, frame_depth, 0],
      [0, frame_depth, 0]
    ]

    grp_frame = entities.add_group
    face_frame = grp_frame.entities.add_face(frame_pts)
    face_frame.pushpull(frame_height)

    # Gán màu cho khung
    grp_frame.material = "Gray"

    # Tạo bề mặt đá
    top_surface_pts = [
      [0, 0, frame_height],
      [frame_width, 0, frame_height],
      [frame_width, frame_depth, frame_height],
      [0, frame_depth, frame_height]
    ]

    grp_surface = entities.add_group
    face_surface = grp_surface.entities.add_face(top_surface_pts)
    face_surface.pushpull(top_surface_height)

    # Gán màu cho bề mặt đá
    grp_surface.material = "White"

    # Tạo chữ nổi 3D
    text_height = 50.mm
    text_depth = 10.mm
    text_content = "Quầy Thu Ngân"

    text_group = entities.add_group
    text_pts = [
      [frame_width / 4, frame_depth / 2, frame_height + top_surface_height],
      [frame_width * 3 / 4, frame_depth / 2, frame_height + top_surface_height],
      [frame_width * 3 / 4, frame_depth / 2 + text_height, frame_height + top_surface_height],
      [frame_width / 4, frame_depth / 2 + text_height, frame_height + top_surface_height]
    ]

    text_face = text_group.entities.add_face(text_pts)
    text_face.pushpull(text_depth)

    # Gán màu cho chữ nổi
    text_group.material = "Red"

    # Tạo đèn LED
    led_height = 5.mm
    led_depth = 20.mm

    led_group = entities.add_group
    led_pts = [
      [0, -led_depth, frame_height + top_surface_height],
      [frame_width, -led_depth, frame_height + top_surface_height],
      [frame_width, 0, frame_height + top_surface_height],
      [0, 0, frame_height + top_surface_height]
    ]

    led_face = led_group.entities.add_face(led_pts)
    led_face.pushpull(led_height)

    # Gán màu cho đèn LED
    led_group.material = "Yellow"

    model.commit_operation
  end
end
QuayThuNganMatDaLamNhua.build