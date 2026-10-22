# Mã nguồn Ruby hoàn chỉnh 100%
module ChuTonRiSetGanLedBub
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuTonRiSetGanLedBub', true)
    entities = model.active_entities

    # Thông số chính
    width = 1200.mm
    height = 400.mm
    depth = 60.mm
    khung_satt = 30.mm
    go_day = 20.mm

    # 1. Khung xương sắt hộp 30x30mm
    khung_group = entities.add_group
    khung = khung_group.entities

    # Khung viền ngoài
    pts = [
      [0, 0, 0],
      [width, 0, 0],
      [width, height, 0],
      [0, height, 0]
    ]
    # 4 cạnh khung
    khung.add_face(pts[0], pts[1], [pts[1][0], pts[1][1], khung_satt], [pts[0][0], pts[0][1], khung_satt])
    khung.add_face(pts[1], pts[2], [pts[2][0], pts[2][1], khung_satt], [pts[1][0], pts[1][1], khung_satt])
    khung.add_face(pts[2], pts[3], [pts[3][0], pts[3][1], khung_satt], [pts[2][0], pts[2][1], khung_satt])
    khung.add_face(pts[3], pts[0], [pts[0][0], pts[0][1], khung_satt], [pts[3][0], pts[3][1], khung_satt])

    # Xương đứng (2 xương chia đều)
    1.upto(2) do |i|
      x = i * width / 3
      khung.add_face([x, 0, 0], [x, 0, khung_satt], [x, height, khung_satt], [x, height, 0])
    end

    # Xương ngang tăng cứng (1 xương giữa)
    y = height / 2
    khung.add_face([0, y, 0], [0, y, khung_satt], [width, y, khung_satt], [width, y, 0])

    # Chân đế (2 chân)
    chan_group = entities.add_group
    chan = chan_group.entities
    chan_length = 100.mm
    [[0, 0, 0], [width - khung_satt, 0, 0]].each do |pt|
      base = chan.add_face(pt, [pt[0]+khung_satt, pt[1], pt[2]], [pt[0]+khung_satt, pt[1]-chan_length, pt[2]], [pt[0], pt[1]-chan_length, pt[2]])
      base.pushpull khung_satt
    end

    # 2. Tấm nền gỗ dựng đứng
    nen_group = entities.add_group
    nen = nen_group.entities
    so_thanh = (width / 50.mm).to_i
    mau_go = "#6B4F2B"
    so_thanh.times do |i|
      x = i * (width / so_thanh)
      thanh = nen.add_face([x, 0, khung_satt], [x+go_day, 0, khung_satt], [x+go_day, height, khung_satt], [x, height, khung_satt])
      thanh.pushpull(depth - khung_satt)
      thanh.material = mau_go
    end

    # 3. Chữ nổi "BBB"
    chu_group = entities.add_group
    chu = chu_group.entities
    chu_text = "B"
    mau_chu = "#B87333"
    mau_vien = "#8B5C2B"
    mau_led = "#FFD700"
    font = "Arial Black"
    chu_rong = 300.mm
    chu_cao = 350.mm
    chu_day = 60.mm
    khoang_cach = 40.mm

    3.times do |i|
      x = 70.mm + i*(chu_rong + khoang_cach)
      y = (height - chu_cao)/2
      chu3d = chu.add_3d_text(
        chu_text,
        TextAlignLeft,
        chu_cao,
        true,
        chu_day,
        font,
        false,
        false
      )
      chu3d_group = chu.add_group(chu3d)
      chu3d_group.material = mau_chu
      chu3d_group.entities.each { |e| e.back_material = mau_vien }
      chu3d_group.move!([x, y, depth])
      # Đèn LED bulb trên mặt chữ
      # Vẽ 7 bóng LED cho mỗi chữ
      led_group = chu3d_group.entities.add_group
      led_radius = 20.mm
      led_z = chu_day + depth + 2.mm
      led_pos = [
        [chu_cao*0.2, chu_cao*0.8],
        [chu_cao*0.5, chu_cao*0.85],
        [chu_cao*0.8, chu_cao*0.8],
        [chu_cao*0.2, chu_cao*0.5],
        [chu_cao*0.5, chu_cao*0.5],
        [chu_cao*0.8, chu_cao*0.5],
        [chu_cao*0.5, chu_cao*0.2]
      ]
      led_pos.each do |lx, ly|
        led = led_group.entities.add_circle([lx, ly, led_z], [0,0,1], led_radius, 24)
        led_face = led_group.entities.add_face(led)
        led_face.pushpull(8.mm)
        led_face.material = mau_led
      end
    end

    # Đặt nhóm chữ lên nền
    chu_group.move!([0, 0, khung_satt + go_day])

    model.commit_operation
  end
end
ChuTonRiSetGanLedBub.build