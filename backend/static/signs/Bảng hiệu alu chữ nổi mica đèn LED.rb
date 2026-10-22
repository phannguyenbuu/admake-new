module ADMAKE_Lightbox
  extend self

  # ---------- VAT LIEU ----------
  def mat(model, name, rgb)
    m = model.materials[name] || model.materials.add(name)
    m.color = Sketchup::Color.new(*rgb)
    m
  end

  # ---------- HOP CHU NHAT ----------
  def box(ents, name, x, y, z, dx, dy, dz, material)
    g = ents.add_group
    g.name = name
    e = g.entities

    pts = [
      [x, y, z], [x + dx, y, z],
      [x + dx, y + dy, z], [x, y + dy, z]
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

  # ---------- HOP DEN BO GOC ----------
  # Mat truoc nam tren mat phang XZ, truc chieu sau la Y.
  def rounded_panel(ents, name, cx, cy, cz,
                    width, height, depth, radius,
                    face_mat, side_mat)

    g = ents.add_group
    g.name = name
    e = g.entities

    hw = width / 2.0
    hh = height / 2.0
    r = [[radius, hw - 1.mm, hh - 1.mm].min, 1.mm].max
    seg = 12

    # Tao duong bao bo goc trong mat phang XZ
    corners = [
      [cx + hw - r, cz + hh - r, 0],
      [cx - hw + r, cz + hh - r, 90],
      [cx - hw + r, cz - hh + r, 180],
      [cx + hw - r, cz - hh + r, 270]
    ]

    # Goc phan tu duoc tao theo thu tu quanh chu vi
    points = []
    [
      [cx + hw - r, cz + hh - r, 0, 90],
      [cx - hw + r, cz + hh - r, 90, 180],
      [cx - hw + r, cz - hh + r, 180, 270],
      [cx + hw - r, cz - hh + r, 270, 360]
    ].each do |ox, oz, a0, a1|
      (0..seg).each do |i|
        a = (a0 + (a1 - a0) * i.to_f / seg) * Math::PI / 180
        points << Geom::Point3d.new(
          ox + r * Math.cos(a),
          cy,
          oz + r * Math.sin(a)
        )
      end
    end

    face = e.add_face(points)
    return g unless face

    # Huong extrude ve phia sau
    face.reverse! if face.normal.y > 0
    face.pushpull(depth)

    # Gan vat lieu mat truoc va mat ben
    e.grep(Sketchup::Face).each do |f|
      center_y = f.bounds.center.y
      if (center_y - cy).abs < 0.01
        f.material = face_mat
        f.back_material = face_mat
      else
        f.material = side_mat
        f.back_material = side_mat
      end
    end

    g
  end

  # ---------- THANH THEP HOP ----------
  def steel_bar(ents, name, p1, p2, size, material)
    a = Geom::Point3d.new(*p1)
    b = Geom::Point3d.new(*p2)
    v = b - a
    return if v.length < 0.1

    axis = v.normalize
    ref = axis.parallel?(Z_AXIS) ? X_AXIS : Z_AXIS
    u = axis.cross(ref).normalize
    w = axis.cross(u).normalize

    s = size / 2.0

    pts = [
      a.offset(u, -s).offset(w, -s),
      a.offset(u,  s).offset(w, -s),
      a.offset(u,  s).offset(w,  s),
      a.offset(u, -s).offset(w,  s)
    ]

    g = ents.add_group
    g.name = name
    f = g.entities.add_face(pts)

    if f
      f.reverse! if f.normal.dot(axis) < 0
      f.pushpull(v.length)
      g.entities.grep(Sketchup::Face).each do |face|
        face.material = material
        face.back_material = material
      end
    end

    g
  end

  # ---------- VIEN NHOM BAO QUANH MAT DEN ----------
  def aluminum_frame(ents, name, cx, cy, cz,
                     width, height, radius, tube_size, material)

    g = ents.add_group
    g.name = name
    e = g.entities

    hw = width / 2.0
    hh = height / 2.0
    r = radius
    n = 16
    pts = []

    [
      [cx + hw - r, cz + hh - r, 0, 90],
      [cx - hw + r, cz + hh - r, 90, 180],
      [cx - hw + r, cz - hh + r, 180, 270],
      [cx + hw - r, cz - hh + r, 270, 360]
    ].each do |ox, oz, a0, a1|
      (0..n).each do |i|
        a = (a0 + (a1-a0)*i.to_f/n) * Math::PI / 180
        pts << Geom::Point3d.new(
          ox + r*Math.cos(a), cy,
          oz + r*Math.sin(a)
        )
      end
    end

    # Ve duong vien tren mat truoc
    pts.each_with_index do |p, i|
      e.add_line(p, pts[(i+1) % pts.length])
    end

    # Tao vien day bang cac doan thanh nho
    pts.each_with_index do |p, i|
      q = pts[(i+1) % pts.length]
      v = q - p
      next if v.length < 0.1

      # Thanh profile vuong nho, bo tri theo chu vi
      axis = v.normalize
      ref = Z_AXIS
      ref = X_AXIS if axis.parallel?(ref)
      u = axis.cross(ref).normalize
      w = axis.cross(u).normalize
      s = tube_size / 2.0

      corners = [
        p.offset(u,-s).offset(w,-s),
        p.offset(u, s).offset(w,-s),
        p.offset(u, s).offset(w, s),
        p.offset(u,-s).offset(w, s)
      ]

      bar = e.add_group
      f = bar.entities.add_face(corners)
      if f
        f.reverse! if f.normal.dot(axis) < 0
        f.pushpull(v.length)
        bar.entities.grep(Sketchup::Face).each do |ff|
          ff.material = material
          ff.back_material = material
        end
      end
    end

    g
  end

  # ---------- CHAY DUNG MO HINH ----------
  def build
    model = Sketchup.active_model
    model.start_operation('ADMAKE - Cum hop den mica', true)

    white = mat(model, 'Mica trang sua', [246, 247, 245])
    silver = mat(model, 'Nhom anod bac', [175, 181, 184])
    steel = mat(model, 'Thep hop xam', [85, 91, 94])
    dark = mat(model, 'Than hop den', [55, 59, 61])

    root = model.active_entities.add_group
    root.name = 'CUM HOP DEN MICA - ADMAKE'
    e = root.entities

    # ===== THONG SO CO THE DIEU CHINH =====
    panel_w = 800.mm
    panel_h = 800.mm
    panel_depth = 100.mm
    corner_r = 100.mm
    frame_t = 18.mm

    panel_count = 5
    spacing = 150.mm

    stand_w = 500.mm
    stand_d = 700.mm
    stand_h = 850.mm
    foot_h = 40.mm
    steel_size = 40.mm

    # ===== CHAN DE =====
    z0 = 0

    # Khung de chu nhat
    steel_bar(e, 'De truoc trai',
      [-stand_w/2, -stand_d/2, z0],
      [-stand_w/2, stand_d/2, z0], steel_size, steel)

    steel_bar(e, 'De truoc phai',
      [stand_w/2, -stand_d/2, z0],
      [stand_w/2, stand_d/2, z0], steel_size, steel)

    steel_bar(e, 'De ngang truoc',
      [-stand_w/2, -stand_d/2, z0],
      [stand_w/2, -stand_d/2, z0], steel_size, steel)

    steel_bar(e, 'De ngang sau',
      [-stand_w/2, stand_d/2, z0],
      [stand_w/2, stand_d/2, z0], steel_size, steel)

    # Ban de sat
    box(e, 'Ban de sat',
      -stand_w/2, -stand_d/2, -foot_h,
      stand_w, stand_d, foot_h, silver)

    # Hai tru dung
    support_z = stand_h
    [-stand_w/4, stand_w/4].each_with_index do |x, i|
      steel_bar(e, "Tru dung #{i+1}",
        [x, 0, 0],
        [x, 0, support_z], steel_size, steel)
    end

    # Thanh ngang giua hai tru
    steel_bar(e, 'Thanh ngang tren',
      [-stand_w/4, 0, support_z],
      [stand_w/4, 0, support_z], steel_size, steel)

    # Thanh giang cheo
    steel_bar(e, 'Giang cheo trai',
      [-stand_w/4, 0, 180.mm],
      [0, 0, 450.mm], 25.mm, steel)

    steel_bar(e, 'Giang cheo phai',
      [0, 0, 450.mm],
      [stand_w/4, 0, 180.mm], 25.mm, steel)

    # ===== CAC HOP DEN XEP LOP =====
    panel_bottom = support_z + 100.mm
    panel_center_z = panel_bottom + panel_h/2.0

    panel_count.times do |i|
      # Mat truoc huong ve Y am
      cy = i * spacing

      panel = rounded_panel(
        e, "Hop den mica #{i+1}",
        0, cy, panel_center_z,
        panel_w, panel_h, panel_depth,
        corner_r, white, dark
      )

      # Vien nhom phia truoc
      aluminum_frame(
        e, "Vien nhom hop #{i+1}",
        0, cy - 2.mm, panel_center_z,
        panel_w + 10.mm, panel_h + 10.mm,
        corner_r + 5.mm, frame_t, silver
      )
    end

    model.commit_operation
    model.active_view.zoom_extents
    UI.messagebox(
      "Da tao cum hop den 3D.\n" \
      "So luong: #{panel_count}\n" \
      "Kich thuoc mat: #{panel_w.to_mm.round} x " \
      "#{panel_h.to_mm.round} mm\n" \
      "Chieu day: #{panel_depth.to_mm.round} mm"
    )
  rescue => err
    model.abort_operation
    UI.messagebox("Loi Ruby: #{err.message}\n#{err.backtrace.first}")
  end
end

ADMAKE_Lightbox.build