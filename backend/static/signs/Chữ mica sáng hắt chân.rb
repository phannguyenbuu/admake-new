# ============================================================

require 'sketchup.rb'

module ADMAKE_COFFEE_SIGN

  extend self

  MODEL_NAME = "ADMAKE - Coffee Tea 10 - Highcut Vintage"

  # ----------------------------------------------------------
  # 1. VẬT LIỆU
  # ----------------------------------------------------------

  def material(name, color, alpha = 1.0)
    mats = Sketchup.active_model.materials
    mat = mats[name] || mats.add(name)
    mat.color = Sketchup::Color.new(*color)
    mat.alpha = alpha
    mat
  end

  def materials
    {
      wall: material("Tuong - gach kem", [208, 201, 181]),
      brick: material("Mach gach", [125, 112, 96]),
      black: material("Chu noi - den", [24, 21, 18]),
      gold: material("Inox vang guong", [218, 164, 36]),
      gold_side: material("Canh chu - vang dong", [132, 91, 24]),
      warm: material("LED - vang am", [255, 190, 80]),
      white: material("Nen logo - trang", [242, 239, 226]),
      glass: material("Kinh - xam xanh", [80, 111, 115], 0.55),
      metal: material("Khung kim loai", [95, 99, 99]),
      red: material("Logo - do", [175, 20, 28])
    }
  end

  # ----------------------------------------------------------
  # 2. HÌNH HỘP 3D
  # Tọa độ: X ngang, Y chiều sâu, Z chiều cao
  # ----------------------------------------------------------

  def add_box(entities, name, x, y, z, dx, dy, dz, mat)
    g = entities.add_group
    g.name = name
    e = g.entities

    p000 = Geom::Point3d.new(x,      y,      z)
    p100 = Geom::Point3d.new(x + dx, y,      z)
    p110 = Geom::Point3d.new(x + dx, y + dy, z)
    p010 = Geom::Point3d.new(x,      y + dy, z)

    p001 = Geom::Point3d.new(x,      y,      z + dz)
    p101 = Geom::Point3d.new(x + dx, y,      z + dz)
    p111 = Geom::Point3d.new(x + dx, y + dy, z + dz)
    p011 = Geom::Point3d.new(x,      y + dy, z + dz)

    faces = [
      [p000, p010, p110, p100],
      [p001, p101, p111, p011],
      [p000, p100, p101, p001],
      [p100, p110, p111, p101],
      [p110, p010, p011, p111],
      [p010, p000, p001, p011]
    ]

    faces.each do |pts|
      face = e.add_face(pts)
      next unless face
      face.material = mat
      face.back_material = mat
    end

    g
  end

  # ----------------------------------------------------------
  # 3. CHỮ NỔI 3D
  # Chữ nằm trên mặt đứng XZ, nhô ra phía trước theo -Y
  # ----------------------------------------------------------

  def add_text_3d(entities, name, text, x, y, z,
                  height, depth, front_mat, side_mat,
                  font = "Arial", bold = true)

    g = entities.add_group
    g.name = name

    ok = g.entities.add_3d_text(
      text,
      Sketchup::TextAlignLeft,
      font,
      bold,
      false,
      height,
      1.mm,
      0,
      true,
      depth,
      front_mat
    )

    unless ok
      g.erase!
      return nil
    end

    # Tô vật liệu mặt sau/cạnh chữ
    g.entities.each do |entity|
      next unless entity.is_a?(Sketchup::Face)
      entity.back_material = side_mat
      entity.material ||= front_mat
    end

    # Đưa mặt phẳng chữ XY thành mặt đứng XZ.
    # Trục đùn Z của chữ hướng ra phía trước theo -Y.
    origin = Geom::Point3d.new(x, y, z)
    xaxis  = Geom::Vector3d.new(1, 0, 0)
    yaxis  = Geom::Vector3d.new(0, 0, 1)
    zaxis  = Geom::Vector3d.new(0, -1, 0)

    g.transformation = Geom::Transformation.axes(
      origin, xaxis, yaxis, zaxis
    )

    g
  end

  # ----------------------------------------------------------
  # 4. KHUNG / VIỀN TRANG TRÍ
  # ----------------------------------------------------------

  def add_frame(entities, x, y, z, w, h, bar, depth, mat, prefix)
    add_box(entities, "#{prefix} - Vien tren",
            x, y, z + h - bar, w, depth, bar, mat)

    add_box(entities, "#{prefix} - Vien duoi",
            x, y, z, w, depth, bar, mat)

    add_box(entities, "#{prefix} - Vien trai",
            x, y, z, bar, depth, h, mat)

    add_box(entities, "#{prefix} - Vien phai",
            x + w - bar, y, z, bar, depth, h, mat)
  end

  # ----------------------------------------------------------
  # 5. BIỂN COFFEE & TEA 10
  # Chữ nổi vàng trên mặt tường, có cạnh tối tạo tương phản
  # ----------------------------------------------------------

  def build_coffee_sign(root, m)
    g = root.add_group
    g.name = "01 - COFFEE & TEA 10"
    e = g.entities

    # Kích thước quy ước của cụm chữ phía trên
    x = -2450.mm
    y = -80.mm
    z = 4650.mm
    width = 4900.mm

    # Tấm nền tối mỏng phía sau chữ, có thể tắt nếu dùng
    # phương án chữ gắn trực tiếp lên tường.
    add_box(e, "Nen sau chu Coffee Tea",
            x, y + 45.mm, z - 100.mm,
            width, 20.mm, 760.mm, m[:black])

    # Thanh gá chữ
    add_box(e, "Thanh lap dat tren",
            x + 100.mm, y + 15.mm, z - 60.mm,
            width - 200.mm, 30.mm, 25.mm, m[:metal])

    # Chữ chính
    add_text_3d(
      e, "Chu Coffee Tea 10",
      "Coffee & Tea 10",
      x + 140.mm, y, z + 100.mm,
      420.mm, 35.mm,
      m[:gold], m[:black],
      "Arial", true
    )

    # Viền đế phụ trợ phía sau chữ
    add_box(e, "Nep chan chu",
            x + 120.mm, y + 5.mm, z - 20.mm,
            width - 240.mm, 12.mm, 22.mm, m[:gold_side])

    # Bát/vấu gá liên kết vào tường
    [x + 250.mm, 0, x + width - 250.mm].each_with_index do |px, i|
      add_box(e, "Pat treo Coffee #{i + 1}",
              px, 20.mm, z + 120.mm,
              60.mm, 100.mm, 160.mm, m[:metal])
    end

    g
  end

  # ----------------------------------------------------------
  # 6. BIỂN HIGHCUT VINTAGE
  # Chữ đen nổi, nền sáng và lớp hắt sáng vàng ấm
  # ----------------------------------------------------------

  def build_highcut_sign(root, m)
    g = root.add_group
    g.name = "02 - HIGHCUT VINTAGE"
    e = g.entities

    x = -2200.mm
    y = -100.mm
    z = 3150.mm
    w = 4400.mm
    h = 650.mm

    # Đế nền sáng
    add_box(e, "Nen bien Highcut",
            x, y + 40.mm, z,
            w, 50.mm, h, m[:white])

    # Hộp hắt sáng phía sau
    add_box(e, "Hop LED sau bien",
            x + 30.mm, y + 10.mm, z + 25.mm,
            w - 60.mm, 30.mm, h - 50.mm, m[:warm])

    # Mặt nền phía trước
    add_box(e, "Mat nen trang",
            x + 50.mm, y - 5.mm, z + 45.mm,
            w - 100.mm, 12.mm, h - 90.mm, m[:white])

    # Chữ nổi màu đen
    add_text_3d(
      e, "Chu Highcut Vintage",
      "Highcut Vintage",
      x + 170.mm, y - 20.mm, z + 170.mm,
      350.mm, 38.mm,
      m[:black], m[:black],
      "Arial", true
    )

    # Nẹp kim loại dưới biển
    add_box(e, "Nep duoi Highcut",
            x, y + 25.mm, z - 20.mm,
            w, 45.mm, 25.mm, m[:metal])

    # Pat liên kết
    [x + 250.mm, x + w / 2, x + w - 250.mm].each_with_index do |px, i|
      add_box(e, "Pat Highcut #{i + 1}",
              px, 15.mm, z + 80.mm,
              70.mm, 100.mm, 100.mm, m[:metal])
    end

    g
  end

  # ----------------------------------------------------------
  # 7. LOGO TRÒN COFFEE
  # ----------------------------------------------------------

  def add_cylinder_y(entities, name, cx, y, cz,
                     radius, depth, mat, segments = 64)
    g = entities.add_group
    g.name = name

    # Tạo đường tròn nằm trên mặt XZ
    pts = []
    segments.times do |i|
      a = 2.0 * Math::PI * i / segments
      pts << Geom::Point3d.new(
        cx + radius * Math.cos(a),
        y,
        cz + radius * Math.sin(a)
      )
    end

    face = g.entities.add_face(pts)
    if face
      face.material = mat
      face.back_material = mat
      face.pushpull(depth)
    end

    g
  end

  def build_round_logo(root, m)
    g = root.add_group
    g.name = "03 - LOGO COFFEE TRON"
    e = g.entities

    cx = 3000.mm
    y = -100.mm
    cz = 3800.mm
    r = 440.mm

    add_cylinder_y(e, "Vien logo kim loai",
                   cx, y, cz, r, 45.mm, m[:black])

    add_cylinder_y(e, "Mat logo trang",
                   cx, y - 3.mm, cz, r - 35.mm,
                   8.mm, m[:white])

    add_text_3d(
      e, "Logo Coffee",
      "COFFEE",
      cx - 270.mm, y - 20.mm, cz - 50.mm,
      105.mm, 12.mm,
      m[:black], m[:black],
      "Arial", true
    )

    # Biểu tượng hạt cà phê cách điệu bằng hai hình elip
    add_cylinder_y(e, "Hat ca phe trai",
                   cx - 70.mm, y - 8.mm, cz + 130.mm,
                   65.mm, 10.mm, m[:gold], 32)

    add_cylinder_y(e, "Hat ca phe phai",
                   cx + 70.mm, y - 8.mm, cz + 130.mm,
                   65.mm, 10.mm, m[:gold], 32)

    g
  end

  # ----------------------------------------------------------
  # 8. TƯỜNG THAM CHIẾU, CỬA SỔ VÀ GẠCH
  # Dùng làm nền phối cảnh; có thể ẩn nhóm này khi xuất biển
  # ----------------------------------------------------------

  def build_wall(root, m)
    g = root.add_group
    g.name = "00 - WALL REFERENCE"
    e = g.entities

    # Tường tham chiếu
    add_box(e, "Khoi tuong",
            -4000.mm, 100.mm, 0,
            8000.mm, 250.mm, 6000.mm, m[:wall])

    # Mảng cửa kính tầng trên
    add_box(e, "Kinh tren trai",
            -1500.mm, 80.mm, 5050.mm,
            1050.mm, 25.mm, 700.mm, m[:glass])

    add_box(e, "Kinh tren phai",
            200.mm, 80.mm, 5050.mm,
            1050.mm, 25.mm, 700.mm, m[:glass])

    # Khung cửa sổ
    add_frame(e, -1550.mm, 60.mm, 5000.mm,
              1150.mm, 800.mm, 35.mm, 30.mm,
              m[:metal], "Khung kinh trai")

    add_frame(e, 150.mm, 60.mm, 5000.mm,
              1150.mm, 800.mm, 35.mm, 30.mm,
              m[:metal], "Khung kinh phai")

    # Các đường mạch gạch tham chiếu
    12.times do |i|
      zz = 200.mm + i * 280.mm
      add_box(e, "Mach gach #{i + 1}",
              -4000.mm, 95.mm, zz,
              8000.mm, 5.mm, 3.mm, m[:brick])
    end

    g
  end

  # ----------------------------------------------------------
  # 9. CHẠY DỰNG MÔ HÌNH
  # ----------------------------------------------------------

  def build
    model = Sketchup.active_model

    model.start_operation("ADMAKE - Dung bien hieu 3D", true)

    begin
      m = materials

      # Nhóm tổng để quản lý toàn bộ mô hình
      root = model.active_entities.add_group
      root.name = MODEL_NAME
      e = root.entities

      # Tường tham chiếu
      build_wall(e, m)

      # Hai cụm biển chính
      build_coffee_sign(e, m)
      build_highcut_sign(e, m)
      build_round_logo(e, m)

      # Đưa camera nhìn toàn mô hình
      model.active_view.zoom_extents
      model.commit_operation

      UI.messagebox(
        "Đã dựng xong mô hình biển hiệu 3D.\\n" \
        "Các cấu kiện được nhóm riêng để chỉnh sửa.\\n" \
        "Kích thước là quy ước ban đầu, cần hiệu chỉnh theo đo đạc."
      )

    rescue => error
      model.abort_operation
      UI.messagebox(
        "Lỗi khi dựng mô hình:\\n#{error.message}\\n" \
        "#{error.backtrace.first}"
      )
    end
  end

  unless file_loaded?(__FILE__)
    UI.menu("Extensions").add_item(
      "ADMAKE - Dung bien Coffee Tea 10"
    ) {
      build
    }
    file_loaded(__FILE__)
  end

end

# Chạy ngay khi nạp file Ruby
ADMAKE_COFFEE_SIGN.build