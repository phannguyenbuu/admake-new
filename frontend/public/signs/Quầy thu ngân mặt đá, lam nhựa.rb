# Mã nguồn Ruby hoàn chỉnh 100%
module QuayThuNganMatDaLamNhua
  def self.build
    model = Sketchup.active_model
    model.start_operation('QuayThuNganMatDaLamNhua', true)
    entities = model.active_entities

    # Thông số chính
    width = 1500.mm
    height = 700.mm
    depth = 1200.mm
    radius = 250.mm # Bán kính bo cong góc trái
    lam_width = 30.mm
    lam_depth = 15.mm
    lam_gap = 2.mm
    stone_thickness = 20.mm
    nẹp_height = 50.mm

    # Tạo nhóm khung xương sắt hộp
    group_frame = entities.add_group
    frame = group_frame.entities

    # Khung đáy (chữ L bo cong)
    pts_base = [
      [0, 0, 0],
      [radius, 0, 0],
      [width, 0, 0],
      [width, depth - radius, 0],
      [width - radius, depth, 0],
      [0, depth, 0],
      [0, radius, 0]
    ]
    # Bo cong góc trái
    arc_pts = []
    num_arc = 12
    (0..num_arc).each do |i|
      angle = Math::PI/2 * i / num_arc
      x = radius * Math.cos(Math::PI - angle)
      y = radius * Math.sin(Math::PI - angle)
      arc_pts << [x, y, 0]
    end
    pts_base = arc_pts + pts_base[1..-1]

    # Khung đáy
    base_face = frame.add_face(pts_base)
    base_face.pushpull(30.mm) # Sắt hộp cao 30mm

    # Khung đứng (cột)
    frame_pts = [
      [0, 0, 0],
      [width, 0, 0],
      [width, depth, 0],
      [0, depth, 0]
    ]
    frame_pts.each do |pt|
      frame.add_face(
        pt,
        [pt[0]+30.mm, pt[1], pt[2]],
        [pt[0]+30.mm, pt[1], pt[2]+height],
        [pt[0], pt[1], pt[2]+height]
      ).pushpull(-30.mm)
    end

    # Tạo thân quầy (ốp lam nhựa dọc bo cong)
    group_body = entities.add_group
    body = group_body.entities

    # Tạo các thanh lam nhựa chạy dọc mặt trước và bo cong
    lam_start = 0
    lam_end = width + depth
    lam_pos = 0
    while lam_pos < width + depth
      # Tính vị trí trên mặt chữ L bo cong
      if lam_pos < radius * Math::PI/2
        # Trên cung tròn bo góc
        angle = lam_pos / radius
        x = radius * Math.cos(Math::PI - angle)
        y = radius * Math.sin(Math::PI - angle)
      elsif lam_pos < width
        # Trên cạnh trước
        x = lam_pos
        y = 0
      else
        # Trên cạnh bên phải
        x = width
        y = lam_pos - width
      end
      # Tạo thanh lam
      lam_face = body.add_face(
        [x, y, 0],
        [x + lam_width, y, 0],
        [x + lam_width, y, height],
        [x, y, height]
      )
      lam_face.pushpull(-lam_depth)
      lam_face.material = "#B97A56"
      lam_face.back_material = "#B97A56"
      lam_pos += lam_width + lam_gap
    end

    # Tạo mặt đá trắng vân mây
    group_stone = entities.add_group
    stone = group_stone.entities
    # Mặt đá phủ ra ngoài thân quầy 30mm
    offset = 30.mm
    pts_stone = pts_base.map { |pt| [pt[0] - offset, pt[1] - offset, height] }
    stone_face = stone.add_face(pts_stone)
    stone_face.pushpull(stone_thickness)
    stone_face.material = "#F5F5F5"

    # Tạo viền nẹp nhôm vàng ở chân
    group_nep = entities.add_group
    nep = group_nep.entities
    pts_nep = pts_base.map { |pt| [pt[0], pt[1], 0] }
    nep_face = nep.add_face(pts_nep)
    nep_face.pushpull(nẹp_height)
    nep_face.material = "#FFD700"

    # Tạo dải LED hắt sáng vàng (mô phỏng bằng khối mỏng sát viền nẹp)
    group_led = entities.add_group
    led = group_led.entities
    pts_led = pts_base.map { |pt| [pt[0], pt[1], nẹp_height] }
    led_face = led.add_face(pts_led)
    led_face.pushpull(10.mm)
    led_face.material = "#FFFACD"

    # Đặt tên nhóm cho dễ quản lý
    group_frame.name = "Khung xương sắt hộp"
    group_body.name = "Ốp lam nhựa giả gỗ"
    group_stone.name = "Mặt đá trắng"
    group_nep.name = "Viền nẹp nhôm vàng"
    group_led.name = "Dải LED hắt chân"

    model.commit_operation
  end
end
QuayThuNganMatDaLamNhua.build