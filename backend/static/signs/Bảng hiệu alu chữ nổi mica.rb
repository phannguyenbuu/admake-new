# ============================================================
# HAFELE - DANG TUAN
# SKETCHUP RUBY API | 3D SIGN + BIM
# Don vi: mm
#
# Tam bang:
#   - Phan tren: do hong
#   - Phan duoi: trang
#   - Chu HAFELE noi 3D
#   - Chu DANG TUAN noi 3D
#   - Thong tin phu
#   - Khung vien va khung thep sau
#
# Cach dung:
# 1. Luu thanh dang_tuan_hafele.rb
# 2. Mo SketchUp > Window > Ruby Console
# 3. Chay: load "D:/SketchUp/dang_tuan_hafele.rb"
#
# Luu y:
# Kich thuoc va bo tri la gia tri uoc tinh theo anh.
# ============================================================

module DangTuanHafele
  extend self

  MODEL_NAME = "DANG_TUAN_HAFELE_3D"

  # ----------------------------------------------------------
  # CAU HINH KICH THUOC (mm)
  # ----------------------------------------------------------
  W = 6000.mm
  H = 3000.mm

  PANEL_D = 45.mm
  FRAME_D = 40.mm
  FRAME_W = 45.mm

  RED_H = 1750.mm
  WHITE_H = H - RED_H

  MAIN_TEXT_DEPTH = 35.mm
  SUB_TEXT_DEPTH  = 8.mm

  # Khoang lui cua chu so voi mat bang
  LETTER_OFFSET = 3.mm

  # ----------------------------------------------------------
  # VAT LIEU
  # ----------------------------------------------------------
  def material(model, name, rgb)
    m = model.materials[name] || model.materials.add(name)
    m.color = Sketchup::Color.new(*rgb)
    m
  end

  def paint(entities, mat)
    entities.grep(Sketchup::Face).each do |f|
      f.material = mat
      f.back_material = mat
    end
  end

  # ----------------------------------------------------------
  # KHOI HOP: X, Y, Z
  # ----------------------------------------------------------
  def box(entities, name, x, y, z, dx, dy, dz, mat)
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
      paint(g.entities, mat)
    end

    g
  end

  # ----------------------------------------------------------
  # CHU NOI 3D
  # Mat truoc huong ve Y am
  # ----------------------------------------------------------
  def text3d(entities, name, string, cx, cz,
             front_y, height, font, bold, mat, depth)

    g = entities.add_group
    g.name = name

    ok = g.entities.add_3d_text(
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

    unless ok
      puts "Khong tao duoc chu: #{string}"
      g.erase!
      return nil
    end

    # Xoay mat chu tu XY sang XZ
    rot = Geom::Transformation.rotation(
      ORIGIN, X_AXIS, 90.degrees
    )
    g.transform!(rot)

    # Can giua theo X va Z
    bb = g.bounds
    mid_x = (bb.min.x + bb.max.x) / 2.0
    mid_z = (bb.min.z + bb.max.z) / 2.0

    # Sau khi xoay, mat chu gan Y=0 va extrusion huong -Y
    target_y = front_y - LETTER_OFFSET
    dy = target_y - bb.min.y

    move = Geom::Transformation.translation(
      Geom::Vector3d.new(cx - mid_x, dy, cz - mid_z)
    )
    g.transform!(move)

    paint(g.entities, mat)
    g
  end

  # ----------------------------------------------------------
  # TAO TAM NEN DUNG
  # ----------------------------------------------------------
  def vertical_panel(entities, name, x, z, w, h, depth, mat)
    box(
      entities, name,
      x, -depth, z,
      w, depth, h, mat
    )
  end

  # ----------------------------------------------------------
  # KHUNG VIEN MAT TRUOC
  # ----------------------------------------------------------
  def make_front_frame(entities, w, h, t, depth, mat)
    y = -PANEL_D - depth

    # Canh tren
    box(entities, "Vien_tren",
        -w / 2, y, h - t,
        w, depth, t, mat)

    # Canh duoi
    box(entities, "Vien_duoi",
        -w / 2, y, 0,
        w, depth, t, mat)

    # Canh trai
    box(entities, "Vien_trai",
        -w / 2, y, 0,
        t, depth, h, mat)

    # Canh phai
    box(entities, "Vien_phai",
        w / 2 - t, y, 0,
        t, depth, h, mat)
  end

  # ----------------------------------------------------------
  # TAO THANH NGANG
  # ----------------------------------------------------------
  def rail(entities, name, x, y, z, length, depth, height, mat)
    box(entities, name, x, y, z, length, depth, height, mat)
  end

  # ----------------------------------------------------------
  # DUNG MO HINH
  # ----------------------------------------------------------
  def build
    model = Sketchup.active_model
    model.start_operation("Dung bang HAFELE DANG TUAN", true)

    begin
      # Vat lieu
      red = material(model, "Son_do_hong",
                     [177, 54, 83])

      white = material(model, "Alu_trang",
                       [242, 242, 239])

      black = material(model, "Chu_den",
                       [24, 20, 24])

      
      hafele_white = material(model, "Chu_HAFELE_trang", [244, 244, 244])
      panel(entities, "Mat_bang", 0, 0, 0, 4500, 1600, 20, white)
      text3d(entities, "HAFELE", 500, 50, "Arial", hafele_white, 200, 30, 800)
    rescue => e
    ensure
      model.commit_operation
    end
  end
end
