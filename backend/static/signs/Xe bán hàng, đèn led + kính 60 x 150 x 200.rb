# Mã nguồn Ruby hoàn chỉnh 100%
module XeBanHangDenLedKinh60X150X200
  def self.build
    model = Sketchup.active_model
    model.start_operation('XeBanHangDenLedKinh60X150X200', true)
    entities = model.active_entities

    # Thông số
    width = 2000.mm
    depth = 600.mm
    height = 1500.mm
    khung_satt = 30.mm
    alu_thickness = 3.mm
    glass_thickness = 8.mm
    base_height = 800.mm
    glass_height = 600.mm
    top_box_height = 100.mm

    # Màu sắc
    mau_vang = Sketchup::Color.new("#FFD600")
    mau_hong = Sketchup::Color.new("#F45CA4")
    mau_trang = Sketchup::Color.new("#FFFFFF")
    mau_den = Sketchup::Color.new("#222222")
    mau_xam = Sketchup::Color.new("#444444")

    # 1. Khung sắt hộp
    khung = entities.add_group
    # 4 trụ đứng
    pts = [
      [0,0,0], [width,0,0], [width,depth,0], [0,depth,0]
    ]
    pts.each do |pt|
      khung.entities.add_face(pt, [pt[0],pt[1],pt[2]+height], [pt[0]+khung_satt,pt[1],pt[2]+height], [pt[0]+khung_satt,pt[1],pt[2]])
      khung.entities.add_face([pt[0]+khung_satt,pt[1],pt[2]], [pt[0]+khung_satt,pt[1],pt[2]+height], [pt[0],pt[1],pt[2]+height], pt)
    end
    # Khung ngang đáy, đỉnh, giữa
    [[0,0,0],[0,0,height],[0,0,base_height],[0,0,base_height+glass_height]].each do |zpt|
      khung.entities.add_face([0,0,zpt[2]], [width,0,zpt[2]], [width,khung_satt,zpt[2]], [0,khung_satt,zpt[2]])
      khung.entities.add_face([width,0,zpt[2]], [width,depth,zpt[2]], [width-khung_satt,depth,zpt[2]], [width-khung_satt,0,zpt[2]])
      khung.entities.add_face([width,depth,zpt[2]], [0,depth,zpt[2]], [0,depth-khung_satt,zpt[2]], [width,depth-khung_satt,zpt[2]])
      khung.entities.add_face([0,depth,zpt[2]], [0,0,zpt[2]], [khung_satt,0,zpt[2]], [khung_satt,depth,zpt[2]])
    end

    # 2. Tấm alu vàng mặt trước
    alu_front = entities.add_group
    face = alu_front.entities.add_face(
      [khung_satt, khung_satt, 0],
      [width-khung_satt, khung_satt, 0],
      [width-khung_satt, khung_satt, base_height],
      [khung_satt, khung_satt, base_height]
    )
    face.pushpull(-alu_thickness)
    alu_front.material = mau_vang

    # 3. Tấm alu vàng mặt hông (trái/phải)
    [khung_satt, width-khung_satt-alu_thickness].each do |x|
      alu_side = entities.add_group
      face = alu_side.entities.add_face(
        [x, khung_satt, 0],
        [x, depth-khung_satt, 0],
        [x, depth-khung_satt, base_height],
        [x, khung_satt, base_height]
      )
      face.pushpull(-alu_thickness)
      alu_side.material = mau_vang
    end

    # 4. Kính cường lực mặt trước
    glass_front = entities.add_group
    face = glass_front.entities.add_face(
      [khung_satt+alu_thickness, khung_satt, base_height],
      [width-khung_satt-alu_thickness, khung_satt, base_height],
      [width-khung_satt-alu_thickness, khung_satt, base_height+glass_height],
      [khung_satt+alu_thickness, khung_satt, base_height+glass_height]
    )
    face.pushpull(-glass_thickness)
    glass_front.material = Sketchup::Color.new(255,255,255,40) # kính mờ

    # 5. Kính cường lực mặt bên
    [khung_satt+alu_thickness, width-khung_satt-alu_thickness-glass_thickness].each do |x|
      glass_side = entities.add_group
      face = glass_side.entities.add_face(
        [x, khung_satt, base_height],
        [x, depth-khung_satt, base_height],
        [x, depth-khung_satt, base_height+glass_height],
        [x, khung_satt, base_height+glass_height]
      )
      face.pushpull(-glass_thickness)
      glass_side.material = Sketchup::Color.new(255,255,255,40)
    end

    # 6. Hộp biển hiệu trên nóc (nền vàng)
    top_box = entities.add_group
    face = top_box.entities.add_face(
      [khung_satt, khung_satt, base_height+glass_height],
      [width-khung_satt, khung_satt, base_height+glass_height],
      [width-khung_satt, khung_satt, base_height+glass_height+top_box_height],
      [khung_satt, khung_satt, base_height+glass_height+top_box_height]
    )
    face.pushpull(-100.mm)
    top_box.material = mau_vang

    # 7. Chữ nổi "Tiệm Trà" (trắng, viền đen, shadow đen)
    text1 = entities.add_group
    text1.entities.add_3d_text(
      "Tiệm Trà",
      TextAlignLeft,
      "UVN Bay Buom", # font script tương tự
      false,
      false,
      120.mm,
      30.mm,
      0,
      true,
      2,
      true
    )
    text1.material = mau_trang
    text1.entities.each { |e| e.material = mau_trang if e.is_a?(Sketchup::Face) }
    text1.move!([khung_satt+50.mm, khung_satt-40.mm, base_height+glass_height+top_box_height+10.mm])

    # 8. Chữ nổi "Labubu" (hồng, viền đen, shadow đen)
    text2 = entities.add_group
    text2.entities.add_3d_text(
      "Labubu",
      TextAlignLeft,
      "Pacifico", # font script tương tự
      false,
      false,
      140.mm,
      40.mm,
      0,
      true,
      2,
      true
    )
    text2.material = mau_hong
    text2.entities.each { |e| e.material = mau_hong if e.is_a?(Sketchup::Face) }
    text2.move!([khung_satt+350.mm, khung_satt-40.mm, base_height+glass_height+top_box_height+10.mm])

    # 9. Chữ phụ mặt trước (3 dòng trắng, viền đen)
    y_text = base_height/2 + 60.mm
    ["TRÀ SỮA FULL TOPPING", "MILO DẦM", "YAOUIRT TRÁI CÂY"].each_with_index do |txt, i|
      t = entities.add_group
      t.entities.add_3d_text(
        txt,
        TextAlignCenter,
        "Arial Black",
        false,
        false,
        60.mm,
        15.mm,
        0,
        true,
        2,
        true
      )
      t.material = mau_trang
      t.entities.each { |e| e.material = mau_trang if e.is_a?(Sketchup::Face) }
      t.move!([width/2-300.mm, khung_satt+30.mm, y_text-i*70.mm])
    end

    # 10. Số điện thoại (nền trắng, chữ đen, viền đen)
    phone_bg = entities.add_group
    face = phone_bg.entities.add_face(
      [width/2-120.mm, khung_satt+30.mm, base_height/2-60.mm],
      [width/2+120.mm, khung_satt+30.mm, base_height/2-60.mm],
      [width/2+120.mm, khung_satt+30.mm, base_height/2-30.mm],
      [width/2-120.mm, khung_satt+30.mm, base_height/2-30.mm]
    )
    face.pushpull(-5.mm)
    phone_bg.material = mau_trang
    phone_txt = entities.add_group
    phone_txt.entities.add_3d_text(
      "Alo ship: 0389 786 547",
      TextAlignCenter,
      "Arial",
      false,
      false,
      30.mm,
      8.mm,
      0,
      true,
      2,
      true
    )
    phone_txt.material = mau_den
    phone_txt.move!([width/2-100.mm, khung_satt+35.mm, base_height/2-55.mm])

    # 11. Logo tròn (dán decal)
    logo = entities.add_group
    center = [width-220.mm, khung_satt+35.mm, base_height/2]
    logo.entities.add_circle(center, [0,0,1], 70.mm)
    logo.entities.add_face(logo.entities[0])
    logo.material = mau_trang
    # Vẽ mascot đơn giản (hình elip hồng)
    mascot = logo.entities.add_group
    mascot.entities.add_circle([center[0], center[1], center[2]+1.mm], [0,0,1], 30.mm)
    mascot.entities.add_face(mascot.entities[0])
    mascot.material = mau_hong

    # 12. Đèn LED bulb treo trần
    3.times do |i|
      led = entities.add_group
      x = width/4 + i*width/4
      y = depth/2
      z = base_height+glass_height+top_box_height-10.mm
      # Dây đèn
      led.entities.add_cylinder([x, y, z], [0,0,-1], 2.mm, 40.mm)
      # Bóng đèn
      led.entities.add_circle([x, y, z-40.mm], [0,0,-1], 15.mm)
      led.entities.add_face(led.entities[1])
      led.material = mau_trang
    end

    # 13. Bánh xe di động
    4.times do |i|
      wheel = entities.add_group
      wx = [khung_satt+30.mm, width-khung_satt-30.mm][i%2]
      wy = [khung_satt+30.mm, depth-khung_satt-30.mm][i/2]
      wz = -20.mm
      wheel.entities.add_circle([wx, wy, wz], [0,0,1], 18.mm)
      wheel.entities.add_face(wheel.entities[0])
      wheel.material = mau_xam
    end

    model.commit_operation
  end
end
XeBanHangDenLedKinh60X150X200.build