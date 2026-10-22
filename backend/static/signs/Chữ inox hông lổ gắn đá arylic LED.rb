# ============================================================

module BunDauCoHau3D
  extend self

  # KICH THUOC BANG
  W = 4000.mm
  H = 1800.mm
  FRAME = 40.mm
  PANEL_D = 35.mm
  LETTER_D = 18.mm

  def material(name, rgb)
    mats = Sketchup.active_model.materials
    m = mats[name] || mats.add(name)
    m.color = Sketchup::Color.new(*rgb)
    m
  end

  def box(entities, name, x, y, z, w, h, d, mat)
    g = entities.add_group
    g.name = name
    pts = [
      [x,y,z], [x+w,y,z], [x+w,y,z+h], [x,y,z+h]
    ].map { |p| Geom::Point3d.new(*p) }

    f = g.entities.add_face(pts)
    if f
      f.reverse! if f.normal.y > 0
      f.pushpull(d)
      g.material = mat
      g.entities.grep(Sketchup::Face).each do |face|
        face.material = mat
        face.back_material = mat
      end
    end
    g
  end

  # Chu noi tren mat dung, truc ngang X, truc cao Z
  def raised_text(entities, name, string, x, z,
                  height, width, face_mat,
                  font = "Arial", bold = true, depth = LETTER_D)

    g = entities.add_group
    g.name = name

    begin
      g.entities.add_3d_text(
        string,
        TextAlignCenter,
        font,
        bold,
        false,
        height,
        0.5.mm,
        true,
        depth
      )
    rescue
      g.erase!
      return nil
    end

    b = g.bounds
    return g if b.width <= 0

    sx = width.to_f / b.width
    g.transform!(
      Geom::Transformation.scaling(
        Geom::Point3d.new(0,0,0), sx, 1, 1
      )
    )

    b = g.bounds
    cx = (b.min.x + b.max.x) / 2.0
    min_y = b.min.y

    g.transform!(
      Geom::Transformation.translation(
        Geom::Vector3d.new(-cx, -min_y, 0)
      )
    )

    # Xoay chu de mat chu huong ra phia truoc (-Y)
    g.transform!(
      Geom::Transformation.rotation(
        Geom::Point3d.new(0,0,0),
        Geom::Vector3d.new(1,0,0),
        90.degrees
      )
    )

    b = g.bounds
    g.transform!(
      Geom::Transformation.translation(
        Geom::Vector3d.new(x, -PANEL_D - depth, z - b.min.z)
      )
    )

    g.material = face_mat
    g.entities.grep(Sketchup::Face).each do |face|
      face.material = face_mat
      face.back_material = face_mat
    end
    g
  end

  def build
    model = Sketchup.active_model
    model.start_operation("Bun Dau Co Hau 3D", true)

    begin
      root = model.active_entities.add_group
      root.name = "BANG HIEU BUN DAU CO HAU"
      e = root.entities

      black  = material("CDH Khung den", [20,20,24])
      teal   = material("CDH Ton xanh ngoc", [0,165,145])
      teal2  = material("CDH Ton song toi", [0,125,115])
      yellow = material("CDH Chu vang", [255,190,0])
      white  = material("CDH Chu trang", [245,243,255])
      orange = material("CDH Dia chi cam", [225,145,65])
      dark   = material("CDH Bong chu den", [18,16,25])

      # TAM BANG
      box(e, "Nen ton xanh ngoc",
          0, 0, 0, W, H, PANEL_D, teal)

      # TON SONG DOC - cac nep noi
      rib_count = 68
      rib_spacing = W.to_f / rib_count

      rib_count.times do |i|
        x = i * rib_spacing
        box(e, "Nep ton doc #{i+1}",
            x, -2.mm, 0,
            7.mm, H, 3.mm, teal2)
      end

      # KHUNG VIEN CHU NHAT
      box(e, "Vien tren", 0, -45.mm, H-FRAME,
          W, FRAME, 45.mm, black)
      box(e, "Vien duoi", 0, -45.mm, 0,
          W, FRAME, 45.mm, black)
      box(e, "Vien trai", 0, -45.mm, 0,
          FRAME, H, 45.mm, black)
      box(e, "Vien phai", W-FRAME, -45.mm, 0,
          FRAME, H, 45.mm, black)

      # DONG CHU CHINH
      raised_text(e, "Chu BUN",
          "BUN", 600.mm, 1190.mm,
          360.mm, 850.mm, white, "Arial", true, 22.mm)

      raised_text(e, "Chu DAU",
          "DAU", 1250.mm, 830.mm,
          310.mm, 850.mm, white, "Arial", true, 22.mm)

      raised_text(e, "Chu CO HAU",
          "CO HAU", 2220.mm, 850.mm,
          350.mm, 1550.mm, yellow, "Arial", true, 25.mm)

      # DONG PHU
      raised_text(e, "Huong vi Ha Thanh",
          "HUONG VI HA THANH",
          2050.mm, 440.mm,
          215.mm, 2350.mm,
          yellow, "Arial", true, 18.mm)

      # DIA CHI
      raised_text(e, "Dia chi",
          "2122 PHAM THE HIEN P6 Q8",
          1550.mm, 135.mm,
          100.mm, 2000.mm,
          orange, "Arial", true, 6.mm)

      # BIEU TUONG NHA DON GIAN
      # Mai nha
      roof = e.add_group
      roof.name = "Icon nha"
      pts = [
        [260.mm,-50.mm,190.mm],
        [390.mm,-50.mm,310.mm],
        [520.mm,-50.mm,190.mm]
      ].map { |p| Geom::Point3d.new(*p) }
      face = roof.entities.add_face(pts)
      face.material = orange if face

      box(e, "Than nha", 300.mm, -50.mm, 80.mm,
          180.mm, 120.mm, 6.mm, orange)

      # KHUNG GIA DO PHIA SAU
      box(e, "Thanh ngang sau",
          100.mm, 30.mm, 100.mm,
          W-200.mm, 50.mm, 50.mm, black)

      # XEM TOAN BO MO HINH
      model.active_view.zoom(root)
      model.commit_operation

      UI.messagebox(
        "Da dung xong bang hieu BUN DAU CO HAU 3D.\n" \
        "Kich thuoc: 4000 x 1800 mm.\n" \
        "Luu mo hinh bang File > Save As."
      )
    rescue => ex
      model.abort_operation
      UI.messagebox("Loi: #{ex.message}")
      raise ex
    end
  end
end

BunDauCoHau3D.build