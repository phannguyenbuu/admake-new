# Mã nguồn Ruby hoàn chỉnh 100%
module MenuA4FomexCanDecal
  def self.build
    model = Sketchup.active_model
    model.start_operation('MenuA4FomexCanDecal', true)
    entities = model.active_entities

    # Kích thước bảng
    width = 210.mm
    height = 297.mm
    thickness = 10.mm

    # Tạo tấm fomex nền
    pts = [
      [0, 0, 0],
      [width, 0, 0],
      [width, height, 0],
      [0, height, 0]
    ]
    face = entities.add_face(pts)
    face.pushpull(-thickness)

    # Tô màu nền đen
    mat_black = model.materials.add('Black')
    mat_black.color = '#18191A'
    face.material = mat_black
    face.back_material = mat_black

    # Tạo viền đỏ trang trí (dải dưới cùng)
    border_height = 15.mm
    border_pts = [
      [0, 0, 0.1],
      [width, 0, 0.1],
      [width, border_height, 0.1],
      [0, border_height, 0.1]
    ]
    border_face = entities.add_face(border_pts)
    mat_red = model.materials.add('Red')
    mat_red.color = '#C62828'
    border_face.material = mat_red
    border_face.back_material = mat_red

    # Chữ nổi 3D (giả lập hiệu ứng nổi, thực tế là decal in UV)
    # "Tiệm Nhà Ken"
    text1 = entities.add_3d_text(
      "Tiệm Nhà", 
      TextAlignCenter, 
      22.mm, 
      true, 
      false, 
      0, 
      "Arial Rounded MT Bold"
    )
    text1_group = entities.add_group(text1)
    text1_group.material = mat_black
    mat_white = model.materials.add('White')
    mat_white.color = '#FFFFFF'
    text1_group.material = mat_white
    text1_group.move! Geom::Transformation.new([width/2, height-45.mm, 1.mm])

    text2 = entities.add_3d_text(
      "Ken", 
      TextAlignCenter, 
      38.mm, 
      true, 
      false, 
      0, 
      "Arial Rounded MT Bold"
    )
    text2_group = entities.add_group(text2)
    mat_yellow = model.materials.add('Yellow')
    mat_yellow.color = '#FFD600'
    text2_group.material = mat_yellow
    text2_group.move! Geom::Transformation.new([width/2, height-80.mm, 1.2.mm])

    # Slogan đỏ
    text3 = entities.add_3d_text(
      "ĂN VẶT NGON - GIÁ HẾT Ý", 
      TextAlignCenter, 
      10.mm, 
      true, 
      false, 
      0, 
      "Arial Black"
    )
    text3_group = entities.add_group(text3)
    text3_group.material = mat_red
    text3_group.move! Geom::Transformation.new([width/2, height-100.mm, 1.1.mm])

    # Các mục menu (ví dụ "MỲ CAY", "ĂN VẶT NHÀ KEN", "TOPPING", "GIẢI KHÁT")
    menu_titles = [
      ["MỲ CAY", height-120.mm],
      ["ĂN VẶT NHÀ KEN", height-170.mm],
      ["TOPPING", height-220.mm],
      ["GIẢI KHÁT", height-250.mm]
    ]
    menu_titles.each do |title, y_pos|
      t = entities.add_3d_text(title, TextAlignLeft, 9.mm, true, false, 0, "Arial Black")
      g = entities.add_group(t)
      g.material = mat_white
      g.move! Geom::Transformation.new([15.mm, y_pos, 1.1.mm])
    end

    # Chữ phụ cuối: "Cay Ngon KHÔ CƯỠNG!"
    text4 = entities.add_3d_text(
      "Cay Ngon KHÔ CƯỠNG!", 
      TextAlignRight, 
      10.mm, 
      true, 
      false, 
      0, 
      "Arial Black"
    )
    text4_group = entities.add_group(text4)
    text4_group.material = mat_yellow
    text4_group.move! Geom::Transformation.new([width-10.mm, 25.mm, 1.1.mm])

    # Icon ớt đỏ (mô phỏng bằng khối elip nhỏ)
    mat_chili = model.materials.add('ChiliRed')
    mat_chili.color = '#FF2D2D'
    chili1 = entities.add_circle([width-40.mm, 20.mm, 1.2.mm], [0,0,1], 3.mm, 16)
    chili1_face = entities.add_face(chili1)
    chili1_face.material = mat_chili
    chili1_face.pushpull(1.5.mm)

    # Icon lon nước ngọt (mô phỏng bằng khối hộp nhỏ)
    mat_coke = model.materials.add('CokeRed')
    mat_coke.color = '#D32F2F'
    coke = entities.add_group
    coke.entities.add_face([width-25.mm, 15.mm, 1.2.mm], [width-20.mm, 15.mm, 1.2.mm], [width-20.mm, 30.mm, 1.2.mm], [width-25.mm, 30.mm, 1.2.mm])
    coke.entities.grep(Sketchup::Face).each { |f| f.pushpull(4.mm) }
    coke.material = mat_coke

    # Kết thúc thao tác
    model.commit_operation
  end
end
MenuA4FomexCanDecal.build