# encoding: UTF-8
# ============================================================
# SKETCHUP RUBY - DUSEK DESIGN 3D WALL SIGN
# Mô hình biển hiệu văn phòng kiến trúc gắn tường gạch.
#
# Thành phần:
# - Tường gạch trang trí và mạch vữa
# - Tấm biển nền xám than
# - 4 chốt inox trang trí ở góc
# - Chữ nổi "dušek design"
# - Dòng chữ phụ "ARCHITECTURAL AND PLANNING CONSULTANTS"
# - Chiều sâu chữ nổi và bóng đổ hình học
#
# Đơn vị: mm
# Cách sử dụng:
# 1. Lưu thành dusek_design_sign.rb
# 2. Mở SketchUp > Window > Ruby Console
# 3. Chạy: load 'dusek_design_sign.rb'
# 4. Chọn Extensions > Create Dusek Design Sign
#
# Lưu ý:
# Đây là mô hình trực quan theo ảnh tham chiếu.
# Không phải hồ sơ thiết kế kết cấu hoặc thi công.
# ============================================================

require 'sketchup.rb'

module DusekDesignSign
  extend self

  MODEL_NAME = 'DUSEK_DESIGN_WALL_SIGN'

  # Kích thước tổng thể
  WALL_WIDTH  = 2400.mm
  WALL_HEIGHT = 1900.mm
  WALL_DEPTH  = 220.mm

  SIGN_WIDTH  = 1500.mm
  SIGN_HEIGHT = 560.mm
  SIGN_DEPTH  = 24.mm

  # Tọa độ mặt trước tường theo trục X-Z.
  # Mặt trước hướng về phía Y âm.
  SIGN_X = -750.mm
  SIGN_Z = 1050.mm
  SIGN_Y = -WALL_DEPTH

  BRICK_HEIGHT = 75.mm
  BRICK_LENGTH = 230.mm
  MORTAR_GAP = 9.mm

  def material(model, name, rgb)
    m = model.materials[name] || model.materials.add(name)
    m.color = Sketchup::Color.new(*rgb)
    m
  end

  def create_materials(model)
    @brick_colors = [
      material(model, 'Brick_Ochre', [174, 119, 70]),
      material(model, 'Brick_Sand', [205, 166, 111]),
      material(model, 'Brick_Rust', [151, 83, 55]),
      material(model, 'Brick_Light', [218, 190, 146]),
      material(model, 'Brick_Brown', [132, 96, 66])
    ]

    @mortar = material(model, 'Mortar_Warm_Grey', [169, 151, 127])
    @sign = material(model, 'Sign_Charcoal_Grey', [83, 84, 82])
    @sign_edge = material(model, 'Sign_Edge_Dark', [48, 49, 48])
    @letter = material(model, 'Raised_Letter_White', [245, 244, 235])
    @metal = material(model, 'Brushed_Stainless_Steel', [220, 220, 210])
    @metal_side = material(model, 'Metal_Shadow', [90, 91, 87])
  end

  def group(entities, name)
    g = entities.add_group
    g.name = name
    g
  end

  def make_box(entities, name, x, y, z, sx, sy, sz, mat)
    g = group(entities, name)

    pts = [
      Geom::Point3d.new(x, y, z),
      Geom::Point3d.new(x + sx, y, z),
      Geom::Point3d.new(x + sx, y + sy, z),
      Geom::Point3d.new(x, y + sy, z),
      Geom::Point3d.new(x, y, z + sz),
      Geom::Point3d.new(x + sx, y, z + sz),
      Geom::Point3d.new(x + sx, y + sy, z + sz),
      Geom::Point3d.new(x, y + sy, z + sz)
    ]

    face_indices = [
      [0, 3, 2, 1],
      [4, 5, 6, 7],
      [0, 1, 5, 4],
      [1, 2, 6, 5],
      [2, 3, 7, 6],
      [3, 0, 4, 7]
    ]

    face_indices.each do |indices|
      face = g.entities.add_face(indices.map { |i| pts[i] })
      next unless face

      face.material = mat
      face.back_material = mat
    end

    g
  end

  def make_cylinder(entities, name, center, radius, depth, mat, segments = 24)
    x, y, z = center
    g = group(entities, name)

    base = Geom::Point3d.new(x, y, z)
    normal = Geom::Vector3d.new(0, -1, 0)

    circle = g.entities.add_circle(base, normal, radius, segments)
    face = g.entities.add_face(circle)

    if face
      face.material = mat
      face.back_material = mat
      face.reverse! if face.normal.y > 0
      face.pushpull(depth)
    end

    g
  end

  # ------------------------------------------------------------
  # TƯỜNG GẠCH
  # ------------------------------------------------------------

  def build_wall(entities)
    wall = group(entities, 'Brick_Wall')

    make_box(
      wall.entities, 'Mortar_Background',
      -WALL_WIDTH / 2, 0, 0,
      WALL_WIDTH, WALL_DEPTH, WALL_HEIGHT,
      @mortar
    )

    row_count = (WALL_HEIGHT / BRICK_HEIGHT).ceil + 1

    row_count.times do |row|
      z = row * BRICK_HEIGHT
      offset = row.odd? ? BRICK_LENGTH / 2 : 0
      x = -WALL_WIDTH / 2 - BRICK_LENGTH

      while x < WALL_WIDTH / 2
        brick_width = BRICK_LENGTH - MORTAR_GAP
        brick_height = BRICK_HEIGHT - MORTAR_GAP
        x0 = x + offset

        if x0 < WALL_WIDTH / 2 && x0 + brick_width > -WALL_WIDTH / 2
          make_box(
            wall.entities, "Brick_R#{row}_X#{x.to_i}",
            x0, -4.mm, z,
            brick_width, WALL_DEPTH + 4.mm, brick_height,
            @brick_colors[(row + (x / BRICK_LENGTH).to_i.abs) % @brick_colors.length]
          )
        end

        x += BRICK_LENGTH
      end
    end

    wall
  end

  # ------------------------------------------------------------
  # TẤM BIỂN
  # ------------------------------------------------------------

  def build_sign_panel(entities)
    panel = group(entities, 'Sign_Panel')

    make_box(
      panel.entities, 'Panel_Back',
      SIGN_X, SIGN_Y - SIGN_DEPTH, SIGN_Z,
      SIGN_WIDTH, SIGN_DEPTH, SIGN_HEIGHT,
      @sign_edge
    )

    # Mặt tấm biển mỏng màu xám than.
    make_box(
      panel.entities, 'Panel_Front',
      SIGN_X + 3.mm, SIGN_Y - SIGN_DEPTH - 1.mm, SIGN_Z + 3.mm,
      SIGN_WIDTH - 6.mm, 2.mm, SIGN_HEIGHT - 6.mm,
      @sign
    )

    panel
  end

  # ------------------------------------------------------------
  # CHỐT INOX GẮN GÓC
  # ------------------------------------------------------------

  def build_fixings(entities)
    fixings = group(entities, 'Corner_Fixings')

    inset_x = 38.mm
    inset_z = 38.mm

    positions = [
      [SIGN_X + inset_x, SIGN_Z + inset_z],
      [SIGN_X + SIGN_WIDTH - inset_x, SIGN_Z + inset_z],
      [SIGN_X + inset_x, SIGN_Z + SIGN_HEIGHT - inset_z],
      [SIGN_X + SIGN_WIDTH - inset_x, SIGN_Z + SIGN_HEIGHT - inset_z]
    ]

    positions.each_with_index do |pos, i|
      x, z = pos

      make_cylinder(
        fixings.entities, "Stainless_Fixing_#{i + 1}",
        [x, SIGN_Y - SIGN_DEPTH - 2.mm, z],
        15.mm, 7.mm, @metal
      )

      make_cylinder(
        fixings.entities, "Fixing_Center_#{i + 1}",
        [x, SIGN_Y - SIGN_DEPTH - 9.mm, z],
        3.mm, 1.mm, @metal_side
      )
    end

    fixings
  end

  # ------------------------------------------------------------
  # CHỮ NỔI
  # ------------------------------------------------------------

  def add_3d_text(entities, name, text, height, position, material,
                  font = 'Arial', bold = false, depth = 7.mm)
    g = group(entities, name)

    x, y, z = position

    text_entities = g.entities.add_3d_text(
      text,
      TextAlignLeft = 0,
      font,
      bold,
      false,
      height,
      0,
      0,
      true,
      depth
    )

    # add_3d_text tạo hình học trong mặt phẳng XY.
    # Xoay để chữ đứng trên mặt phẳng XZ, hướng ra phía trước.
    rotation = Geom::Transformation.rotation(
      ORIGIN,
      X_AXIS,
      90.degrees
    )

    translation = Geom::Transformation.translation(
      Geom::Vector3d.new(x, y, z)
    )

    g.transform!(translation * rotation)

    g.entities.grep(Sketchup::Face).each do |face|
      face.material = material
      face.back_material = material
    end

    g
  end

  def build_main_title(entities)
    title = group(entities, 'Main_Raised_Title')

    # Dùng chữ 3D thực để người dùng có thể chỉnh font trong SketchUp.
    text = title.entities.add_3d_text(
      'dušek design',
      0,
      'Arial',
      false,
      false,
      155.mm,
      0,
      0,
      true,
      12.mm
    )

    title.entities.grep(Sketchup::Face).each do |face|
      face.material = @letter
      face.back_material = @letter
    end

    bounds = title.bounds
    current_width = bounds.width
    target_width = 1320.mm

    if current_width > 0
      scale_x = target_width / current_width
      transform = Geom::Transformation.scaling(
        ORIGIN, scale_x, 1.0, 1.0
      )
      title.transform!(transform)
    end

    # Đưa chữ từ mặt phẳng XY sang mặt phẳng XZ.
    rotation = Geom::Transformation.rotation(
      ORIGIN,
      X_AXIS,
      90.degrees
    )

    title.transform!(rotation)

    bounds = title.bounds
    dx = SIGN_X + (SIGN_WIDTH - bounds.width) / 2.0 - bounds.min.x
    dz = SIGN_Z + 160.mm - bounds.min.z
    dy = SIGN_Y - SIGN_DEPTH - 17.mm - bounds.min.y

    title.transform!(
      Geom::Transformation.translation(
        Geom::Vector3d.new(dx, dy, dz)
      )
    )

    title
  end

  def build_subtitle(entities)
    subtitle = group(entities, 'Subtitle')

    subtitle.entities.add_3d_text(
      'ARCHITECTURAL AND PLANNING CONSULTANTS',
      0,
      'Arial',
      false,
      false,
      29.mm,
      0,
      0,
      true,
      2.mm
    )

    subtitle.entities.grep(Sketchup::Face).each do |face|
      face.material = @letter
      face.back_material = @letter
    end

    # Xoay mặt chữ về phía trước biển.
    subtitle.transform!(
      Geom::Transformation.rotation(ORIGIN, X_AXIS, 90.degrees)
    )

    bounds = subtitle.bounds
    target_width = 990.mm
    scale_x = target_width / bounds.width if bounds.width > 0

    if scale_x
      subtitle.transform!(
        Geom::Transformation.scaling(ORIGIN, scale_x, 1.0, 1.0)
      )
    end

    bounds = subtitle.bounds
    dx = SIGN_X + (SIGN_WIDTH - bounds.width) / 2.0 - bounds.min.x
    dz = SIGN_Z + 72.mm - bounds.min.z
    dy = SIGN_Y - SIGN_DEPTH - 5.mm - bounds.min.y

    subtitle.transform!(
      Geom::Transformation.translation(
        Geom::Vector3d.new(dx, dy, dz)
      )
    )

    subtitle
  end

  # ------------------------------------------------------------
  # MENU EXTENSIONS
  # ------------------------------------------------------------

  def build
    model = Sketchup.active_model
    model.start_operation('Create Dusek Design Sign', true)

    begin
      model.entities.clear!
      create_materials(model)

      root = model.entities.add_group
      root.name = MODEL_NAME

      entities = root.entities

      build_wall(entities)
      build_sign_panel(entities)
      build_fixings(entities)
      build_main_title(entities)
      build_subtitle(entities)

      model.active_view.zoom_extents
      model.commit_operation

      UI.messagebox(
        'Đã tạo mô hình biển hiệu Dusek Design.'
      )
    rescue StandardError => e
      model.abort_operation

      UI.messagebox(
        "Không thể tạo mô hình:\n#{e.message}\n\n" \
        "#{e.backtrace.first(8).join("\n")}"
      )
    end
  end

  unless file_loaded?(__FILE__)
    UI.menu('Extensions').add_item(
      'Create Dusek Design Sign'
    ) { build }

    file_loaded(__FILE__)
  end
end