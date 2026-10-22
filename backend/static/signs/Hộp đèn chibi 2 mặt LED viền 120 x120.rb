# Mã nguồn Ruby hoàn chỉnh 100%
module HopDenChibi2MatLedVien120X120
  def self.build
    model = Sketchup.active_model
    model.start_operation('HopDenChibi2MatLedVien120X120', true)
    entities = model.active_entities

    # Thông số chính
    width = 1200.mm
    height = 1200.mm
    depth = 30.mm
    khung_size = 30.mm
    led_viền = 10.mm

    # 1. Khung xương sắt hộp 30x30mm
    khung_group = entities.add_group
    khung = khung_group.entities
    # Khung ngoài
    pts = [
      [0, 0, 0],
      [width, 0, 0],
      [width, height, 0],
      [0, height, 0]
    ]
    khung.add_face(pts).pushpull(-khung_size)
    # Xương đứng
    khung.add_face([[width/2-khung_size/2, 0, 0], [width/2+khung_size/2, 0, 0], [width/2+khung_size/2, height, 0], [width/2-khung_size/2, height, 0]]).pushpull(-khung_size)
    # Xương ngang tăng cứng
    khung.add_face([[0, height/2-khung_size/2, 0], [width, height/2-khung_size/2, 0], [width, height/2+khung_size/2, 0], [0, height/2+khung_size/2, 0]]).pushpull(-khung_size)
    # Tai treo tường
    tai_group = entities.add_group
    tai = tai_group.entities
    tai.add_face([[-60.mm, height/2-60.mm, -khung_size], [0, height/2-60.mm, -khung_size], [0, height/2+60.mm, -khung_size], [-60.mm, height/2+60.mm, -khung_size]]).pushpull(-60.mm)
    khung_group.material = "#222222"
    tai_group.material = "#222222"

    # 2. Tấm nền bảng hiệu (dạng chibi bo tròn, mô phỏng bằng đa giác lượn sóng)
    bg_group = entities.add_group
    bg = bg_group.entities
    center = [width/2, height/2, khung_size]
    r1 = 550.mm
    r2 = 600.mm
    points = []
    16.times do |i|
      angle = i * Math::PI * 2 / 16
      r = i.even? ? r1 : r2
      x = center[0] + r * Math.cos(angle)
      y = center[1] + r * Math.sin(angle)
      points << [x, y, khung_size]
    end
    bg_face = bg.add_face(points)
    bg_face.pushpull(depth)
    bg_group.material = "#111111"

    # 3. Viền LED nổi (mô phỏng bằng đường tròn ngoài, màu trắng)
    led_group = entities.add_group
    led = led_group.entities
    led_circle = led.add_circle(center, [0,0,1], r2+led_viền, 64)
    led_face = led.add_face(led_circle)
    led_face.followme(led.add_circle(center, [0,0,1], led_viền, 32))
    led_group.material = "#ffffff"

    # 4. Ngôi sao lớn phía trên cùng (logo)
    star_group = entities.add_group
    star = star_group.entities
    star_center = [width/2, height-80.mm, khung_size+depth+5.mm]
    star_points = []
    5.times do |i|
      angle = i * 2 * Math::PI / 5 - Math::PI/2
      r = 90.mm
      x = star_center[0] + r * Math.cos(angle)
      y = star_center[1] + r * Math.sin(angle)
      star_points << [x, y, star_center[2]]
      angle2 = angle + Math::PI/5
      r2 = 40.mm
      x2 = star_center[0] + r2 * Math.cos(angle2)
      y2 = star_center[1] + r2 * Math.sin(angle2)
      star_points << [x2, y2, star_center[2]]
    end
    star_face = star.add_face(star_points)
    star_face.pushpull(20.mm)
    star_group.material = "#ffe066"

    # 5. Các ngôi sao nhỏ trang trí
    [[width/2-300.mm, height/2+200.mm], [width/2+320.mm, height/2-180.mm], [width/2-350.mm, height/2-250.mm]].each do |pos|
      s_group = entities.add_group
      s = s_group.entities
      s_center = [pos[0], pos[1], khung_size+depth+3.mm]
      s_points = []
      5.times do |i|
        angle = i * 2 * Math::PI / 5 - Math::PI/2
        r = 40.mm
        x = s_center[0] + r * Math.cos(angle)
        y = s_center[1] + r * Math.sin(angle)
        s_points << [x, y, s_center[2]]
        angle2 = angle + Math::PI/5
        r2 = 18.mm
        x2 = s_center[0] + r2 * Math.cos(angle2)
        y2 = s_center[1] + r2 * Math.sin(angle2)
        s_points << [x2, y2, s_center[2]]
      end
      s_face = s.add_face(s_points)
      s_face.pushpull(10.mm)
      s_group.material = "#ff9900"
    end

    # 6. Khối chữ nổi chính "KARAOKE" (xanh dương viền trắng)
    karaoke_group = entities.add_group
    karaoke = karaoke_group.entities
    karaoke.add_3d_text(
      "KARAOKE",
      TextAlignCenter,
      "Arial Black",
      false,
      false,
      120.mm,
      30.mm,
      0,
      true,
      0
    ).each { |e| e.material = "#00bfff" }
    karaoke_group.transform! Geom::Transformation.new([width/2, height/2+120.mm, khung_size+depth+10.mm])
    karaoke_group.material = "#00bfff"

    # 7. Chữ phụ "Sóng Mã" (hồng neon)
    songma_group = entities.add_group
    songma = songma_group.entities
    songma.add_3d_text(
      "Sóng Mã",
      TextAlignCenter,
      "Brush Script MT",
      false,
      false,
      80.mm,
      20.mm,
      0,
      true,
      0
    ).each { |e| e.material = "#ff3cac" }
    songma_group.transform! Geom::Transformation.new([width/2, height/2+30.mm, khung_size+depth+10.mm])
    songma_group.material = "#ff3cac"

    # 8. Số nổi "25" (vàng)
    so25_group = entities.add_group
    so25 = so25_group.entities
    so25.add_3d_text(
      "25",
      TextAlignCenter,
      "Arial Black",
      false,
      false,
      90.mm,
      25.mm,
      0,
      true,
      0
    ).each { |e| e.material = "#ffe066" }
    so25_group.transform! Geom::Transformation.new([width/2, height/2-100.mm, khung_size+depth+10.mm])
    so25_group.material = "#ffe066"

    # 9. Dòng chữ nhỏ "NAM QUỐC CANG" (đỏ)
    nqg_group = entities.add_group
    nqg = nqg_group.entities
    nqg.add_3d_text(
      "NAM QUỐC CANG",
      TextAlignCenter,
      "Arial",
      false,
      false,
      35.mm,
      8.mm,
      0,
      true,
      0
    ).each { |e| e.material = "#ff2d2d" }
    nqg_group.transform! Geom::Transformation.new([width/2, height/2-160.mm, khung_size+depth+10.mm])
    nqg_group.material = "#ff2d2d"

    model.commit_operation
  end
end
HopDenChibi2MatLedVien120X120.build