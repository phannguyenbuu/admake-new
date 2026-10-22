# frozen_string_literal: true
# ================================================================
# OUTDOOR BILLBOARD - SKETCHUP RUBY GENERATOR
# Mo hinh bien quang cao ngoai troi theo anh tham chieu
#
# Thanh phan:
# 01. Mat dat va mong be tong
# 02. Hai cot tru thep tron va cot hop gia cuong
# 03. Ban de va bu long neo
# 04. Gian khung xuong thep khong gian
# 05. Tam pano quang cao trang
# 06. San catwalk va lan can bao ve
# 07. Thang leo an toan va long bao ve
# 08. Den chieu sang
# 09. Chu noi 3D tuy chon
#
# Don vi dau vao: met
# Cach chay: SketchUp > Window > Ruby Console
# load 'duong_dan/outdoor_billboard.rb'
#
# Luu y:
# Day la mo hinh concept, khong thay the ho so ket cau thi cong.
# ================================================================

require 'sketchup.rb'

module OutdoorBillboardGenerator
  extend self

  # --------------------------------------------------------------
  # 01. THONG SO MO HINH
  # --------------------------------------------------------------

  BOARD_W = 18.0
  BOARD_H = 8.0
  BOARD_T = 0.12
  BOARD_BOTTOM = 10.0

  BOARD_CENTER_X = 0.0
  BOARD_FRONT_Y = -0.35

  COLUMN_X_POSITIONS = [-5.5, 5.5].freeze
  COLUMN_Y = 0.45
  COLUMN_RADIUS = 0.48
  COLUMN_HEIGHT = BOARD_BOTTOM
  COLUMN_SEGMENTS = 48

  FOUNDATION_W = 2.4
  FOUNDATION_D = 2.4
  FOUNDATION_H = 1.2
  FOUNDATION_TOP = 0.0

  BASE_PLATE_W = 1.35
  BASE_PLATE_D = 1.35
  BASE_PLATE_T = 0.12

  TRUSS_W = 19.0
  TRUSS_H = 1.15
  TRUSS_D = 1.10
  TRUSS_BOTTOM = BOARD_BOTTOM - TRUSS_H
  TRUSS_PANEL = 0.85

  CATWALK_W = 0.75
  CATWALK_D = 0.85
  CATWALK_Z = TRUSS_BOTTOM - 0.08

  LADDER_X = 5.0
  LADDER_Y = 0.0
  LADDER_BOTTOM = 0.35
  LADDER_TOP = BOARD_BOTTOM - 0.15
  LADDER_STEP = 0.30

  FRAME_BAR = 0.08
  FRAME_DIAGONAL = 0.045

  ADD_GROUND = true
  ADD_LIGHTS = true
  ADD_LADDER_CAGE = true
  ADD_RAISED_TEXT = false

  # --------------------------------------------------------------
  # 02. DON VI, DIEM VA VAT LIEU
  # --------------------------------------------------------------

  def m(value)
    value.to_f * 39.37007874015748
  end

  def point(x, y, z)
    Geom::Point3d.new(m(x), m(y), m(z))
  end

  def vector(x, y, z)
    Geom::Vector3d.new(x, y, z)
  end

  def make_group(parent, name)
    result = parent.add_group
    result.name = name
    result
  end

  def make_material(name, rgb, alpha = 1.0)
    materials = Sketchup.active_model.materials
    mat = materials[name] || materials.add(name)
    mat.color = Sketchup::Color.new(*rgb)
    mat.alpha = alpha
    mat
  end

  def setup_materials
    @concrete = make_material(
      'OB Concrete', [165, 165, 158]
    )
    @concrete_dark = make_material(
      'OB Concrete Dark', [120, 123, 122]
    )
    @steel = make_material(
      'OB Galvanized Steel', [116, 137, 151]
    )
    @steel_dark = make_material(
      'OB Structural Steel Dark', [40, 58, 72]
    )
    @steel_light = make_material(
      'OB Steel Highlights', [188, 199, 207]
    )
    @panel_white = make_material(
      'OB White Billboard', [250, 250, 248]
    )
    @panel_edge = make_material(
      'OB Panel Edge', [160, 174, 184]
    )
    @lamp_material = make_material(
      'OB Lamp Housing', [42, 48, 52]
    )
    @lamp_glass = make_material(
      'OB Lamp Glass', [255, 243, 210]
    )
    @text_material = make_material(
      'OB Raised Lettering', [30, 45, 42]
    )
    @ground_material = make_material(
      'OB Ground', [155, 155, 146]
    )
  end

  # --------------------------------------------------------------
  # 03. KHOI HOP
  # --------------------------------------------------------------

  def add_box(entities, x, y, z, dx, dy, dz, mat)
    return nil if dx <= 0 || dy <= 0 || dz <= 0

    vertices = [
      point(x,      y,      z),
      point(x + dx, y,      z),
      point(x + dx, y + dy, z),
      point(x,      y + dy, z)
    ]

    face = entities.add_face(vertices)
    return nil unless face && face.valid?

    face.reverse! if face.normal.z < 0
    face.material = mat
    face.back_material = mat
    face.pushpull(m(dz))

    face
  end

  # --------------------------------------------------------------
  # 04. THANH THEP HOP NOI HAI DIEM
  # --------------------------------------------------------------

  def add_beam(entities, p1, p2, width, mat)
    direction = p2 - p1
    length = direction.length
    return nil if length < 0.001

    direction.normalize!

    reference = vector(0, 0, 1)
    reference = vector(0, 1, 0) if direction.parallel?(reference)

    axis_x = direction.cross(reference)
    axis_x.normalize!

    axis_y = direction.cross(axis_x)
    axis_y.normalize!

    radius = m(width) / 2.0

    vertices = [
      p1.offset(axis_x, radius).offset(axis_y, radius),
      p1.offset(axis_x, -radius).offset(axis_y, radius),
      p1.offset(axis_x, -radius).offset(axis_y, -radius),
      p1.offset(axis_x, radius).offset(axis_y, -radius)
    ]

    face = entities.add_face(vertices)
    return nil unless face && face.valid?

    face.material = mat
    face.back_material = mat
    face.pushpull(length)

    face
  end

  # --------------------------------------------------------------
  # 05. ONG TRON THEP
  # --------------------------------------------------------------

  def add_cylinder(entities, x, y, z, radius, height, mat, segments = 32)
    circle = entities.add_circle(
      point(x, y, z),
      vector(0, 0, 1),
      m(radius),
      segments
    )

    face = entities.add_face(circle)
    return nil unless face && face.valid?

    face.material = mat
    face.back_material = mat
    face.pushpull(m(height))

    face
  end

  def add_horizontal_cylinder(entities, x, y, z, radius, length, mat)
    center = point(x, y, z)

    circle = entities.add_circle(
      center,
      vector(0, 1, 0),
      m(radius),
      32
    )

    face = entities.add_face(circle)
    return nil unless face && face.valid?

    face.material = mat
    face.back_material = mat
    face.pushpull(m(length))

    face
  end

  # --------------------------------------------------------------
  # 06. MONG BE TONG VA BAN DE COT
  # --------------------------------------------------------------

  def build_foundations(parent)
    g = make_group(parent, '01 - Concrete Foundations')
    e = g.entities

    COLUMN_X_POSITIONS.each do |x|
      # Be tong lot mong
      add_box(
        e,
        x - FOUNDATION_W / 2.0 - 0.15,
        COLUMN_Y - FOUNDATION_D / 2.0 - 0.15,
        -FOUNDATION_H - 0.15,
        FOUNDATION_W + 0.30,
        FOUNDATION_D + 0.30,
        0.15,
        @concrete_dark
      )

      # Mong chinh
      add_box(
        e,
        x - FOUNDATION_W / 2.0,
        COLUMN_Y - FOUNDATION_D / 2.0,
        -FOUNDATION_H,
        FOUNDATION_W,
        FOUNDATION_D,
        FOUNDATION_H,
        @concrete
      )

      # Be co cot
      add_box(
        e,
        x - 0.85,
        COLUMN_Y - 0.85,
        0.0,
        1.70,
        1.70,
        0.30,
        @concrete
      )

      # Ban de cot
      add_box(
        e,
        x - BASE_PLATE_W / 2.0,
        COLUMN_Y - BASE_PLATE_D / 2.0,
        0.30,
        BASE_PLATE_W,
        BASE_PLATE_D,
        BASE_PLATE_T,
        @steel_dark
      )

      # Bu long neo
      [-0.48, 0.48].each do |dx|
        [-0.48, 0.48].each do |dy|
          add_cylinder(
            e,
            x + dx,
            COLUMN_Y + dy,
            0.18,
            0.035,
            0.30,
            @steel_dark,
            12
          )

          add_cylinder(
            e,
            x + dx,
            COLUMN_Y + dy,
            0.57,
            0.065,
            0.035,
            @steel_light,
            12
          )
        end
      end
    end

    g
  end

  # --------------------------------------------------------------
  # 07. HAI COT THEP TRU TRON
  # --------------------------------------------------------------

  def build_columns(parent)
    g = make_group(parent, '02 - Twin Steel Columns')
    e = g.entities

    COLUMN_X_POSITIONS.each do |x|
      # Than cot chinh
      add_cylinder(
        e,
        x,
        COLUMN_Y,
        0.32,
        COLUMN_RADIUS,
        COLUMN_HEIGHT - 0.32,
        @steel_dark,
        COLUMN_SEGMENTS
      )

      # Dai tang cung
      [0.55, 1.10, 4.0, 7.0, 9.2].each do |z|
        add_cylinder(
          e,
          x,
          COLUMN_Y,
          z,
          COLUMN_RADIUS + 0.035,
          0.07,
          @steel,
          COLUMN_SEGMENTS
        )
      end

      # Ban ma dau cot
      add_box(
        e,
        x - 0.70,
        COLUMN_Y - 0.65,
        COLUMN_HEIGHT - 0.15,
        1.40,
        1.30,
        0.20,
        @steel_dark
      )
    end

    g
  end

  # --------------------------------------------------------------
  # 08. COT HOP VA GIANG LIEN KET
  # --------------------------------------------------------------

  def build_secondary_posts(parent)
    g = make_group(parent, '03 - Box Posts and Bracing')
    e = g.entities

    COLUMN_X_POSITIONS.each do |x|
      # Cot hop phia sau cot tron
      add_box(
        e,
        x - 0.13,
        COLUMN_Y + 0.48,
        0.35,
        0.26,
        0.26,
        COLUMN_HEIGHT - 0.50,
        @steel_dark
      )

      # Giang lien ket tren cot
      add_beam(
        e,
        point(x - 0.35, COLUMN_Y + 0.48, 8.8),
        point(x + 0.35, COLUMN_Y + 0.48, 9.5),
        0.07,
        @steel
      )
    end

    # Giang lien ket hai cot
    add_beam(
      e,
      point(COLUMN_X_POSITIONS[0], COLUMN_Y + 0.48, 8.9),
      point(COLUMN_X_POSITIONS[1], COLUMN_Y + 0.48, 8.9),
      0.10,
      @steel_dark
    )

    g
  end

  # --------------------------------------------------------------
  # 09. GIAN KHUNG XUONG THEP KHONG GIAN
  # --------------------------------------------------------------

  def build_truss(parent)
    g = make_group(parent, '04 - Spatial Steel Truss')
    e = g.entities

    x1 = -TRUSS_W / 2.0
    x2 = TRUSS_W / 2.0

    z1 = TRUSS_BOTTOM
    z2 = BOARD_BOTTOM

    y1 = BOARD_FRONT_Y + BOARD_T + 0.15
    y2 = y1 + TRUSS_D

    panels = (TRUSS_W / TRUSS_PANEL).ceil
    step = TRUSS_W / panels.to_f

    [y1, y2].each do |y|
      # Thanh bien tren va duoi
      add_beam(e, point(x1, y, z1), point(x2, y, z1), FRAME_BAR, @steel_dark)
      add_beam(e, point(x1, y, z2), point(x2, y, z2), FRAME_BAR, @steel_dark)

      # Thanh dung va thanh cheo
      panels.times do |i|
        xa = x1 + i * step
        xb = xa + step

        add_beam(
          e,
          point(xa, y, z1),
          point(xa, y, z2),
          0.045,
          @steel
        )

        if i.even?
          add_beam(
            e,
            point(xa, y, z1),
            point(xb, y, z2),
            FRAME_DIAGONAL,
            @steel
          )
        else
          add_beam(
            e,
            point(xa, y, z2),
            point(xb, y, z1),
            FRAME_DIAGONAL,
            @steel
          )
        end
      end

      add_beam(
        e,
        point(x2, y, z1),
        point(x2, y, z2),
        0.045,
        @steel
      )
    end

    # Thanh ngang noi hai mat gian
    (0..panels).each do |i|
      x = x1 + i * step

      add_beam(
        e,
        point(x, y1, z1),
        point(x, y2, z1),
        0.045,
        @steel
      )

      add_beam(
        e,
        point(x, y1, z2),
        point(x, y2, z2),
        0.045,
        @steel
      )
    end

    # Giang cheo khong gian
    panels.times do |i|
      next unless i.even?

      xa = x1 + i * step
      xb = xa + step

      add_beam(
        e,
        point(xa, y1, z1),
        point(xb, y2, z2),
        FRAME_DIAGONAL,
        @steel_dark
      )

      add_beam(
        e,
        point(xa, y2, z1),
        point(xb, y1, z2),
        FRAME_DIAGONAL,
        @steel_dark
      )
    end

    # Gia cuong dung o hai dau pano
    [x1, x2].each do |x|
      add_beam(
        e,
        point(x, y1, z1),
        point(x, y2, z2),
        0.07,
        @steel_dark
      )

      add_beam(
        e,
        point(x, y2, z1),
        point(x, y1, z2),
        0.07,
        @steel_dark
      )
    end

    g
  end

  # --------------------------------------------------------------
  # 10. MAT PANO QUANG CAO
  # --------------------------------------------------------------

  def build_panel(parent)
    g = make_group(parent, '05 - White Billboard Panel')
    e = g.entities

    # Tam pano trang
    add_box(
      e,
      BOARD_CENTER_X - BOARD_W / 2.0,
      BOARD_FRONT_Y,
      BOARD_BOTTOM,
      BOARD_W,
      BOARD_T,
      BOARD_H,
      @panel_white
    )

    # Vien kim loai
    edge = 0.07
    frame_y = BOARD_FRONT_Y - 0.025

    add_box(
      e,
      -BOARD_W / 2.0 - edge,
      frame_y,
      BOARD_BOTTOM + BOARD_H,
      BOARD_W + 2.0 * edge,
      0.06,
      edge,
      @panel_edge
    )

    add_box(
      e,
      -BOARD_W / 2.0 - edge,
      frame_y,
      BOARD_BOTTOM - edge,
      BOARD_W + 2.0 * edge,
      0.06,
      edge,
      @panel_edge
    )

    add_box(
      e,
      -BOARD_W / 2.0 - edge,
      frame_y,
      BOARD_BOTTOM,
      edge,
      0.06,
      BOARD_H,
      @panel_edge
    )

    add_box(
      e,
      BOARD_W / 2.0,
      frame_y,
      BOARD_BOTTOM,
      edge,
      0.06,
      BOARD_H,
      @panel_edge
    )

    g
  end

  # --------------------------------------------------------------
  # 11. SAN CATWALK VA LAN CAN
  # --------------------------------------------------------------

  def build_catwalk(parent)
    g = make_group(parent, '06 - Catwalk and Guardrails')
    e = g.entities

    x1 = -TRUSS_W / 2.0
    x2 = TRUSS_W / 2.0

    y1 = BOARD_FRONT_Y + BOARD_T + 0.15
    y2 = y1 + CATWALK_D

    z = CATWALK_Z

    # Mat san catwalk
    add_box(
      e,
      x1,
      y1,
      z,
      TRUSS_W,
      CATWALK_D,
      0.07,
      @steel_dark
    )

    # Dam doc
    [y1, y2].each do |y|
      add_beam(
        e,
        point(x1, y, z - 0.05),
        point(x2, y, z - 0.05),
        0.07,
        @steel
      )
    end

    # Dam ngang
    panels = (TRUSS_W / 1.5).ceil

    (0..panels).each do |i|
      x = x1 + TRUSS_W * i / panels.to_f

      add_beam(
        e,
        point(x, y1, z - 0.05),
        point(x, y2, z - 0.05),
        0.04,
        @steel
      )
    end

    # Lan can
    rail_top = z + 1.05
    rail_mid = z + 0.52

    [y1, y2].each do |y|
      add_beam(
        e,
        point(x1, y, rail_top),
        point(x2, y, rail_top),
        0.04,
        @steel
      )

      add_beam(
        e,
        point(x1, y, rail_mid),
        point(x2, y, rail_mid),
        0.03,
        @steel
      )

      (0..panels).each do |i|
        x = x1 + TRUSS_W * i / panels.to_f

        add_beam(
          e,
          point(x, y, z),
          point(x, y, rail_top),
          0.03,
          @steel
        )
      end
    end

    g
  end

  # --------------------------------------------------------------
  # 12. THANG LEO AN TOAN
  # --------------------------------------------------------------

  def build_ladder(parent)
    g = make_group(parent, '07 - Safety Ladder')
    e = g.entities

    x = LADDER_X
    y = LADDER_Y

    # Hai thanh doc
    [-0.22, 0.22].each do |dx|
      add_beam(
        e,
        point(x + dx, y, LADDER_BOTTOM),
        point(x + dx, y, LADDER_TOP),
        0.04,
        @steel
      )
    end

    # Bac thang
    z = LADDER_BOTTOM

    while z <= LADDER_TOP
      add_beam(
        e,
        point(x - 0.22, y, z),
        point(x + 0.22, y, z),
        0.03,
        @steel_light
      )

      z += LADDER_STEP
    end

    if ADD_LADDER_CAGE
      cage_y = y + 0.22
      cage_z = 3.0

      [-0.43, 0.43].each do |dx|
        add_beam(
          e,
          point(x + dx, cage_y, cage_z),
          point(x + dx, cage_y, LADDER_TOP),
          0.03,
          @steel_dark
        )
      end

      z = cage_z

      while z <= LADDER_TOP
        add_beam(
          e,
          point(x - 0.43, cage_y, z),
          point(x + 0.43, cage_y, z),
          0.025,
          @steel
        )

        z += 0.60
      end
    end

    g
  end

  # --------------------------------------------------------------
  # 13. DEN CHIEU SANG TREN DINH PANO
  # --------------------------------------------------------------

  def build_lights(parent)
    g = make_group(parent, '08 - Billboard Lights')
    e = g.entities

    count = 8
    spacing = BOARD_W / (count - 1).to_f

    count.times do |i|
      x = -BOARD_W / 2.0 + i * spacing
      z = BOARD_BOTTOM + BOARD_H + 0.18

      # Tay do den
      add_beam(
        e,
        point(x, BOARD_FRONT_Y + 0.05, z),
        point(x, BOARD_FRONT_Y - 0.55, z + 0.18),
        0.035,
        @steel_dark
      )

      # Than den
      add_box(
        e,
        x - 0.18,
        BOARD_FRONT_Y - 0.80,
        z + 0.10,
        0.36,
        0.24,
        0.10,
        @lamp_material
      )

      # Mat den
      add_box(
        e,
        x - 0.15,
        BOARD_FRONT_Y - 0.79,
        z + 0.075,
        0.30,
        0.20,
        0.025,
        @lamp_glass
      )
    end

    g
  end

  # --------------------------------------------------------------
  # 14. CHU NOI 3D TUY CHON
  # --------------------------------------------------------------

  def build_raised_text(parent)
    g = make_group(parent, '09 - Raised Billboard Text')
    e = g.entities

    text_group = e.add_group
    text_group.name = 'Raised Text - Billboard'

    text_group.entities.add_3d_text(
      'OUTDOOR ADVERTISING',
      TextAlignCenter,
      'Arial',
      false,
      true,
      m(0.55),
      0.0,
      0.0,
      true,
      m(0.04)
    )

    text_group.entities.each do |entity|
      next unless entity.respond_to?(:material=)

      entity.material = @text_material
    end

    # Xoay mat chu huong ve phia truoc (-Y)
    transform = Geom::Transformation.translation(
      point(0, BOARD_FRONT_Y - 0.15, BOARD_BOTTOM + 3.2)
    )

    rotation = Geom::Transformation.rotation(
      ORIGIN,
      X_AXIS,
      90.degrees
    )

    text_group.transform!(transform * rotation)

    g
  end

  # --------------------------------------------------------------
  # 15. MAT DAT THAM KHAO
  # --------------------------------------------------------------

  def build_ground(parent)
    g = make_group(parent, '00 - Ground')
    e = g.entities

    add_box(
      e,
      -25.0, -20.0, -1.45,
      50.0, 40.0, 0.20,
      @ground_material
    )

    g
  end

  # --------------------------------------------------------------
  # 16. CAMERA VA HIEN THI
  # --------------------------------------------------------------

  def setup_camera
    model = Sketchup.active_model
    view = model.active_view

    camera = Sketchup::Camera.new(
      point(25, -42, 22),
      point(0, 0, 8),
      vector(0, 0, 1)
    )

    view.camera = camera
    view.zoom_extents
    view.invalidate
  end

  # --------------------------------------------------------------
  # 17. TAO MO HINH
  # --------------------------------------------------------------

  def build
    model = Sketchup.active_model
    model.start_operation('Outdoor Billboard Generator', true)

    begin
      setup_materials

      root = make_group(
        model.active_entities,
        'OUTDOOR BILLBOARD - COMPLETE MODEL'
      )

      build_ground(root) if ADD_GROUND
      build_foundations(root)
      build_columns(root)
      build_secondary_posts(root)
      build_truss(root)
      build_panel(root)
      build_catwalk(root)
      build_ladder(root)
      build_lights(root) if ADD_LIGHTS
      build_raised_text(root) if ADD_RAISED_TEXT

      model.commit_operation
      setup_camera

      puts '============================================'
      puts 'OUTDOOR BILLBOARD CREATED'
      puts "Panel: #{BOARD_W}m x #{BOARD_H}m"
      puts "Panel bottom: #{BOARD_BOTTOM}m"
      puts 'Groups are organized by structural component.'
      puts 'Save the model as SKP when ready.'
      puts '============================================'

    rescue StandardError => error
      model.abort_operation
      puts "Billboard generation failed: #{error.message}"
      puts error.backtrace
    end
  end
end

# --------------------------------------------------------------
# RUN
# --------------------------------------------------------------

OutdoorBillboardGenerator.build