# frozen_string_literal: true
# ================================================================
# 3D SIGNAGE - ILLUMINATED FACADE SIGN
# SketchUp Ruby (.rb)
#
# Mo hinh bien hieu chu noi phat sang theo anh tham chieu:
# - Tuong mat tien va khoi nen
# - Tam bien hop kim / alu mau den
# - Khung xuong thep hop
# - Chu noi 3D SIGNAGE
# - Lop mat chu acrylic trang xanh
# - Vien chu va lop dem tao hieu ung chieu sau
# - Den LED, vo den, thanh gan tuong
# - Gia do, ban ma, bulong
# - Mong be tong, cot thep, catwalk va thang leo tuy chon
#
# Don vi: met
# Mat dung: XZ
# Mat truoc bien huong ve truc Y am
#
# Chay trong SketchUp Ruby Console:
# load 'C:/duong_dan/illuminated_signage.rb'
#
# Luu y: Mo hinh concept, khong thay the ho so ket cau.
# ================================================================

require 'sketchup.rb'

module IlluminatedSignage
  extend self

  # --------------------------------------------------------------
  # THONG SO CHINH
  # --------------------------------------------------------------

  SIGN_W = 5.20
  SIGN_H = 1.18
  SIGN_D = 0.32
  SIGN_X = 0.0
  SIGN_Y = 0.0
  SIGN_Z = 4.20

  WALL_W = 8.00
  WALL_H = 5.60
  WALL_D = 0.35

  LETTER_TEXT = '3D SIGNAGE'
  LETTER_SIZE = 0.88
  LETTER_DEPTH = 0.12
  LETTER_GAP = 0.08

  CREATE_WALL = true
  CREATE_SIGN_FRAME = true
  CREATE_LED_HOUSING = true
  CREATE_MOUNTING_HARDWARE = true
  CREATE_OUTDOOR_SUPPORTS = false
  CREATE_CATWALK = false
  CREATE_LADDER = false

  # --------------------------------------------------------------
  # DON VI
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
    g = parent.add_group
    g.name = name
    g
  end

  # --------------------------------------------------------------
  # VAT LIEU
  # --------------------------------------------------------------

  def mat(name, rgb, alpha = 1.0)
    materials = Sketchup.active_model.materials
    material = materials[name] || materials.add(name)
    material.color = Sketchup::Color.new(*rgb)
    material.alpha = alpha
    material
  end

  def setup_materials
    @wall = mat('Signage - Charcoal Facade', [25, 27, 30])
    @wall_inner = mat('Signage - Recessed Dark Wall', [12, 14, 17])

    @body = mat('Signage - Black Aluminium Composite', [18, 21, 25])
    @body_side = mat('Signage - Black Metal Edge', [5, 7, 10])

    @steel = mat('Signage - Galvanized Steel', [100, 112, 124])
    @steel_light = mat('Signage - Brushed Aluminium', [177, 190, 202])
    @steel_dark = mat('Signage - Dark Steel', [39, 48, 58])

    @white = mat('Signage - LED White Acrylic', [215, 245, 255])
    @cyan = mat('Signage - Ice Blue LED', [65, 190, 255])
    @blue_glow = mat('Signage - Blue Glow', [38, 118, 255], 0.30)
    @led_core = mat('Signage - LED Core', [240, 252, 255])

    @concrete = mat('Signage - Concrete Foundation', [132, 134, 132])
    @glass = mat('Signage - Shop Glass', [38, 53, 62], 0.35)
    @rubber = mat('Signage - Cable Rubber', [12, 14, 17])
  end

  # --------------------------------------------------------------
  # KHOI HOP
  # --------------------------------------------------------------

  def box(entities, x, y, z, dx, dy, dz, material)
    return nil if dx <= 0 || dy <= 0 || dz <= 0

    corners = [
      pt(x, y, z),
      pt(x + dx, y, z),
      pt(x + dx, y + dy, z),
      pt(x, y + dy, z)
    ]

    face = entities.add_face(corners)
    return nil unless face && face.valid?

    face.material = material
    face.back_material = material
    face.reverse! if face.normal.z < 0
    face.pushpull(m(dz))
    face
  end

  # --------------------------------------------------------------
  # THANH HOP NOI HAI DIEM
  # --------------------------------------------------------------

  def beam(entities, a, b, width, material)
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

    half = m(width) / 2.0

    points = [
      a.offset(u, half).offset(v, half),
      a.offset(u, -half).offset(v, half),
      a.offset(u, -half).offset(v, -half),
      a.offset(u, half).offset(v, -half)
    ]

    face = entities.add_face(points)
    return nil unless face && face.valid?

    face.material = material
    face.back_material = material
    face.pushpull(length)
    face
  end

  # --------------------------------------------------------------
  # TRU TRON
  # --------------------------------------------------------------

  def cylinder(entities, x, y, z, radius, height, material, segments = 20)
    edges = entities.add_circle(
      pt(x, y, z),
      vec(0, 0, 1),
      m(radius),
      segments
    )

    face = entities.add_face(edges)
    return nil unless face && face.valid?

    face.material = material
    face.back_material = material
    face.pushpull(m(height))
    face
  end

  # --------------------------------------------------------------
  # MAT TUONG MAT TIEN
  # --------------------------------------------------------------

  def build_wall(parent)
    g = group(parent, '01 - Shopfront Facade')
    e = g.entities

    box(
      e,
      -WALL_W / 2.0,
      0.15,
      0.0,
      WALL_W,
      WALL_D,
      WALL_H,
      @wall
    )

    # Khoi cua hang ben duoi
    box(e, -WALL_W / 2.0, -0.01, 0.0, WALL_W, 0.18, 2.90, @wall_inner)

    # Khung cua kinh
    frame_y = -0.045
    door_z = 0.0
    door_h = 2.55

    [-2.65, -0.90, 0.90, 2.65].each do |x|
      box(
        e,
        x - 0.035,
        frame_y,
        door_z,
        0.07,
        0.07,
        door_h,
        @steel_dark
      )
    end

    box(
      e,
      -2.70,
      frame_y,
      door_h,
      5.40,
      0.08,
      0.08,
      @steel_dark
    )

    # Mat kinh
    box(
      e,
      -2.55,
      -0.005,
      0.12,
      1.55,
      0.025,
      2.35,
      @glass
    )

    box(
      e,
      -0.80,
      -0.005,
      0.12,
      1.60,
      0.025,
      2.35,
      @glass
    )

    box(
      e,
      1.00,
      -0.005,
      0.12,
      1.55,
      0.025,
      2.35,
      @glass
    )

    g
  end

  # --------------------------------------------------------------
  # VO BIEN HIEU
  # --------------------------------------------------------------

  def build_sign_body(parent)
    g = group(parent, '02 - Main Sign Box')
    e = g.entities

    x = SIGN_X - SIGN_W / 2.0
    y = SIGN_Y - SIGN_D
    z = SIGN_Z

    # Vo hop chinh
    box(
      e,
      x,
      y,
      z,
      SIGN_W,
      SIGN_D,
      SIGN_H,
      @body
    )

    # Lop mat den truoc
    box(
      e,
      x + 0.045,
      y - 0.018,
      z + 0.045,
      SIGN_W - 0.09,
      0.025,
      SIGN_H - 0.09,
      @body
    )

    # Vien nhom bao quanh
    beam(
      e,
      pt(x, y - 0.035, z),
      pt(x + SIGN_W, y - 0.035, z),
      0.035,
      @steel_dark
    )

    beam(
      e,
      pt(x, y - 0.035, z + SIGN_H),
      pt(x + SIGN_W, y - 0.035, z + SIGN_H),
      0.035,
      @steel_dark
    )

    beam(
      e,
      pt(x, y - 0.035, z),
      pt(x, y - 0.035, z + SIGN_H),
      0.035,
      @steel_dark
    )

    beam(
      e,
      pt(x + SIGN_W, y - 0.035, z),
      pt(x + SIGN_W, y - 0.035, z + SIGN_H),
      0.035,
      @steel_dark
    )

    g
  end

  # --------------------------------------------------------------
  # KHUNG XUONG THEP
  # --------------------------------------------------------------

  def build_sign_frame(parent)
    g = group(parent, '03 - Sign Structural Frame')
    e = g.entities

    x1 = SIGN_X - SIGN_W / 2.0 + 0.10
    x2 = SIGN_X + SIGN_W / 2.0 - 0.10
    y = SIGN_Y - 0.03
    z1 = SIGN_Z + 0.10
    z2 = SIGN_Z + SIGN_H - 0.10

    # Khung chu nhat
    beam(e, pt(x1, y, z1), pt(x2, y, z1), 0.055, @steel)
    beam(e, pt(x1, y, z2), pt(x2, y, z2), 0.055, @steel)
    beam(e, pt(x1, y, z1), pt(x1, y, z2), 0.055, @steel)
    beam(e, pt(x2, y, z1), pt(x2, y, z2), 0.055, @steel)

    # Thanh dung gia cuong
    1.upto(5) do |i|
      x = x1 + (x2 - x1) * i / 6.0
      beam(e, pt(x, y, z1), pt(x, y, z2), 0.035, @steel_dark)
    end

    # Thanh ngang ben trong
    z_mid = (z1 + z2) / 2.0
    beam(e, pt(x1, y, z_mid), pt(x2, y, z_mid), 0.035, @steel_dark)

    # Thanh cheo gia cuong
    0.upto(5) do |i|
      xa = x1 + (x2 - x1) * i / 6.0
      xb = x1 + (x2 - x1) * (i + 1) / 6.0

      beam(
        e,
        pt(xa, y, z1),
        pt(xb, y, z2),
        0.018,
        @steel_dark
      )

      beam(
        e,
        pt(xa, y, z2),
        pt(xb, y, z1),
        0.018,
        @steel_dark
      )
    end

    g
  end

  # --------------------------------------------------------------
  # CHU NOI 3D PHAT SANG
  # --------------------------------------------------------------

  def create_text_group(parent, text, size, material)
    g = group(parent, "Illuminated Text - #{text}")

    begin
      g.entities.add_3d_text(
        text,
        TextAlignCenter,
        'Arial',
        false,
        true,
        m(size),
        0.0,
        0.0,
        true,
        m(LETTER_DEPTH)
      )

      g.entities.each do |entity|
        next unless entity.respond_to?(:material=)

        entity.material = material
        entity.back_material = material if entity.respond_to?(:back_material=)
      end

      # Xoay chu tu mat phang XY sang mat dung XZ
      rotation = Geom::Transformation.rotation(
        ORIGIN,
        X_AXIS,
        90.degrees
      )

      # Dat mat chu ra truoc bien
      translation = Geom::Transformation.translation(
        pt(SIGN_X, SIGN_Y - SIGN_D - 0.075, SIGN_Z + 0.18)
      )

      g.transform!(translation * rotation)

    rescue StandardError => error
      puts "Khong tao duoc chu '#{text}': #{error.message}"
    end

    g
  end

  def build_sign_text(parent)
    g = group(parent, '04 - 3D SIGNAGE Illuminated Letters')

    # Lop chu phat sang mau xanh nhat
    create_text_group(
      g,
      LETTER_TEXT,
      LETTER_SIZE,
      @white
    )

    # Thanh LED trang tri phia sau chu
    e = g.entities
    x1 = SIGN_X - SIGN_W * 0.40
    x2 = SIGN_X + SIGN_W * 0.40
    z = SIGN_Z + SIGN_H * 0.20
    y = SIGN_Y - SIGN_D - 0.095

    beam(
      e,
      pt(x1, y, z),
      pt(x2, y, z),
      0.012,
      @cyan
    )

    g
  end

  # --------------------------------------------------------------
  # VO DEN LED VA HIEU UNG VIEN SANG
  # --------------------------------------------------------------

  def build_led_housing(parent)
    g = group(parent, '05 - LED Backlight and Glow')
    e = g.entities

    x1 = SIGN_X - SIGN_W / 2.0 + 0.12
    x2 = SIGN_X + SIGN_W / 2.0 - 0.12
    z1 = SIGN_Z + 0.12
    z2 = SIGN_Z + SIGN_H - 0.12
    y = SIGN_Y - SIGN_D - 0.05

    # Thanh LED sau chu
    beam(e, pt(x1, y, z1), pt(x2, y, z1), 0.025, @cyan)
    beam(e, pt(x1, y, z2), pt(x2, y, z2), 0.025, @cyan)
    beam(e, pt(x1, y, z1), pt(x1, y, z2), 0.025, @cyan)
    beam(e, pt(x2, y, z1), pt(x2, y, z2), 0.025, @cyan)

    # Cum LED nho phia sau bien
    0.upto(9) do |i|
      x = x1 + (x2 - x1) * i / 9.0
      cylinder(
        e,
        x,
        SIGN_Y - 0.02,
        SIGN_Z + SIGN_H + 0.015,
        0.012,
        0.02,
        @led_core,
        12
      )
    end

    g
  end

  # --------------------------------------------------------------
  # GIA DO VA BU LONG GAN TUONG
  # --------------------------------------------------------------

  def build_mounting_hardware(parent)
    g = group(parent, '06 - Wall Mounting Brackets')
    e = g.entities

    x_positions = [
      SIGN_X - SIGN_W * 0.38,
      SIGN_X - SIGN_W * 0.13,
      SIGN_X + SIGN_W * 0.13,
      SIGN_X + SIGN_W * 0.38
    ]

    x_positions.each do |x|
      # Ban ma sat gan tuong
      box(
        e,
        x - 0.10,
        SIGN_Y + 0.01,
        SIGN_Z + 0.18,
        0.20,
        0.08,
        0.25,
        @steel_dark
      )

      # Tay console
      beam(
        e,
        pt(x, SIGN_Y + 0.04, SIGN_Z + 0.20),
        pt(x, SIGN_Y - SIGN_D + 0.02, SIGN_Z + 0.20),
        0.045,
        @steel
      )

      # Bu long
      cylinder(
        e,
        x,
        SIGN_Y + 0.10,
        SIGN_Z + 0.24,
        0.018,
        0.025,
        @steel_light,
        16
      )
    end

    g
  end

  # --------------------------------------------------------------
  # MONG BE TONG VA COT THEP NGOAI TROI TUY CHON
  # --------------------------------------------------------------

  def build_outdoor_supports(parent)
    g = group(parent, '07 - Outdoor Columns and Foundations')
    e = g.entities

    [-1.60, 1.60].each do |x|
      # Mong be tong
      box(
        e,
        x - 0.45,
        -0.50,
        -1.20,
        0.90,
        1.00,
        1.20,
        @concrete
      )

      # Ban de
      box(
        e,
        x - 0.24,
        -0.24,
        0.0,
        0.48,
        0.48,
        0.08,
        @steel
      )

      # Cot thep tron
      cylinder(
        e,
        x,
        0.0,
        0.08,
        0.15,
        SIGN_Z - 0.15,
        @steel,
        32
      )

      # Dai cot
      cylinder(
        e,
        x,
        0.0,
        SIGN_Z - 0.20,
        0.18,
        0.12,
        @steel_dark,
        32
      )

      # Bu long neo
      [-0.15, 0.15].each do |dx|
        [-0.15, 0.15].each do |dy|
          cylinder(
            e,
            x + dx,
            dy,
            0.08,
            0.012,
            0.16,
            @steel_light,
            12
          )
        end
      end
    end

    # Dam ngang lien ket cot
    beam(
      e,
      pt(-1.60, 0.0, SIGN_Z - 0.12),
      pt(1.60, 0.0, SIGN_Z - 0.12),
      0.12,
      @steel_dark
    )

    g
  end

  # --------------------------------------------------------------
  # SAN CATWALK TUY CHON
  # --------------------------------------------------------------

  def build_catwalk(parent)
    g = group(parent, '08 - Maintenance Catwalk')
    e = g.entities

    x1 = SIGN_X - SIGN_W / 2.0 - 0.20
    x2 = SIGN_X + SIGN_W / 2.0 + 0.20
    y1 = SIGN_Y + 0.10
    y2 = SIGN_Y + 0.85
    z = SIGN_Z - 0.18

    box(
      e,
      x1,
      y1,
      z,
      x2 - x1,
      y2 - y1,
      0.07,
      @steel_dark
    )

    # Dam doc
    beam(e, pt(x1, y1, z), pt(x2, y1, z), 0.06, @steel)
    beam(e, pt(x1, y2, z), pt(x2, y2, z), 0.06, @steel)

    # Thanh ngang san
    0.upto(12) do |i|
      x = x1 + (x2 - x1) * i / 12.0
      beam(
        e,
        pt(x, y1, z + 0.04),
        pt(x, y2, z + 0.04),
        0.018,
        @steel
      )
    end

    g
  end

  # --------------------------------------------------------------
  # THANG LEO TUY CHON
  # --------------------------------------------------------------

  def build_ladder(parent)
    g = group(parent, '09 - Fixed Access Ladder')
    e = g.entities

    x = SIGN_X + SIGN_W / 2.0 + 0.25
    y = SIGN_Y + 0.20
    z0 = 0.10
    z1 = SIGN_Z + SIGN_H - 0.10

    # Hai thanh dung
    beam(e, pt(x, y, z0), pt(x, y, z1), 0.045, @steel_dark)
    beam(e, pt(x + 0.35, y, z0), pt(x + 0.35, y, z1), 0.045, @steel_dark)

    # Bac thang
    steps = ((z1 - z0) / 0.28).to_i
    0.upto(steps) do |i|
      z = z0 + i * 0.28
      beam(
        e,
        pt(x, y, z),
        pt(x + 0.35, y, z),
        0.025,
        @steel
      )
    end

    g
  end

  # --------------------------------------------------------------
  # DAY DIEN VA ONG LUON
  # --------------------------------------------------------------

  def build_cable_conduit(parent)
    g = group(parent, '10 - Electrical Conduit')
    e = g.entities

    x = SIGN_X + SIGN_W / 2.0 - 0.12
    y = SIGN_Y + 0.08
    z1 = SIGN_Z - 0.20
    z2 = SIGN_Z + SIGN_H + 0.10

    beam(
      e,
      pt(x, y, z1),
      pt(x, y, z2),
      0.025,
      @rubber
    )

    # Hop dau noi dien
    box(
      e,
      x - 0.06,
      y - 0.04,
      SIGN_Z + SIGN_H - 0.10,
      0.12,
      0.08,
      0.12,
      @steel_dark
    )

    g
  end

  # --------------------------------------------------------------
  # CAMERA
  # --------------------------------------------------------------

  def set_camera
    model = Sketchup.active_model
    view = model.active_view

    eye = pt(2.8, -7.0, 6.2)
    target = pt(0.0, 0.0, SIGN_Z + SIGN_H / 2.0)
    up = vec(0, 0, 1)

    camera = Sketchup::Camera.new(eye, target, up)
    camera.perspective = true
    view.camera = camera

    view.zoom_extents
    view.invalidate
  end

  # --------------------------------------------------------------
  # MAIN
  # --------------------------------------------------------------

  def build
    model = Sketchup.active_model
    model.start_operation('Create Illuminated 3D Signage', true)

    begin
      setup_materials

      root = group(
        model.active_entities,
        '3D SIGNAGE - Illuminated Facade Sign'
      )

      build_wall(root) if CREATE_WALL
      build_sign_body(root)
      build_sign_frame(root) if CREATE_SIGN_FRAME
      build_sign_text(root)

      build_led_housing(root) if CREATE_LED_HOUSING
      build_mounting_hardware(root) if CREATE_MOUNTING_HARDWARE
      build_outdoor_supports(root) if CREATE_OUTDOOR_SUPPORTS
      build_catwalk(root) if CREATE_CATWALK
      build_ladder(root) if CREATE_LADDER
      build_cable_conduit(root) if CREATE_LED_HOUSING

      model.commit_operation
      set_camera

      puts '=============================================='
      puts '3D SIGNAGE MODEL CREATED'
      puts "Sign: #{SIGN_W} x #{SIGN_H} x #{SIGN_D} m"
      puts "Text: #{LETTER_TEXT}"
      puts 'LED blue-white lighting and steel frame included.'
      puts '=============================================='

    rescue StandardError => error
      model.abort_operation
      puts "SIGNAGE MODEL ERROR: #{error.message}"
      puts error.backtrace
    end
  end
end

IlluminatedSignage.build