# frozen_string_literal: true
# ================================================================
# AHIMSA DENTAL SPA - 3D SIGNAGE MODEL FOR SKETCHUP
# Bien hieu mica/acrylic den, chu noi vang kim loai va logo hoa sen.
#
# THANH PHAN:
# 01. Tam bien dang chu nhat bo goc
# 02. Lop nen acrylic den mo
# 03. Tam lot lung va lop dem tao chieu sau
# 04. Logo hoa sen cach dieu mau vang
# 05. Chu noi AHIMSA
# 06. Dong chu DENTAL SPA
# 07. Bon nut stand-off kim loai
# 08. Moc va khung gan tuong
# 09. Tuong op da mau kem de trinh bay
# 10. Tuy chon mong, cot va khung bien ngoai troi
#
# Don vi: met
# Bien duoc dung doc, mat truoc huong ve truc Y am.
#
# Chay trong SketchUp Ruby Console:
# load 'C:/duong_dan/ahimsa_signage.rb'
#
# Mo hinh concept, khong thay the ho so ket cau.
# ================================================================

require 'sketchup.rb'

module AhimsaSignage
  extend self

  # --------------------------------------------------------------
  # THONG SO
  # --------------------------------------------------------------

  SIGN_W = 1.50
  SIGN_H = 1.15
  SIGN_T = 0.055
  CORNER_R = 0.075

  SIGN_X = 0.0
  SIGN_Y = 0.0
  SIGN_Z = 2.00

  WALL_W = 3.2
  WALL_H = 3.8
  WALL_D = 0.22

  LETTER_DEPTH = 0.018
  LETTER_H = 0.245
  SUBTITLE_H = 0.095

  SCREW_R = 0.014
  SCREW_OFFSET_X = 0.075
  SCREW_OFFSET_Z = 0.075

  CREATE_WALL = true
  CREATE_OUTDOOR_SUPPORTS = false

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

  def material(name, rgb, alpha = 1.0)
    mats = Sketchup.active_model.materials
    mat = mats[name] || mats.add(name)
    mat.color = Sketchup::Color.new(*rgb)
    mat.alpha = alpha
    mat
  end

  def setup_materials
    @black = material('AHIMSA Matte Black Acrylic', [24, 25, 23])
    @black_edge = material('AHIMSA Black Acrylic Edge', [10, 11, 10])
    @gold = material('AHIMSA Brushed Champagne Gold', [207, 174, 91])
    @gold_light = material('AHIMSA Gold Highlight', [241, 220, 153])
    @gold_dark = material('AHIMSA Gold Side', [112, 83, 34])

    @steel = material('AHIMSA Stainless Steel', [184, 190, 188])
    @steel_dark = material('AHIMSA Screw Shadow', [70, 72, 70])

    @wall = material('AHIMSA Warm Beige Stone', [215, 207, 188])
    @wall_line = material('AHIMSA Stone Joints', [190, 180, 161])

    @concrete = material('AHIMSA Concrete', [153, 153, 145])
    @structural_steel = material('AHIMSA Structural Steel', [75, 84, 88])
  end

  # --------------------------------------------------------------
  # KHOI HOP
  # --------------------------------------------------------------

  def box(entities, x, y, z, dx, dy, dz, mat)
    return nil if dx <= 0 || dy <= 0 || dz <= 0

    points = [
      pt(x, y, z),
      pt(x + dx, y, z),
      pt(x + dx, y + dy, z),
      pt(x, y + dy, z)
    ]

    face = entities.add_face(points)
    return nil unless face && face.valid?

    face.reverse! if face.normal.z < 0
    face.material = mat
    face.back_material = mat
    face.pushpull(m(dz))
    face
  end

  # --------------------------------------------------------------
  # TAM PHANG DUNG BO GOC
  # Mat bien nam tren mat phang XZ, huong nhin ra truc Y am.
  # --------------------------------------------------------------

  def rounded_rectangle(entities, x, y, z, width, height, radius, mat, segments = 8)
    r = [radius, width / 2.0, height / 2.0].min
    corners = [
      [x + width - r, z + height - r, 0.0],
      [x + r, z + height - r, 90.0],
      [x + r, z + r, 180.0],
      [x + width - r, z + r, 270.0]
    ]

    points = []

    corners.each do |cx, cz, start_angle|
      segments.times do |i|
        angle = (start_angle + i * 90.0 / (segments - 1)) * Math::PI / 180.0
        points << pt(
          cx + r * Math.cos(angle),
          y,
          cz + r * Math.sin(angle)
        )
      end
    end

    face = entities.add_face(points)
    return nil unless face && face.valid?

    face.material = mat
    face.back_material = mat
    face
  end

  def make_vertical_panel(parent, name, x, y, z, width, height, thickness, radius, mat)
    g = group(parent, name)
    e = g.entities

    face = rounded_rectangle(
      e, x, y, z, width, height, radius, mat
    )

    if face && face.valid?
      # Tao do day theo truc Y, mat truoc huong ve Y am.
      face.reverse! if face.normal.y > 0
      face.pushpull(m(thickness))
    end

    g
  end

  # --------------------------------------------------------------
  # THANH THEP NOI HAI DIEM
  # --------------------------------------------------------------

  def beam(entities, a, b, width, mat)
    direction = b - a
    length = direction.length
    return nil if length < 0.001

    direction.normalize!

    ref = vec(0, 0, 1)
    ref = vec(0, 1, 0) if direction.parallel?(ref)

    ux = direction.cross(ref)
    ux.normalize!
    uy = direction.cross(ux)
    uy.normalize!

    h = m(width) / 2.0

    corners = [
      a.offset(ux, h).offset(uy, h),
      a.offset(ux, -h).offset(uy, h),
      a.offset(ux, -h).offset(uy, -h),
      a.offset(ux, h).offset(uy, -h)
    ]

    face = entities.add_face(corners)
    return nil unless face && face.valid?

    face.material = mat
    face.back_material = mat
    face.pushpull(length)
    face
  end

  # --------------------------------------------------------------
  # TRU TRON
  # --------------------------------------------------------------

  def cylinder(entities, x, y, z, radius, height, mat, segments = 24)
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
  # TUONG TRANG TRI
  # --------------------------------------------------------------

  def build_wall(parent)
    g = group(parent, '01 - Beige Stone Wall')
    e = g.entities

    box(
      e,
      -WALL_W / 2.0,
      0.10,
      0.0,
      WALL_W,
      WALL_D,
      WALL_H,
      @wall
    )

    # Duong ron da ngang nhe
    [0.55, 1.20, 1.85, 2.50, 3.15].each do |z|
      box(
        e,
        -WALL_W / 2.0,
        0.075,
        z,
        WALL_W,
        0.035,
        0.008,
        @wall_line
      )
    end

    g
  end

  # --------------------------------------------------------------
  # TAM BIEN DEN
  # --------------------------------------------------------------

  def build_sign_panel(parent)
    g = group(parent, '02 - Rounded Matte Black Sign')
    e = g.entities

    x = SIGN_X - SIGN_W / 2.0
    z = SIGN_Z
    y = SIGN_Y

    # Lop dem sau, nho hon tam bien chinh
    make_vertical_panel(
      g,
      'Rear Shadow Spacer',
      x + 0.012,
      y + 0.025,
      z + 0.012,
      SIGN_W - 0.024,
      SIGN_H - 0.024,
      0.035,
      CORNER_R * 0.85,
      @black_edge
    )

    # Tam acrylic den
    make_vertical_panel(
      g,
      'Front Matte Black Acrylic',
      x,
      y - 0.015,
      z,
      SIGN_W,
      SIGN_H,
      SIGN_T,
      CORNER_R,
      @black
    )

    g
  end

  # --------------------------------------------------------------
  # BU LONG / NUT STANDOFF
  # --------------------------------------------------------------

  def build_mounting_bolts(parent)
    g = group(parent, '03 - Four Stainless Stand-off Bolts')
    e = g.entities

    x_left = SIGN_X - SIGN_W / 2.0 + SCREW_OFFSET_X
    x_right = SIGN_X + SIGN_W / 2.0 - SCREW_OFFSET_X

    z_bottom = SIGN_Z + SCREW_OFFSET_Z
    z_top = SIGN_Z + SIGN_H - SCREW_OFFSET_Z

    [[x_left, z_bottom], [x_left, z_top],
     [x_right, z_bottom], [x_right, z_top]].each do |x, z|

      # Than spacer gan tuong, truc truong song song Y
      cylinder(
        e,
        x,
        SIGN_Y - 0.005,
        z,
        0.022,
        0.035,
        @steel_dark,
        20
      )

      # Dau nut kim loai tren mat bien
      cylinder(
        e,
        x,
        SIGN_Y - 0.065,
        z,
        0.018,
        0.055,
        @steel,
        24
      )

      # Mat nut sang hon
      cylinder(
        e,
        x,
        SIGN_Y - 0.070,
        z,
        0.012,
        0.008,
        @gold_light,
        24
      )
    end

    g
  end

  # --------------------------------------------------------------
  # CHU NOI
  # --------------------------------------------------------------

  def create_3d_text(parent, label, size, x, y, z, mat, font = 'Arial')
    g = group(parent, "Raised Letter - #{label}")

    begin
      g.entities.add_3d_text(
        label,
        TextAlignCenter,
        font,
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

        entity.material = mat
        entity.back_material = mat if entity.respond_to?(:back_material=)
      end

      # Xoay chu de mat chu dung theo mat bien.
      rotation = Geom::Transformation.rotation(
        ORIGIN,
        X_AXIS,
        90.degrees
      )

      translation = Geom::Transformation.translation(pt(x, y, z))
      g.transform!(translation * rotation)

    rescue StandardError => error
      puts "Text error '#{label}': #{error.message}"
    end

    g
  end

  def build_main_text(parent)
    g = group(parent, '04 - AHIMSA Raised Gold Typography')

    # Vi tri chu can giua tren tam bien
    create_3d_text(
      g,
      'AHIMSA',
      LETTER_H,
      SIGN_X,
      SIGN_Y - 0.105,
      SIGN_Z + 0.37,
      @gold,
      'Arial'
    )

    create_3d_text(
      g,
      'DENTAL SPA',
      SUBTITLE_H,
      SIGN_X,
      SIGN_Y - 0.105,
      SIGN_Z + 0.16,
      @gold_light,
      'Arial'
    )

    g
  end

  # --------------------------------------------------------------
  # LOGO HOA SEN CACH DIEU
  # Dung cac canh cong va thanh dang la de tao hinh logo don gian.
  # --------------------------------------------------------------

  def build_lotus_logo(parent)
    g = group(parent, '05 - Champagne Gold Lotus Logo')
    e = g.entities

    cx = SIGN_X
    y = SIGN_Y - 0.11
    base_z = SIGN_Z + 0.73

    # Than la trung tam
    beam(
      e,
      pt(cx, y, base_z),
      pt(cx, y, base_z + 0.30),
      0.040,
      @gold
    )

    # Canh hoa sen trai va phai
    petals = [
      [-0.25, 0.02, -0.20, 0.24],
      [-0.20, 0.02, -0.12, 0.42],
      [-0.12, 0.02, -0.06, 0.53],
      [-0.06, 0.02,  0.00, 0.59],
      [ 0.00, 0.02,  0.06, 0.53],
      [ 0.06, 0.02,  0.12, 0.42],
      [ 0.12, 0.02,  0.20, 0.24],
      [ 0.20, 0.02,  0.25, 0.02]
    ]

    petals.each do |dx1, dz1, dx2, dz2|
      beam(
        e,
        pt(cx + dx1, y, base_z + dz1),
        pt(cx + dx2, y, base_z + dz2),
        0.045,
        @gold
      )
    end

    # La hoa hai ben
    beam(
      e,
      pt(cx - 0.27, y, base_z + 0.04),
      pt(cx - 0.33, y, base_z + 0.18),
      0.035,
      @gold_light
    )

    beam(
      e,
      pt(cx + 0.27, y, base_z + 0.04),
      pt(cx + 0.33, y, base_z + 0.18),
      0.035,
      @gold_light
    )

    g
  end

  # --------------------------------------------------------------
  # KHUNG GAN TUONG VA THANH THEP
  # --------------------------------------------------------------

  def build_rear_mounting_frame(parent)
    g = group(parent, '06 - Rear Mounting Frame')
    e = g.entities

    x1 = SIGN_X - SIGN_W / 2.0 + 0.12
    x2 = SIGN_X + SIGN_W / 2.0 - 0.12
    z1 = SIGN_Z + 0.12
    z2 = SIGN_Z + SIGN_H - 0.12
    y = SIGN_Y + SIGN_T + 0.02

    beam(e, pt(x1, y, z1), pt(x2, y, z1), 0.025, @structural_steel)
    beam(e, pt(x1, y, z2), pt(x2, y, z2), 0.025, @structural_steel)
    beam(e, pt(x1, y, z1), pt(x1, y, z2), 0.025, @structural_steel)
    beam(e, pt(x2, y, z1), pt(x2, y, z2), 0.025, @structural_steel)

    # Hai thanh gia cuong dung
    [-0.35, 0.35].each do |dx|
      beam(
        e,
        pt(SIGN_X + dx, y, z1),
        pt(SIGN_X + dx, y, z2),
        0.020,
        @structural_steel
      )
    end

    g
  end

  # --------------------------------------------------------------
  # KHUNG, MONG, COT NGOAI TROI TUY CHON
  # Mac dinh tat vi anh tham chieu la bien gan tuong.
  # --------------------------------------------------------------

  def build_optional_outdoor_structure(parent)
    g = group(parent, '07 - Optional Outdoor Sign Structure')
    e = g.entities

    [-0.45, 0.45].each do |x|
      # Mong be tong
      box(
        e,
        x - 0.35,
        -0.45,
        -0.85,
        0.70,
        0.70,
        0.85,
        @concrete
      )

      # Ban de cot
      box(
        e,
        x - 0.22,
        -0.22,
        0.0,
        0.44,
        0.44,
        0.06,
        @steel
      )

      # Cot thep hop
      box(
        e,
        x - 0.09,
        -0.09,
        0.06,
        0.18,
        0.18,
        SIGN_Z - 0.10,
        @structural_steel
      )

      # Bu long neo
      [-0.14, 0.14].each do |dx|
        [-0.14, 0.14].each do |dy|
          cylinder(
            e,
            x + dx,
            dy,
            0.06,
            0.012,
            0.14,
            @steel,
            12
          )
        end
      end
    end

    # Dam ngang lien ket hai cot
    beam(
      e,
      pt(-0.45, 0.0, SIGN_Z - 0.10),
      pt(0.45, 0.0, SIGN_Z - 0.10),
      0.08,
      @structural_steel
    )

    g
  end

  # --------------------------------------------------------------
  # CAMERA
  # --------------------------------------------------------------

  def set_camera
    model = Sketchup.active_model
    view = model.active_view

    eye = pt(2.3, -4.2, 3.15)
    target = pt(0.0, 0.0, SIGN_Z + SIGN_H / 2.0)
    up = vec(0, 0, 1)

    view.camera = Sketchup::Camera.new(eye, target, up)
    view.camera.perspective = true
    view.zoom_extents
    view.invalidate
  end

  # --------------------------------------------------------------
  # TAO MO HINH
  # --------------------------------------------------------------

  def build
    model = Sketchup.active_model
    model.start_operation('Create AHIMSA Dental Spa Sign', true)

    begin
      setup_materials

      root = group(
        model.active_entities,
        'AHIMSA DENTAL SPA - COMPLETE SIGNAGE'
      )

      build_wall(root) if CREATE_WALL
      build_sign_panel(root)
      build_rear_mounting_frame(root)
      build_mounting_bolts(root)
      build_lotus_logo(root)
      build_main_text(root)

      if CREATE_OUTDOOR_SUPPORTS
        build_optional_outdoor_structure(root)
      end

      model.commit_operation
      set_camera

      puts '=============================================='
      puts 'AHIMSA DENTAL SPA SIGNAGE CREATED'
      puts "Kich thuoc tam bien: #{SIGN_W} x #{SIGN_H} m"
      puts "Do day tam bien: #{SIGN_T} m"
      puts 'Thanh phan: tam den, chu noi vang, logo hoa sen,'
      puts 'bon nut stand-off va khung gan tuong.'
      puts '=============================================='

    rescue StandardError => error
      model.abort_operation
      puts "AHIMSA SIGNAGE ERROR: #{error.message}"
      puts error.backtrace
    end
  end
end

AhimsaSignage.build