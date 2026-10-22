module KoSierSign3D
  extend self

  # ----------------------------------------------------------
  # 01. THONG SO
  # ----------------------------------------------------------

  W = 6000.0
  H = 3000.0
  D = 100.0

  Z0 = 2600.0
  POST_H = 5900.0

  POST_X = 150.0
  POST_R = 65.0

  FRAME = 45.0
  FACE_Y = -D

  BLUE_H = 1800.0
  WHITE_H = H - BLUE_H

  # ----------------------------------------------------------
  # 02. VAT LIEU
  # ----------------------------------------------------------

  def material(model, name, rgb)
    m = model.materials[name] || model.materials.add(name)
    m.color = Sketchup::Color.new(rgb[0], rgb[1], rgb[2])
    m
  end

  # ----------------------------------------------------------
  # 03. CAC HAM TAO HINH
  # ----------------------------------------------------------

  def point(x, y, z)
    Geom::Point3d.new(x.mm, y.mm, z.mm)
  end

  # Tao khoi hop bang 6 mat
  def box(parent, name, x1, y1, z1, x2, y2, z2, mat)
    g = parent.add_group
    g.name = name
    e = g.entities

    faces = [
      [[x1,y1,z1],[x1,y2,z1],[x2,y2,z1],[x2,y1,z1]],
      [[x1,y1,z2],[x2,y1,z2],[x2,y2,z2],[x1,y2,z2]],
      [[x1,y1,z1],[x2,y1,z1],[x2,y1,z2],[x1,y1,z2]],
      [[x1,y2,z1],[x1,y2,z2],[x2,y2,z2],[x2,y2,z1]],
      [[x1,y1,z1],[x1,y1,z2],[x1,y2,z2],[x1,y2,z1]],
      [[x2,y1,z1],[x2,y2,z1],[x2,y2,z2],[x2,y1,z2]]
    ]

    faces.each do |coords|
      f = e.add_face(coords.map { |p| point(p[0],p[1],p[2]) })
      next unless f
      f.material = mat
      f.back_material = mat
    end

    g
  end

  # Thanh hop chay theo phuong X
  def beam_x(parent, name, x1, x2, y, z, width, depth, mat)
    box(parent, name,
        x1, y-depth/2.0, z-width/2.0,
        x2, y+depth/2.0, z+width/2.0, mat)
  end

  # Thanh hop chay theo phuong Z
  def beam_z(parent, name, x, y, z1, z2, width, depth, mat)
    box(parent, name,
        x-width/2.0, y-depth/2.0, z1,
        x+width/2.0, y+depth/2.0, z2, mat)
  end

  # Tao tru tron dung theo truc Z
  def cylinder_z(parent, name, x, y, z1, z2, radius, mat, sides=32)
    g = parent.add_group
    g.name = name

    center = point(x,y,z1)
    edges = g.entities.add_circle(center, Z_AXIS, radius.mm, sides)
    face = g.entities.add_face(edges)

    if face
      face.material = mat
      face.back_material = mat
      face.pushpull((z2-z1).mm)

      g.entities.grep(Sketchup::Face).each do |f|
        f.material = mat
        f.back_material = mat
      end
    end

    g
  end

  # Tam da giac/tam da giac bat ky tren mat XZ
  def front_polygon(parent, name, coords, y, thickness, mat)
    g = parent.add_group
    g.name = name

    pts = coords.map { |p| point(p[0], y, p[1]) }
    face = g.entities.add_face(pts)

    if face
      face.material = mat
      face.back_material = mat
      face.reverse! if face.normal.y > 0
      face.pushpull(thickness.mm)

      g.entities.grep(Sketchup::Face).each do |f|
        f.material = mat
        f.back_material = mat
      end
    end

    g
  end

  # Tao chu noi va can giua theo bounding box.
  # Chu duoc xoay dung len mat bien, extrusion huong ra phia truoc.
  def text_3d(parent, name, str, cx, baseline_z, height,
              mat, font='Arial', bold=true, depth=8.0)

    g = parent.add_group
    g.name = name


  def build
    model = Sketchup.active_model
    entities = model.active_entities
    m_blue = material(model, "Mat_Blue", [0, 100, 200])
    m_white = material(model, "Mat_White", [250, 250, 250])
    box(entities, "Khung", 0, 0, 0, 3300, 250, 3300, m_blue)
    box(entities, "Mat_Pano", 0, 130, 0, 3234, 10, 3234, m_white)
  end
end
KoSierSign3D.build rescue nil
