# frozen_string_literal: true
# ================================================================
# OUTDOOR BILLBOARD - SKETCHUP RUBY
# Bien quang cao ngoai troi 2 tru, gian thep, catwalk, thang leo
# Mo hinh concept theo anh tham chieu
#
# Don vi thong so: met
# Tuong thich: SketchUp Ruby API
# Cach chay:
#   1. Luu file thanh outdoor_billboard.rb
#   2. Mo Window > Ruby Console trong SketchUp
#   3. Chay: load 'C:/duong_dan/outdoor_billboard.rb'
#
# Cau truc:
#   00 - Canh quan va mat duong
#   01 - Mong be tong
#   02 - Cot thep tru tron
#   03 - Cot hop va ban ma
#   04 - Khung gian thep khong gian
#   05 - Pano quang cao
#   06 - San catwalk
#   07 - Thang leo an toan
#   08 - Tay do va den chieu sang
#   09 - Bu long va lien ket
#   10 - Chu noi tuy chon
#
# Luu y: Mo hinh minh hoa, khong thay the thiet ke ket cau.
# ================================================================

require 'sketchup.rb'

module OutdoorBillboard3D
  extend self

  # --------------------------------------------------------------
  # 01. THONG SO CHINH
  # --------------------------------------------------------------

  BOARD_WIDTH  = 18.0
  BOARD_HEIGHT = 5.8
  BOARD_DEPTH  = 0.18
  BOARD_BOTTOM = 10.0
  BOARD_CENTER_X = 0.0

  FRONT_Y = -0.45
  BACK_Y  = FRONT_Y + BOARD_DEPTH

  COLUMN_X = [-5.4, 5.4].freeze
  COLUMN_Y = 0.55
  COLUMN_RADIUS = 0.48
  COLUMN_BASE_Z = 0.0
  COLUMN_TOP_Z = BOARD_BOTTOM - 0.15

  FOUNDATION_WIDTH  = 2.4
  FOUNDATION_DEPTH  = 2.4
  FOUNDATION_HEIGHT = 1.15

  TRUSS_WIDTH = 19.0
  TRUSS_HEIGHT = 1.0
  TRUSS_DEPTH = 1.15
  TRUSS_BOTTOM = BOARD_BOTTOM - TRUSS_HEIGHT
  TRUSS_PANEL_COUNT = 24

  CATWALK_WIDTH = 19.6
  CATWALK_DEPTH = 0.95
  CATWALK_Z = TRUSS_BOTTOM - 0.12

  LADDER_X = 5.95
  LADDER_Y = 0.45
  LADDER_BOTTOM = 0.35
  LADDER_TOP = BOARD_BOTTOM - 0.05
  LADDER_STEP = 0.30

  BAR_MAIN = 0.075
  BAR_SECONDARY = 0.045
  BAR_DIAGONAL = 0.035

  CREATE_GROUND = true
  CREATE_ROAD = true
  CREATE_LIGHTS = true
  CREATE_LADDER_CAGE = true
  CREATE_RAISED_TEXT = false

  # --------------------------------------------------------------
  # 02. DON VI VA HAM HINH HOC
  # --------------------------------------------------------------

  def u(value)
    value.to_f * 39.37007874015748
  end

  def p3(x, y, z)
    Geom::Point3d.new(u(x), u(y), u(z))
  end

  def v3(x, y, z)
    Geom::Vector3d.new(x, y, z)
  end

  def make_group(parent, name)
    group = parent.add_group
    group.name = name
    group
  end

  def make_material(name, rgb, alpha = 1.0)
    materials = Sketchup.active_model.materials
    mat = materials[name] || materials.add(name)
    mat.color = Sketchup::Color.new(*rgb)
    mat.alpha = alpha
    mat
  end

  def setup_materials
    @concrete = make_material('OB3D Concrete', [158, 158, 151])
    @concrete_dark = make_material('OB3D Concrete Dark', [111, 116, 118])

    @steel = make_material('OB3D Galvanized Steel', [143, 163, 175])
    @steel_dark = make_material('OB3D Structural Steel', [43, 59, 72])
    @steel_light = make_material('OB3D Steel Highlight', [204, 216, 223])
    @steel_blue = make_material('OB3D Blue Steel', [91, 132, 157])

    @panel = make_material('OB3D White Billboard', [255, 255, 253])
    @panel_edge = make_material('OB3D Panel Aluminium Edge', [179, 191, 198])

    @lamp_body = make_material('OB3D Lamp Housing', [53, 61, 67])
    @lamp_glass = make_material('OB3D Lamp Glass', [255, 244, 210])

    @road = make_material('OB3D Asphalt', [90, 92, 94])
    @road_line = make_material('OB3D Road Markings', [245, 245, 237])
    @grass = make_material('OB3D Green Ground', [112, 151, 78])
    @text_mat = make_material('OB3D Raised Text', [34, 49, 56])
  end

  # --------------------------------------------------------------
  # 03. KHOI HOP
  # --------------------------------------------------------------

  def add_box(entities, x, y, z, dx, dy, dz, mat)
    return nil if dx <= 0 || dy <= 0 || dz <= 0

    corners = [
      p3(x,      y,      z),
      p3(x + dx, y,      z),
      p3(x + dx, y + dy, z),
      p3(x,      y + dy, z)
    ]

    face = entities.add_face(corners)
    return nil unless face && face.valid?

    face.reverse! if face.normal.z < 0
    face.material = mat
    face.back_material = mat
    face.pushpull(u(dz))
    face
  end

  # --------------------------------------------------------------
  # 04. THANH THEP HOP NOI HAI DIEM
  # --------------------------------------------------------------

  def add_beam(entities, start_point, end_point, width, mat)
    direction = end_point - start_point
    length = direction.length
    return nil if length < 0.001

    direction.normalize!

    reference = v3(0, 0, 1)
    reference = v3(0, 1, 0) if direction.parallel?(reference)

    axis_x = direction.cross(reference)
    axis_x.normalize!

    axis_y = direction.cross(axis_x)
    axis_y.normalize!

    half = u(width) / 2.0

    vertices = [
      start_point.offset(axis_x, half).offset(axis_y, half),
      start_point.offset(axis_x, -half).offset(axis_y, half),
      start_point.offset(axis_x, -half).offset(axis_y, -half),
      start_point.offset(axis_x, half).offset(axis_y, -half)
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

  def add_cylinder(entities, x, y, z, radius, height, mat, segments = 36)
    edges = entities.add_circle(
      p3(x, y, z),
      v3(0, 0, 1),
      u(radius),
      segments
    )

    face = entities.add_face(edges)
    return nil unless face && face.valid?

    face.material = mat
    face.back_material = mat
    face.pushpull(u(height))
    face
  end

  def add_horizontal_cylinder(entities, x, y, z, radius, length, mat)
    edges = entities.add_circle(
      p3(x, y, z),
      v3(0, 1, 0),
      u(radius),
      24
    )

    face = entities.add_face(edges)
    return nil unless face && face.valid?

    face.material = mat
    face.back_material = mat
    face.pushpull(u(length))
    face
  end

  # --------------------------------------------------------------
  # 06. MAT DUONG VA CANH QUAN
  # --------------------------------------------------------------

  def build_ground(parent)
    g = make_group(parent, '00 - Ground and Road')
    e = g.entities

    if CREATE_GROUND
      add_box(
        e, -30, -25, -1.35,
        60, 50, 0.25,
        @grass
      )
    end

    if CREATE_ROAD
      # Mat duong nam truoc bien
      add_box(
        e, -7.0, -28.0, -1.08,
        14.0, 35.0, 0.05,
        @road
      )

      # Le duong hai ben
      add_box(
        e, -7.35, -28.0, -1.02,
        0.25, 35.0, 0.06,
        @road_line
      )

      add_box(
        e, 7.10, -28.0, -1.02,
        0.25, 35.0, 0.06,
        @road_line
      )

      # Vach dut net tim duong
      18.times do |i|
        y = -27.0 + i * 1.75
        add_box(
          e, -0.09, y, -1.015,
          0.18, 0.85, 0.025,
          @road_line
        )
      end
    end

    g
  end

  # --------------------------------------------------------------
  # 07. MONG BE TONG
  # --------------------------------------------------------------

  def build_foundations(parent)
    g = make_group(parent, '01 - Reinforced Concrete Foundations')
    e = g.entities

    COLUMN_X.each do |x|
      # Lop be tong lot
      add_box(
        e,
        x - FOUNDATION_WIDTH / 2.0 - 0.18,
        COLUMN_Y - FOUNDATION_DEPTH / 2.0 - 0.18,
        -FOUNDATION_HEIGHT - 0.15,
        FOUNDATION_WIDTH + 0.36,
        FOUNDATION_DEPTH + 0.36,
        0.15,
        @concrete_dark
      )

      # Mong chinh
      add_box(
        e,
        x - FOUNDATION_WIDTH / 2.0,
        COLUMN_Y - FOUNDATION_DEPTH / 2.0,
        -FOUNDATION_HEIGHT,
        FOUNDATION_WIDTH,
        FOUNDATION_DEPTH,
        FOUNDATION_HEIGHT,
        @concrete
      )

      # Be co cot
      add_box(
        e,
        x - 0.78,
        COLUMN_Y - 0.78,
        0.0,
        1.56,
        1.56,
        0.32,
        @concrete
      )

      # Ban de thep
      add_box(
        e,
        x - 0.68,
        COLUMN_Y - 0.68,
        0.32,
        1.36,
        1.36,
        0.10,
        @steel_dark
      )

      # Bu long neo
      [-0.48, 0.48].each do |dx|
        [-0.48, 0.48].each do |dy|
          add_cylinder(
            e,
            x + dx,
            COLUMN_Y + dy,
            0.22,
            0.035,
            0.28,
            @steel_dark,
            12
          )

          add_cylinder(
            e,
            x + dx,
            COLUMN_Y + dy,
            0.43,
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
  # 08. HAI COT THEP TRU TRON
  # --------------------------------------------------------------

  def build_columns(parent)
    g = make_group(parent, '02 - Twin Round Steel Columns')
    e = g.entities

    COLUMN_X.each do |x|
      # Cot tron chinh
      add_cylinder(
        e,
        x,
        COLUMN_Y,
        0.42,
        COLUMN_RADIUS,
        COLUMN_TOP_Z - 0.42,
        @steel,
        48
      )

      # Dai thep tang cung
      [0.55, 1.10, 4.0, 7.0, 9.25].each do |z|
        add_cylinder(
          e,
          x,
          COLUMN_Y,
          z,
          COLUMN_RADIUS + 0.035,
          0.06,
          @steel_dark,
          48
        )
      end

      # Nap cot tren
      add_cylinder(
        e,
        x,
        COLUMN_Y,
        COLUMN_TOP_Z - 0.05,
        COLUMN_RADIUS + 0.025,
        0.12,
        @steel_light,
        48
      )
    end

    g
  end

  # --------------------------------------------------------------
  # 09. COT HOP VA KHUNG LIEN KET
  # --------------------------------------------------------------

  def build_box_posts(parent)
    g = make_group(parent, '03 - Box Posts and Connections')
    e = g.entities

    COLUMN_X.each do |x|
      # Cot hop phia sau tru tron
      add_box(
        e,
        x - 0.15,
        COLUMN_Y + 0.45,
        0.42,
        0.30,
        0.30,
        COLUMN_TOP_Z - 0.42,
        @steel_dark
      )

      # Ban ma dau cot
      add_box(
        e,
        x - 0.70,
        COLUMN_Y - 0.55,
        TRUSS_BOTTOM - 0.12,
        1.40,
        1.20,
        0.18,
        @steel_blue
      )

      # Gia tam ngang
      add_beam(
        e,
        p3(x - 0.75, COLUMN_Y + 0.48, TRUSS_BOTTOM - 0.1),
        p3(x + 0.75, COLUMN_Y + 0.48, TRUSS_BOTTOM - 0.1),
        0.12,
        @steel_dark
      )
    end

    g
  end

  # --------------------------------------------------------------
  # 10. KHUNG GIAN THEP KHONG GIAN
  # --------------------------------------------------------------

  def build_truss(parent)
    g = make_group(parent, '04 - Spatial Steel Truss')
    e = g.entities

    x1 = -TRUSS_WIDTH / 2.0
    x2 = TRUSS_WIDTH / 2.0
    y1 = BACK_Y + 0.12
    y2 = y1 + TRUSS_DEPTH
    z1 = TRUSS_BOTTOM
    z2 = BOARD_BOTTOM

    panels = TRUSS_PANEL_COUNT
    step = TRUSS_WIDTH / panels.to_f

    # Hai mat gian truoc va sau
    [y1, y2].each do |y|
      add_beam(e, p3(x1, y, z1), p3(x2, y, z1), BAR_MAIN, @steel_dark)
      add_beam(e, p3(x1, y, z2), p3(x2, y, z2), BAR_MAIN, @steel_dark)

      panels.times do |i|
        xa = x1 + i * step
        xb = xa + step

        add_beam(
          e,
          p3(xa, y, z1),
          p3(xa, y, z2),
          BAR_SECONDARY,
          @steel
        )

        if i.even?
          add_beam(
            e,
            p3(xa, y, z1),
            p3(xb, y, z2),
            BAR_DIAGONAL,
            @steel_light
          )
        else
          add_beam(
            e,
            p3(xa, y, z2),
            p3(xb, y, z1),
            BAR_DIAGONAL,
            @steel_light
          )
        end
      end
    end

    # Thanh noi hai mat gian theo chieu sau
    (0..panels).each do |i|
      x = x1 + i * step

      add_beam(
        e,
        p3(x, y1, z1),
        p3(x, y2, z1),
        BAR_SECONDARY,
        @steel
      )

      add_beam(
        e,
        p3(x, y1, z2),
        p3(x, y2, z2),
        BAR_SECONDARY,
        @steel
      )
    end

    # Gian cheo theo chieu sau tao ket cau khong gian
    panels.times do |i|
      next unless i.even?

      xa = x1 + i * step
      xb = xa + step

      add_beam(
        e,
        p3(xa, y1, z1),
        p3(xb, y2, z2),
        BAR_DIAGONAL,
        @steel_dark
      )

      add_beam(
        e,
        p3(xa, y2, z1),
        p3(xb, y1, z2),
        BAR_DIAGONAL,
        @steel_dark
      )
    end

    # Khung dung hai dau
    [x1, x2].each do |x|
      add_beam(
        e,
        p3(x, y1, z1),
        p3(x, y1, z2),
        BAR_MAIN,
        @steel_dark
      )

      add_beam(
        e,
        p3(x, y2, z1),
        p3(x, y2, z2),
        BAR_MAIN,
        @steel_dark
      )
    end

    g
  end

  # --------------------------------------------------------------
  # 11. TAM PANO TRANG
  # --------------------------------------------------------------

  def build_panel(parent)
    g = make_group(parent, '05 - White Billboard Face')
    e = g.entities

    x1 = -BOARD_WIDTH / 2.0
    x2 = BOARD_WIDTH / 2.0
    z1 = BOARD_BOTTOM
    z2 = BOARD_BOTTOM + BOARD_HEIGHT

    # Tam pano chinh
    add_box(
      e,
      x1,
      FRONT_Y,
      z1,
      BOARD_WIDTH,
      BOARD_DEPTH,
      BOARD_HEIGHT,
      @panel
    )

    # Khung vien nhom
    edge = 0.07
    ey = FRONT_Y - 0.04

    add_box(
      e, x1 - edge, ey, z2,
      BOARD_WIDTH + 2 * edge, 0.07, edge,
      @panel_edge
    )

    add_box(
      e, x1 - edge, ey, z1 - edge,
      BOARD_WIDTH + 2 * edge, 0.07, edge,
      @panel_edge
    )

    add_box(
      e, x1 - edge, ey, z1,
      edge, 0.07, BOARD_HEIGHT,
      @panel_edge
    )

    add_box(
      e, x2, ey, z1,
      edge, 0.07, BOARD_HEIGHT,
      @panel_edge
    )

    # Thanh gia cuong phia sau pano
    frame_y = BACK_Y + 0.02

    add_beam(
      e,
      p3(x1, frame_y, z1 + 0.12),
      p3(x2, frame_y, z1 + 0.12),
      0.08,
      @steel_dark
    )

    add_beam(
      e,
      p3(x1, frame_y, z2 - 0.12),
      p3(x2, frame_y, z2 - 0.12),
      0.08,
      @steel_dark
    )

    g
  end

  # --------------------------------------------------------------
  # 12. SAN CATWALK VA LAN CAN
  # --------------------------------------------------------------

  def build_catwalk(parent)
    g = make_group(parent, '06 - Catwalk Platform and Guardrails')
    e = g.entities

    x1 = -CATWALK_WIDTH / 2.0
    x2 = CATWALK_WIDTH / 2.0
    y1 = BACK_Y + 0.05
    y2 = y1 + CATWALK_DEPTH
    z = CATWALK_Z

    # Mat san kim loai
    add_box(
      e,
      x1, y1, z,
      CATWALK_WIDTH, CATWALK_DEPTH, 0.08,
      @steel_dark
    )

    # Dam doc hai ben
    [y1, y2].each do |y|
      add_beam(
        e,
        p3(x1, y, z - 0.04),
        p3(x2, y, z - 0.04),
        0.08,
        @steel
      )
    end

    # Dam ngang catwalk
    divisions = 24

    (0..divisions).each do |i|
      x = x1 + CATWALK_WIDTH * i / divisions.to_f

      add_beam(
        e,
        p3(x, y1, z - 0.04),
        p3(x, y2, z - 0.04),
        0.035,
        @steel
      )
    end

    # Lan can o phia ngoai
    rail_z = z + 1.05
    mid_z = z + 0.52

    [y1, y2].each do |y|
      add_beam(
        e,
        p3(x1, y, rail_z),
        p3(x2, y, rail_z),
        0.045,
        @steel
      )

      add_beam(
        e,
        p3(x1, y, mid_z),
        p3(x2, y, mid_z),
        0.03,
        @steel
      )

      (0..divisions).each do |i|
        x = x1 + CATWALK_WIDTH * i / divisions.to_f

        add_beam(
          e,
          p3(x, y, z),
          p3(x, y, rail_z),
          0.025,
          @steel
        )
      end
    end

    # Tay do tam console
    [-1, 1].each do |side|
      4.times do |i|
        x = side * (4.2 + i * 3.1)

        add_beam(
          e,
          p3(x, y1, z),
          p3(x + side * 0.65, y1 - 0.55, z - 0.35),
          0.06,
          @steel_dark
        )
      end
    end

    g
  end

  # --------------------------------------------------------------
  # 13. THANG LEO VA LONG BAO VE
  # --------------------------------------------------------------

  def build_ladder(parent)
    g = make_group(parent, '07 - Safety Ladder')
    e = g.entities

    x = LADDER_X
    y = LADDER_Y
    z0 = LADDER_BOTTOM
    z1 = LADDER_TOP

    # Thanh doc
    [-0.20, 0.20].each do |dx|
      add_beam(
        e,
        p3(x + dx, y, z0),
        p3(x + dx, y, z1),
        0.04,
        @steel
      )
    end

    # Bac thang
    z = z0

    while z <= z1
      add_beam(
        e,
        p3(x - 0.20, y, z),
        p3(x + 0.20, y, z),
        0.028,
        @steel_light
      )

      z += LADDER_STEP
    end

    if CREATE_LADDER_CAGE
      cage_y = y + 0.22
      cage_bottom = 3.0

      [-0.42, 0.42].each do |dx|
        add_beam(
          e,
          p3(x + dx, cage_y, cage_bottom),
          p3(x + dx, cage_y, z1),
          0.03,
          @steel_dark
        )
      end

      z = cage_bottom

      while z <= z1
        add_beam(
          e,
          p3(x - 0.42, cage_y, z),
          p3(x + 0.42, cage_y, z),
          0.025,
          @steel
        )

        z += 0.60
      end
    end

    g
  end

  # --------------------------------------------------------------
  # 14. DEN CHIEU SANG TREN DINH BIEN
  # --------------------------------------------------------------

  def build_lights(parent)
    g = make_group(parent, '08 - Billboard Lighting')
    e = g.entities

    count = 5
    spacing = BOARD_WIDTH / (count - 1).to_f

    count.times do |i|
      x = -BOARD_WIDTH / 2.0 + i * spacing
      z = BOARD_BOTTOM + BOARD_HEIGHT + 0.15

      # Tay den dua ra phia truoc
      add_beam(
        e,
        p3(x, FRONT_Y + 0.04, z),
        p3(x, FRONT_Y - 0.55, z + 0.18),
        0.04,
        @steel_dark
      )

      # Than den
      add_box(
        e,
        x - 0.22,
        FRONT_Y - 0.78,
        z + 0.10,
        0.44,
        0.24,
        0.12,
        @lamp_body
      )

      # Mat den
      add_box(
        e,
        x - 0.18,
        FRONT_Y - 0.79,
        z + 0.075,
        0.36,
        0.20,
        0.025,
        @lamp_glass
      )
    end

    g
  end

  # --------------------------------------------------------------
  # 15. CHU NOI TUY CHON
  # --------------------------------------------------------------

  def build_raised_text(parent)
    g = make_group(parent, '09 - Optional Raised Lettering')
    e = g.entities

    lettering = e.add_group
    lettering.name = 'Raised Billboard Text'

    lettering.entities.add_3d_text(
      'OUTDOOR ADVERTISING',
      TextAlignCenter,
      'Arial',
      false,
      true,
      u(0.65),
      0.0,
      0.0,
      true,
      u(0.04)
    )

    lettering.entities.each do |entity|
      next unless entity.respond_to?(:material=)

      entity.material = @text_mat
    end

    rotation = Geom::Transformation.rotation(
      ORIGIN,
      X_AXIS,
      90.degrees
    )

    translation = Geom::Transformation.translation(
      p3(0, FRONT_Y - 0.12, BOARD_BOTTOM + 2.4)
    )

    lettering.transform!(translation * rotation)

    g
  end

  # --------------------------------------------------------------
  # 16. CAMERA
  # --------------------------------------------------------------

  def setup_camera
    model = Sketchup.active_model
    view = model.active_view

    camera = Sketchup::Camera.new(
      p3(0, -36, 16),
      p3(0, 0, 7.5),
      v3(0, 0, 1)
    )

    view.camera = camera
    view.perspective = true
    view.zoom_extents
    view.invalidate
  end

  # --------------------------------------------------------------
  # 17. TAO MO HINH TONG
  # --------------------------------------------------------------

  def build
    model = Sketchup.active_model
    model.start_operation('Create Outdoor Billboard 3D', true)

    begin
      setup_materials

      root = make_group(
        model.active_entities,
        'OUTDOOR BILLBOARD - COMPLETE MODEL'
      )

      build_ground(root)
      build_foundations(root)
      build_columns(root)
      build_box_posts(root)
      build_truss(root)
      build_panel(root)
      build_catwalk(root)
      build_ladder(root)
      build_lights(root) if CREATE_LIGHTS
      build_raised_text(root) if CREATE_RAISED_TEXT

      model.commit_operation
      setup_camera

      puts '=============================================='
      puts 'OUTDOOR BILLBOARD CREATED SUCCESSFULLY'
      puts "Pano: #{BOARD_WIDTH}m x #{BOARD_HEIGHT}m"
      puts "Cao do day pano: #{BOARD_BOTTOM}m"
      puts "So cot chinh: #{COLUMN_X.length}"
      puts 'Cac bo phan da duoc phan nhom rieng.'
      puts '=============================================='

    rescue StandardError => error
      model.abort_operation
      puts "ERROR: #{error.message}"
      puts error.backtrace
    end
  end
end

# --------------------------------------------------------------
# RUN GENERATOR
# --------------------------------------------------------------

OutdoorBillboard3D.build