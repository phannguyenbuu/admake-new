# frozen_string_literal: true
# ================================================================
# 3D WALL SIGNAGE - XBIGSWITCH NETWORKS
# SketchUp Ruby Script (.rb)
#
# Mo hinh bien hieu chu noi 3D theo anh tham chieu:
# - Tuong nen mau trang kem
# - Tam bien/backplate an sau chu
# - Chu noi "xbigSwitch" mau den than
# - Bieu tuong X mau xanh cyan
# - Chu "networks" mau xanh duong
# - Logo trang tri phia duoi
# - Chan dem, pat gan tuong, bu long
# - Khung xuong thep va he gia do
# - Tuy chon mong be tong, cot thep, catwalk va thang leo
#
# Don vi: met
# Mat tuong: XZ
# Mat truoc huong ve Y am
#
# Luu file .rb, sau do chay trong SketchUp Ruby Console:
# load 'C:/duong_dan/xbigswitch_signage.rb'
# ================================================================

require 'sketchup.rb'

module XBigSwitchSignage
  extend self

  # --------------------------------------------------------------
  # THONG SO MO HINH
  # --------------------------------------------------------------

  WALL_WIDTH  = 8.0
  WALL_HEIGHT = 5.0
  WALL_DEPTH  = 0.25

  SIGN_WIDTH  = 4.30
  SIGN_HEIGHT = 1.85
  SIGN_DEPTH  = 0.12

  SIGN_CENTER_X = 0.0
  SIGN_FRONT_Y  = -0.10
  SIGN_BOTTOM_Z = 2.15

  MAIN_TEXT = 'xbigSwitch'
  SUB_TEXT  = 'networks'

  MAIN_TEXT_SIZE = 0.76
  SUB_TEXT_SIZE  = 0.62
  TEXT_DEPTH     = 0.075

  CREATE_WALL             = true
  CREATE_BACKPLATE        = false
  CREATE_MOUNTING_BRACKETS = true
  CREATE_OUTDOOR_FOUNDATION = false
  CREATE_CATWALK           = false
  CREATE_LADDER            = false

  # --------------------------------------------------------------
  # DON VI VA HINH HOC
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
    group = parent.add_group
    group.name = name
    group
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
    @wall_mat = material(
      'XBS - Warm White Wall',
      [232, 230, 220]
    )

    @backplate_mat = material(
      'XBS - Hidden Dark Backplate',
      [32, 34, 38]
    )

    @black_mat = material(
      'XBS - Graphite Raised Letters',
      [35, 35, 38]
    )

    @black_side_mat = material(
      'XBS - Letter Side Graphite',
      [16, 18, 21]
    )

    @cyan_mat = material(
      'XBS - Cyan Blue Logo',
      [30, 158, 211]
    )

    @blue_mat = material(
      'XBS - Network Blue',
      [32, 137, 192]
    )

    @logo_gray_mat = material(
      'XBS - Secondary Logo Gray',
      [158, 158, 153]
    )

    @steel_mat = material(
      'XBS - Galvanized Steel',
      [125, 133, 139]
    )

    @steel_dark_mat = material(
      'XBS - Dark Steel',
      [56, 62, 67]
    )

    @concrete_mat = material(
      'XBS - Concrete',
      [143, 142, 135]
    )

    @bolt_mat = material(
      'XBS - Stainless Steel',
      [190, 194, 197]
    )
  end

  # --------------------------------------------------------------
  # KHOI HOP
  # --------------------------------------------------------------

  def add_box(entities, x, y, z, width, depth, height, mat)
    return nil if width <= 0 || depth <= 0 || height <= 0

    corners = [
      point(x, y, z),
      point(x + width, y, z),
      point(x + width, y + depth, z),
      point(x, y + depth, z)
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
  # THANH HOP NOI HAI DIEM
  # --------------------------------------------------------------

  def add_beam(entities, p1, p2, width, mat)
    direction = p2 - p1
    length = direction.length
    return nil if length < 0.001

    direction.normalize!

    reference = vector(0, 0, 1)
    reference = vector(0, 1, 0) if direction.parallel?(reference)

    u = direction.cross(reference)
    u.normalize!

    v = direction.cross(u)
    v.normalize!

    half = m(width) / 2.0

    corners = [
      p1.offset(u, half).offset(v, half),
      p1.offset(u, -half).offset(v, half),
      p1.offset(u, -half).offset(v, -half),
      p1.offset(u, half).offset(v, -half)
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

  def add_cylinder(entities, x, y, z, radius, height, mat, segments = 20)
    edges = entities.add_circle(
      point(x, y, z),
      vector(0, 0, 1),
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
  # TUONG NEN
  # --------------------------------------------------------------

  def build_wall(parent)
    group = make_group(parent, '01 - Architectural Wall')
    entities = group.entities

    add_box(
      entities,
      -WALL_WIDTH / 2.0,
      0.20,
      0.0,
      WALL_WIDTH,
      WALL_DEPTH,
      WALL_HEIGHT,
      @wall_mat
    )

    # Phan tuong trang sau bien hieu
    add_box(
      entities,
      -WALL_WIDTH / 2.0,
      0.10,
      0.0,
      WALL_WIDTH,
      0.12,
      0.08,
      @wall_mat
    )

    group
  end

  # --------------------------------------------------------------
  # TAM BACKPLATE AN SAU CHU (TUY CHON)
  # --------------------------------------------------------------

  def build_backplate(parent)
    group = make_group(parent, '02 - Concealed Sign Backplate')
    entities = group.entities

    x = SIGN_CENTER_X - SIGN_WIDTH / 2.0
    y = SIGN_FRONT_Y + 0.035
    z = SIGN_BOTTOM_Z

    add_box(
      entities,
      x,
      y,
      z,
      SIGN_WIDTH,
      SIGN_DEPTH,
      SIGN_HEIGHT,
      @backplate_mat
    )

    group
  end

  # --------------------------------------------------------------
  # CHU NOI 3D
  # --------------------------------------------------------------

  def build_3d_text(parent, text, size, depth, mat, name)
    group = make_group(parent, name)

    begin
      group.entities.add_3d_text(
        text,
        TextAlignLeft,
        'Arial',
        false,
        true,
        m(size),
        0.0,
        0.0,
        true,
        m(depth)
      )

      group.entities.each do |entity|
        next unless entity.respond_to?(:material=)

        entity.material = mat
        entity.back_material = mat if entity.respond_to?(:back_material=)
      end

      # Chu mac dinh tao tren XY.
      # Xoay 90 do quanh X de dung chu tren mat phang XZ.
      rotation = Geom::Transformation.rotation(
        ORIGIN,
        X_AXIS,
        90.degrees
      )

      # Sau khi xoay, truc Y cua chu tro thanh truc Z am.
      # Dung dich chuyen de dua chu ra truoc mat tuong.
      translation = Geom::Transformation.translation(
        point(0.0, SIGN_FRONT_Y, 0.0)
      )

      group.transform!(translation * rotation)

    rescue StandardError => error
      puts "Loi tao chu #{text}: #{error.message}"
    end

    group
  end

  # --------------------------------------------------------------
  # DAT CHU THEO VI TRI TUONG
  # --------------------------------------------------------------

  def place_text_group(group, x, y, z)
    bounds = group.bounds

    current_min_x = bounds.min.x
    current_min_z = bounds.min.z

    target_x = m(x)
    target_y = m(y)
    target_z = m(z)

    transform = Geom::Transformation.translation(
      Geom::Vector3d.new(
        target_x - current_min_x,
        target_y - bounds.min.y,
        target_z - current_min_z
      )
    )

    group.transform!(transform)
    group
  end

  def build_main_text(parent)
    group = make_group(parent, '03 - Main Raised Text')
    entities = group.entities

    text_group = entities.add_group

    begin
      text_group.entities.add_3d_text(
        MAIN_TEXT,
        TextAlignLeft,
        'Arial',
        false,
        true,
        m(MAIN_TEXT_SIZE),
        0.0,
        0.0,
        true,
        m(TEXT_DEPTH)
      )

      text_group.entities.each do |entity|
        next unless entity.respond_to?(:material=)

        entity.material = @black_mat
        entity.back_material = @black_mat if entity.respond_to?(:back_material=)
      end

      # Dung chu tren mat dung
      rotation = Geom::Transformation.rotation(
        ORIGIN,
        X_AXIS,
        90.degrees
      )

      text_group.transform!(rotation)

      # Dat chu o nua tren cua bien
      bounds = text_group.bounds
      desired_x = m(SIGN_CENTER_X - SIGN_WIDTH * 0.43)
      desired_y = m(SIGN_FRONT_Y - 0.10)
      desired_z = m(SIGN_BOTTOM_Z + SIGN_HEIGHT * 0.46)

      translation = Geom::Transformation.translation(
        Geom::Vector3d.new(
          desired_x - bounds.min.x,
          desired_y - bounds.min.y,
          desired_z - bounds.min.z
        )
      )

      text_group.transform!(translation)
      text_group.name = 'xbigSwitch - Graphite Raised Letters'

    rescue StandardError => error
      puts "Loi tao chu chinh: #{error.message}"
    end

    group
  end

  def build_sub_text(parent)
    group = make_group(parent, '04 - Networks Raised Text')
    entities = group.entities

    text_group = entities.add_group

    begin
      text_group.entities.add_3d_text(
        SUB_TEXT,
        TextAlignLeft,
        'Arial',
        false,
        true,
        m(SUB_TEXT_SIZE),
        0.0,
        0.0,
        true,
        m(TEXT_DEPTH * 0.80)
      )

      text_group.entities.each do |entity|
        next unless entity.respond_to?(:material=)

        entity.material = @blue_mat
        entity.back_material = @blue_mat if entity.respond_to?(:back_material=)
      end

      rotation = Geom::Transformation.rotation(
        ORIGIN,
        X_AXIS,
        90.degrees
      )

      text_group.transform!(rotation)

      bounds = text_group.bounds

      desired_x = m(SIGN_CENTER_X - SIGN_WIDTH * 0.18)
      desired_y = m(SIGN_FRONT_Y - 0.12)
      desired_z = m(SIGN_BOTTOM_Z + SIGN_HEIGHT * 0.13)

      translation = Geom::Transformation.translation(
        Geom::Vector3d.new(
          desired_x - bounds.min.x,
          desired_y - bounds.min.y,
          desired_z - bounds.min.z
        )
      )

      text_group.transform!(translation)
      text_group.name = 'networks - Blue Raised Letters'

    rescue StandardError => error
      puts "Loi tao chu phu: #{error.message}"
    end

    group
  end

  # --------------------------------------------------------------
  # BIEU TUONG X MAU CYAN
  # --------------------------------------------------------------

  def build_x_logo(parent)
    group = make_group(parent, '05 - Cyan X Logo')
    entities = group.entities

    center_x = SIGN_CENTER_X - SIGN_WIDTH * 0.38
    center_z = SIGN_BOTTOM_Z + SIGN_HEIGHT * 0.42
    front_y = SIGN_FRONT_Y - 0.13

    # Hai thanh cheo tao hinh X
    add_beam(
      entities,
      point(center_x - 0.13, front_y, center_z + 0.26),
      point(center_x + 0.13, front_y, center_z - 0.26),
      0.12,
      @cyan_mat
    )

    add_beam(
      entities,
      point(center_x - 0.13, front_y - 0.015, center_z - 0.26),
      point(center_x + 0.13, front_y - 0.015, center_z + 0.26),
      0.12,
      @cyan_mat
    )

    # Thanh vien trang tri nho
    add_beam(
      entities,
      point(center_x - 0.19, front_y - 0.02, center_z + 0.08),
      point(center_x - 0.10, front_y - 0.02, center_z + 0.17),
      0.035,
      @blue_mat
    )

    group
  end

  # --------------------------------------------------------------
  # LOGO PHU PHIA DUOI
  # --------------------------------------------------------------

  def build_secondary_logo(parent)
    group = make_group(parent, '06 - Secondary Brand Mark')
    entities = group.entities

    x = SIGN_CENTER_X - SIGN_WIDTH * 0.16
    z = SIGN_BOTTOM_Z - 0.35
    y = SIGN_FRONT_Y - 0.06

    # Bieu tuong dang la cach dieu
    add_beam(
      entities,
      point(x, y, z),
      point(x + 0.10, y, z + 0.14),
      0.018,
      @logo_gray_mat
    )

    add_beam(
      entities,
      point(x + 0.10, y, z + 0.14),
      point(x + 0.20, y, z + 0.02),
      0.018,
      @logo_gray_mat
    )

    add_beam(
      entities,
      point(x + 0.04, y - 0.01, z + 0.03),
      point(x + 0.16, y - 0.01, z + 0.03),
      0.018,
      @logo_gray_mat
    )

    # Ten thuong hieu phu
    begin
      logo_text = entities.add_group

      logo_text.entities.add_3d_text(
        'ZAHRAT ALMADINA',
        TextAlignLeft,
        'Arial',
        false,
        false,
        m(0.17),
        0.0,
        0.0,
        true,
        m(0.006)
      )

      logo_text.entities.each do |entity|
        next unless entity.respond_to?(:material=)

        entity.material = @logo_gray_mat
      end

      rotation = Geom::Transformation.rotation(
        ORIGIN,
        X_AXIS,
        90.degrees
      )

      logo_text.transform!(rotation)

      bounds = logo_text.bounds
      translation = Geom::Transformation.translation(
        Geom::Vector3d.new(
          m(x + 0.25) - bounds.min.x,
          m(y) - bounds.min.y,
          m(z - 0.03) - bounds.min.z
        )
      )

      logo_text.transform!(translation)

    rescue StandardError => error
      puts "Khong tao duoc logo phu: #{error.message}"
    end

    group
  end

  # --------------------------------------------------------------
  # CHAN DEM VA PAT GAN TUONG
  # --------------------------------------------------------------

  def build_mounting_brackets(parent)
    group = make_group(parent, '07 - Concealed Wall Mounts')
    entities = group.entities

    x_positions = [
      SIGN_CENTER_X - SIGN_WIDTH * 0.38,
      SIGN_CENTER_X - SIGN_WIDTH * 0.13,
      SIGN_CENTER_X + SIGN_WIDTH * 0.13,
      SIGN_CENTER_X + SIGN_WIDTH * 0.38
    ]

    x_positions.each do |x|
      # Pat gan tuong
      add_box(
        entities,
        x - 0.06,
        SIGN_FRONT_Y + 0.04,
        SIGN_BOTTOM_Z + 0.45,
        0.12,
        0.08,
        0.18,
        @steel_dark_mat
      )

      # Tay do
      add_beam(
        entities,
        point(x, SIGN_FRONT_Y + 0.06, SIGN_BOTTOM_Z + 0.52),
        point(x, SIGN_FRONT_Y - SIGN_DEPTH, SIGN_BOTTOM_Z + 0.52),
        0.035,
        @steel_mat
      )

      # Bu long gan tuong
      add_cylinder(
        entities,
        x,
        SIGN_FRONT_Y + 0.13,
        SIGN_BOTTOM_Z + 0.49,
        0.014,
        0.025,
        @bolt_mat,
        12
      )
    end

    group
  end

  # --------------------------------------------------------------
  # MONG BE TONG VA COT THEP TUY CHON
  # --------------------------------------------------------------

  def build_outdoor_foundation(parent)
    group = make_group(parent, '08 - Outdoor Foundations and Columns')
    entities = group.entities

    [-1.40, 1.40].each do |x|
      # Mong be tong
      add_box(
        entities,
        x - 0.35,
        -0.45,
        -1.00,
        0.70,
        0.90,
        1.00,
        @concrete_mat
      )

      # Ban de thep
      add_box(
        entities,
        x - 0.22,
        -0.22,
        0.0,
        0.44,
        0.44,
        0.08,
        @steel_mat
      )

      # Cot thep tron
      add_cylinder(
        entities,
        x,
        0.0,
        0.08,
        0.14,
        SIGN_BOTTOM_Z - 0.08,
        @steel_mat,
        32
      )

      # Dai cot
      add_cylinder(
        entities,
        x,
        0.0,
        SIGN_BOTTOM_Z - 0.12,
        0.17,
        0.12,
        @steel_dark_mat,
        32
      )

      # Bu long neo
      [-0.14, 0.14].each do |dx|
        [-0.14, 0.14].each do |dy|
          add_cylinder(
            entities,
            x + dx,
            dy,
            0.08,
            0.012,
            0.12,
            @bolt_mat,
            12
          )
        end
      end
    end

    # Dam ngang lien ket hai cot
    add_beam(
      entities,
      point(-1.40, 0.0, SIGN_BOTTOM_Z - 0.10),
      point(1.40, 0.0, SIGN_BOTTOM_Z - 0.10),
      0.10,
      @steel_dark_mat
    )

    group
  end

  # --------------------------------------------------------------
  # SAN CATWALK TUY CHON
  # --------------------------------------------------------------

  def build_catwalk(parent)
    group = make_group(parent, '09 - Maintenance Catwalk')
    entities = group.entities

    x1 = SIGN_CENTER_X - SIGN_WIDTH / 2.0 - 0.18
    x2 = SIGN_CENTER_X + SIGN_WIDTH / 2.0 + 0.18
    y1 = SIGN_FRONT_Y + 0.10
    y2 = SIGN_FRONT_Y + 0.70
    z = SIGN_BOTTOM_Z - 0.20

    add_box(
      entities,
      x1,
      y1,
      z,
      x2 - x1,
      y2 - y1,
      0.055,
      @steel_dark_mat
    )

    # Thanh gia cuong ben duoi san
    add_beam(
      entities,
      point(x1, y1, z),
      point(x2, y1, z),
      0.045,
      @steel_mat
    )

    add_beam(
      entities,
      point(x1, y2, z),
      point(x2, y2, z),
      0.045,
      @steel_mat
    )

    0.upto(12) do |i|
      x = x1 + (x2 - x1) * i / 12.0
      add_beam(
        entities,
        point(x, y1, z + 0.03),
        point(x, y2, z + 0.03),
        0.015,
        @steel_mat
      )
    end

    group
  end

  # --------------------------------------------------------------
  # THANG LEO TUY CHON
  # --------------------------------------------------------------

  def build_ladder(parent)
    group = make_group(parent, '10 - Fixed Access Ladder')
    entities = group.entities

    x = SIGN_CENTER_X + SIGN_WIDTH / 2.0 + 0.25
    y = SIGN_FRONT_Y + 0.25
    z0 = 0.10
    z1 = SIGN_BOTTOM_Z + SIGN_HEIGHT

    # Hai thanh dung
    add_beam(
      entities,
      point(x, y, z0),
      point(x, y, z1),
      0.035,
      @steel_dark_mat
    )

    add_beam(
      entities,
      point(x + 0.32, y, z0),
      point(x + 0.32, y, z1),
      0.035,
      @steel_dark_mat
    )

    # Bac thang
    count = ((z1 - z0) / 0.28).to_i

    0.upto(count) do |i|
      z = z0 + i * 0.28

      add_beam(
        entities,
        point(x, y, z),
        point(x + 0.32, y, z),
        0.022,
        @steel_mat
      )
    end

    group
  end

  # --------------------------------------------------------------
  # CAMERA
  # --------------------------------------------------------------

  def set_camera
    model = Sketchup.active_model
    view = model.active_view

    eye = point(3.0, -7.0, 4.0)
    target = point(0.0, 0.0, SIGN_BOTTOM_Z + SIGN_HEIGHT / 2.0)
    up = vector(0, 0, 1)

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

    model.start_operation(
      'Create XBigSwitch 3D Wall Signage',
      true
    )

    begin
      setup_materials

      root = make_group(
        model.active_entities,
        'XBIGSWITCH NETWORKS - 3D WALL SIGN'
      )

      build_wall(root) if CREATE_WALL

      build_backplate(root) if CREATE_BACKPLATE

      build_main_text(root)
      build_sub_text(root)
      build_x_logo(root)
      build_secondary_logo(root)

      build_mounting_brackets(root) if CREATE_MOUNTING_BRACKETS

      build_outdoor_foundation(root) if CREATE_OUTDOOR_FOUNDATION
      build_catwalk(root) if CREATE_CATWALK
      build_ladder(root) if CREATE_LADDER

      model.commit_operation
      set_camera

      puts '=============================================='
      puts 'XBIGSWITCH NETWORKS SIGNAGE CREATED'
      puts "Main text: #{MAIN_TEXT}"
      puts "Sub text: #{SUB_TEXT}"
      puts "Sign width: #{SIGN_WIDTH} m"
      puts "Sign height: #{SIGN_HEIGHT} m"
      puts 'Raised graphite letters and cyan/blue logo included.'
      puts '=============================================='

    rescue StandardError => error
      model.abort_operation

      puts "SIGNAGE MODEL ERROR: #{error.message}"
      puts error.backtrace
    end
  end
end

XBigSwitchSignage.build