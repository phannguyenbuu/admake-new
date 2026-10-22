# ============================================================

module SachJuice3D
  extend self

  def mat(model, name, rgb)
    m = model.materials[name] || model.materials.add(name)
    m.color = Sketchup::Color.new(*rgb)
    m
  end

  def beam(entities, name, p1, p2, width, depth, material)
    a = Geom::Point3d.new(*p1)
    b = Geom::Point3d.new(*p2)
    v = b - a
    return if v.length < 0.01

    z_axis = v.clone
    z_axis.normalize!

    ref = Geom::Vector3d.new(0, 1, 0)
    ref = Geom::Vector3d.new(1, 0, 0) if z_axis.parallel?(ref)

    x_axis = z_axis.cross(ref)
    x_axis.normalize!
    y_axis = z_axis.cross(x_axis)
    y_axis.normalize!

    tr = Geom::Transformation.axes(a, x_axis, y_axis, z_axis)
    g = entities.add_group
    g.name = name

    pts = [
      [-width / 2.0, -depth / 2.0, 0],
      [ width / 2.0, -depth / 2.0, 0],
      [ width / 2.0,  depth / 2.0, 0],
      [-width / 2.0,  depth / 2.0, 0]
    ].map { |p| Geom::Point3d.new(*p).transform(tr) }

    f = g.entities.add_face(pts)
    f.reverse! if f && f.normal.dot(z_axis) < 0
    f.pushpull(v.length) if f
    g.material = material
    g.entities.grep(Sketchup::Face).each do |face|
      face.material = material
      face.back_material = material
    end
    g
  end

  def box(entities, name, x, y, z, sx, sy, sz, material)
    g = entities.add_group
    g.name = name
    pts = [
      [x, y, z], [x + sx, y, z],
      [x + sx, y + sy, z], [x, y + sy, z]
    ].map { |p| Geom::Point3d.new(*p) }
    f = g.entities.add_face(pts)
    f.reverse! if f && f.normal.z < 0
    f.pushpull(sz) if f
    g.material = material
    g.entities.grep(Sketchup::Face).each do |face|
      face.material = material
      face.back_material = material
    end
    g
  end

  def panel(entities, name, points, y, thickness, material)
    g = entities.add_group
    g.name = name
    pts = points.map { |x, z| Geom::Point3d.new(x, y, z) }
    f = g.entities.add_face(pts)
    raise "Khong tao duoc mat #{name}" unless f
    f.reverse! if f.normal.y > 0
    f.pushpull(thickness)
    g.material = material
    g.entities.grep(Sketchup::Face).each do |face|
      face.material = material
      face.back_material = material
    end
    g
  end

  def run
    model = Sketchup.active_model
    model.start_operation('Sach Juice Sign 3D', true)

    begin
      root = model.active_entities.add_group
      root.name = 'SACH JUICE - COMPLETE SIGN'
      e = root.entities

      black  = mat(model, 'SJ Black Steel', [25, 27, 31])
      white  = mat(model, 'SJ White Acrylic', [248, 247, 250])
      pink   = mat(model, 'SJ Juice Pink', [230, 28, 100])
      green  = mat(model, 'SJ Leaf Green', [85, 190, 100])
      yellow = mat(model, 'SJ Fruit Yellow', [250, 202, 28])
      red    = mat(model, 'SJ Red Label', [220, 22, 48])
      blue   = mat(model, 'SJ Blue Accent', [30, 95, 190])

      # 1. BASE: 650 x 500 mm
      box(e, 'Base front rail', 0, 0, 20, 650, 40, 40, black)
      box(e, 'Base rear rail', 0, 460, 20, 650, 40, 40, black)
      box(e, 'Base left rail', 0, 40, 20, 40, 420, 40, black)
      box(e, 'Base right rail', 610, 40, 20, 40, 420, 40, black)
      box(e, 'Base crossbar 1', 120, 40, 20, 40, 420, 40, black)
      box(e, 'Base crossbar 2', 490, 40, 20, 40, 420, 40, black)

      # 2. UPRIGHTS AND BRACING
      box(e, 'Left upright', 160, 205, 60, 40, 40, 1350, black)
      box(e, 'Right upright', 450, 205, 60, 40, 40, 1350, black)

      beam(e, 'Left diagonal brace',
           [180, 220, 150], [290, 220, 1370], 35, 35, black)
      beam(e, 'Right diagonal brace',
           [470, 220, 150], [360, 220, 1370], 35, 35, black)
      beam(e, 'Top support',
           [180, 220, 1370], [470, 220, 1370], 40, 40, black)

      # 3. SIGN BODY: rounded-top silhouette
      outline = [
        [100, 2240], [100, 2500], [120, 2580],
        [165, 2650], [220, 2705], [290, 2730],
        [360, 2705], [415, 2650], [460, 2580],
        [480, 2500], [480, 2240], [445, 2110],
        [405, 1950], [365, 1780], [330, 1620],
        [290, 1530], [250, 1620], [215, 1780],
        [175, 1950], [135, 2110]
      ]

      panel(e, 'Black outer casing', outline, 160, 85, black)
      panel(e, 'White front acrylic', outline, 155, 8, white)

      # 4. GRAPHIC PANELS
      # Main pink juice cup, represented as a separate solid panel
      cup = [
        [195, 2110], [380, 2110], [360, 1810],
        [325, 1690], [250, 1690], [215, 1810]
      ]
      panel(e, 'Pink juice graphic', cup, 142, 4, pink)

      # Decorative leaf shapes
      panel(e, 'Left leaf', [
        [115, 2070], [165, 2140], [190, 2040],
        [160, 1990], [130, 2015]
      ], 136, 4, green)

      panel(e, 'Right leaf', [
        [385, 2070], [435, 2140], [450, 2015],
        [420, 1990], [390, 2040]
      ], 136, 4, green)

      # Red product label
      panel(e, 'Red juice label', [
        [205, 2050], [375, 2050],
        [365, 1970], [215, 1970]
      ], 132, 4, red)

      # Yellow fruit accents
      [[225, 1740], [250, 1715], [350, 1745], [365, 1775]].each_with_index do |p, i|
        cx, cz = p
        points = (0..23).map do |k|
          angle = 2.0 * Math::PI * k / 24
          [cx + 18 * Math.cos(angle), cz + 18 * Math.sin(angle)]
        end
        panel(e, "Fruit accent #{i + 1}", points, 130, 5, yellow)
      end

      # 5. TEXT: editable 3D text entities
      # Exact fonts depend on fonts installed on the computer.
      def add_text(entities, name, string, point, height, material)
        g = entities.add_group
        g.name = name
        text = g.entities.add_3d_text(
          string,
          TextAlignCenter = 1,
          'Arial',
          false,
          true,
          height,
          0.0,
          0.0,
          true,
          1.5
        )
        g.material = material
        g.entities.grep(Sketchup::Face).each do |face|
          face.material = material
          face.back_material = material
        end
        g.transform!(Geom::Transformation.translation(
          Geom::Point3d.new(*point)
        ))
        g
      end

      # Text on front plane: horizontal text uses the X axis.
      add_text(e, 'Brand title', 'Sach Juice',
               [290, 120, 2460], 58, green)
      add_text(e, 'Drink subtitle', 'Nuoc ep Detox',
               [290, 115, 2020], 30, white)

      # 6. FOOT / MOUNTING PLATES
      box(e, 'Left mounting plate', 155, 195, 55, 60, 60, 10, black)
      box(e, 'Right mounting plate', 435, 195, 55, 60, 60, 10, black)

      # 7. CAMERA AND VIEW
      model.active_view.zoom_extents
      model.commit_operation

      UI.messagebox(
        "Da tao mo hinh Sach Juice 3D.\n" \
        "Kich thuoc va hinh in la mo phong tham khao."
      )
    rescue => err
      model.abort_operation
      UI.messagebox("Loi tao mo hinh: #{err.message}\n#{err.backtrace.first}")
    end
  end
end

SachJuice3D.run