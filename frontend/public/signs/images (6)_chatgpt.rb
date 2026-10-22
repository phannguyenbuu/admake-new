# frozen_string_literal: true
# ================================================================
# SIGNBOARD MOCKUP - SKETCHUP RUBY
# Bien hieu hop gan tuong theo anh tham chieu.
#
# THANH PHAN:
# 01. Tuong gach trang tri
# 02. Ket cau gia do thep gan tuong
# 03. Than hop bien quang cao
# 04. Khung xuong thep ben trong
# 05. Mat pano mau cam do
# 06. Vien nep kim loai sang mau
# 07. Chu noi 3D "SignBoard Mockup"
# 08. Tam op hong va nep canh
# 09. Bu long va ban ma lien ket
#
# Don vi: met
# Truc X: ngang bien
# Truc Y: chieu sau (am Y huong mat bien)
# Truc Z: chieu cao
#
# Chay trong SketchUp Ruby Console:
# load 'C:/duong_dan/signboard_mockup.rb'
# ================================================================

require 'sketchup.rb'

module SignboardMockup
  extend self

  # --------------------------------------------------------------
  # THONG SO MO HINH
  # --------------------------------------------------------------

  WIDTH = 2.35
  HEIGHT = 0.88
  DEPTH = 0.22
  CENTER_Z = 3.25

  FRAME_SIZE = 0.035
  FACE_THICKNESS = 0.018
  BORDER_SIZE = 0.025

  CREATE_WALL = true
  CREATE_MOUNTING = true
  CREATE_INTERNAL_FRAME = true
  CREATE_LETTERING = true
  CREATE_REAR_PLATE = true

  # --------------------------------------------------------------
  # DON VI VA TOA DO
  # --------------------------------------------------------------

  def m(value)
    value.to_f * 39.37007874015748
  end

  def pt(x, y, z)
    Geom::Point3d.new(m(x), m(y), m(z))
  end

  def vec(x, y, z)
    Geom::Vector3d.new(x, y, z)
  end

  def make_group(parent, name)
    result = parent.add_group
    result.name = name
    result
  end

  # --------------------------------------------------------------
  # VAT LIEU
  # --------------------------------------------------------------

  def make_material(name, rgb, alpha = 1.0)
    materials = Sketchup.active_model.materials
    mat = materials[name] || materials.add(name)
    mat.color = Sketchup::Color.new(*rgb)
    mat.alpha = alpha
    mat
  end

  def setup_materials
    @wall = make_material('Wall - Grey Limestone', [151, 147, 136])
    @mortar = make_material('Wall - Mortar Joints', [90, 88, 82])
    @wall_shadow = make_material('Wall - Recessed Surface', [111, 108, 100])

    @cabinet = make_material('Sign - Dark Burgundy Cabinet', [53, 28, 35])
    @cabinet_side = make_material('Sign - Burgundy Side', [76, 34, 43])
    @frame = make_material('Sign - Dark Steel Frame', [43, 39, 40])

    @orange = make_material('Sign - Coral Orange Face', [246, 91, 54])
    @orange_dark = make_material('Sign - Inner Orange Border', [219, 65, 43])
    @white = make_material('Sign - Ivory White Trim', [245, 235, 213])
    @lettering = make_material('Sign - White Letters', [255, 249, 237])

    @steel = make_material('Mount - Galvanized Steel', [124, 125, 125])
    @steel_dark = make_material('Mount - Dark Steel', [55, 53, 54])
    @bolt = make_material('Mount - Metal Fasteners', [175, 171, 157])
  end

  # --------------------------------------------------------------
  # KHOI HOP
  # --------------------------------------------------------------

  def add_box(entities, x, y, z, width, depth, height, mat)
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
  # THANH HOP THEP NOI HAI DIEM
  # --------------------------------------------------------------

  def add_beam(entities, a, b, size, mat)
    direction = b - a
    length = direction.length
    return nil if length < 0.001

    direction.normalize!

    ref = vec(0, 0, 1)
    ref = vec(0, 1, 0) if direction.parallel?(ref)

    u = direction.cross(ref)
    u.normalize!
    v = direction.cross(u)
    v.normalize!

    half = m(size) / 2.0

    points = [
      a.offset(u, half).offset(v, half),
      a.offset(u, -half).offset(v, half),
      a.offset(u, -half).offset(v, -half),
      a.offset(u, half).offset(v, -half)
    ]

    face = entities.add_face(points)
    return nil unless face && face.valid?

    face.material = mat
    face.back_material = mat
    face.pushpull(length)
    face
  end

  # --------------------------------------------------------------
  # TRU TRON KIM LOAI VA BU LONG
  # --------------------------------------------------------------

  def add_cylinder(entities, x, y, z, radius, height, mat, segments = 20)
    edges = entities.add_circle(
      pt(x, y, z),
      vec(0, 0, 1),
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
  # TUONG GACH THAM KHAO
  # --------------------------------------------------------------

  def build_wall(parent)
    g = make_group(parent, '00 - Architectural Brick Wall')
    e = g.entities

    wall_width = 4.0
    wall_height = 3.4
    wall_depth = 0.24
    wall_z = CENTER_Z - 1.7

    add_box(
      e,
      -wall_width / 2.0,
      0.12,
      wall_z,
      wall_width,
      wall_depth,
      wall_height,
      @wall
    )

    # Tao cac mach ngang tren mat tuong.
    z = wall_z + 0.08
    while z < wall_z + wall_height
      add_beam(
        e,
        pt(-wall_width / 2.0, 0.105, z),
        pt(wall_width / 2.0, 0.105, z),
        0.009,
        @mortar
      )
      z += 0.22
    end

    # Mach doc chia vien gach, so le theo tung hang.
    row = 0
    z = wall_z + 0.08

    while z < wall_z + wall_height
      offset = row.even? ? 0.0 : 0.18
      x = -wall_width / 2.0 + offset

      while x < wall_width / 2.0
        add_beam(
          e,
          pt(x, 0.105, z),
          pt(x, 0.105, z + 0.22),
          0.008,
          @mortar
        )
        x += 0.36
      end

      z += 0.22
      row += 1
    end

    g
  end

  # --------------------------------------------------------------
  # VO HOP BIEN QUANG CAO
  # --------------------------------------------------------------

  def build_cabinet(parent)
    g = make_group(parent, '01 - Sign Cabinet')
    e = g.entities

    x = -WIDTH / 2.0
    z = CENTER_Z - HEIGHT / 2.0

    # Than hop chinh.
    add_box(
      e,
      x,
      -DEPTH,
      z,
      WIDTH,
      DEPTH,
      HEIGHT,
      @cabinet
    )

    # Nep hong ben trai tao chieu sau giong anh.
    add_box(
      e,
      x - 0.025,
      -DEPTH - 0.008,
      z - 0.025,
      0.075,
      DEPTH + 0.016,
      HEIGHT + 0.05,
      @cabinet_side
    )

    # Mat pano cam do.
    add_box(
      e,
      x + 0.055,
      -DEPTH - FACE_THICKNESS,
      z + 0.055,
      WIDTH - 0.11,
      FACE_THICKNESS,
      HEIGHT - 0.11,
      @orange
    )

    # Vien kim loai sang bao quanh pano.
    front_y = -DEPTH - FACE_THICKNESS - 0.006

    add_box(
      e,
      x + 0.035,
      front_y,
      z + 0.035,
      WIDTH - 0.07,
      0.012,
      BORDER_SIZE,
      @white
    )

    add_box(
      e,
      x + 0.035,
      front_y,
      z + HEIGHT - 0.035 - BORDER_SIZE,
      WIDTH - 0.07,
      0.012,
      BORDER_SIZE,
      @white
    )

    add_box(
      e,
      x + 0.035,
      front_y,
      z + 0.035,
      BORDER_SIZE,
      0.012,
      HEIGHT - 0.07,
      @white
    )

    add_box(
      e,
      x + WIDTH - 0.035 - BORDER_SIZE,
      front_y,
      z + 0.035,
      BORDER_SIZE,
      0.012,
      HEIGHT - 0.07,
      @white
    )

    # Nep do noi phia trong.
    inner = 0.075
    inner_border = 0.009

    add_box(
      e,
      x + inner,
      front_y - 0.001,
      z + inner,
      WIDTH - inner * 2,
      0.006,
      inner_border,
      @orange_dark
    )

    add_box(
      e,
      x + inner,
      front_y - 0.001,
      z + HEIGHT - inner - inner_border,
      WIDTH - inner * 2,
      0.006,
      inner_border,
      @orange_dark
    )

    g
  end

  # --------------------------------------------------------------
  # KHUNG XUONG THEP BEN TRONG
  # --------------------------------------------------------------

  def build_internal_frame(parent)
    g = make_group(parent, '02 - Internal Steel Frame')
    e = g.entities

    x1 = -WIDTH / 2.0 + 0.055
    x2 = WIDTH / 2.0 - 0.055
    y = -DEPTH + 0.035
    z1 = CENTER_Z - HEIGHT / 2.0 + 0.055
    z2 = CENTER_Z + HEIGHT / 2.0 - 0.055

    add_beam(e, pt(x1, y, z1), pt(x2, y, z1), FRAME_SIZE, @frame)
    add_beam(e, pt(x1, y, z2), pt(x2, y, z2), FRAME_SIZE, @frame)
    add_beam(e, pt(x1, y, z1), pt(x1, y, z2), FRAME_SIZE, @frame)
    add_beam(e, pt(x2, y, z1), pt(x2, y, z2), FRAME_SIZE, @frame)

    [-0.75, -0.25, 0.25, 0.75].each do |x|
      add_beam(
        e,
        pt(x, y, z1),
        pt(x, y, z2),
        0.018,
        @steel_dark
      )
    end

    [0.20, 0.40, 0.60].each do |offset|
      z = z1 + offset
      next if z >= z2

      add_beam(
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
  # GIA DO GAN TUONG
  # --------------------------------------------------------------

  def build_mounting(parent)
    g = make_group(parent, '03 - Wall Mounting Brackets')
    e = g.entities

    x_positions = [
      -WIDTH / 2.0 + 0.10,
      WIDTH / 2.0 - 0.10
    ]

    z_positions = [
      CENTER_Z - HEIGHT / 2.0 + 0.13,
      CENTER_Z + HEIGHT / 2.0 - 0.13
    ]

    x_positions.each do |x|
      z_positions.each do |z|
        # Ban ma gan vao tuong.
        add_box(
          e,
          x - 0.06,
          0.035,
          z - 0.055,
          0.12,
          0.13,
          0.11,
          @steel_dark
        )

        # Tay do vuong goc.
        add_beam(
          e,
          pt(x, 0.12, z),
          pt(x, -0.18, z),
          0.035,
          @steel
        )

        # Thanh noi vao mat sau bien.
        add_beam(
          e,
          pt(x, -0.18, z),
          pt(x, -DEPTH + 0.02, z),
          0.035,
          @steel_dark
        )

        # Bu long gan ban ma.
        add_cylinder(
          e,
          x,
          0.025,
          z,
          0.012,
          0.012,
          @bolt,
          16
        )
      end
    end

    g
  end

  # --------------------------------------------------------------
  # TAM OP SAU
  # --------------------------------------------------------------

  def build_rear_plate(parent)
    g = make_group(parent, '04 - Rear Service Panel')
    e = g.entities

    add_box(
      e,
      -WIDTH / 2.0 + 0.06,
      DEPTH * 0.30,
      CENTER_Z - HEIGHT / 2.0 + 0.06,
      WIDTH - 0.12,
      0.025,
      HEIGHT - 0.12,
      @cabinet_side
    )

    g
  end

  # --------------------------------------------------------------
  # CHU NOI 3D
  # --------------------------------------------------------------

  def add_3d_text(parent, name, text, center_x, center_z,
                  text_height, thickness, mat,
                  font = 'Arial', bold = false)
    g = make_group(parent, name)

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

      # Chu mac dinh nam tren XY, xoay dung de huong ra mat bien.
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
      target_y = -m(DEPTH + FACE_THICKNESS + 0.018)
      target_z = m(center_z)

      translation = Geom::Vector3d.new(
        target_x - (bounds.min.x + bounds.max.x) / 2.0,
        target_y - bounds.min.y,
        target_z - (bounds.min.z + bounds.max.z) / 2.0
      )

      g.transform!(Geom::Transformation.translation(translation))

    rescue StandardError => error
      puts "Text creation failed [#{text}]: #{error.message}"
    end

    g
  end

  # --------------------------------------------------------------
  # NOI DUNG MAT PANO
  # --------------------------------------------------------------

  def build_lettering(parent)
    g = make_group(parent, '05 - Raised White Typography')

    add_3d_text(
      g,
      'SignBoard Mockup Text',
      'SignBoard Mockup',
      0.0,
      CENTER_Z + 0.015,
      0.155,
      0.009,
      @lettering,
      'Arial',
      false
    )

    g
  end

  # --------------------------------------------------------------
  # THANH GIA CUONG VA NEP VIEN
  # --------------------------------------------------------------

  def build_edge_details(parent)
    g = make_group(parent, '06 - Edge Reinforcement')
    e = g.entities

    x1 = -WIDTH / 2.0 + 0.025
    x2 = WIDTH / 2.0 - 0.025
    z1 = CENTER_Z - HEIGHT / 2.0 + 0.025
    z2 = CENTER_Z + HEIGHT / 2.0 - 0.025
    y = -DEPTH - FACE_THICKNESS - 0.009

    add_beam(e, pt(x1, y, z1), pt(x2, y, z1), 0.008, @white)
    add_beam(e, pt(x1, y, z2), pt(x2, y, z2), 0.008, @white)
    add_beam(e, pt(x1, y, z1), pt(x1, y, z2), 0.008, @white)
    add_beam(e, pt(x2, y, z1), pt(x2, y, z2), 0.008, @white)

    g
  end

  # --------------------------------------------------------------
  # CAMERA
  # --------------------------------------------------------------

  def set_camera
    model = Sketchup.active_model
    view = model.active_view

    eye = pt(2.6, -4.6, CENTER_Z + 1.0)
    target = pt(0, 0, CENTER_Z)

    camera = Sketchup::Camera.new(
      eye,
      target,
      vec(0, 0, 1)
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
    model.start_operation('Create SignBoard Mockup', true)

    begin
      setup_materials

      root = make_group(
        model.active_entities,
        'SignBoard Mockup - Complete Assembly'
      )

      build_wall(root) if CREATE_WALL
      build_cabinet(root)
      build_internal_frame(root) if CREATE_INTERNAL_FRAME
      build_mounting(root) if CREATE_MOUNTING
      build_rear_plate(root) if CREATE_REAR_PLATE
      build_edge_details(root)
      build_lettering(root) if CREATE_LETTERING

      model.commit_operation
      set_camera

      puts '=============================================='
      puts 'SIGNBOARD MOCKUP CREATED'
      puts "Width:  #{WIDTH} m"
      puts "Height: #{HEIGHT} m"
      puts "Depth:  #{DEPTH} m"
      puts 'Wall, cabinet, steel frame, wall brackets,'
      puts 'coral panel, white trim and 3D lettering created.'
      puts '=============================================='

    rescue StandardError => error
      model.abort_operation
      puts "SIGNBOARD ERROR: #{error.message}"
      puts error.backtrace
    end
  end
end

SignboardMockup.build