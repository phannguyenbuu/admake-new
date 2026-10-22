# ============================================================
# SKETCHUP RUBY - BANG VINH DANH DONG VANG, DE GO DO
# Don vi: mm | SketchUp 2021+
# Cach dung: Window > Ruby Console > load file .rb
# ============================================================

module BangVinhDanh3D
  extend self

  def mat(name, color, alpha = 1.0)
    m = Sketchup.active_model.materials[name] ||
        Sketchup.active_model.materials.add(name)
    m.color = Sketchup::Color.new(*color)
    m.alpha = alpha
    m
  end

  def box(entities, name, x, y, z, sx, sy, sz, material)
    g = entities.add_group
    g.name = name
    e = g.entities

    pts = [
      [x-sx/2, y-sy/2, z-sz/2],
      [x+sx/2, y-sy/2, z-sz/2],
      [x+sx/2, y+sy/2, z-sz/2],
      [x-sx/2, y+sy/2, z-sz/2]
    ].map { |p| Geom::Point3d.new(*p) }

    f = e.add_face(pts)
    return g unless f

    f.reverse! if f.normal.z < 0
    f.pushpull(sz)

    # Pushpull theo Z, sau do chinh tam khoi ve cao do z
    g.transform!(
      Geom::Transformation.translation([0, 0, z-sz/2])
    )
    g.material = material
    g.entities.grep(Sketchup::Face).each do |face|
      face.material = material
      face.back_material = material
    end
    g
  end

  # Tao khoi hop bang 8 diem, dung truc X/Y/Z
  def solid_box(entities, name, x, y, z, sx, sy, sz, material)
    g = entities.add_group
    g.name = name
    e = g.entities

    x1, x2 = x-sx/2, x+sx/2
    y1, y2 = y-sy/2, y+sy/2
    z1, z2 = z-sz/2, z+sz/2

    faces = [
      [[x1,y1,z1],[x2,y1,z1],[x2,y2,z1],[x1,y2,z1]],
      [[x1,y1,z2],[x1,y2,z2],[x2,y2,z2],[x2,y1,z2]],
      [[x1,y1,z1],[x1,y1,z2],[x2,y1,z2],[x2,y1,z1]],
      [[x1,y2,z1],[x2,y2,z1],[x2,y2,z2],[x1,y2,z2]],
      [[x1,y1,z1],[x1,y2,z1],[x1,y2,z2],[x1,y1,z2]],
      [[x2,y1,z1],[x2,y1,z2],[x2,y2,z2],[x2,y2,z1]]
    ]

    faces.each do |arr|
      face = e.add_face(arr.map { |p| Geom::Point3d.new(*p) })
      next unless face
      face.reverse! if face.normal.dot(
        Geom::Vector3d.new(
          face.bounds.center.x-x,
          face.bounds.center.y-y,
          face.bounds.center.z-z
        )
      ) < 0
      face.material = material
      face.back_material = material
    end
    g
  end

  # Chu noi 3D: mat chu huong ra phia truoc bang (Y am)
  def text3d(entities, string, x, front_y, z,
             height, material, bold = true, extrusion = 1.2)
    g = entities.add_group
    g.name = "Chu noi - #{string}"

    begin
      g.entities.add_3d_text(
        string,
        TextAlignCenter = 1,
        "Arial",
        bold,
        false,
        height,
        0.5,
        0,
        true,
        extrusion
      )
    rescue
      g.entities.add_3d_text(
        string, 1, "Arial", bold, false, height, 0.5, 0
      )
    end

    # Mat phang XY cua text xoay thanh mat phang XZ
    rotation = Geom::Transformation.rotation(
      ORIGIN, X_AXIS, 90.degrees
    )
    translation = Geom::Transformation.translation(
      [x, front_y, z]
    )
    g.transform!(translation * rotation)

    g.material = material
    g.entities.grep(Sketchup::Face).each do |f|
      f.material = material
      f.back_material = material
    end
    g
  end

  def border_frame(entities, x, y, z, w, h, t, material, name)
    
  def border_frame(entities, x, y, z, w, h, t, material, name)
    
  def border_frame(entities, x, y, z, w, h, t, material, name)
    solid_box(entities, "#{name} - Tren", x, y, z+h/2-t/2, w, t, t, material)
    solid_box(entities, "#{name} - Duoi", x, y, z-h/2+t/2, w, t, t, material)
    solid_box(entities, "#{name} - Trai", x-w/2+t/2, y, z, t, t, h-2*t, material)
    solid_box(entities, "#{name} - Phai", x+w/2-t/2, y, z, t, t, h-2*t, material)
  end
end
BangVinhDanh3D.border_frame(Sketchup.active_model.entities, 0, 0, 0, 300, 150, 10, BangVinhDanh3D.mat("go", [120, 60, 20]), "Khung") rescue nil
