# ==============================================================================
# BẢNG THỐNG KÊ CẤU KIỆN & BÓC TÁCH VẬT TƯ THI CÔNG CHI TIẾT (BOM)
# Dự án: Mô hình 3D từ mã SketchUp
# Phân loại: STOREFRONT | Kích thước: 6.0m (Dài) x 1.2m (Cao) x 0.03m (Sâu) • Diện tích: 7.2 m²
# Tổng số cấu kiện kết cấu: 11 hạng mục
# Tự động đánh giá & lập trình bởi: ADMAKE AI Structural Engineering Studio
# ------------------------------------------------------------------------------
# STT | Tên Cấu Kiện                      | Kích Thước (Quy Cách)             | SL   | ĐVT    | Đơn Giá (VNĐ) | Thành Tiền (VNĐ)
# ------------------------------------------------------------------------------
#   1 | Móng bê tông cốt thép chịu lực   | 2 hố móng (1.0m x 1.0m x sâu 1.2 |    2 | hố móng |     2.800.000 |        5.600.000
#   2 | Bản mã thép & Bu lông neo móng   | Bản mã 250x250x16mm + 8 Bu lông  |    2 | bộ      |       850.000 |        1.700.000
#   3 | Trụ thép tròn chịu lực chính Ø21 | Thép ống đúc Ø210mm x L=4.0m, độ |    2 | cây trụ |     4.200.000 |        8.400.000
#   4 | Khung xương giàn sắt hộp (Sắt hộ | Đan xương nan caro nhịp 1.2m, tổ |    4 | cây (6m |       185.000 |          740.000
#   5 | Thanh giằng xéo tăng cứng chống  | Sắt hộp vuông 25x25x1.2mm đan ch |    5 | cây (6m |       145.000 |          725.000
#   6 | Mặt bảng tấm ốp Alu Alcorest 3mm | 6.0m x 1.2m (Diện tích thiết kế: |  7.2 | m²      |       650.000 |        4.680.000
#   7 | Nẹp viền nhôm định hình V25 bo g | V nhôm 25x25mm bọc kín 4 cạnh vi |    5 | cây (3m |        45.000 |          225.000
#   8 | Tôn mạ màu chống thấm bảo vệ mặt | Tôn kẽm mạ màu 0.35mm che kín mặ |  7.2 | m²      |        95.000 |          684.000
#   9 | Bộ chữ nổi 3D thương hiệu phát s | Khổ bộ chữ 4.2m x 0.42m, mặt Mic |    1 | bộ      |     3.023.999 |        3.023.999
#  10 | Cần đỡ & Đèn pha LED chiếu rọi n | 2 cần vươn 1.2m + Đèn pha LED 50 |    2 | bộ      |       480.000 |          960.000
#  11 | Vật tư phụ & Phụ kiện liên kết c | Que hàn, ốc vít tự khoan, silico |    1 | gói kho |       395.999 |          395.999
# ------------------------------------------------------------------------------
# THÔNG SỐ DỰ TRÙ VẬN HÀNH & LOGISTICS (AI STRUCTURAL ESTIMATE)
# 1. Nhân công sản xuất & lắp đặt: 9 công (Đơn giá: 400.000 đ/công)
# 2. Cự ly vận chuyển công trình: 15 km (Đơn giá: 15.000 đ/km)
# 3. % Hao hụt vật tư: 5%
# 4. Trọng lượng vận chuyển: 238 kg
# 5. Kích thước đóng gói: 6.0m × 1.2m × 0.35m (nguyên kiện)
# 6. Đề xuất loại xe sử dụng: Xe cẩu tự hành 3.5 - 5 tấn (thùng dài 5.2 - 6.0m)
# ------------------------------------------------------------------------------
# TỔNG DỰ TOÁN VẬT TƯ BÓC TÁCH: 27.133.998 VNĐ
# Hướng dẫn: Mở SketchUp -> Extensions -> Ruby Console -> Dán mã này và Enter
# ==============================================================================

# ============================================================
# LOP 66 - BIEN QUANG CAO TIEM LOP XE
# SketchUp Ruby API | 3D + BIM COMPONENTS
# Don vi: mm
# ============================================================
#
# Kich thuoc mac dinh: 6000 x 1200 mm
# Mat bang: XZ
# Mat truoc: Y am
#
# Thanh phan:
# 01. Tam nen den
# 02. Vien khung
# 03. Chu noi LOP 66
# 04. Hinh lop xe va gai lop
# 05. Icon mam xe
# 06. Chu lop xe chinh hang
# 07. Dai thong tin dia chi va dien thoai
# 08. Khung xuong phia sau
#
# Cach chay:
# Luu thanh lop66_sign.rb
# Mo Window > Ruby Console trong SketchUp
# Nhap: load "D:/SketchUp/lop66_sign.rb"
# ============================================================

module Lop66Sign
  extend self

  MODEL_NAME = "LOP66_SIGN_3D"

  # ---------------- THONG SO ----------------
  W = 6000.mm
  H = 1200.mm
  PANEL_T = 25.mm
  FRAME_T = 30.mm
  FRAME_D = 35.mm

  INFO_H = 190.mm
  TITLE_H = 410.mm
  TITLE_D = 22.mm
  SMALL_D = 5.mm

  # ---------------- VAT LIEU ----------------
  def mat(model, name, rgb)
    m = model.materials[name] || model.materials.add(name)
    m.color = Sketchup::Color.new(*rgb)
    m
  end

  def paint(group, material)
    group.entities.grep(Sketchup::Face).each do |f|
      f.material = material
      f.back_material = material
    end
  end

  # ---------------- KHOI HOP ----------------
  def box(entities, name, x, y, z, dx, dy, dz, material)
    g = entities.add_group
    g.name = name

    pts = [
      [x, y, z],
      [x + dx, y, z],
      [x + dx, y + dy, z],
      [x, y + dy, z]
    ].map { |p| Geom::Point3d.new(*p) }

    face = g.entities.add_face(pts)

    if face
      face.reverse! if face.normal.z < 0
      face.pushpull(dz)
      paint(g, material)
    end

    g
  end

  # ---------------- CHU NOI 3D ----------------
  # Text duoc tao tren XY, sau do xoay thanh mat XZ.
  # Mat truoc huong Y am.
  def text3d(entities, name, string, cx, cz, front_y,
             height, font, bold, material, depth)

    g = entities.add_group
    g.name = name

    success = g.entities.add_3d_text(
      string,
      TextAlignCenter,
      font,
      bold,
      false,
      height,
      0.0,
      0,
      true,
      depth
    )

    unless success
      puts "Khong tao duoc text: #{string}"
      g.erase!
      return nil
    end

    # Xoay chu dung tren mat bang
    rotation = Geom::Transformation.rotation(
      ORIGIN, X_AXIS, 90.degrees
    )
    g.transform!(rotation)

    bb = g.bounds
    center_x = (bb.min.x + bb.max.x) / 2.0
    center_z = (bb.min.z + bb.max.z) / 2.0

    # Can mat chu ve phia truoc bang
    delta_y = front_y - bb.min.y

    translation = Geom::Transformation.translation(
      Geom::Vector3d.new(
        cx - center_x,
        delta_y,
        cz - center_z
      )
    )
    g.transform!(translation)

    paint(g, material)
    g
  end

  # ---------------- DUONG THANH ----------------
  def rail(entities, name, x1, z1, x2, z2,
           width, y, depth, material)

    dx = x2 - x1
    dz = z2 - z1
    length = Math.sqrt(dx * dx + dz * dz)
    return nil if length < 0.1.mm

    angle = Math.atan2(dz, dx)
    g = box(
      entities, name,
      x1, y, z1 - width / 2.0,
      length, depth, width, material
    )

    # Xoay thanh quanh diem dau
    tr = Geom::Transformation.rotation(
      Geom::Point3d.new(x1, y, z1),
      Y_AXIS,
      -angle
    )

    g.transform!(tr)
    g
  end

  # ---------------- VONG TRON TREN MAT XZ ----------------
  def ring_lines(entities, name, cx, cz, radius, y, material)
    g = entities.add_group
    g.name = name

    center = Geom::Point3d.new(cx, y, cz)
    normal = Geom::Vector3d.new(0, -1, 0)

    g.entities.add_circle(center, normal, radius, 48)

    g.entities.grep(Sketchup::Edge).each do |edge|
      edge.material = material
    end

    g
  end

  # ---------------- ICON LOP XE ----------------
  def tire_icon(entities, cx, cz, radius, y, black, grey, orange)
    g = entities.add_group
    g.name = "04_Banh_xe_3D"

    # Cac duong tron mo phong lop va mam
    ring_lines(g.entities, "Lop_ngoai",
               cx, cz, radius, y, grey)

    ring_lines(g.entities, "Thanh_lop",
               cx, cz, radius * 0.88, y - 1.mm, black)

    ring_lines(g.entities, "Vien_mam",
               cx, cz, radius * 0.58, y - 2.mm, grey)

    ring_lines(g.entities, "Tam_mam",
               cx, cz, radius * 0.45, y - 3.mm, orange)

    # Gai lop dang thanh ngan theo chu vi
    24.times do |i|
      angle = 2.0 * Math::PI * i / 24.0
      r1 = radius * 0.91
      r2 = radius * 0.99

      x1 = cx + r1 * Math.cos(angle)
      z1 = cz + r1 * Math.sin(angle)
      x2 = cx + r2 * Math.cos(angle + 0.06)
      z2 = cz + r2 * Math.sin(angle + 0.06)

      rail(
        g.entities, "Gai_lop_#{i + 1}",
        x1, z1, x2, z2,
        5.mm, y - 2.mm, 2.mm, black
      )
    end

    g
  end

  # ---------------- ICON MAM XE ----------------
  def wheel_icon(entities, cx, cz, radius, y, grey, white)
    g = entities.add_group
    g.name = "06_Icon_mam_xe"

    ring_lines(g.entities, "Mam_vien",
               cx, cz, radius, y, grey)

    ring_lines(g.entities, "Mam_trong",
               cx, cz, radius * 0.76, y - 1.mm, white)

    ring_lines(g.entities, "Bau_mam",
               cx, cz, radius * 0.24, y - 2.mm, grey)

    # 8 nan mam
    8.times do |i|
      angle = i * 2.0 * Math::PI / 8
      x1 = cx + radius * 0.22 * Math.cos(angle)
      z1 = cz + radius * 0.22 * Math.sin(angle)
      x2 = cx + radius * 0.72 * Math.cos(angle + 0.12)
      z2 = cz + radius * 0.72 * Math.sin(angle + 0.12)

      rail(
        g.entities, "Nan_mam_#{i + 1}",
        x1, z1, x2, z2,
        8.mm, y - 2.mm, 2.mm, grey
      )
    end

    g
  end

  # ---------------- DUNG BANG ----------------
  def build
    model = Sketchup.active_model
    model.start_operation("LOP 66 - Bang quang cao 3D", true)

    begin
      # Vat lieu
      black = mat(model, "Nen_den_than",
                  [24, 24, 29])

      dark = mat(model, "Khung_thep",
                 [45, 47, 50])

      orange = mat(model, "Vang_cam",
                   [255, 167, 0])

      yellow = mat(model, "Vang_sang",
                   [255, 190, 20])

      white = mat(model, "Trang",
                  [244, 244, 240])

      grey = mat(model, "Nhom_bac",
                 [165, 169, 175])

      tyre_black = mat(model, "Cao_su",
                       [32, 32, 34])

      # Xoa model cu neu chay lai
      model.entities.grep(Sketchup::Group).each do |g|
        g.erase! if g.name == MODEL_NAME
      end

      root = model.entities.add_group
      root.name = MODEL_NAME
      e = root.entities

      half_w = W / 2.0
      front_y = -PANEL_T

      # ======================================================
      # 1. TAM NEN DEN
      # ======================================================
      box(
        e, "01_Tam_nen_den",
        -half_w, -PANEL_T, 0,
        W, PANEL_T, H,
        black
      )

      # ======================================================
      # 2. VIEN KHUNG
      # ======================================================
      box(e, "Vien_tren",
          -half_w, -PANEL_T - FRAME_D, H - FRAME_T,
          W, FRAME_D, FRAME_T, orange)

      box(e, "Vien_duoi",
          -half_w, -PANEL_T - FRAME_D, 0,
          W, FRAME_D, FRAME_T, orange)

      box(e, "Vien_trai",
          -half_w, -PANEL_T - FRAME_D, 0,
          FRAME_T, FRAME_D, H, orange)

      box(e, "Vien_phai",
          half_w - FRAME_T, -PANEL_T - FRAME_D, 0,
          FRAME_T, FRAME_D, H, orange)

      # ======================================================
      # 3. CHU LOP 66
      # ======================================================
      text3d(
        e, "03_CHU_LOP_66",
        "LOP 66",
        -400.mm, 720.mm,
        front_y - 3.mm,
        TITLE_H,
        "Arial",
        true,
        yellow,
        TITLE_D
      )

      # ======================================================
      # 4. HINH LOP XE BEN TRAI
      # ======================================================
      tire_icon(
        e,
        -2250.mm, 650.mm,
        260.mm,
        front_y - 3.mm,
        tyre_black, grey, orange
      )

      # ======================================================
      # 5. HAI ICON MAM XE BEN PHAI
      # ======================================================
      wheel_icon(
        e,
        1050.mm, 760.mm,
        115.mm,
        front_y - 3.mm,
        grey, white
      )

      wheel_icon(
        e,
        2200.mm, 760.mm,
        115.mm,
        front_y - 3.mm,
        grey, white
      )

      # ======================================================
      # 6. CHU LOP XE CHINH HANG
      # ======================================================
      text3d(
        e, "06_Lop_xe_1",
        "LOP XE",
        1400.mm, 730.mm,
        front_y - 3.mm,
        95.mm,
        "Arial",
        true,
        white,
        SMALL_D
      )

      text3d(
        e, "06_Chinh_hang_1",
        "CHINH HANG",
        1400.mm, 630.mm,
        front_y - 3.mm,
        50.mm,
        "Arial",
        true,
        orange,
        SMALL_D
      )

      text3d(
        e, "07_Lop_xe_2",
        "LOP XE",
        2500.mm, 730.mm,
        front_y - 3.mm,
        95.mm,
        "Arial",
        true,
        white,
        SMALL_D
      )

      text3d(
        e, "07_Chinh_hang_2",
        "CHINH HANG",
        2500.mm, 630.mm,
        front_y - 3.mm,
        50.mm,
        "Arial",
        true,
        orange,
        SMALL_D
      )

      # ======================================================
      # 7. DAI THONG TIN DUOI
      # ======================================================
      box(
        e, "08_Dai_thong_tin_trang",
        -half_w, -PANEL_T - 1.mm, 0,
        W, 2.mm, INFO_H,
        white
      )

      # Dia chi
      text3d(
        e, "09_Dia_chi",
        "66 DINH TIEN HOANG, BMT, DAK LAK",
        -1350.mm, 95.mm,
        -PANEL_T - 4.mm,
        55.mm,
        "Arial",
        true,
        dark,
        SMALL_D
      )

      # So dien thoai
      text3d(
        e, "10_SDT_1",
        "0981 217 430",
        1050.mm, 95.mm,
        -PANEL_T - 4.mm,
        55.mm,
        "Arial",
        true,
        dark,
        SMALL_D
      )

      text3d(
        e, "11_SDT_2",
        "0914 582 952",
        2300.mm, 95.mm,
        -PANEL_T - 4.mm,
        55.mm,
        "Arial",
        true,
        dark,
        SMALL_D
      )

      # Duong phan cach khu vuc thong tin
      box(
        e, "Duong_phan_cach_1",
        300.mm, -PANEL_T - 3.mm, 25.mm,
        3.mm, 3.mm, INFO_H - 50.mm,
        grey
      )

      box(
        e, "Duong_phan_cach_2",
        1750.mm, -PANEL_T - 3.mm, 25.mm,
        3.mm, 3.mm, INFO_H - 50.mm,
        grey
      )

      # ======================================================
      # 8. KHUNG THEP PHIA SAU
      # ======================================================
      back_y = 15.mm
      tube = 40.mm

      # Thanh ngang sau
      box(
        e, "Khung_sau_tren",
        -half_w + 50.mm, back_y, H - 100.mm,
        W - 100.mm, tube, tube, dark
      )

      box(
        e, "Khung_sau_giua",
        -half_w + 50.mm, back_y, H / 2.0,
        W - 100.mm, tube, tube, dark
      )

      box(
        e, "Khung_sau_duoi",
        -half_w + 50.mm, back_y, 50.mm,
        W - 100.mm, tube, tube, dark
      )

      # Thanh dung
      [-half_w + 100.mm, 0, half_w - 100.mm].each_with_index do |x, i|
        box(
          e, "Khung_sau_dung_#{i + 1}",
          x, back_y, 50.mm,
          tube, tube, H - 100.mm, dark
        )
      end

      # ======================================================
      # 9. HOAN TAT
      # ======================================================
      model.selection.clear
      model.selection.add(root)
      model.active_view.zoom_extents
      model.commit_operation

      puts "Da tao xong bang hieu LOP 66."
      puts "Kich thuoc: #{W.to_mm} x #{H.to_mm} mm."
      root

    rescue => error
      model.abort_operation
      puts "Loi: #{error.message}"
      puts error.backtrace
      raise
    end
  end
end

Lop66Sign.build