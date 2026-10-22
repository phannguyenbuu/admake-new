# ============================================================
# THUY NaBi - TIEM THUE DO BMT
# SKETCHUP RUBY API - MO HINH BIEN QUANG CAO 3D
# Don vi: mm
#
# Bao gom:
# 1. Tam nen alu/PVC trang
# 2. Khung vien nhom
# 3. Chu THUY NaBi noi 3D
# 4. Dong chu phu va duong gach ngang
# 5. Khu vuc thong tin lien he
# 6. Icon dia diem, dien thoai, Facebook
#
# Luu file: thuy_nabi_sign.rb
# ============================================================

module ThuyNabiSign
  extend self

  MODEL_NAME = "THUY_NABI_BIEN_QUANG_CAO"

  # Kich thuoc uoc tinh theo anh
  SIGN_W = 2400.mm
  SIGN_H = 1500.mm
  PANEL_T = 25.mm

  FRAME_W = 18.mm
  FRAME_D = 30.mm

  # Do noi chu
  MAIN_TEXT_D = 18.mm
  SUB_TEXT_D = 4.mm

  # ----------------------------------------------------------
  # VAT LIEU
  # ----------------------------------------------------------
  def material(model, name, rgb)
    m = model.materials[name] || model.materials.add(name)
    m.color = Sketchup::Color.new(*rgb)
    m
  end

  def paint(group, mat)
    group.entities.grep(Sketchup::Face).each do |f|
      f.material = mat
      f.back_material = mat
    end
  end

  # ----------------------------------------------------------
  # KHOI HOP
  # ----------------------------------------------------------
  def box(entities, name, x, y, z, dx, dy, dz, mat)
    g = entities.add_group
    g.name = name

    points = [
      [x, y, z],
      [x + dx, y, z],
      [x + dx, y + dy, z],
      [x, y + dy, z]
    ].map { |p| Geom::Point3d.new(*p) }

    face = g.entities.add_face(points)

    if face
      face.reverse! if face.normal.z < 0
      face.pushpull(dz)
      paint(g, mat)
    end

    g
  end

  # ----------------------------------------------------------
  # TAM CHU NHAT DUNG
  # Mat truoc huong Y am
  # ----------------------------------------------------------
  def panel(entities, name, x, z, width, height,
            thickness, mat)

    g = entities.add_group
    g.name = name

    # Mat sau cua tam
    box(g.entities, "Tam_vat_lieu",
        x, 0, z,
        width, thickness, height, mat)

    g
  end

  # ----------------------------------------------------------
  # CHU NOI 3D
  # Tao text trong mat XY, xoay de dung tren mat XZ
  # ----------------------------------------------------------
  def text3d(entities, name, string, cx, cz,
             face_y, text_height, font, bold,
             mat, extrusion)

    g = entities.add_group
    g.name = name

    ok = g.entities.add_3d_text(
      string,
      TextAlignCenter,
      font,
      bold,
      false,
      text_height,
      0.0,
      0,
      true,
      extrusion
    )

    unless ok
      g.erase!
      puts "Khong tao duoc chu: #{string}"
      return nil
    end

    # Xoay mat chu XY thanh XZ
    rotation = Geom::Transformation.rotation(
      ORIGIN, X_AXIS, 90.degrees
    )
    g.transform!(rotation)

    # Can giua bounding box sau khi xoay
    bb = g.bounds
    bx = (bb.min.x + bb.max.x) / 2.0
    bz = (bb.min.z + bb.max.z) / 2.0
    by = bb.min.y

    translation = Geom::Transformation.translation(
      Geom::Vector3d.new(cx - bx, face_y - by, cz - bz)
    )
    g.transform!(translation)

    paint(g, mat)
    g
  end

  # ----------------------------------------------------------
  # VIEN KHUNG BANG
  # ----------------------------------------------------------
  def make_frame(entities, w, h, frame_w, y, depth, mat)
    # Canh tren
    box(entities, "Khung_tren",
        -w / 2, y, h - frame_w,
        w, depth, frame_w, mat)

    # Canh duoi
    box(entities, "Khung_duoi",
        -w / 2, y, 0,
        w, depth, frame_w, mat)

    # Canh trai
    box(entities, "Khung_trai",
        -w / 2, y, 0,
        frame_w, depth, h, mat)

    # Canh phai
    box(entities, "Khung_phai",
        w / 2 - frame_w, y, 0,
        frame_w, depth, h, mat)
  end

  # ----------------------------------------------------------
  # DUONG TRANG TRI NGANG
  # ----------------------------------------------------------
  def horizontal_line(entities, name, x1, x2, z, y, thickness, mat)
    box(entities, name,
        x1, y, z - thickness / 2,
        x2 - x1, 2.mm, thickness, mat)
  end

  # ----------------------------------------------------------
  # ICON TRON VA CHAM TRON
  # ----------------------------------------------------------
  
  def circle_icon(entities, name, cx, cz, radius, y, depth, mat, segments = 24)
    box(entities, name, cx - radius, y, cz - radius, radius * 2, depth, radius * 2, mat)
  end
end
