# Mã nguồn Ruby hoàn chỉnh 100%
module BangHieuChuNoiMicaLedVienFullMau400X140
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuChuNoiMicaLedVienFullMau400X140', true)
    entities = model.active_entities

    # Thông số
    width = 4000.mm
    height = 1400.mm
    depth = 30.mm
    khung_size = 30.mm
    radius = 120.mm # Bo góc lớn

    # Tạo khung xương sắt hộp
    khung_group = entities.add_group
    khung = khung_group.entities

    # Khung viền ngoài
    pts = [
      [0, 0, 0],
      [width, 0, 0],
      [width, height, 0],
      [0, height, 0]
    ]
    # Bo góc
    require 'sketchup.rb'
    face = khung.add_face(pts)
    face.pushpull(-khung_size)
    # Xương dọc
    (1..(width/500)).each do |i|
      x = i*500.mm
      next if x > width-khung_size
      khung.add_face(
        [x, khung_size, -khung_size],
        [x, height-khung_size, -khung_size],
        [x, height-khung_size, 0],
        [x, khung_size, 0]
      ).pushpull(khung_size)
    end
    # Xương ngang
    (1..(height/400)).each do |j|
      y = j*400.mm
      next if y > height-khung_size
      khung.add_face(
        [khung_size, y, -khung_size],
        [width-khung_size, y, -khung_size],
        [width-khung_size, y, 0],
        [khung_size, y, 0]
      ).pushpull(khung_size)
    end
    # Chân đế
    chan1 = khung.add_face([width*0.1, -60.mm, -khung_size], [width*0.1+80.mm, -60.mm, -khung_size], [width*0.1+80.mm, 0, -khung_size], [width*0.1, 0, -khung_size])
    chan1.pushpull(-30.mm)
    chan2 = khung.add_face([width*0.9, -60.mm, -khung_size], [width*0.9+80.mm, -60.mm, -khung_size], [width*0.9+80.mm, 0, -khung_size], [width*0.9, 0, -khung_size])
    chan2.pushpull(-30.mm)

    # Tạo tấm nền alu vàng bo góc
    mat_alu = model.materials.add('AluVang')
    mat_alu.color = Sketchup::Color.new('#E8B22A')
    nen_group = entities.add_group
    nen = nen_group.entities
    # Vẽ hình chữ nhật bo góc
    require 'extensions.rb'
    require 'sketchup.rb'
    # Vẽ bằng arc 4 góc
    path = []
    path << Geom::Point3d.new(radius, 0, 0)
    path << Geom::Point3d.new(width-radius, 0, 0)
    path << Geom::Point3d.new(width, radius, 0)
    path << Geom::Point3d.new(width, height-radius, 0)
    path << Geom::Point3d.new(width-radius, height, 0)
    path << Geom::Point3d.new(radius, height, 0)
    path << Geom::Point3d.new(0, height-radius, 0)
    path << Geom::Point3d.new(0, radius, 0)
    edges = []
    edges << nen.add_arc([radius, 0, 0], [1,0,0], [0,1,0], radius, 0, 90.degrees)
    edges << nen.add_line([radius, 0, 0], [width-radius, 0, 0])
    edges << nen.add_arc([width-radius, 0, 0], [0,1,0], [1,0,0], radius, 270.degrees, 360.degrees)
    edges << nen.add_line([width, radius, 0], [width, height-radius, 0])
    edges << nen.add_arc([width-radius, height, 0], [-1,0,0], [0,-1,0], radius, 0, 90.degrees)
    edges << nen.add_line([width-radius, height, 0], [radius, height, 0])
    edges << nen.add_arc([radius, height, 0], [0,-1,0], [-1,0,0], radius, 90.degrees, 180.degrees)
    edges << nen.add_line([0, height-radius, 0], [0, radius, 0])
    nen_face = nen.add_face(nen.find_faces.first.outer_loop.vertices.map(&:position))
    nen_face.material = mat_alu
    nen_face.pushpull(depth)

    # Viền nẹp alu vàng
    vien_group = entities.add_group
    vien = vien_group.entities
    mat_vien = model.materials.add('VienVang')
    mat_vien.color = Sketchup::Color.new('#FFD700')
    # Viền ngoài bằng offset mặt nền và pushpull
    vien_face = nen_face.all_connected.select{|f| f.is_a?(Sketchup::Face)}.first
    offset = 30.mm
    vien_edges = vien_face.offset(offset)
    vien_face2 = vien.add_face(vien_edges)
    vien_face2.material = mat_vien
    vien_face2.pushpull(20.mm)

    # Đèn LED viền full màu (mô phỏng bằng các khối tròn nhỏ quanh viền)
    led_group = entities.add_group
    led = led_group.entities
    mat_led = model.materials.add('LedHong')
    mat_led.color = Sketchup::Color.new('#E040FB')
    led_count = 60
    (0...led_count).each do |i|
      angle = 2*Math::PI*i/led_count
      x = width/2 + (width/2-20.mm)*Math.cos(angle)
      y = height/2 + (height/2-20.mm)*Math.sin(angle)
      led.add_circle([x, y, depth+20.mm], [0,0,1], 15.mm)
      led.entities[-1].each do |e|
        if e.is_a?(Sketchup::Edge)
          f = led.add_face(e.vertices.map(&:position))
          f.material = mat_led if f
          f.pushpull(10.mm) if f
        end
      end
    end

    # Logo burger nổi 3D
    logo_group = entities.add_group
    logo = logo_group.entities
    logo_x = 300.mm
    logo_y = height/2-150.mm
    # Thân burger (ellipse trắng)
    mat_logo_white = model.materials.add('LogoWhite')
    mat_logo_white.color = Sketchup::Color.new('#FFFFFF')
    logo.add_circle([logo_x, logo_y, depth+1.mm], [0,0,1], 110.mm, 32)
    logo_face = logo.add_face(logo.entities.grep(Sketchup::Edge))
    logo_face.material = mat_logo_white
    logo_face.pushpull(30.mm)
    # Nhân hồng
    mat_logo_pink = model.materials.add('LogoPink')
    mat_logo_pink.color = Sketchup::Color.new('#FF4081')
    logo.add_circle([logo_x, logo_y+40.mm, depth+31.mm], [0,0,1], 80.mm, 32)
    logo_face2 = logo.add_face(logo.entities.grep(Sketchup::Edge)[-32,32])
    logo_face2.material = mat_logo_pink
    logo_face2.pushpull(10.mm)
    # Cờ đỏ
    mat_logo_red = model.materials.add('LogoRed')
    mat_logo_red.color = Sketchup::Color.new('#FF1744')
    logo.add_circle([logo_x+60.mm, logo_y+120.mm, depth+35.mm], [0,0,1], 25.mm, 16)
    logo_face3 = logo.add_face(logo.entities.grep(Sketchup::Edge)[-16,16])
    logo_face3.material = mat_logo_red
    logo_face3.pushpull(8.mm)
    # Viền tím nhạt
    mat_logo_vien = model.materials.add('LogoVien')
    mat_logo_vien.color = Sketchup::Color.new('#B39DDB')
    logo.add_circle([logo_x, logo_y, depth+1.mm], [0,0,1], 115.mm, 32)
    logo_face4 = logo.add_face(logo.entities.grep(Sketchup::Edge)[-32,32])
    logo_face4.material = mat_logo_vien
    logo_face4.pushpull(5.mm)

    # Chữ nổi chính "BURGER VIET"
    text_group = entities.add_group
    mat_chu_trang = model.materials.add('ChuTrang')
    mat_chu_trang.color = Sketchup::Color.new('#FFFFFF')
    mat_chu_den = model.materials.add('ChuDen')
    mat_chu_den.color = Sketchup::Color.new('#222222')
    text1 = text_group.entities.add_3d_text(
      "BURGER VIET",
      TextAlignCenter,
      "Arial Black",
      false,
      false,
      300.mm,
      40.mm,
      0,
      true,
      0
    )
    text1.material = mat_chu_trang
    text1.transformation = Geom::Transformation.new([width/2, height/2+100.mm, depth+2.mm])
    # Viền đen (mô phỏng bằng offset)
    # Chữ phụ "CN BUÔN MÊ THUỘT"
    mat_chu_vang = model.materials.add('ChuVang')
    mat_chu_vang.color = Sketchup::Color.new('#FFD700')
    text2 = text_group.entities.add_3d_text(
      "CN BUÔN MÊ THUỘT",
      TextAlignCenter,
      "Arial Black",
      false,
      false,
      120.mm,
      20.mm,
      0,
      true,
      0
    )
    text2.material = mat_chu_vang
    text2.transformation = Geom::Transformation.new([width/2, height/2-60.mm, depth+2.mm])
    # Chữ địa chỉ
    text3 = text_group.entities.add_3d_text(
      "74 Mai Hắc Đế, P. Tân Thành, Tp. Buôn Ma Thuột",
      TextAlignCenter,
      "Arial",
      false,
      false,
      60.mm,
      10.mm,
      0,
      true,
      0
    )
    text3.material = mat_chu_vang
    text3.transformation = Geom::Transformation.new([width/2, height/2-130.mm, depth+2.mm])

    model.commit_operation
  end
end
BangHieuChuNoiMicaLedVienFullMau400X140.build