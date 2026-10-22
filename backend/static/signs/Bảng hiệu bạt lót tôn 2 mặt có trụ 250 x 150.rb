module TiemNhaOc3D

  extend self

  # ----------------------------------------------------------
  # 1. THÔNG SỐ KÍCH THƯỚC
  # ----------------------------------------------------------

  W = 4000.0       # Chiều rộng biển
  H = 1200.0       # Chiều cao biển
  D = 120.0        # Chiều sâu hộp biển

  PANEL_MARGIN = 32.0
  BORDER_W     = 22.0
  CORNER_CUT   = 42.0

  FACE_Y       = -4.0
  TEXT_DEPTH   = 16.0
  TEXT_RAISE    = 5.0

  # ----------------------------------------------------------
  # 2. KHỞI TẠO MODEL
  # ----------------------------------------------------------

  model = Sketchup.active_model
  model.start_operation('Dung bien hieu Tiem Nha Oc 3D', true)

  begin

    # Xóa nhóm mô hình cũ do script này tạo
    old = model.entities.grep(Sketchup::Group).find do |g|
      g.name == 'TIEM_NHA_OC_3D'
    end

    old.erase! if old && old.valid?

    root = model.entities.add_group
    root.name = 'TIEM_NHA_OC_3D'
    root.description = 'Bien hieu Tiem Nha Oc - mo hinh 3D'

    # --------------------------------------------------------
    # 3. VẬT LIỆU
    # --------------------------------------------------------

    materials = model.materials

    def get_material(materials, name, color, alpha = 1.0)
      mat = materials[name] || materials.add(name)
      mat.color = Sketchup::Color.new(
        color[0], color[1], color[2], (alpha * 255).to_i
      )
      mat.alpha = alpha
      mat
    end

    mat_body = get_material(
      materials, 'OC_Body_Dark_Brown', [47, 34, 43]
    )

    mat_face = get_material(
      materials, 'OC_Face_Brown', [53, 37, 44]
    )

    mat_gold = get_material(
      materials, 'OC_Gold_Trim', [238, 166, 35]
    )

    mat_gold_light = get_material(
      materials, 'OC_Gold_Light', [255, 194, 43]
    )

    mat_red = get_material(
      materials, 'OC_Logo_Red', [235, 18, 56]
    )

    mat_red_side = get_material(
      materials, 'OC_Logo_Red_Side', [115, 15, 38]
    )

    mat_white = get_material(
      materials, 'OC_White_Text', [255, 250, 239]
    )

    mat_shadow = get_material(
      materials, 'OC_Text_Shadow', [20, 15, 19]
    )

    mat_metal = get_material(
      materials, 'OC_Frame_Metal', [70, 70, 74]
    )

    # --------------------------------------------------------
    # 4. HÀM TẠO HỘP CHỮ NHẬT
    # --------------------------------------------------------

    def add_box(parent, name, x1, y1, z1, x2, y2, z2, material)
      group = parent.add_group
      group.name = name

      pts = [
        [x1, y1, z1],
        [x2, y1, z1],
        [x2, y1, z2],
        [x1, y1, z2]
      ].map { |p| Geom::Point3d.new(p[0].mm, p[1].mm, p[2].mm) }

      face = group.entities.add_face(pts)
      raise "Khong tao duoc mat: #{name}" unless face

      face.reverse! if face.normal.y > 0

      face.pushpull((y2 - y1).mm)

      group.entities.grep(Sketchup::Face).each do |f|
        f.material = material
        f.back_material = material
      end

      group
    end

    # --------------------------------------------------------
    # 5. HÀM TẠO TẤM PHẲNG TRÊN MẶT BIỂN
    # --------------------------------------------------------

    def add_front_polygon(parent, name, points, depth, material)
      group = parent.add_group
      group.name = name

      pts = points.map do |p|
        Geom::Point3d.new(p[0].mm, p[1].mm, p[2].mm)
      end

      face = group.entities.add_face(pts)
      raise "Loi tao polygon: #{name}" unless face

      face.reverse! if face.normal.y > 0
      face.pushpull(depth.mm)

      group.entities.grep(Sketchup::Face).each do |f|
        f.material = material
        f.back_material = material
      end

      group
    end

    # --------------------------------------------------------
    # 6. HÀM TẠO THANH VIỀN THEO ĐƯỜNG BAO
    # --------------------------------------------------------

    def add_front_bar(parent, name, x1, z1, x2, z2,
                      width, y, material)

      dx = x2 - x1
      dz = z2 - z1
      len = Math.sqrt(dx * dx + dz * dz)

      return nil if len < 0.001

      nx = -dz / len * width / 2.0
      nz =  dx / len * width / 2.0

      points = [
        [x1 + nx, y, z1 + nz],
        [x2 + nx, y, z2 + nz],
        [x2 - nx, y, z2 - nz],
        [x1 - nx, y, z1 - nz]
      ]

      add_front_polygon(
        parent, name, points, 3.0, material
      )
    end

    # --------------------------------------------------------
    # 7. HÀM TẠO CHỮ 3D
    #
    # Chữ được dựng trong mặt phẳng XY cục bộ, sau đó xoay
    # để nằm đứng trên mặt biển XZ.
    # --------------------------------------------------------

    def add_text_3d(parent, name, text, x, z, height,
                    material, font = 'Arial',
                    bold = true, depth = 12.0,
                    align = :center)

      group = parent.add_group
      group.name = name

      alignment = case align
                  when :left
                    TextAlignLeft = 0
                  when :right
                    TextAlignRight = 2
                  else
                    TextAlignCenter = 1
                  end

      ok = group.entities.add_3d_text(
        text,
        alignment,
        font,
        bold,
        false,
        height.mm,
        0.5.mm,
        0,
        true,
        depth.mm
      )

      unless ok
        group.erase!
        return nil
      end

      group.entities.grep(Sketchup::Face).each do |f|
        f.material = material
        f.back_material = material
      end

      # Xoay mặt chữ đứng: mặt XY -> mặt XZ
      rotation = Geom::Transformation.rotation(
        ORIGIN, X_AXIS, 90.degrees
      )

      group.transform!(rotation)

      # Đưa chân chữ đến vị trí thiết kế
      translation = Geom::Transformation.translation(
        Geom::Vector3d.new(x.mm, FACE_Y.mm, z.mm)
      )

      group.transform!(translation)

      group
    end

    # --------------------------------------------------------
    # 8. HỘP BIỂN CHÍNH
    # --------------------------------------------------------

    body = add_box(
      root, '01_Hop_Bien_Chinh',
      0, 0, 0,
      W, D, H,
      mat_body
    )

    # Tấm nền mặt trước
    add_box(
      root, '02_Mat_Nen_Bien',
      18, FACE_Y + 1.0, 18,
      W - 18, FACE_Y + 5.0, H - 18,
      mat_face
    )

    # --------------------------------------------------------
    # 9. VIỀN NGOÀI MÀU VÀNG
    # --------------------------------------------------------

    x0 = PANEL_MARGIN
    x3 = W - PANEL_MARGIN
    z0 = PANEL_MARGIN
    z3 = H - PANEL_MARGIN
    c  = CORNER_CUT

    # Viền trên, có góc cắt
    add_front_bar(
      root, '03_Vien_Tren_Trai',
      x0 + c, z3, x3 - c, z3,
      BORDER_W, FACE_Y - 1, mat_gold
    )

    add_front_bar(
      root, '03_Vien_Trai_Dung',
      x0, z0 + c, x0, z3 - c,
      BORDER_W, FACE_Y - 1, mat_gold
    )

    add_front_bar(
      root, '03_Vien_Phai_Dung',
      x3, z0 + c, x3, z3 - c,
      BORDER_W, FACE_Y - 1, mat_gold
    )

    add_front_bar(
      root, '03_Vien_Duoi',
      x0 + c, z0, x3 - c, z0,
      BORDER_W, FACE_Y - 1, mat_gold
    )

    # Bốn đoạn góc vát
    add_front_bar(
      root, '03_Goc_Trai_Tren',
      x0, z3 - c, x0 + c, z3,
      BORDER_W, FACE_Y - 1, mat_gold
    )

    add_front_bar(
      root, '03_Goc_Phai_Tren',
      x3 - c, z3, x3, z3 - c,
      BORDER_W, FACE_Y - 1, mat_gold
    )

    add_front_bar(
      root, '03_Goc_Trai_Duoi',
      x0, z0 + c, x0 + c, z0,
      BORDER_W, FACE_Y - 1, mat_gold
    )

    add_front_bar(
      root, '03_Goc_Phai_Duoi',
      x3 - c, z0, x3, z0 + c,
      BORDER_W, FACE_Y - 1, mat_gold
    )

    # --------------------------------------------------------
    # 10. CHỮ NỔI "TIỆM NHÀ"
    # --------------------------------------------------------
    #
    # Vị trí phía trái, chiếm khoảng 55% chiều ngang.
    # Chữ được tạo riêng từng nhóm để chỉnh sửa dễ dàng.
    # --------------------------------------------------------

    title_group = root.entities.add_group
    title_group.name = '04_Nhom_Chu_Tiem_Nha'

    # Chữ nổi chính
    add_text_3d(
      title_group,
      'Chu_Tiem_Nha',
      'TIỆM NHÀ',
      1180,
      535,
      315,
      mat_gold_light,
      'Arial',
      true,
      TEXT_DEPTH,
      :center
    )

    # Gạch chân dưới tiêu đề
    add_front_bar(
      title_group,
      'Gach_Ngang_Tieu_De',
      260, 420,
      2160, 420,
      18,
      FACE_Y - 2,
      mat_gold
    )

    # --------------------------------------------------------
    # 11. DÒNG PHỤ "Giá bình dân"
    # --------------------------------------------------------

    subtitle_group = root.entities.add_group
    subtitle_group.name = '05_Nhom_Chu_Gia_Binh_Dan'

    add_text_3d(
      subtitle_group,
      'Chu_Gia_Binh_Dan',
      'Giá bình dân',
      1190,
      220,
      155,
      mat_gold_light,
      'Arial',
      true,
      10.0,
      :center
    )

    # --------------------------------------------------------
    # 12. LOGO "ỐC" NỔI ĐỎ
    #


  rescue => err
  ensure
    model.commit_operation
  end
end
