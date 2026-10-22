# frozen_string_literal: true
# ================================================================
# OUTDOOR BRIDGE BILLBOARD - SKETCHUP RUBY
# Mo hinh bien quang cao hai cot tren cau theo anh tham chieu.
#
# THANH PHAN:
# 01. Mong be tong cot tru
# 02. Hai cot thep tron doc hai ben
# 03. Ban de va bu long neo
# 04. Khung vien pano nhom
# 05. Khung xương thep phia sau pano
# 06. Thanh giang ngang lien ket hai cot
# 07. San catwalk bao tri
# 08. Thang leo co long bao ve
# 09. Mat pano quang cao
# 10. Khung vien trang
# 11. Chu noi va chi tiet trang tri
#
# Don vi: met
# Truc X = ngang, Y = chieu sau, Z = chieu cao
#
# Chay trong SketchUp Ruby Console:
# load 'C:/duong_dan/bridge_billboard.rb'
# ================================================================

require 'sketchup.rb'

module BridgeBillboard
  extend self

  # --------------------------------------------------------------
  # THONG SO MO HINH
  # --------------------------------------------------------------

  SIGN_WIDTH  = 7.20
  SIGN_HEIGHT = 2.10
  SIGN_BOTTOM = 7.80
  SIGN_DEPTH  = 0.18

  POST_SPACING = 8.00
  POST_RADIUS  = 0.16
  POST_HEIGHT  = 8.40

  FOUNDATION_WIDTH  = 0.90
  FOUNDATION_DEPTH  = 0.90
  FOUNDATION_HEIGHT = 1.20

  FRAME_BAR = 0.065
  FRAME_DEPTH = 0.30

  CATWALK_DEPTH = 0.55
  CATWALK_THICKNESS = 0.045

  LADDER_WIDTH = 0.38
  LADDER_STEP = 0.28

  CREATE_FOUNDATIONS = true
  CREATE_CATWALK = true
  CREATE_LADDERS = true
  CREATE_BACK_FRAME = true
  CREATE_RAISED_TEXT = true

  # --------------------------------------------------------------
  # DON VI VA HINH HOC
  # --------------------------------------------------------------

  def mm(value)
    value.to_f * 39.37007874015748
  end

  def p3(x, y, z)
    Geom::Point3d.new(mm(x), mm(y), mm(z))
  end

  def v3(x, y, z)
    Geom::Vector3d.new(x, y, z)
  end

  def make_group(parent, name)
    g = parent.add_group
    g.name = name
    g
  end

  # --------------------------------------------------------------
  # VAT LIEU
  # --------------------------------------------------------------

  def material(name, rgb, alpha = 1.0)
    materials = Sketchup.active_model.materials
    m = materials[name] || materials.add(name)
    m.color = Sketchup::Color.new(*rgb)
    m.alpha = alpha
    m
  end

  def setup_materials
    @concrete = material('BB Concrete', [155, 155, 150])
    @steel = material('BB Galvanized Steel', [160, 169, 175])
    @steel_dark = material('BB Steel Dark', [74, 83, 91])
    @steel_light = material('BB Steel Light', [210, 216, 220])
    @frame_white = material('BB White Aluminium Frame', [235, 239, 237])
    @panel = material('BB Advertising Panel', [0, 151, 210])
    @panel_edge = material('BB Panel Edge', [38, 54, 62])
    @cyan = material('BB Cyan Graphic', [0, 225, 255])
    @green = material('BB Landscape Green', [61, 145, 56])
    @white = material('BB White Text', [255, 255, 255])
    @dark = material('BB Dark Text', [20, 51, 68])
    @silver = material('BB Silver Hardware', [205, 210, 214])
  end

  # --------------------------------------------------------------
  # KHOI HOP
  # --------------------------------------------------------------

  def box(entities, x, y, z, width, depth, height, mat)
    return nil if width <= 0 || depth <= 0 || height <= 0

    points = [
      p3(x, y, z),
      p3(x + width, y, z),
      p3(x + width, y + depth, z),
      p3(x, y + depth, z)
    ]

    face = entities.add_face(points)
    return nil unless face && face.valid?

    face.material = mat
    face.back_material = mat
    face.reverse! if face.normal.z < 0
    face.pushpull(mm(height))
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

    ref = v3(0, 0, 1)
    ref = v3(0, 1, 0) if direction.parallel?(ref)

    u = direction.cross(ref)
    u.normalize!
    v = direction.cross(u)
    v.normalize!

    half = mm(size) / 2.0

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
  # TRU TRON THEP
  # --------------------------------------------------------------

  def cylinder(entities, x, y, z, radius, height, mat, segments = 32)
    edges = entities.add_circle(
      p3(x, y, z),
      v3(0, 0, 1),
      mm(radius),
      segments
    )

    face = entities.add_face(edges)
    return nil unless face && face.valid?

    face.material = mat
    face.back_material = mat
    face.pushpull(mm(height))
    face
  end

  # --------------------------------------------------------------
  # MONG BE TONG, BAN DE, COT THEP
  # --------------------------------------------------------------

  def build_foundations(parent)
    g = make_group(parent, '01 - Concrete Foundations and Steel Posts')
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

      # Ban de cot
      box(
        e,
        x - 0.28,
        -0.28,
        0,
        0.56,
        0.56,
        0.10,
        @steel_dark
      )

      # Bu long neo
      [-0.19, 0.19].each do |dx|
        [-0.19, 0.19].each do |dy|
          cylinder(
            e,
            x + dx,
            dy,
            0.10,
            0.018,
            0.075,
            @silver,
            12
          )
        end
      end

      # Cot thep tron dung
      cylinder(
        e,
        x,
        0,
        0.10,
        POST_RADIUS,
        POST_HEIGHT - 0.10,
        @steel,
        36
      )

      # Vong dai gia cuong tai dau cot
      cylinder(
        e,
        x,
        0,
        SIGN_BOTTOM - 0.20,
        POST_RADIUS + 0.035,
        0.30,
        @steel_dark,
        36
      )
    end

    g
  end

  # --------------------------------------------------------------
  # KHUNG VIEN PANO
  # --------------------------------------------------------------

  def build_panel_frame(parent)
    g = make_group(parent, '02 - Aluminium Perimeter Frame')
    e = g.entities

    x1 = -SIGN_WIDTH / 2.0
    x2 = SIGN_WIDTH / 2.0
    z1 = SIGN_BOTTOM
    z2 = SIGN_BOTTOM + SIGN_HEIGHT

    y_front = -0.23
    y_back = y_front + FRAME_DEPTH

    # Khung truoc va sau
    [y_front, y_back].each do |y|
      beam(e, p3(x1, y, z1), p3(x2, y, z1), FRAME_BAR, @frame_white)
      beam(e, p3(x1, y, z2), p3(x2, y, z2), FRAME_BAR, @frame_white)
      beam(e, p3(x1, y, z1), p3(x1, y, z2), FRAME_BAR, @frame_white)
      beam(e, p3(x2, y, z1), p3(x2, y, z2), FRAME_BAR, @frame_white)
    end

    # Thanh noi chieu sau
    [x1, x2].each do |x|
      [z1, z2].each do |z|
        beam(e, p3(x, y_front, z), p3(x, y_back, z), FRAME_BAR, @steel)
      end
    end

    # Thanh dung phia sau pano
    1.upto(8) do |i|
      x = x1 + SIGN_WIDTH * i / 9.0
      beam(
        e,
        p3(x, y_back, z1),
        p3(x, y_back, z2),
        0.035,
        @steel
      )
    end

    g
  end

  # --------------------------------------------------------------
  # KHUNG GIANG CHEO PHIA SAU PANO
  # --------------------------------------------------------------

  def build_back_truss(parent)
    g = make_group(parent, '03 - Rear Steel Bracing')
    e = g.entities

    x1 = -SIGN_WIDTH / 2.0 + 0.05
    x2 = SIGN_WIDTH / 2.0 - 0.05
    y = 0.10
    z1 = SIGN_BOTTOM + 0.05
    z2 = SIGN_BOTTOM + SIGN_HEIGHT - 0.05

    beam(e, p3(x1, y, z1), p3(x2, y, z1), 0.05, @steel_dark)
    beam(e, p3(x1, y, z2), p3(x2, y, z2), 0.05, @steel_dark)
    beam(e, p3(x1, y, z1), p3(x1, y, z2), 0.05, @steel_dark)
    beam(e, p3(x2, y, z1), p3(x2, y, z2), 0.05, @steel_dark)

    count = 10

    0.upto(count - 1) do |i|
      xa = x1 + (x2 - x1) * i / count.to_f
      xb = x1 + (x2 - x1) * (i + 1) / count.to_f

      if i.even?
        beam(e, p3(xa, y, z1), p3(xb, y, z2), 0.035, @steel)
      else
        beam(e, p3(xa, y, z2), p3(xb, y, z1), 0.035, @steel)
      end
    end

    g
  end

  # --------------------------------------------------------------
  # THANH NGANG NOI HAI COT
  # --------------------------------------------------------------

  def build_cross_support(parent)
    g = make_group(parent, '04 - Cross Supports')
    e = g.entities

    x1 = -POST_SPACING / 2.0
    x2 = POST_SPACING / 2.0

    # Dam ngang chinh phia duoi pano
    beam(
      e,
      p3(x1, 0, SIGN_BOTTOM - 0.20),
      p3(x2, 0, SIGN_BOTTOM - 0.20),
      0.18,
      @steel_dark
    )

    # Thanh lien ket phia tren
    beam(
      e,
      p3(x1, 0, SIGN_BOTTOM + 0.25),
      p3(x2, 0, SIGN_BOTTOM + 0.25),
      0.10,
      @steel
    )

    # Gia cuong tu cot len khung
    [-1, 1].each do |side|
      x = side * POST_SPACING / 2.0
      x_inner = side * (SIGN_WIDTH / 2.0 - 0.20)

      beam(
        e,
        p3(x, 0, SIGN_BOTTOM - 0.20),
        p3(x_inner, 0, SIGN_BOTTOM + 0.20),
        0.08,
        @steel
      )
    end

    g
  end

  # --------------------------------------------------------------
  # SAN CATWALK
  # --------------------------------------------------------------

  def build_catwalk(parent)
    g = make_group(parent, '05 - Rear Maintenance Catwalk')
    e = g.entities

    width = SIGN_WIDTH + 0.40
    x1 = -width / 2.0
    y1 = 0.30
    z = SIGN_BOTTOM - 0.45

    # Tam san
    box(
      e,
      x1,
      y1,
      z,
      width,
      CATWALK_DEPTH,
      CATWALK_THICKNESS,
      @steel_dark
    )

    # Dam doc san
    [y1 + 0.08, y1 + CATWALK_DEPTH - 0.08].each do |y|
      beam(
        e,
        p3(x1, y, z - 0.08),
        p3(-x1, y, z - 0.08),
        0.045,
        @steel
      )
    end

    # Thanh ngang san
    0.upto(16) do |i|
      x = x1 + width * i / 16.0
      beam(
        e,
        p3(x, y1, z - 0.06),
        p3(x, y1 + CATWALK_DEPTH, z - 0.06),
        0.025,
        @steel
      )
    end

    # Lan can phia ngoai
    rail_y = y1 + CATWALK_DEPTH
    beam(
      e,
      p3(x1, rail_y, z + 0.90),
      p3(-x1, rail_y, z + 0.90),
      0.035,
      @steel
    )

    beam(
      e,
      p3(x1, rail_y, z + 0.45),
      p3(-x1, rail_y, z + 0.45),
      0.025,
      @steel
    )

    0.upto(12) do |i|
      x = x1 + width * i / 12.0
      beam(
        e,
        p3(x, rail_y, z),
        p3(x, rail_y, z + 0.90),
        0.025,
        @steel
      )
    end

    g
  end

  # --------------------------------------------------------------
  # THANG LEO CO LONG BAO VE
  # --------------------------------------------------------------

  def build_ladders(parent)
    g = make_group(parent, '06 - Fixed Access Ladders')
    e = g.entities

    [-POST_SPACING / 2.0 + 0.20, POST_SPACING / 2.0 - 0.20].each do |x|
      y = 0.22
      z0 = 0.15
      z1 = SIGN_BOTTOM - 0.30

      # Hai thanh doc
      beam(e, p3(x - LADDER_WIDTH / 2.0, y, z0),
           p3(x - LADDER_WIDTH / 2.0, y, z1), 0.028, @steel_dark)

      beam(e, p3(x + LADDER_WIDTH / 2.0, y, z0),
           p3(x + LADDER_WIDTH / 2.0, y, z1), 0.028, @steel_dark)

      count = ((z1 - z0) / LADDER_STEP).to_i

      0.upto(count) do |i|
        z = z0 + i * LADDER_STEP
        beam(
          e,
          p3(x - LADDER_WIDTH / 2.0, y, z),
          p3(x + LADDER_WIDTH / 2.0, y, z),
          0.022,
          @steel_light
        )
      end

      # Gia lap dai bao ve tren doan tren cao
      6.upto(10) do |i|
        z = z0 + i * 0.55
        next if z > z1

        beam(
          e,
          p3(x - LADDER_WIDTH / 2.0 - 0.10, y + 0.12, z),
          p3(x + LADDER_WIDTH / 2.0 + 0.10, y + 0.12, z),
          0.020,
          @steel
        )
      end
    end

    g
  end

  # --------------------------------------------------------------
  # MAT PANO QUANG CAO
  # --------------------------------------------------------------

  def build_panel_face(parent)
    g = make_group(parent, '07 - Advertising Pano')
    e = g.entities

    x = -SIGN_WIDTH / 2.0 + 0.065
    y = -0.255
    z = SIGN_BOTTOM + 0.065

    box(
      e,
      x,
      y,
      z,
      SIGN_WIDTH - 0.13,
      0.035,
      SIGN_HEIGHT - 0.13,
      @panel
    )

    # Nep vien phu
    beam(
      e,
      p3(-SIGN_WIDTH / 2.0, y - 0.01, SIGN_BOTTOM),
      p3(SIGN_WIDTH / 2.0, y - 0.01, SIGN_BOTTOM),
      0.025,
      @frame_white
    )

    beam(
      e,
      p3(-SIGN_WIDTH / 2.0, y - 0.01, SIGN_BOTTOM + SIGN_HEIGHT),
      p3(SIGN_WIDTH / 2.0, y - 0.01, SIGN_BOTTOM + SIGN_HEIGHT),
      0.025,
      @frame_white
    )

    g
  end

  # --------------------------------------------------------------
  # CHU NOI TREN MAT PANO
  # --------------------------------------------------------------

  def raised_text(parent, text, x, z, height, depth, mat, name)
    g = make_group(parent, name)

    begin
      g.entities.add_3d_text(
        text,
        TextAlignLeft,
        'Arial',
        true,
        false,
        mm(height),
        0.0,
        0.0,
        true,
        mm(depth)
      )

      g.entities.each do |entity|
        next unless entity.respond_to?(:material=)

        entity.material = mat
        entity.back_material = mat if entity.respond_to?(:back_material=)
      end

      # Xoay chu dung tren mat pano
      g.transform!(
        Geom::Transformation.rotation(
          ORIGIN,
          X_AXIS,
          90.degrees
        )
      )

      bounds = g.bounds

      g.transform!(
        Geom::Transformation.translation(
          Geom::Vector3d.new(
            mm(x) - bounds.min.x,
            mm(-0.30) - bounds.min.y,
            mm(z) - bounds.min.z
          )
        )
      )
    rescue StandardError => error
      puts "Khong tao duoc chu #{text}: #{error.message}"
    end

    g
  end

  def build_panel_text(parent)
    g = make_group(parent, '08 - Raised Panel Text')
    e = g.entities

    raised_text(
      g,
      'ENERGY',
      -2.45,
      SIGN_BOTTOM + 1.30,
      0.36,
      0.015,
      @dark,
      'Headline - ENERGY'
    )

    raised_text(
      g,
      'POWER FOR EVERYONE',
      -2.45,
      SIGN_BOTTOM + 0.88,
      0.20,
      0.012,
      @dark,
      'Subheadline'
    )

    # Duong trang tri mau cyan
    beam(
      e,
      p3(-0.60, -0.30, SIGN_BOTTOM + 0.40),
      p3(0.25, -0.30, SIGN_BOTTOM + 1.70),
      0.055,
      @cyan
    )

    beam(
      e,
      p3(-0.35, -0.31, SIGN_BOTTOM + 0.40),
      p3(0.50, -0.31, SIGN_BOTTOM + 1.70),
      0.035,
      @cyan
    )

    # Cot thap dien minh hoa
    beam(
      e,
      p3(2.15, -0.30, SIGN_BOTTOM + 0.35),
      p3(2.45, -0.30, SIGN_BOTTOM + 1.45),
      0.025,
      @steel_dark
    )

    [-0.10, 0.08, 0.24].each do |offset|
      beam(
        e,
        p3(2.15 + offset, -0.31, SIGN_BOTTOM + 0.75),
        p3(2.15 - offset, -0.31, SIGN_BOTTOM + 0.75),
        0.018,
        @steel
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

    eye = p3(0, -18, 9.0)
    target = p3(0, 0, SIGN_BOTTOM + SIGN_HEIGHT / 2.0)

    camera = Sketchup::Camera.new(eye, target, v3(0, 0, 1))
    camera.perspective = true

    view.camera = camera
    view.zoom_extents
    view.invalidate
  end

  # --------------------------------------------------------------
  # TAO MO HINH
  # --------------------------------------------------------------

  def build
    model = Sketchup.active_model

    model.start_operation('Create Bridge Billboard', true)

    begin
      setup_materials

      root = make_group(
        model.active_entities,
        'OUTDOOR BRIDGE BILLBOARD'
      )

      build_foundations(root) if CREATE_FOUNDATIONS
      build_cross_support(root)
      build_panel_frame(root)
      build_back_truss(root) if CREATE_BACK_FRAME
      build_panel_face(root)
      build_panel_text(root) if CREATE_RAISED_TEXT
      build_catwalk(root) if CREATE_CATWALK
      build_ladders(root) if CREATE_LADDERS

      model.commit_operation
      set_camera

      puts '============================================'
      puts 'BRIDGE BILLBOARD CREATED'
      puts "Pano: #{SIGN_WIDTH} x #{SIGN_HEIGHT} m"
      puts "Bottom elevation: #{SIGN_BOTTOM} m"
      puts 'Two round steel posts, foundations, frame,'
      puts 'rear bracing, catwalk, ladders and pano.'
      puts '============================================'

    rescue StandardError => error
      model.abort_operation
      puts "BILLBOARD ERROR: #{error.message}"
      puts error.backtrace
    end
  end
end

BridgeBillboard.build