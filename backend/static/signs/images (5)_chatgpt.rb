# frozen_string_literal: true
# ================================================================
# STOREFRONT SIGNBOARD - SKETCHUP RUBY
# Bien hieu hop gan tuong theo hinh anh tham chieu.
#
# THANH PHAN:
# 01. Mang tuong gia lap va gia do gan tuong
# 02. Khung hop thep ben trong
# 03. Vo bien va mat pano mau do hong
# 04. Vien nep trang phat sang
# 05. Chu noi 3D "SignBoard Storefront Mockup"
# 06. Ba nhan trang tri PSD / DESIGNED / MOCKUP
# 07. Tam op hong phia sau
# 08. Bu long va pat lien ket
#
# Don vi: met
# Truc X: ngang bien
# Truc Y: chieu sau (am Y huong mat bien)
# Truc Z: chieu cao
#
# Cach chay:
# load 'C:/duong_dan/storefront_signboard.rb'
# ================================================================

require 'sketchup.rb'

module StorefrontSignboard
  extend self

  # --------------------------------------------------------------
  # THONG SO CHINH
  # --------------------------------------------------------------

  WIDTH       = 1.85
  HEIGHT      = 1.15
  DEPTH       = 0.16
  CENTER_Z    = 3.25

  FRAME       = 0.035
  FACE_THICK  = 0.018
  BORDER      = 0.025

  CREATE_TEXT       = true
  CREATE_WALL       = true
  CREATE_MOUNTING   = true
  CREATE_BACK_PLATE = true

  # --------------------------------------------------------------
  # DON VI
  # --------------------------------------------------------------

  def m(value)
    value.to_f * 39.37007874015748
  end

  def pt(x, y, z)
    Geom::Point3d.new(m(x), m(y), m(z))
  end

  def v(x, y, z)
    Geom::Vector3d.new(x, y, z)
  end

  def group(parent, name)
    result = parent.add_group
    result.name = name
    result
  end

  # --------------------------------------------------------------
  # VAT LIEU
  # --------------------------------------------------------------

  def material(name, rgb, alpha = 1.0)
    materials = Sketchup.active_model.materials
    mat = materials[name] || materials.add(name)
    mat.color = Sketchup::Color.new(*rgb)
    mat.alpha = alpha
    mat
  end

  def setup_materials
    @wall_mat = material('Storefront - Warm Brick', [155, 91, 68])
    @mortar_mat = material('Storefront - Mortar', [206, 181, 164])
    @black = material('Sign - Black Cabinet', [30, 29, 31])
    @black_edge = material('Sign - Rear Dark Steel', [18, 18, 20])
    @red = material('Sign - Coral Red Face', [250, 83, 91])
    @red_side = material('Sign - Coral Side', [222, 63, 73])
    @white = material('Sign - White Trim', [245, 238, 235])
    @text_white = material('Sign - White Lettering', [255, 255, 255])
    @steel = material('Mount - Galvanized Steel', [150, 153, 157])
    @steel_dark = material('Mount - Dark Steel', [65, 67, 71])
    @glow = material('Sign - LED Glow', [255, 175, 178])
    @tag_mat = material('Sign - White Labels', [255, 250, 248])
    @tag_text = material('Sign - Label Text', [185, 94, 99])
  end

  # --------------------------------------------------------------
  # KHOI HOP
  # --------------------------------------------------------------

  def box(entities, x, y, z, width, depth, height, mat)
    return nil if width <= 0 || depth <= 0 || height <= 0

    points = [
      pt(x, y, z),
      pt(x + width, y, z),
      pt(x + width, y + depth, z),
      pt(x, y + depth, z)
    ]

    face = entities.add_face(points)
    return nil unless face && face.valid?

    face.material = mat
    face.back_material = mat
    face.reverse! if face.normal.z < 0
    face.pushpull(m(height))
    face
  end

  # --------------------------------------------------------------
  # THANH THEP NOI HAI DIEM
  # --------------------------------------------------------------

  def beam(entities, a, b, size, mat)
    direction = b - a
    length = direction.length
    return nil if length < 0.001

    direction.normalize!
    ref = v(0, 0, 1)
    ref = v(0, 1, 0) if direction.parallel?(ref)

    u = direction.cross(ref)
    u.normalize!
    w = direction.cross(u)
    w.normalize!

    half = m(size) / 2.0

    corners = [
      a.offset(u, half).offset(w, half),
      a.offset(u, -half).offset(w, half),
      a.offset(u, -half).offset(w, -half),
      a.offset(u, half).offset(w, -half)
    ]

    face = entities.add_face(corners)
    return nil unless face && face.valid?

    face.material = mat
    face.back_material = mat
    face.pushpull(length)
    face
  end

  # --------------------------------------------------------------
  # TRU TRON / BU LONG
  # --------------------------------------------------------------

  def cylinder(entities, x, y, z, radius, height, mat, segments = 20)
    edges = entities.add_circle(
      pt(x, y, z),
      v(0, 0, 1),
      m(radius),
      segments
    )

    face = entities.add_face(edges)
    return nil unless face && face.valid?

    face.material = mat
    face.back_material = mat
    face.pushpull(m(height))
    face
  end

  # --------------------------------------------------------------
  # TAM TUONG GIA LAP
  # --------------------------------------------------------------

  def build_wall(parent)
    g = group(parent, '00 - Wall Reference')
    e = g.entities

    box(
      e,
      -1.65, 0.20, CENTER_Z - 1.65,
      3.30, 0.12, 3.30,
      @wall_mat
    )

    # Cac duong mach gach ngang
    z_start = CENTER_Z - 1.60
    0.upto(10) do |i|
      z = z_start + i * 0.30
      beam(
        e,
        pt(-1.65, 0.065, z),
        pt(1.65, 0.065, z),
        0.008,
        @mortar_mat
      )
    end

    # Mach gach doc so le
    0.upto(10) do |row|
      z = z_start + row * 0.30
      offset = row.even? ? 0.0 : 0.22

      x = -1.65 + offset
      while x < 1.65
        beam(
          e,
          pt(x, 0.065, z),
          pt(x, 0.065, z + 0.30),
          0.008,
          @mortar_mat
        )
        x += 0.44
      end
    end

    g
  end

  # --------------------------------------------------------------
  # VO BIEN QUANG CAO
  # --------------------------------------------------------------

  def build_cabinet(parent)
    g = group(parent, '01 - Sign Cabinet')
    e = g.entities

    x = -WIDTH / 2.0
    z = CENTER_Z - HEIGHT / 2.0

    # Vo hop den
    box(
      e,
      x, -DEPTH, z,
      WIDTH, DEPTH, HEIGHT,
      @black
    )

    # Mat truoc pano
    box(
      e,
      x + 0.045, -DEPTH - FACE_THICK, z + 0.045,
      WIDTH - 0.09, FACE_THICK, HEIGHT - 0.09,
      @red
    )

    # Vien trang quanh mat truoc
    front_y = -DEPTH - FACE_THICK - 0.002

    box(
      e,
      x, front_y, z,
      WIDTH, 0.012, BORDER,
      @white
    )

    box(
      e,
      x, front_y, z + HEIGHT - BORDER,
      WIDTH, 0.012, BORDER,
      @white
    )

    box(
      e,
      x, front_y, z,
      BORDER, 0.012, HEIGHT,
      @white
    )

    box(
      e,
      x + WIDTH - BORDER, front_y, z,
      BORDER, 0.012, HEIGHT,
      @white
    )

    # Vien do phia trong tao hieu ung hai lop
    inner = 0.045
    red_border = 0.012

    box(
      e,
      x + inner, front_y - 0.001, z + inner,
      WIDTH - inner * 2, 0.006, red_border,
      @red_side
    )

    box(
      e,
      x + inner, front_y - 0.001, z + HEIGHT - inner - red_border,
      WIDTH - inner * 2, 0.006, red_border,
      @red_side
    )

    box(
      e,
      x + inner, front_y - 0.001, z + inner,
      red_border, 0.006, HEIGHT - inner * 2,
      @red_side
    )

    box(
      e,
      x + WIDTH - inner - red_border, front_y - 0.001, z + inner,
      red_border, 0.006, HEIGHT - inner * 2,
      @red_side
    )

    g
  end

  # --------------------------------------------------------------
  # KHUNG XUONG THEP
  # --------------------------------------------------------------

  def build_frame(parent)
    g = group(parent, '02 - Internal Steel Frame')
    e = g.entities

    x1 = -WIDTH / 2.0 + 0.045
    x2 = WIDTH / 2.0 - 0.045
    y = -DEPTH + 0.035
    z1 = CENTER_Z - HEIGHT / 2.0 + 0.045
    z2 = CENTER_Z + HEIGHT / 2.0 - 0.045

    beam(e, pt(x1, y, z1), pt(x2, y, z1), FRAME, @steel_dark)
    beam(e, pt(x1, y, z2), pt(x2, y, z2), FRAME, @steel_dark)
    beam(e, pt(x1, y, z1), pt(x1, y, z2), FRAME, @steel_dark)
    beam(e, pt(x2, y, z1), pt(x2, y, z2), FRAME, @steel_dark)

    # Thanh dung gia cuong
    [-0.55, 0.0, 0.55].each do |x|
      beam(
        e,
        pt(x, y, z1),
        pt(x, y, z2),
        0.018,
        @steel_dark
      )
    end

    # Thanh ngang
    [0.25, 0.50, 0.75].each do |offset|
      z = z1 + offset
      next if z >= z2

      beam(
        e,
        pt(x1, y, z),
        pt(x2, y, z),
        0.015,
        @steel
      )
    end

    g
  end

  # --------------------------------------------------------------
  # PAT GAN TUONG
  # --------------------------------------------------------------

  def build_mounting(parent)
    g = group(parent, '03 - Wall Mounting Brackets')
    e = g.entities

    z_top = CENTER_Z + HEIGHT / 2.0 - 0.12
    z_bottom = CENTER_Z - HEIGHT / 2.0 + 0.12

    [-0.78, 0.78].each do |x|
      [z_bottom, z_top].each do |z|
        # Pat gan tuong
        box(
          e,
          x - 0.045, 0.04, z - 0.05,
          0.09, 0.13, 0.10,
          @steel_dark
        )

        # Tay do vuong goc
        beam(
          e,
          pt(x, 0.12, z),
          pt(x, -0.20, z),
          0.035,
          @steel
        )

        # Thanh lien ket vao than bien
        beam(
          e,
          pt(x, -0.20, z),
          pt(x, -DEPTH + 0.02, z),
          0.035,
          @steel_dark
        )

        # Bu long
        cylinder(
          e,
          x, 0.035, z,
          0.012, 0.012,
          @steel,
          16
        )
      end
    end

    g
  end

  # --------------------------------------------------------------
  # TAM OP PHIA SAU
  # --------------------------------------------------------------

  def build_back_plate(parent)
    g = group(parent, '04 - Rear Mounting Plate')
    e = g.entities

    box(
      e,
      -WIDTH / 2.0 + 0.06,
      DEPTH * 0.30,
      CENTER_Z - HEIGHT / 2.0 + 0.06,
      WIDTH - 0.12,
      0.025,
      HEIGHT - 0.12,
      @black_edge
    )

    g
  end

  # --------------------------------------------------------------
  # CHU NOI 3D
  # --------------------------------------------------------------

  def add_3d_text(parent, name, text, center_x, center_z,
                  text_height, thickness, mat, font = 'Arial',
                  bold = false)
    g = group(parent, name)

    begin
      g.entities.add_3d_text(
        text,
        TextAlignCenter,
        font,
        bold,
        false,
        m(text_height),
        0.0,
        0.0,
        true,
        m(thickness)
      )

      # Chu tao tren mat phang XY, sau do xoay de huong ra phia truoc.
      g.transform!(
        Geom::Transformation.rotation(
          ORIGIN,
          X_AXIS,
          90.degrees
        )
      )

      g.entities.each do |entity|
        next unless entity.respond_to?(:material=)

        entity.material = mat
        entity.back_material = mat if entity.respond_to?(:back_material=)
      end

      bounds = g.bounds

      target_x = m(center_x)
      target_y = -m(DEPTH + FACE_THICK + 0.020)
      target_z = m(center_z)

      translation = Geom::Vector3d.new(
        target_x - (bounds.min.x + bounds.max.x) / 2.0,
        target_y - bounds.min.y,
        target_z - (bounds.min.z + bounds.max.z) / 2.0
      )

      g.transform!(Geom::Transformation.translation(translation))

    rescue StandardError => error
      puts "Text creation failed: #{text} - #{error.message}"
    end

    g
  end

  # --------------------------------------------------------------
  # NHAN TRANG TRI
  # --------------------------------------------------------------

  def add_capsule_tag(parent, center_x, center_z, width, label)
    g = group(parent, "Tag - #{label}")
    e = g.entities

    tag_height = 0.075
    front_y = -DEPTH - FACE_THICK - 0.025

    box(
      e,
      center_x - width / 2.0,
      front_y,
      center_z - tag_height / 2.0,
      width,
      0.008,
      tag_height,
      @tag_mat
    )

    add_3d_text(
      g,
      "Tag Text - #{label}",
      label,
      center_x,
      center_z,
      0.026,
      0.003,
      @tag_text,
      'Arial',
      false
    )

    g
  end

  # --------------------------------------------------------------
  # NOI DUNG CHU
  # --------------------------------------------------------------

  def build_lettering(parent)
    g = group(parent, '05 - Raised White Sign Typography')

    text_center_z = CENTER_Z + 0.14

    add_3d_text(
      g,
      'Title - SignBoard',
      'SignBoard',
      0.0,
      text_center_z + 0.17,
      0.145,
      0.009,
      @text_white,
      'Arial',
      false
    )

    add_3d_text(
      g,
      'Title - Storefront',
      'Storefront',
      0.0,
      text_center_z + 0.025,
      0.145,
      0.009,
      @text_white,
      'Arial',
      false
    )

    add_3d_text(
      g,
      'Title - Mockup',
      'Mockup',
      0.0,
      text_center_z - 0.12,
      0.145,
      0.009,
      @text_white,
      'Arial',
      false
    )

    tag_z = text_center_z - 0.29

    add_capsule_tag(g, -0.28, tag_z, 0.17, 'PSD')
    add_capsule_tag(g, 0.00, tag_z, 0.27, 'DESIGNED')
    add_capsule_tag(g, 0.30, tag_z, 0.23, 'MOCKUP')

    g
  end

  # --------------------------------------------------------------
  # VIEN LED PHAT SANG
  # --------------------------------------------------------------

  def build_led_trim(parent)
    g = group(parent, '06 - LED Border Accent')
    e = g.entities

    x1 = -WIDTH / 2.0 + 0.022
    x2 = WIDTH / 2.0 - 0.022
    z1 = CENTER_Z - HEIGHT / 2.0 + 0.022
    z2 = CENTER_Z + HEIGHT / 2.0 - 0.022
    y = -DEPTH - FACE_THICK - 0.004

    beam(e, pt(x1, y, z1), pt(x2, y, z1), 0.007, @glow)
    beam(e, pt(x1, y, z2), pt(x2, y, z2), 0.007, @glow)
    beam(e, pt(x1, y, z1), pt(x1, y, z2), 0.007, @glow)
    beam(e, pt(x2, y, z1), pt(x2, y, z2), 0.007, @glow)

    g
  end

  # --------------------------------------------------------------
  # CAMERA
  # --------------------------------------------------------------

  def set_camera
    model = Sketchup.active_model
    view = model.active_view

    eye = pt(2.6, -4.4, CENTER_Z + 1.0)
    target = pt(0, 0, CENTER_Z)

    camera = Sketchup::Camera.new(
      eye,
      target,
      v(0, 0, 1)
    )

    camera.perspective = true
    view.camera = camera
    view.zoom_extents
    view.invalidate
  end

  # --------------------------------------------------------------
  # TAO TOAN BO MO HINH
  # --------------------------------------------------------------

  def build
    model = Sketchup.active_model
    model.start_operation('Create Storefront Signboard', true)

    begin
      setup_materials

      root = group(
        model.active_entities,
        'Storefront Signboard - Complete Model'
      )

      build_wall(root) if CREATE_WALL
      build_cabinet(root)
      build_frame(root)
      build_mounting(root) if CREATE_MOUNTING
      build_back_plate(root) if CREATE_BACK_PLATE
      build_led_trim(root)
      build_lettering(root) if CREATE_TEXT

      model.commit_operation
      set_camera

      puts '============================================'
      puts 'STOREFRONT SIGNBOARD CREATED'
      puts "Width: #{WIDTH} m"
      puts "Height: #{HEIGHT} m"
      puts "Depth: #{DEPTH} m"
      puts 'Cabinet, coral face, steel frame, wall brackets,'
      puts 'white trim, 3D lettering and label tags created.'
      puts '============================================'

    rescue StandardError => error
      model.abort_operation
      puts "SIGNBOARD ERROR: #{error.message}"
      puts error.backtrace
    end
  end
end

StorefrontSignboard.build