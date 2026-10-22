# encoding: UTF-8
# ============================================================
# NHA KHE SIGN - SKETCHUP RUBY 3D
# SketchUp Ruby API | Units: mm
# ============================================================

module NhaKheSign
  extend self

  # ----------------------------------------------------------
  # 1. CONFIGURATION
  # ----------------------------------------------------------
  WIDTH       = 4000.mm
  PANEL_H     = 650.mm
  PANEL_D     = 100.mm
  PANEL_Z     = 650.mm

  FRAME       = 30.mm
  SLAT_W      = 65.mm
  SLAT_GAP    = 5.mm

  TOP_TEXT    = "NHÀ KHÉ"
  BOTTOM_TEXT = "BÒ NẤM NƯỚNG SỐT"

  TOP_H       = 390.mm
  BOTTOM_H    = 190.mm
  LETTER_D    = 32.mm
  OUTLINE_D   = 42.mm

  POST_W      = 70.mm
  POST_D      = 60.mm
  POST_H      = 1450.mm
  BASE_W      = 220.mm
  BASE_D      = 180.mm
  BASE_T      = 12.mm

  # ----------------------------------------------------------
  # 2. MATERIALS
  # ----------------------------------------------------------
  def mat(model, name, rgb)
    m = model.materials[name] || model.materials.add(name)
    m.color = Sketchup::Color.new(*rgb)
    m
  end

  def materials(model)
    {
      black:  mat(model, "NK | Black steel",       [22, 22, 25]),
      steel:  mat(model, "NK | Galvanized steel",  [135, 142, 146]),
      wood1:  mat(model, "NK | Dark walnut",       [48, 26, 17]),
      wood2:  mat(model, "NK | Walnut",            [83, 43, 24]),
      wood3:  mat(model, "NK | Light walnut",      [108, 61, 34]),
      yellow: mat(model, "NK | Yellow LED face",   [255, 218, 0]),
      white:  mat(model, "NK | White LED face",    [255, 250, 238]),
      warm:   mat(model, "NK | Warm diffuser",     [255, 225, 150]),
      base:   mat(model, "NK | Base plate",        [45, 47, 50])
    }
  end

  # ----------------------------------------------------------
  # 3. SOLID BOX
  # ----------------------------------------------------------
  def box(entities, name, x, y, z, dx, dy, dz, material)
    g = entities.add_group
    g.name = name
    e = g.entities

    p1 = [x,      y,      z]
    p2 = [x + dx, y,      z]
    p3 = [x + dx, y + dy, z]
    p4 = [x,      y + dy, z]

    face = e.add_face(p1, p2, p3, p4)
    if face
      face.reverse! if face.normal.z < 0
      face.pushpull(dz)

      e.grep(Sketchup::Face).each do |f|
        f.material = material
        f.back_material = material
      end
    end

    g
  end

  # ----------------------------------------------------------
  # 4. CYLINDER
  # ----------------------------------------------------------
  def cylinder(entities, name, x, y, z, radius, height, material)
    g = entities.add_group
    g.name = name
    e = g.entities

    circle = e.add_circle(
      Geom::Point3d.new(x, y, z),
      Geom::Vector3d.new(0, 0, 1),
      radius,
      16
    )

    face = e.add_face(circle)
    if face
      face.reverse! if face.normal.z < 0
      face.pushpull(height)
      e.grep(Sketchup::Face).each do |f|
        f.material = material
        f.back_material = material
      end
    end

    g
  end

  # ----------------------------------------------------------
  # 5. 3D TEXT
  #
  # Local text is generated on XY, then rotated 90 degrees
  # about X so its front faces toward negative Y.
  # ----------------------------------------------------------
  def text3d(parent, label, height, depth, baseline, material, name)
    g = parent.add_group
    g.name = name

    begin
      g.entities.add_3d_text(
        label,
        TextAlignCenter,
        "Arial",
        true,       # bold
        false,      # italic
        height,
        0.5.mm,     # tolerance
        0,          # Z offset
        true,       # filled
        depth
      )
    rescue => error
      puts "Cannot create text '#{label}': #{error.message}"
      g.erase!
      return nil
    end

    rotation = Geom::Transformation.rotation(
      ORIGIN,
      X_AXIS,
      90.degrees
    )
    g.transform!(rotation)

    # Center the actual generated text.
    bounds = g.bounds
    cx = (bounds.min.x + bounds.max.x) / 2.0
    min_z = bounds.min.z

    translation = Geom::Transformation.translation(
      Geom::Vector3d.new(-cx, -35.mm, baseline - min_z)
    )
    g.transform!(translation)

    g.entities.grep(Sketchup::Face).each do |f|
      f.material = material
      f.back_material = material
    end

    g
  end

  # ----------------------------------------------------------
  # 6. CHANNEL LETTERS
  # ----------------------------------------------------------
  def channel_text(parent, label, height, baseline, face_material,
                   dark_material, prefix)

    # Dark backing/body, thicker than the illuminated face.
    text3d(
      parent, label, height, OUTLINE_D,
      baseline, dark_material,
      "#{prefix} | Black backing"
    )

    # Colored front face.
    text3d(
      parent, label, height, LETTER_D,
      baseline, face_material,
      "#{prefix} | Front face"
    )
  end

  # ----------------------------------------------------------
  # 7. MAIN SIGN PANEL
  # ----------------------------------------------------------
  def build_panel(parent, m)
    g = parent.add_group
    g.name = "01 | PANEL AND WOOD SLATS"
    e = g.entities

    x0 = -WIDTH / 2.0
    z0 = PANEL_Z

    # Main panel body.
    box(
      e, "Main black backing",
      x0, 0, z0,
      WIDTH, PANEL_D, PANEL_H,
      m[:black]
    )

    # Vertical decorative wood slats on the front.
    x = x0
    i = 0
    pitch = SLAT_W + SLAT_GAP

    while x < WIDTH / 2.0
      w = [SLAT_W, WIDTH / 2.0 - x].min
      wood = [m[:wood1], m[:wood2], m[:wood3]][i % 3]

      box(
        e, "Wood slat %02d" % (i + 1),
        x, -8.mm, z0 + 8.mm,
        w, 8.mm, PANEL_H - 16.mm,
        wood
      )

      x += pitch
      i += 1
    end

    # Outer rectangular metal frame.
    box(
      e, "Top frame",
      x0 - FRAME, -20.mm, z0 + PANEL_H,
      WIDTH + 2 * FRAME, 30.mm, FRAME,
      m[:steel]
    )

    box(
      e, "Bottom frame",
      x0 - FRAME, -20.mm, z0 - FRAME,
      WIDTH + 2 * FRAME, 30.mm, FRAME,
      m[:steel]
    )

    box(
      e, "Left frame",
      x0 - FRAME, -20.mm, z0,
      FRAME, 30.mm, PANEL_H,
      m[:steel]
    )

    box(
      e, "Right frame",
      WIDTH / 2.0, -20.mm, z0,
      FRAME, 30.mm, PANEL_H,
      m[:steel]
    )

    # Rear horizontal reinforcement.
    box(
      e, "Rear upper reinforcement",
      x0, PANEL_D, z0 + PANEL_H - 65.mm,
      WIDTH