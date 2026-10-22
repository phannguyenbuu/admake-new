module BanhBaoTuoi3D
  extend self

  # ---------------- PARAMETERS ----------------
  W = 6000.mm
  H = 1200.mm
  D = 100.mm

  PANEL_BOTTOM = 2800.mm
  RAIL_H = 35.mm
  RIB_COUNT = 72

  def material(model, name, rgb)
    mats = model.materials
    m = mats[name] || mats.add(name)
    m.color = Sketchup::Color.new(*rgb)
    m
  end

  def box(entities, name, x, y, z, w, d, h, mat)
    g = entities.add_group
    g.name = name
    pts = [
      [x,y,z], [x+w,y,z], [x+w,y+d,z], [x,y+d,z]
    ].map { |p| Geom::Point3d.new(*p) }

    face = g.entities.add_face(pts)
    face.reverse! if face.normal.y < 0
    face.pushpull(h)

    g.material = mat
    g.entities.grep(Sketchup::Face).each do |f|
      f.material = mat
      f.back_material = mat
    end
    g
  end

  def beam_between(entities, name, p1, p2, width, depth, mat)
    a = Geom::Point3d.new(*p1)
    b = Geom::Point3d.new(*p2)
    v = b - a
    length = v.length
    return if length < 0.1

    g = entities.add_group
    g.name = name
    pts = [
      [0,0,0], [width,0,0],
      [width,depth,0], [0,depth,0]
    ].map { |p| Geom::Point3d.new(*p) }

    f = g.entities.add_face(pts)
    f.pushpull(length)
    g.material = mat
    g.entities.grep(Sketchup::Face).each do |face|
      face.material = mat
      face.back_material = mat
    end

    tr = Geom::Transformation.new(
      Geom::Point3d.new(*p1),
      Geom::Vector3d.new(0,0,1),
      Geom::Vector3d.new(1,0,0),
      v
    )
    # Stable alternative: align local Z to beam direction
    tr = Geom::Transformation.new(a) *
         Geom::Transformation.rotation(
           ORIGIN, X_AXIS, 0
         )
    direction = v.normalize
    rotation_axis = Z_AXIS.cross(direction)
    if rotation_axis.length > 0.0001
      angle = Z_AXIS.angle_between(direction)
      tr = Geom::Transformation.new(a) *
           Geom::Transformation.rotation(ORIGIN, rotation_axis, angle)
    end
    g.transform!(tr)
    g
  end

  def raised_text(entities, text, name, x, z, height,
                  face_mat, font = 'Arial',
                  bold = true, italic = false,
                  extrusion = 12.mm)
    g = entities.add_group
    g.name = name

    ok = g.entities.add_3d_text(
      text,
      TextAlignCenter = 1,
      font,
      bold,
      italic,
      height,
      0.5.mm,
      0,
      true,
      extrusion
    )

    unless ok
      puts "Không tạo được chữ: #{text}"
      g.erase!
      return nil
    end

    # 3D text is generated in XY; rotate it onto the XZ sign.
    rot = Geom::Transformation.rotation(
      ORIGIN, X_AXIS, 90.degrees
    )
    g.transform!(rot)

    bb = g.bounds
    tr = Geom::Transformation.translation(
      [x - bb.center.x, -8.mm - bb.min.y, z - bb.center.z]
    )
    g.transform!(tr)

    g.material = face_mat
    g.entities.grep(Sketchup::Face).each do |f|
      f.material = face_mat
      f.back_material = face_mat
    end
    g
  end

  def build
    model = Sketchup.active_model
    model.start_operation('Dung bien Banh Bao Tuoi 3D', true)

    begin
      root = model.active_entities.add_group
      root.name = 'BIEN HIEU BANH BAO TUOI'
      e = root.entities

      orange = material(model, 'Son vang cam', [255,155,0])
      orange_dark = material(model, 'Cam dam', [210,91,0])
      white = material(model, 'Ton trang', [242,240,226])
      cream = material(model, 'Nen kem', [255,226,151])
      steel = material(model, 'Khung sat', [65,65,65])
      shadow = material(model, 'Vien chu nau', [67,38,20])
      black = material(model, 'Mat sau den', [35,35,35])

      # 1. Main sign body
      box(e, 'Mat sau bien', 0, 0, 0, W, D, H, black)
      box(e, 'Mat bien vang cam', 20.mm, -2.mm,
          20.mm, W-40.mm, 8.mm, H-40.mm, orange)

      # 2. Perimeter frame
      frame = 35.mm
      box(e, 'Nep tren', 0, 0, H-frame, W, 30.mm, frame, orange_dark)
      box(e, 'Nep duoi', 0, 0, 0, W, 30.mm, frame, orange_dark)
      box(e, 'Nep trai', 0, 0, 0, frame, 30.mm, H, orange_dark)
      box(e, 'Nep phai', W-frame, 0, 0, frame, 30.mm, H, orange_dark)

      # 3. White vertically ribbed backing panel
      panel_x = 220.mm
      panel_z = 280.mm
      panel_w = W - 440.mm
      panel_h = 610.mm

      box(e, 'Nen ton song trang',
          panel_x, -12.mm, panel_z,
          panel_w, 12.mm, panel_h, white)

      rib_spacing = panel_w.to_f / RIB_COUNT
      RIB_COUNT.times do |i|
        x = panel_x + i * rib_spacing
        # Narrow raised strips imitate corrugated sheet
        box(e, "Gan ton #{i+1}",
            x, -15.mm, panel_z,
            2.mm, 3.mm, panel_h, cream)
      end

      # 4. Main lettering: raised orange letters
      # Adjust text height and positions for local fonts.
      raised_text(
        e, 'BÁNH BAO TƯƠI',
        'Chu Banh Bao Tuoi',
        W/2, 790.mm, 310.mm,
        orange, 'Arial', true, false, 18.mm
      )

      raised_text(
        e, 'Ăn Ngon Sống Khỏe',
        'Slogan An Ngon Song Khoe',
        W/2, 455.mm, 145.mm,
        orange_dark, 'Arial', true, false, 10.mm
      )

      # 5. Bottom decorative horizontal rails
      box(e, 'Nep ngang tren',
          100.mm, -18.mm, 255.mm,
          W-200.mm, 10.mm, 12.mm, orange_dark)

      box(e, 'Nep ngang duoi',
          100.mm, -18.mm, 225.mm,
          W-200.mm, 10.mm, 10.mm, orange)

      # 6. Supporting brackets behind sign
      support_y = 75.mm
      [350.mm, W-390.mm].each_with_index do |x, i|
        box(e, "Tru gia cuong #{i+1}",
            x, support_y, -180.mm,
            40.mm, 45.mm, H+360.mm, steel)
      end

      # 7. Lower fascia


  end
end
end
BanhBaoTuoi3D.build rescue nil
