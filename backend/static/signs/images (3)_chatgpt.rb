# frozen_string_literal: true
# ================================================================
# SKYWOW LED SIGNBOARD - SKETCHUP RUBY
# Bien quang cao pano nen xanh, chu noi vang phat sang.
#
# THANH PHAN:
# 01. Mong be tong
# 02. Cot thep hop/tron va ban ma neo
# 03. Khung xuong thep phia sau
# 04. Pano hop chu nhat
# 05. Mat bien xanh la
# 06. Chu noi 3D "Skywow"
# 07. Vien chu mau den va lop vien vang
# 08. Hieu ung vien LED phat sang gia lap
# 09. Khung treo, thanh gia cuong va den chieu sang
# 10. San catwalk va thang bao tri tuy chon
#
# Don vi: met
# X = ngang, Y = chieu sau, Z = chieu cao
#
# Chay trong SketchUp Ruby Console:
# load 'C:/duong_dan/skywow_signboard.rb'
# ================================================================

require 'sketchup.rb'

module SkywowSignboard
  extend self

  # --------------------------------------------------------------
  # THONG SO
  # --------------------------------------------------------------

  SIGN_WIDTH  = 4.80
  SIGN_HEIGHT = 2.15
  SIGN_DEPTH  = 0.16
  SIGN_BOTTOM = 4.20

  POST_SPACING = 3.60
  POST_RADIUS  = 0.12
  POST_HEIGHT  = 4.40

  FOUNDATION_WIDTH  = 0.65
  FOUNDATION_DEPTH  = 0.65
  FOUNDATION_HEIGHT = 0.70

  FRAME_SIZE = 0.055
  FRAME_DEPTH = 0.12

  CREATE_FOUNDATIONS = true
  CREATE_SUPPORTS = true
  CREATE_REAR_FRAME = true
  CREATE_CATWALK = true
  CREATE_LADDERS = true
  CREATE_LIGHTS = true
  CREATE_RAISED_TEXT = true

  # --------------------------------------------------------------
  # DON VI / TOA DO
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

  def group(parent, name)
    result = parent.add_group
    result.name = name
    result
  end

  # --------------------------------------------------------------
  # VAT LIEU
  # --------------------------------------------------------------

  def make_material(name, color, alpha = 1.0)
    mats = Sketchup.active_model.materials
    mat = mats[name] || mats.add(name)
    mat.color = Sketchup::Color.new(*color)
    mat.alpha = alpha
    mat
  end

  def setup_materials
    @concrete = make_material('SW Concrete', [145, 145, 140])
    @steel = make_material('SW Galvanized Steel', [160, 170, 174])
    @steel_dark = make_material('SW Dark Steel', [48, 56, 54])
    @steel_light = make_material('SW Steel Highlights', [205, 212, 209])
    @panel_green = make_material('SW Emerald Green Panel', [28, 105, 64])
    @panel_edge = make_material('SW Panel Edge', [20, 35, 28])
    @black = make_material('SW Glossy Black Letter', [17, 15, 10])
    @gold = make_material('SW Warm Gold', [255, 205, 66])
    @gold_light = make_material('SW LED Warm White', [255, 238, 142])
    @white = make_material('SW White', [255, 255, 255])
  end

  # --------------------------------------------------------------
  # KHOI HOP
  # --------------------------------------------------------------

  def box(entities, x, y, z, width, depth, height, mat)
    return nil if width <= 0 || depth <= 0 || height <= 0

    corners = [
      pt(x, y, z),
      pt(x + width, y, z),
      pt(x + width, y + depth, z),
      pt(x, y + depth, z)
    ]

    face = entities.add_face(corners)
    return nil unless face && face.valid?

    face.material = mat
    face.back_material = mat
    face.reverse! if face.normal.z < 0
    face.pushpull(m(height))
    face
  end

  # --------------------------------------------------------------
  # THANH THEP GIUA HAI DIEM
  # --------------------------------------------------------------

  def beam(entities, a, b, size, mat)
    direction = b - a
    length = direction.length
    return nil if length < 0.001

    direction.normalize!
    reference = vec(0, 0, 1)
    reference = vec(0, 1, 0) if direction.parallel?(reference)

    u = direction.cross(reference)
    u.normalize!
    v = direction.cross(u)
    v.normalize!

    half = m(size) / 2.0

    corners = [
      a.offset(u, half).offset(v, half),
      a.offset(u, -half).offset(v, half),
      a.offset(u, -half).offset(v, -half),
      a.offset(u, half).offset(v, -half)
    ]

    face = entities.add_face(corners)
    return nil unless face && face.valid?

    face.material = mat
    face.back_material = mat
    face.pushpull(length)
    face
  end

  # --------------------------------------------------------------
  # TRU TRON THEP
  # --------------------------------------------------------------

  def cylinder(entities, x, y, z, radius, height, mat, segments = 32)
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
  # MONG BE TONG VA COT
  # --------------------------------------------------------------

  def build_foundations(parent)
    g = group(parent, '01 - Concrete Foundations and Posts')
    e = g.entities

    [-POST_SPACING / 2.0, POST_SPACING / 2.0].each do |x|
      box(
        e,
        x - FOUNDATION_WIDTH / 2.0,
        -FOUNDATION_DEPTH / 2.0,
        -FOUNDATION_HEIGHT,
        FOUNDATION_WIDTH,
        FOUNDATION_DEPTH,
        FOUNDATION_HEIGHT,
        @concrete
      )

      # Ban de chan cot
      box(e, x - 0.23, -0.23, 0, 0.46, 0.46, 0.08, @steel_dark)

      # Bu long neo
      [-0.15, 0.15].each do |dx|
        [-0.15, 0.15].each do |dy|
          cylinder(e, x + dx, dy, 0.08, 0.015, 0.04, @steel_light, 12)
        end
      end

      # Cot thep tron dung
      cylinder(
        e,
        x,
        0,
        0.08,
        POST_RADIUS,
        POST_HEIGHT,
        @steel,
        36
      )

      # Dai gia cuong dau cot
      cylinder(
        e,
        x,
        0,
        SIGN_BOTTOM - 0.20,
        POST_RADIUS + 0.035,
        0.18,
        @steel_dark,
        36
      )
    end

    g
  end

  # --------------------------------------------------------------
  # KHUNG XUONG PANO
  # --------------------------------------------------------------

  def build_frame(parent)
    g = group(parent, '02 - Billboard Steel Frame')
    e = g.entities

    x1 = -SIGN_WIDTH / 2.0
    x2 = SIGN_WIDTH / 2.0
    z1 = SIGN_BOTTOM
    z2 = SIGN_BOTTOM + SIGN_HEIGHT
    yf = -SIGN_DEPTH / 2.0
    yb = SIGN_DEPTH / 2.0 + 0.06

    # Khung vien truoc
    beam(e, pt(x1, yf, z1), pt(x2, yf, z1), FRAME_SIZE, @steel_light)
    beam(e, pt(x1, yf, z2), pt(x2, yf, z2), FRAME_SIZE, @steel_light)
    beam(e, pt(x1, yf, z1), pt(x1, yf, z2), FRAME_SIZE, @steel_light)
    beam(e, pt(x2, yf, z1), pt(x2, yf, z2), FRAME_SIZE, @steel_light)

    # Khung vien sau
    beam(e, pt(x1, yb, z1), pt(x2, yb, z1), FRAME_SIZE, @steel_dark)
    beam(e, pt(x1, yb, z2), pt(x2, yb, z2), FRAME_SIZE, @steel_dark)
    beam(e, pt(x1, yb, z1), pt(x1, yb, z2), FRAME_SIZE, @steel_dark)
    beam(e, pt(x2, yb, z1), pt(x2, yb, z2), FRAME_SIZE, @steel_dark)

    # Thanh noi truoc-sau
    [x1, x2].each do |x|
      [z1, z2].each do |z|
        beam(e, pt(x, yf, z), pt(x, yb, z), FRAME_SIZE, @steel)
      end
    end

    # Thanh dung sau pano
    1.upto(8) do |i|
      x = x1 + SIGN_WIDTH * i / 9.0
      beam(e, pt(x, yb, z1), pt(x, yb, z2), 0.035, @steel)
    end

    # Thanh ngang gia cuong
    [0.35, 0.75, 1.15, 1.55, 1.90].each do |offset|
      z = z1 + offset
      next if z >= z2

      beam(e, pt(x1, yb, z), pt(x2, yb, z), 0.035, @steel)
    end

    # Giang cheo chu X
    0.upto(5) do |i|
      xa = x1 + i * SIGN_WIDTH / 6.0
      xb = x1 + (i + 1) * SIGN_WIDTH / 6.0
      next if xb > x2

      if i.even?
        beam(e, pt(xa, yb, z1), pt(xb, yb, z2), 0.025, @steel_dark)
      else
        beam(e, pt(xa, yb, z2), pt(xb, yb, z1), 0.025, @steel_dark)
      end
    end

    g
  end

  # --------------------------------------------------------------
  # MAT BIEN XANH
  # --------------------------------------------------------------

  def build_panel(parent)
    g = group(parent, '03 - Emerald Green Sign Face')
    e = g.entities

    box(
      e,
      -SIGN_WIDTH / 2.0 + 0.04,
      -SIGN_DEPTH / 2.0 - 0.045,
      SIGN_BOTTOM + 0.04,
      SIGN_WIDTH - 0.08,
      0.045,
      SIGN_HEIGHT - 0.08,
      @panel_green
    )

    # Nep den quanh pano
    x1 = -SIGN_WIDTH / 2.0
    x2 = SIGN_WIDTH / 2.0
    z1 = SIGN_BOTTOM
    z2 = SIGN_BOTTOM + SIGN_HEIGHT
    y = -SIGN_DEPTH / 2.0 - 0.075

    beam(e, pt(x1, y, z1), pt(x2, y, z1), 0.025, @panel_edge)
    beam(e, pt(x1, y, z2), pt(x2, y, z2), 0.025, @panel_edge)
    beam(e, pt(x1, y, z1), pt(x1, y, z2), 0.025, @panel_edge)
    beam(e, pt(x2, y, z1), pt(x2, y, z2), 0.025, @panel_edge)

    g
  end

  # --------------------------------------------------------------
  # CHU NOI 3D
  # Chu duoc tao tren mat phang XY, sau do xoay dung len mat pano.
  # --------------------------------------------------------------

  def add_text_3d(entities, text, height_m, thickness_m, material_obj)
    entities.add_3d_text(
      text,
      TextAlignCenter,
      'Arial',
      true,
      false,
      m(height_m),
      0.0,
      0.0,
      true,
      m(thickness_m)
    )

    entities.each do |entity|
      next unless entity.respond_to?(:material=)

      entity.material = material_obj
      entity.back_material = material_obj if entity.respond_to?(:back_material=)
    end
  end

  def make_text_group(parent, name, text, center_x, center_z, height, depth, mat)
    g = group(parent, name)

    begin
      add_text_3d(g.entities, text, height, depth, mat)

      # Chuyen chu tu XY sang mat phang XZ, huong ra phia truoc.
      g.transform!(
        Geom::Transformation.rotation(ORIGIN, X_AXIS, 90.degrees)
      )

      bounds = g.bounds
      desired_x = m(center_x)
      desired_y = m(-SIGN_DEPTH / 2.0 - 0.11)
      desired_z = m(center_z)

      offset = Geom::Vector3d.new(
        desired_x - (bounds.min.x + bounds.max.x) / 2.0,
        desired_y - bounds.min.y,
        desired_z - (bounds.min.z + bounds.max.z) / 2.0
      )

      g.transform!(Geom::Transformation.translation(offset))
    rescue StandardError => error
      puts "Text creation error (#{text}): #{error.message}"
    end

    g
  end

  # --------------------------------------------------------------
  # CHU SKYWOW VA VIEN LED
  # --------------------------------------------------------------

  def build_letters(parent)
    g = group(parent, '04 - Skywow Raised Letters and LED')
    e = g.entities

    # Chu chinh mau vang kim loai
    make_text_group(
      g,
      'Skywow Gold Lettering',
      'Skywow',
      0.0,
      SIGN_BOTTOM + SIGN_HEIGHT * 0.53,
      0.72,
      0.045,
      @gold
    )

    # Lop vien LED gia lap, chu nho hon va nam truoc chu chinh
    make_text_group(
      g,
      'Skywow LED Halo',
      'Skywow',
      0.0,
      SIGN_BOTTOM + SIGN_HEIGHT * 0.53,
      0.75,
      0.018,
      @gold_light
    )

    # Nen den phia sau chu tao do day
    make_text_group(
      g,
      'Skywow Dark Letter Backing',
      'Skywow',
      0.0,
      SIGN_BOTTOM + SIGN_HEIGHT * 0.53,
      0.69,
      0.060,
      @black
    )

    g
  end

  # --------------------------------------------------------------
  # GIA DO LIEN KET VA TAY DO
  # --------------------------------------------------------------

  def build_supports(parent)
    g = group(parent, '05 - Wall Brackets and Support Arms')
    e = g.entities

    [-BRACKET_SPACING / 2.0, BRACKET_SPACING / 2.0].each do |x|
      # Tay do ngang vuong goc voi mat pano
      beam(
        e,
        pt(x, 0.10, BRACKET_HEIGHT),
        pt(x, -BRACKET_LENGTH, BRACKET_HEIGHT),
        0.065,
        @steel_dark
      )

      # Thanh giang cheo
      beam(
        e,
        pt(x, 0.10, BRACKET_HEIGHT - 0.08),
        pt(x, -BRACKET_LENGTH, BRACKET_HEIGHT - 0.40),
        0.045,
        @steel
      )

      # Ban ma gan tuong
      box(
        e,
        x - 0.12,
        0.06,
        BRACKET_HEIGHT - 0.20,
        0.24,
        0.08,
        0.40,
        @steel_dark
      )

      # Bu long tren ban ma
      [-0.07, 0.07].each do |dx|
        [-0.08, 0.08].each do |dz|
          cylinder(
            e,
            x + dx,
            0.04,
            BRACKET_HEIGHT + dz,
            0.012,
            0.025,
            @steel_light,
            12
          )
        end
      end
    end

    g
  end

  # --------------------------------------------------------------
  # MONG VA TUONG THAM CHIEU
  # --------------------------------------------------------------

  def build_wall(parent)
    g = group(parent, '00 - Reference Wall')
    e = g.entities

    box(
      e,
      -WALL_WIDTH / 2.0,
      0.22,
      0,
      WALL_WIDTH,
      WALL_THICKNESS,
      WALL_HEIGHT,
      @concrete
    )

    g
  end

  # --------------------------------------------------------------
  # DEN CHIEU SANG TREN PANO
  # --------------------------------------------------------------

  def build_lights(parent)
    g = group(parent, '06 - Top Sign Lights')
    e = g.entities

    [-0.42, 0.0, 0.42].each do |offset|
      x = offset * SIGN_WIDTH
      z = SIGN_BOTTOM + SIGN_HEIGHT + 0.10

      # Can den
      beam(
        e,
        pt(x, -0.05, z),
        pt(x, -0.30, z + 0.10),
        0.018,
        @steel_dark
      )

      # Than den
      cylinder(
        e,
        x,
        -0.30,
        z + 0.07,
        0.035,
        0.035,
        @steel_light,
        16
      )

      # Bong den
      cylinder(
        e,
        x,
        -0.30,
        z + 0.02,
        0.025,
        0.025,
        @gold_light,
        16
      )
    end

    g
  end

  # --------------------------------------------------------------
  # SAN CATWALK BAO TRI
  # --------------------------------------------------------------

  def build_catwalk(parent)
    g = group(parent, '07 - Maintenance Platform')
    e = g.entities

    width = SIGN_WIDTH + 0.20
    x1 = -width / 2.0
    y = 0.16
    z = SIGN_BOTTOM - 0.18

    # San thao tac
    box(
      e,
      x1,
      y,
      z,
      width,
      0.45,
      0.045,
      @steel_dark
    )

    # Dam doc
    [y + 0.05, y + 0.40].each do |yy|
      beam(
        e,
        pt(x1, yy, z - 0.08),
        pt(-x1, yy, z - 0.08),
        0.035,
        @steel
      )
    end

    # Thanh ngang gia cuong
    0.upto(12) do |i|
      x = x1 + width * i / 12.0
      beam(
        e,
        pt(x, y, z - 0.06),
        pt(x, y + 0.45, z - 0.06),
        0.022,
        @steel
      )
    end

    g
  end

  # --------------------------------------------------------------
  # THANG LEO BAO TRI
  # --------------------------------------------------------------

  def build_ladders(parent)
    g = group(parent, '08 - Maintenance Ladder')
    e = g.entities

    x = SIGN_WIDTH / 2.0 - 0.22
    y = 0.27
    z0 = 0.25
    z1 = SIGN_BOTTOM - 0.25
    ladder_width = 0.32
    rung_spacing = 0.28

    beam(
      e,
      pt(x - ladder_width / 2.0, y, z0),
      pt(x - ladder_width / 2.0, y, z1),
      0.025,
      @steel_dark
    )

    beam(
      e,
      pt(x + ladder_width / 2.0, y, z0),
      pt(x + ladder_width / 2.0, y, z1),
      0.025,
      @steel_dark
    )

    count = ((z1 - z0) / rung_spacing).to_i

    0.upto(count) do |i|
      z = z0 + i * rung_spacing
      beam(
        e,
        pt(x - ladder_width / 2.0, y, z),
        pt(x + ladder_width / 2.0, y, z),
        0.020,
        @steel_light
      )
    end

    g
  end

  # --------------------------------------------------------------
  # CAMERA
  # --------------------------------------------------------------

  def set_camera
    model = Sketchup.active_model
    view = model.active_view

    eye = pt(5.0, -8.0, 5.2)
    target = pt(0, -0.05, SIGN_BOTTOM + SIGN_HEIGHT / 2.0)

    camera = Sketchup::Camera.new(eye, target, vec(0, 0, 1))
    camera.perspective = true

    view.camera = camera
    view.zoom_extents
    view.invalidate
  end

  # --------------------------------------------------------------
  # TAO MO HINH CHINH
  # --------------------------------------------------------------

  def build
    model = Sketchup.active_model
    model.start_operation('Create Skywow LED Billboard', true)

    begin
      setup_materials

      root = group(model.active_entities, 'SKYWOW LED SIGNBOARD')

      build_wall(root)
      build_foundations(root) if CREATE_FOUNDATIONS
      build_supports(root) if CREATE_SUPPORTS
      build_frame(root)
      build_panel(root)
      build_letters(root) if CREATE_RAISED_TEXT
      build_lights(root) if CREATE_LIGHTS
      build_catwalk(root) if CREATE_CATWALK
      build_ladders(root) if CREATE_LADDERS

      model.commit_operation
      set_camera

      puts '=============================================='
      puts 'SKYWOW LED SIGNBOARD CREATED'
      puts "Panel: #{SIGN_WIDTH}m x #{SIGN_HEIGHT}m"
      puts "Bottom elevation: #{SIGN_BOTTOM}m"
      puts 'Components: wall, foundations, steel frame,'
      puts 'green panel, raised letters, lights and supports.'
      puts '=============================================='

    rescue StandardError => error
      model.abort_operation
      puts "SKYWOW SIGNBOARD ERROR: #{error.message}"
      puts error.backtrace
    end
  end
end

SkywowSignboard.build