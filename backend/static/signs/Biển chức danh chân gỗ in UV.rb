# ============================================================

module NhatKhoaHungPlaque
  extend self

  MODEL_NAME = "BANG_TEN_NHAT_KHOA_HUNG"

  # Kich thuoc tong the (mm) - co the thay doi
  W       = 600.mm
  H_PANEL = 245.mm
  D_PANEL = 18.mm
  BASE_W  = 650.mm
  BASE_D  = 165.mm
  BASE_H  = 22.mm

  def mat(model, name, color, texture_size = nil)
    m = model.materials[name] || model.materials.add(name)
    m.color = Sketchup::Color.new(*color)
    m
  end

  def box(entities, name, x, y, z, dx, dy, dz, material)
    g = entities.add_group
    g.name = name
    e = g.entities

    pts = [
      [x,      y,      z],
      [x + dx, y,      z],
      [x + dx, y + dy, z],
      [x,      y + dy, z]
    ].map { |p| Geom::Point3d.new(*p) }

    f = e.add_face(pts)
    if f
      f.reverse! if f.normal.z < 0
      f.pushpull(dz)
      e.grep(Sketchup::Face).each do |face|
        face.material = material
        face.back_material = material
      end
    end
    g
  end

  # Tao thanh hop co tiet dien vuong
  def beam(entities, name, p1, p2, width, depth, material)
    a = Geom::Point3d.new(*p1)
    b = Geom::Point3d.new(*p2)
    v = b - a
    return if v.length < 0.001

    # Dung thanh theo truc X hoac Z, phu hop khung mat dung
    g = entities.add_group
    g.name = name
    length = v.length
    if v.parallel?(Geom::Vector3d.new(1, 0, 0))
      box(g.entities, name + "_solid",
          [a.x, b.x].min, a.y, a.z - width / 2,
          length, depth, width, material)
    elsif v.parallel?(Geom::Vector3d.new(0, 0, 1))
      box(g.entities, name + "_solid",
          a.x - width / 2, a.y, [a.z, b.z].min,
          width, depth, length, material)
    end
    g
  end

  # Chu noi 3D tren mat dung.
  # Mat truoc cua bang huong ve phia Y am.
  def front_text(entities, name, string, x, z, height,
                 material, bold = true, font = "Arial",
                 extrusion = 0.8.mm)

    g = entities.add_group
    g.name = name

    ok = g.entities.add_3d_text(
      string,
      TextAlignCenter,
      font,
      bold,
      false,
      height,
      0.1.mm,
      0,
      true,
      extrusion
    )

    unless ok
      g.erase!
      return nil
    end

    # Chu tao tren mat XY; xoay 90 do de dung tren mat XZ.
    # Sau xoay, truc Z cua chu huong ra phia truoc.
    rotation = Geom::Transformation.rotation(
      ORIGIN, X_AXIS, 90.degrees
    )
    translation = Geom::Transformation.translation(
      Geom::Vector3d.new(x, -0.5.mm, z)
    )
    g.transform!(translation * rotation)

    g.entities.grep(Sketchup::Face).each do |face|
      face.material = material
      face.back_material = material
    end
    g
  end

  # Duong tron trang tri nam tren mat dung XZ.
  def circle_front(entities, name, cx, cz, radius, material,
                   segments = 32, thickness = 0.5.mm)
    g = entities.add_group
    g.name = name
    center = Geom::Point3d.new(cx, -0.4.mm, cz)
    normal = Geom::Vector3d.new(0, -1, 0)

    edges = g.entities.add_circle(center, normal, radius, segments)
    face = g.entities.add_face(edges)
    if face
      face.material = material
      face.pushpull(thickness)
      g.entities.grep(Sketchup::Face).each do |f|
        f.material = material
        f.back_material = material
      end
    end
    g
  end

  # Mot canh hoa cach dieu, lap thanh dai trang tri.
  def ornament(entities, x, z, scale, gold, index)
    g = entities.add_group
    g.name = "Hoa_tiet_vien_#{index}"

    # Hai cung tron nho va mot tam giac kim loai cach dieu
    center = Geom::Point3d.new(x, -0.6.mm, z)
    normal = Geom::Vector3d.new(0, -1, 0)

    [-1, 1].each do |side|
      c = Geom::Point3d.new(
        x + side * 2.0.mm * scale, -0.6.mm, z
      )
      edges = g.entities.add_circle(
        c, normal, 2.2.mm * scale, 12
      )
      edges.each { |edge| edge.soft = true if edge.valid? }
    end

    # Duong trang tri dang chu S don gian
    pts = [
      Geom::Point3d.new(x - 4.mm * scale, -0.6.mm, z),
      Geom::Point3d.new(x - 1.mm * scale, -0.6.mm, z + 2.mm * scale),
      Geom::Point3d.new(x + 1.mm * scale, -0.6.mm, z - 2.mm * scale),
      Geom::Point3d.new(x + 4.mm * scale, -0.6.mm, z)
    ]
    g.entities.add_curve(pts)

    g.entities.grep(Sketchup::Edge).each do |edge|
      edge.material = gold
    end
    g
  end

  def build
    model = Sketchup.active_model
    model.start_operation("Dung bang ten Nhat Khoa Hung", true)

    # Vat lieu
    wood       = mat(model, "Go_do_ruou",       [92, 15, 25])
    wood_light = mat(model, "Go_do_sang",       [130, 28, 38])
    gold       = mat(model, "Vang_kim_loai",    [224, 184, 42])
    gold_light = mat(model, "Vang_sang",        [255, 222, 92])
    gold_dark  = mat(model, "Vang_vien_dam",    [126, 92, 19])
    blue       = mat(model, "Xanh_logo_chu",    [15, 37, 135])
    green      = mat(model, "Xanh_la_logo",     [25, 120, 63])
    red        = mat(model, "Do_chu_KIM_NHO",   [198, 15, 18])
    white      = mat(model, "Trang_vien_chu",   [255, 241, 190])
    black      = mat(model, "Den_nau",          [53, 28, 12])

    # Xoa group cu neu chay lai
    old = model.entities.grep(Sketchup::Group).find do |g|
      g.name == MODEL_NAME
    end
    old.erase! if old && old.valid?

    root = model.entities.add_group
    root.name = MODEL_NAME
    e = root.entities

    # --------------------------------------------------------
    # 1. DE GO NHIEU CAP
    # Mat truoc la Y am, chieu cao Z duong
    # --------------------------------------------------------
    box(e, "De_go_cap_duoi",
        -BASE_W / 2, 0, 0,
        BASE_W, BASE_D, BASE_H, wood)

    box(e, "De_go_cap_tren",
        -310.mm, 12.mm, BASE_H,
        620.mm, 135.mm, 28.mm, wood_light)

    # Thanh vien vang tren de
    box(e, "Nep_vang_trang_tri_de",
        -300.mm, 8.mm, 47.mm,
        600.mm, 5.mm, 12.mm, gold)

    box(e, "Nep_vang_sang",
        -300.mm, 7.mm, 58.mm,
        600.mm, 4.mm, 1.8.mm, gold_light)

    # --------------------------------------------------------
    # 2. KHUNG BANG DUNG
    # --------------------------------------------------------
    panel_z = 72.mm
    panel_y = 38.mm
    panel_w = W
    panel_h = H_PANEL
    panel_front_y = panel_y

    # Than bang va mat vang
    box(e, "Than_khung_go",
        -panel_w / 2, panel_y, panel_z,
        panel_w, D_PANEL, panel_h, wood)

    box(e, "Mat_bang_vang",
        -panel_w / 2 + 8.mm,
        panel_y - 0.5.mm,
        panel_z + 8.mm,
        panel_w - 16.mm,
        1.2.mm,
        panel_h - 16.mm,
        gold)

    # Vien vang ngoai
    frame = 5.mm
    y_frame = panel_y - 1.2.mm
    z0 = panel_z + 5.mm
    inner_w = panel_w - 10.mm
    inner_h = panel_h - 10.mm

    box(e, "Vien_vang_duoi",
        -inner_w / 2, y_frame, z0,
        inner_w, 2.mm, frame, gold_light)

    box(e, "Vien_vang_tren",
        -inner_w / 2, y_frame, z0 + inner_h - frame,
        inner_w, 2.mm, frame, gold_light)

    box(e, "Vien_vang_trai",
        -inner_w / 2, y_frame, z0,
        frame, 2.mm, inner_h, gold_light)

    box(e, "Vien_vang_phai",
        inner_w / 2 - frame, y_frame, z0,
        frame, 2.mm, inner_h, gold_light)

    # Vien trong mau vang dam
    box(e, "Vien_trong_duoi",
        -275.mm, panel_y - 1.8.mm, panel_z + 29.mm,
        550.mm, 1.5.mm, 1.5.mm, gold_dark)

    box(e, "Vien_trong_tren",
        -275.mm, panel_y - 1.8.mm, panel_z + 214.mm,
        550.mm, 1.5.mm, 1.5.mm, gold_dark)

    box(e, "Vien_trong_trai",
        -275.mm, panel_y - 1.8.mm, panel_z + 29.mm,
        1.5.mm, 1.5.mm, 185.mm, gold_dark)

    box(e, "Vien_trong_phai",
        273.5.mm, panel_y - 1.8.mm, panel_z + 29.mm,
        1.5.mm, 1.5.mm, 185.mm, gold_dark)

    # --------------------------------------------------------
    # 3. HOA TIET LAP LAI QUANH VIEN
    # --------------------------------------------------------
    # Dai tren va duoi
    (0..54).each do |i|
      x = -265.mm + i * 9.8.mm
      ornament(e, x, panel_z + 20.mm, 0.7, gold_light, i)
      ornament(e, x, panel_z + 222.mm, 0.7, gold_light, i + 100)
    end

    # Hai dai doc
    (0..18).each do |i|
      z = panel_z + 32.mm + i * 9.8.mm
      ornament(e, -285.mm, z, 0.7, gold_light, i + 200)
      ornament(e,  285.mm, z, 0.7, gold_light, i + 300)
    end

    # --------------------------------------------------------
    # 4. CHU NOI 3D
    # --------------------------------------------------------
    # Logo va ten don vi
    front_text(e, "Ten_cong_ty",
      "NHAT KHOA HUNG",
      65.mm, panel_z + 177.mm, 27.mm,
      blue, true, "Arial", 0.8.mm)

    front_text(e, "Chi_nhanh",
      "CHI NHANH VINH LONG",
      65.mm, panel_z + 149.mm, 17.mm,
      blue, true, "Arial", 0.6.mm)

    front_text(e, "Chuc_danh",
      "GIAM DOC",
      0.mm, panel_z + 103.mm, 19.mm,
      blue, true, "Times New Roman", 0.8.mm)

    front_text(e, "Ten_giam_doc",
      "KIM NHO",
      0.mm, panel_z + 42.mm, 47.mm,
      red, true, "Arial", 1.2.mm)

    # --------------------------------------------------------
    # 5. LOGO HOA CACH DIEU
    # --------------------------------------------------------
    logo_x = -225.mm
    logo_z = panel_z + 171.mm
    circle_front(e, "Logo_vong_ngoai",
      logo_x, logo_z, 23.mm, green, 48, 0.5.mm)

    circle_front(e, "Logo_vong_trong",
      logo_x, logo_z, 17.mm, gold, 48, 0.4.mm)

    # 5 canh hoa tao bang cac duong tron giao nhau
    petal_radius = 9.mm
    5.times do |i|
      angle = i * 72.degrees - 90.degrees
      px = logo_x + Math.cos(angle) * 10.mm
      pz = logo_z + Math.sin(angle) * 10.mm

      circle_front(e, "Logo_canh_hoa_#{i + 1}",
        px, pz, petal_radius, blue, 32, 0.7.mm)
    end

    circle_front(e, "Logo_nhu hoa",
      logo_x, logo_z, 3.mm, gold_light, 24, 0.8.mm)

    front_text(e, "Logo_ten",
      "NHAT KHOA HUNG",
      logo_x, panel_z + 143.mm, 6.mm,
      blue, true, "Times New Roman", 0.3.mm)

    # --------------------------------------------------------
    # 6. DUONG PHAN CACH TRANG TRI
    # --------------------------------------------------------
    box(e, "Duong_ngang_trang_tri",
        -110.mm, panel_y - 1.mm, panel_z + 130.mm,
        220.mm, 0.8.mm, 0.8.mm, gold_light)

    # Cac nut tron trang tri tren duong ngang
    [-45, -30, -15, 0, 15, 30, 45].each_with_index do |offset, i|
      circle_front(e, "Nut_trang_tri_#{i}",
        offset.mm, panel_z + 130.mm,
        1.8.mm, gold_light, 16, 0.4.mm)
    end

    # --------------------------------------------------------
    # 7. HOAN TAT
    # --------------------------------------------------------
    model.selection.clear
    model.selection.add(root)
    model.active_view.zoom_extents
    model.commit_operation

    puts "Da tao xong mo hinh: #{MODEL_NAME}"
    root
  rescue => ex
    model.abort_operation
    puts "Loi khi dung bang ten: #{ex.message}"
    puts ex.backtrace
    raise
  end
end

# Chay lenh dung mo hinh
NhatKhoaHungPlaque.build