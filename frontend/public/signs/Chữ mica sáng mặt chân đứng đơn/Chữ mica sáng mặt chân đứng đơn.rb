# Mã nguồn Ruby hoàn chỉnh 100%
module ChuMicaSangMatChanDungDon
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuMicaSangMatChanDungDon', true)
    entities = model.active_entities

    # Thông số
    width = 1200.mm
    height = 400.mm
    depth = 60.mm
    base_thickness = 5.mm
    frame_size = 30.mm
    frame_offset = 10.mm

    # Màu sắc
    color_nen = "#222222"
    color_vien = "#444444"
    color_chu_vang = "#ffe600"
    color_chu_trang = "#ffffff"
    color_hong_chu = "#222222"

    # 1. Khung xương sắt hộp
    frame_group = entities.add_group
    frame = frame_group.entities

    # Khung viền ngoài
    pts = [
      [0, 0, 0],
      [width, 0, 0],
      [width, height, 0],
      [0, height, 0]
    ]
    frame.add_face(pts).pushpull(-frame_size)
    # Xương đứng (2 xương giữa)
    x1 = width / 3
    x2 = 2 * width / 3
    [x1, x2].each do |x|
      frame.add_face(
        [x, 0, -frame_size],
        [x + frame_size, 0, -frame_size],
        [x + frame_size, height, -frame_size],
        [x, height, -frame_size]
      ).pushpull(-frame_size)
    end
    # Xương ngang tăng cứng (1 thanh giữa)
    y = height / 2 - frame_size / 2
    frame.add_face(
      [0, y, -frame_size],
      [width, y, -frame_size],
      [width, y + frame_size, -frame_size],
      [0, y + frame_size, -frame_size]
    ).pushpull(-frame_size)

    # 2. Tấm nền alu/gỗ phủ đen
    nen_group = entities.add_group
    nen = nen_group.entities
    nen_face = nen.add_face(
      [frame_offset, frame_offset, 0],
      [width - frame_offset, frame_offset, 0],
      [width - frame_offset, height - frame_offset, 0],
      [frame_offset, height - frame_offset, 0]
    )
    nen_face.pushpull(base_thickness)
    nen_group.material = color_nen

    # 3. Viền nẹp alu/nhôm xước
    vien_group = entities.add_group
    vien = vien_group.entities
    vien_width = 20.mm
    # Viền trên
    vien.add_face(
      [0, 0, base_thickness],
      [width, 0, base_thickness],
      [width, vien_width, base_thickness],
      [0, vien_width, base_thickness]
    ).pushpull(vien_width)
    # Viền dưới
    vien.add_face(
      [0, height - vien_width, base_thickness],
      [width, height - vien_width, base_thickness],
      [width, height, base_thickness],
      [0, height, base_thickness]
    ).pushpull(vien_width)
    # Viền trái
    vien.add_face(
      [0, 0, base_thickness],
      [vien_width, 0, base_thickness],
      [vien_width, height, base_thickness],
      [0, height, base_thickness]
    ).pushpull(vien_width)
    # Viền phải
    vien.add_face(
      [width - vien_width, 0, base_thickness],
      [width, 0, base_thickness],
      [width, height, base_thickness],
      [width - vien_width, height, base_thickness]
    ).pushpull(vien_width)
    vien_group.material = color_vien

    # 4. Chữ nổi 3D dòng trên: "NHÀ KHẾ"
    chu1_group = entities.add_group
    chu1_text = "NHÀ KHẾ"
    chu1_height = 170.mm
    chu1_depth = 60.mm
    chu1_x = 80.mm
    chu1_y = height - chu1_height - 40.mm
    chu1_group.entities.add_3d_text(
      chu1_text,
      TextAlignLeft = true,
      Font = "Arial Black",
      Bold = true,
      Italic = false,
      Height = chu1_height,
      Tolerance = 0.0,
      Z = base_thickness,
      Filled = true,
      Extruded = chu1_depth
    ).each { |e| e.material = color_chu_vang }
    chu1_group.move! Geom::Transformation.translation([chu1_x, chu1_y, base_thickness])

    # 5. Chữ nổi 3D dòng dưới: "BÒ NẤM NƯỚNG SỐT"
    chu2_group = entities.add_group
    chu2_text = "BÒ NẤM NƯỚNG SỐT"
    chu2_height = 80.mm
    chu2_depth = 25.mm
    chu2_x = 70.mm
    chu2_y = 40.mm
    chu2_group.entities.add_3d_text(
      chu2_text,
      TextAlignLeft = true,
      Font = "Arial Black",
      Bold = true,
      Italic = false,
      Height = chu2_height,
      Tolerance = 0.0,
      Z = base_thickness,
      Filled = true,
      Extruded = chu2_depth
    ).each { |e| e.material = color_chu_trang }
    chu2_group.move! Geom::Transformation.translation([chu2_x, chu2_y, base_thickness])

    # 6. Hông chữ (mô phỏng viền đen/inox)
    # Đơn giản hóa: Tô màu mặt bên chữ bằng màu hông
    chu1_group.entities.each { |e| e.back_material = color_hong_chu if e.respond_to?(:back_material) }
    chu2_group.entities.each { |e| e.back_material = color_hong_chu if e.respond_to?(:back_material) }

    # 7. Chân đế (giả lập bệ thấp phía dưới)
    chan_group = entities.add_group
    chan_height = 40.mm
    chan_group.entities.add_face(
      [0, -chan_height, 0],
      [width, -chan_height, 0],
      [width, 0, 0],
      [0, 0, 0]
    ).pushpull(60.mm)
    chan_group.material = "#8d735b"

    model.commit_operation
  end
end
ChuMicaSangMatChanDungDon.build