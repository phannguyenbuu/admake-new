# encoding: UTF-8
# ============================================================
# ADMAKE - BIEN BAO DU AN / SKETCHUP RUBY API
# Dung hinh 3D theo anh bien bao ngoai troi
# Don vi: mm
# ============================================================

module ADMAKE_BienBaoDuAn
  extend self

  W = 3000.mm
  H = 1800.mm
  THICKNESS = 35.mm
  POST_H = 3500.mm
  POST_SIZE = 60.mm
  FRAME = 25.mm
  TEXT_DEPTH = 3.mm

  def material(name, rgb)
    mats = Sketchup.active_model.materials
    m = mats[name] || mats.add(name)
    m.color = Sketchup::Color.new(*rgb)
    m
  end

  def block(entities, name, x, y, z, dx, dy, dz, mat)
    g = entities.add_group
    g.name = name

    pts = [
      [x,      y,      z],
      [x + dx, y,      z],
      [x + dx, y + dy, z],
      [x,      y + dy, z]
    ].map { |p| Geom::Point3d.new(p) }

    f = g.entities.add_face(pts)
    if f
      f.material = mat
      f.back_material = mat
      f.pushpull(dz)
    end
    g
  end

  def text3d(entities, string, x, y, z, height, mat, bold = true)
    g = entities.add_group
    g.name = "Chu_#{string.gsub(/[^A-Za-z0-9]/, '_')}"

    ok = g.entities.add_3d_text(
      string,
      1,
      "Arial",
      bold,
      false,
      height,
      0,
      0,
      true,
      TEXT_DEPTH
    )

    unless ok
      g.erase!
      return nil
    end

    # Chu tao tren mat XY, xoay dung len mat bien.
    g.transform!(
      Geom::Transformation.translation([x, y, z]) *
      Geom::Transformation.rotation(ORIGIN, X_AXIS, 90.degrees)
    )

    g.entities.grep(Sketchup::Face).each do |f|
      f.material = mat
      f.back_material = mat
    end

    g
  end

  def run
    model = Sketchup.active_model
    model.start_operation("ADMAKE Bien Bao Du An", true)

    begin
      root = model.active_entities.add_group
      root.name = "BIEN_BAO_DOI_SAN_XUAT_KO_SIER_II"
      e = root.entities

      blue = material("Nen_xanh_duong", [20, 65, 175])
      white = material("Nen_trang", [245, 246, 248])
      red = material("Chu_do", [177, 42, 49])
      navy = material("Chu_xanh_dam", [20, 50, 105])
      silver = material("Nhom_bac", [175, 185, 192])
      steel = material("Thep_tru", [135, 145, 150])
      concrete = material("Be_tong_mong", [145, 145, 140])

      half_w = W / 2.0
      z0 = 1800.mm
      front_y = -THICKNESS / 2.0 - 2.mm

      # ------------------------------------------------
      # MONG BE TONG VA TRU THEP
      # ------------------------------------------------
      [-1, 1].each do |side|
        px = side * (half_w - 100.mm)

        block(
          e, "Mong_tru_#{side}",
          px - 130.mm, -130.mm, 0,
          260.mm, 260.mm, 400.mm, concrete
        )

        block(
          e, "Tru_thep_#{side}",
          px - POST_SIZE / 2.0,
          -POST_SIZE / 2.0,
          400.mm,
          POST_SIZE, POST_SIZE,
          POST_H - 400.mm, steel
        )

        block(
          e, "Nap_tru_#{side}",
          px - POST_SIZE / 2.0,
          -POST_SIZE / 2.0,
          POST_H,
          POST_SIZE, POST_SIZE, 5.mm, silver
        )
      end

      # ------------------------------------------------
      # TAM BIEN CHINH
      # ------------------------------------------------
      block(
        e, "Tam_bien_nen",
        -half_w, -THICKNESS / 2.0, z0,
        W, THICKNESS, H, blue
      )

      # Khu vuc noi dung phia duoi
      lower_h = 700.mm
      block(
        e, "Nen_thong_tin_trang",
        -half_w + FRAME,
        front_y,
        z0 + FRAME,
        W - 2 * FRAME, 3.mm,
        lower_h, white
      )

      # Dai ngan cach xanh
      block(
        e, "Duong_phan_cach",
        -half_w + FRAME,
        front_y - 4.mm,
        z0 + lower_h + FRAME,
        W - 2 * FRAME, 3.mm, 15.mm, white
      )

      # ------------------------------------------------
      # KHUNG VIEN NHOM
      # ------------------------------------------------
      block(e, "Vien_tren",
        -half_w, -THICKNESS / 2.0 - 5.mm,
        z0 + H - FRAME,
        W, 5.mm, FRAME, silver)

      block(e, "Vien_duoi",
        -half_w, -THICKNESS / 2.0 - 5.mm,
        z0,
        W, 5.mm, FRAME, silver)

      block(e, "Vien_trai",
        -half_w, -THICKNESS / 2.0 - 5.mm,
        z0,
        FRAME, 5.mm, H, silver)

      block(e, "Vien_phai",
        half_w - FRAME, -THICKNESS / 2.0 - 5.mm,
        z0,
        FRAME, 5.mm, H, silver)

      # ------------------------------------------------
      # CHU TIEU DE NOI
      # ------------------------------------------------
      text3d(
        e, "ĐỘI SẢN XUẤT",
        0, front_y - 8.mm,
        z0 + H - 450.mm,
        180.mm, red, true
      )

      text3d(
        e, "KÔ SIÊR II",
        0, front_y - 8.mm,
        z0 + H - 800.mm,
        180.mm, red, true
      )

      text3d(
        e, "ĐC: TỔ LIÊN GIA 19, B. KÔ SIÊR, P. BUÔN MA THUỘT, ĐẮK LẮK",
        0, front_y - 8.mm,
        z0 + H - 970.mm,
        35.mm, navy, true
      )

      # ------------------------------------------------
      # KHU VUC THONG TIN BEN DUOI
      # ------------------------------------------------
      # Cot trai
      text3d(
        e, "ĐƠN VỊ CUNG ỨNG",
        -W / 4.0, front_y - 8.mm,
        z0 + 570.mm,
        45.mm, navy, true
      )

      text3d(
        e, "PHÂN BÓN & THUỐC BVTV",
        -W / 4.0, front_y - 8.mm,
        z0 + 460.mm,
        40.mm, navy, true
      )

      text3d(
        e, "BACONCO",
        -W / 4.0, front_y - 8.mm,
        z0 + 280.mm,
        32.mm, navy, true
      )

      # Cot phai
      text3d(
        e, "ĐƠN VỊ TƯ VẤN KỸ THUẬT",
        W / 4.0, front_y - 8.mm,
        z0 + 570.mm,
        42.mm, navy, true
      )

      text3d(
        e, "& CUNG ỨNG VẬT TƯ",
        W / 4.0, front_y - 8.mm,
        z0 + 485.mm,
        42.mm, navy, true
      )

      text3d(
        e, "NPP THÀNH DŨNG",
        W / 4.0, front_y - 8.mm,
        z0 + 300.mm,
        68.mm, red, true
      )

      text3d(
        e, "ĐT: 0983 00 47 53",
        W / 4.0, front_y - 8.mm,
        z0 + 100.mm,
        38.mm, navy, true
      )

      # ------------------------------------------------
      # HOAN TAT
      # ------------------------------------------------
      model.selection.clear
      model.selection.add(root)
      model.active_view.zoom_extents
      model.commit_operation

      UI.messagebox(
        "Da dung xong bien bao 3D.\n" \
        "Bang: 3000 x 1800 mm.\n" \
        "Hay kiem tra font chu va chinh lai kich thuoc theo hien truong."
      )

    rescue => ex
      model.abort_operation
      UI.messagebox("Loi Ruby: #{ex.message}")
    end
  end
end

ADMAKE_BienBaoDuAn.run