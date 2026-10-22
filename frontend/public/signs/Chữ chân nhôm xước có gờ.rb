# encoding: UTF-8
# ============================================================
# XE ĐIỆN THU HIỀN - SKETCHUP RUBY 3D
# Biển quảng cáo mặt tiền - mô hình tham số
# Đơn vị: mm
# SketchUp Ruby API
# ============================================================

require 'sketchup.rb'

module XeDienThuHien3D
  extend self

  # ---------------- THÔNG SỐ MÔ HÌNH ----------------
  W       = 5000.mm
  H       = 1500.mm
  THICK   = 80.mm
  BOTTOM  = 2200.mm
  TOP     = BOTTOM + H
  POST_H  = 3900.mm
  POST_D  = 76.mm
  FRONT_Y = -THICK

  def material(model, name, rgb)
    mats = model.materials
    m = mats[name] || mats.add(name)
    m.color = Sketchup::Color.new(*rgb)
    m
  end

  def box(entities, name, x1, y1, z1, x2, y2, z2, mat)
    g = entities.add_group
    g.name = name
    pts = [
      [x1,y1,z1], [x2,y1,z1],
      [x2,y2,z1], [x1,y2,z1]
    ].map { |p| Geom::Point3d.new(*p) }

    face = g.entities.add_face(pts)
    if face
      face.reverse! if face.normal.z < 0
      face.pushpull(z2 - z1)
      g.material = mat
      g.entities.grep(Sketchup::Face).each do |f|
        f.material = mat
        f.back_material = mat
      end
    end
    g
  end

  # Khối hộp với mặt trước quay về phía -Y
  def front_box(entities, name, x, z, width, height,
                depth, y, mat)
    box(
      entities, name,
      x, y, z,
      x + width, y + depth, z + height,
      mat
    )
  end

  # Trụ tròn đứng
  def cylinder(entities, name, x, y, z, radius, height, mat)
    g = entities.add_group
    g.name = name
    center = Geom::Point3d.new(x, y, z)
    circle = g.entities.add_circle(
      center, Geom::Vector3d.new(0,0,1), radius, 32
    )
    face = g.entities.add_face(circle)
    if face
      face.reverse! if face.normal.z < 0
      face.pushpull(height)
      g.material = mat
      g.entities.grep(Sketchup::Face).each do |f|
        f.material = mat
        f.back_material = mat
      end
    end
    g
  end

  # Tạo chữ nổi trên mặt đứng XZ.
  # Chữ được tạo trên mặt phẳng XY, sau đó xoay 90 độ quanh X.
  def text3d(entities, label, x, z, height,
             font, color, depth = 8.mm,
             bold = true, italic = false,
             align = 0)
    g = entities.add_group
    g.name = "CHU_NOI_#{label.gsub(/\s+/, '_')}"
    e = g.entities

    begin
      e.add_3d_text(
        label,
        align,
        font,
        bold,
        italic,
        height,
        0.5.mm,
        depth,
        true
      )
    rescue => err
      puts "Loi tao chu #{label}: #{err.message}"
      return g
    end

    rotation = Geom::Transformation.rotation(
      ORIGIN, X_AXIS, 90.degrees
    )
    translation = Geom::Transformation.translation(
      Geom::Vector3d.new(x, FRONT_Y - 12.mm, z)
    )
    g.transformation = translation * rotation

    g.material = color
    e.grep(Sketchup::Face).each do |f|
      f.material = color
      f.back_material = color
    end
    g
  end

  # Thanh phân cách đứng
  def separator(entities, x, z, height, mat)
    front_box(
      entities, "THANH_PHAN_CACH",
      x, z, 3.mm, height, 3.mm,
      FRONT_Y - 5.mm, mat
    )
  end

  def build
    model = Sketchup.active_model
    model.start_operation('Dung bien XE DIEN THU HIEN 3D', true)

    begin
      # ---------------- VẬT LIỆU ----------------
      blue       = material(model, 'Xanh_Tim_Nen', [40, 30, 125])
      blue_edge  = material(model, 'Xanh_Vien', [26, 24, 94])
      white      = material(model, 'Trang_Chu', [248, 248, 255])
      yellow     = material(model, 'Vang_Thong_Tin', [255, 220, 20])
      silver     = material(model, 'Nhom_Bac', [180, 187, 195])
      dark       = material(model, 'Den_Khung', [45, 48, 58])
      led        = material(model, 'LED_Trang', [255, 255, 240])
      grey       = material(model, 'Xam_Kim_Loai', [105, 112, 122])

      root = model.active_entities.add_group
      root.name = 'BIEN_QUANG_CAO_XE_DIEN_THU_HIEN'
      e = root.entities

      # ---------------- KHUNG BẢNG ----------------
      front_box(
        e, 'KHUNG_BIEN_NHOM',
        0, BOTTOM, W, H, THICK, 0, silver
      )

      front_box(
        e, 'MAT_NEN_XANH_TIM',
        25.mm, BOTTOM + 25.mm,
        W - 50.mm, H - 50.mm,
        5.mm, FRONT_Y - 2.mm, blue
      )

      # Viền sáng bên trong
      front_box(
        e, 'VIEN_TREN',
        45.mm, TOP - 42.mm,
        W - 90.mm, 5.mm, 3.mm,
        FRONT_Y - 7.mm, white
      )
      front_box(
        e, 'VIEN_DUOI',
        45.mm, BOTTOM + 42.mm,
        W - 90.mm, 5.mm, 3.mm,
        FRONT_Y - 7.mm, white
      )
      front_box(
        e, 'VIEN_TRAI',
        45.mm, BOTTOM + 42.mm,
        5.mm, H - 84.mm, 3.mm,
        FRONT_Y - 7.mm, white
      )
      front_box(
        e, 'VIEN_PHAI',
        W - 50.mm, BOTTOM + 42.mm,
        5.mm, H - 84.mm, 3.mm,
        FRONT_Y - 7.mm, white
      )

      # ---------------- TIÊU ĐỀ CHÍNH ----------------
      # Dòng chữ lớn màu trắng, font đậm nghiêng
      text3d(
        e, 'XE ĐIỆN THU HIỀN',
        220.mm, BOTTOM + 770.mm,
        380.mm, 'Arial', white, 12.mm,
        true, true
      )

      # ---------------- THANH THÔNG TIN ----------------
      # Thanh nền trắng bo cảm giác bằng hai đầu tròn
      # Bố trí đơn giản để dễ thay đổi trong SketchUp
      bar_x = 650.mm
      bar_z = BOTTOM + 380.mm
      bar_w = 3700.mm
      bar_h = 190.mm

      front_box(
        e, 'THANH_THONG_TIN',
        bar_x, bar_z, bar_w, bar_h,
        5.mm, FRONT_Y - 8.mm, white
      )

      # Ba biểu tượng dạng tròn
      centers = [
        bar_x + 260.mm,
        bar_x + 1530.mm,
        bar_x + 2800.mm
      ]

      centers.each_with_index do |cx, i|
        circle_group = e.add_group
        circle_group.name = "ICON_#{i + 1}"
        c = circle_group.entities
        center = Geom::Point3d.new(
          cx, FRONT_Y - 16.mm, bar_z + 95.mm
        )
        ring = c.add_circle(
          center, Geom::Vector3d.new(0,1,0), 54.mm, 32
        )
        face = c.add_face(ring)
        if face
          face.material = blue
          face.back_material = blue
          face.pushpull(3.mm)
        end
      end

      # Nội dung các nhóm dịch vụ
      text3d(
        e, 'XE ĐIỆN',
        bar_x + 350.mm, bar_z + 52.mm,
        90.mm, 'Arial', blue, 3.mm, true, false
      )

      text3d(
        e, 'XE MÁY ĐIỆN',
        bar_x + 1620.mm, bar_z + 52.mm,
        85.mm, 'Arial', blue, 3.mm, true, false
      )

      text3d(
        e, 'PHỤ KIỆN',
        bar_x + 2890.mm, bar_z + 52.mm,
        85.mm, 'Arial', blue, 3.mm, true, false
      )

      # ---------------- DẢI CHÂN BẢNG ----------------
      front_box(
        e, 'DAI_CHAN_XANH',
        45.mm, BOTTOM + 90.mm,
        W - 90.mm, 125.mm, 4.mm,
        FRONT_Y - 8.mm, blue_edge
      )

      text3d(
        e, 'CHAT LUONG - BEN BI - TIET KIEM',
        160.mm, BOTTOM + 115.mm,
        62.mm, 'Arial', white, 3.mm, true, false
      )

      # Địa chỉ và số điện thoại ở phía phải
      text3d(
        e, '05 GIAI PHONG',
        2900.mm, BOTTOM + 115.mm,
        58.mm, 'Arial', white, 3.mm, true, false
      )

      text3d(
        e, '0835 47 6789',
        4000.mm, BOTTOM + 115.mm,
        58.mm, 'Arial', white, 3.mm, true, false
      )

      # ---------------- VIỀN NHÔM ----------------
      # Nẹp trên và dưới
      front_box(
        e, 'NEP_NHOM_TREN',
        0, TOP - 15.mm, W, 15.mm,
        15.mm, -15.mm, silver
      )
      front_box(
        e, 'NEP_NHOM_DUOI',
        0, BOTTOM, W, 15.mm,
        15.mm, -15.mm, silver
      )

      # ---------------- TRỤ ĐỠ ----------------
      # Hai trụ ống thép đứng
      post_x = [150.mm, W - 150.mm]

      post_x.each_with_index do |px, i|
        cylinder(
          e, "TRU_THEP_#{i + 1}",
          px, 0, 0,
          POST_D / 2, POST_H, silver
        )

        # Đế chân trụ
        front_box(
          e, "DE_TRU_#{i + 1}",
          px - 100.mm, -100.mm, 0,
          200.mm, 200.mm, 12.mm,
          dark
        )

        # Nẹp trang trí trụ
        cylinder(
          e, "DAI_TRU_#{i + 1}",
          px, 0, BOTTOM + 30.mm,
          POST_D / 2 + 5.mm, 35.mm, grey
        )
      end

      # Thanh ngang gia cường phía sau bảng
      front_box(
        e, 'GIANG_NGANG_SAU',
        120.mm, BOTTOM + 150.mm,
        W - 240.mm, 60.mm,
        60.mm, 15.mm, dark
      )

      # ---------------- LED VIỀN ----------------
      # Mô phỏng bóng LED thành các khối nhỏ.
      # Có thể giảm số lượng nếu máy cấu hình thấp.
      led_step = 100.mm
      led_size = 18.mm
      led_y = FRONT_Y - 20.mm

      # Cạnh trên và dưới
      count = (W / led_step).to_i
      count.times do |i|
        lx = 70.mm + i * led_step

        front_box(
          e, "LED_TREN_#{i}",
          lx, TOP - 70.mm,
          led_size, led_size, 4.mm,
          led_y, led
        )

        front_box(
          e, "LED_DUOI_#{i}",
          lx, BOTTOM + 70.mm,
          led_size, led_size, 4.mm,
          led_y, led
        )
      end

      # Cạnh trái và phải
      side_count = (H / led_step).to_i
      side_count.times do |i|
        lz = BOTTOM + 100.mm + i * led_step

        front_box(
          e, "LED_TRAI_#{i}",
          70.mm, lz,
          led_size, led_size, 4.mm,
          led_y, led
        )

        front_box(
          e, "LED_PHAI_#{i}",
          W - 88.mm, lz,
          led_size, led_size, 4.mm,
          led_y, led
        )
      end

      # ---------------- HOÀN TẤT ----------------
      model.commit_operation
      model.active_view.zoom_extents
      puts 'Da tao xong mo hinh bien XE DIEN THU HIEN 3D.'

    rescue => error
      model.abort_operation
      puts "Loi: #{error.message}"
      puts error.backtrace
    end
  end
end

XeDienThuHien3D.build