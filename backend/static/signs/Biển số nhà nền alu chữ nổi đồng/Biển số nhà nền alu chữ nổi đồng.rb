# Mã nguồn Ruby hoàn chỉnh 100%
module BienSoNhaNenAluChuNoiDong
  def self.build
    model = Sketchup.active_model
    model.start_operation('BienSoNhaNenAluChuNoiDong', true)
    entities = model.active_entities

    # Kích thước tổng thể
    width = 300.mm
    height = 200.mm
    depth = 25.mm

    # Thông số vật liệu
    color_alu = "#E5E5E5"
    color_vien = "#222222"
    color_chu_noi = "#FFD700"
    color_chu_phang = "#222222"

    # 1. Khung xương sắt hộp phía sau (25x25mm)
    khung_group = entities.add_group
    khung = khung_group.entities
    # Khung viền ngoài
    khung.add_face([0,0,-25.mm],[width,0,-25.mm],[width,height,-25.mm],[0,height,-25.mm]).pushpull(25.mm)
    # Xương ngang tăng cứng (ở giữa)
    x1 = width/2 - 12.5.mm
    khung.add_face([x1,0,-25.mm],[x1+25.mm,0,-25.mm],[x1+25.mm,height,-25.mm],[x1,height,-25.mm]).pushpull(25.mm)
    # Xương dọc tăng cứng (ở giữa)
    y1 = height/2 - 12.5.mm
    khung.add_face([0,y1,-25.mm],[width,y1,-25.mm],[width,y1+25.mm,-25.mm],[0,y1+25.mm,-25.mm]).pushpull(25.mm)
    # Tai treo (giả định 2 tai tròn Ø10mm, dày 5mm)
    tai1 = khung_group.entities.add_circle([15.mm, height-10.mm, -12.5.mm], [0,0,1], 5.mm, 24)
    khung_group.entities.add_face(tai1).pushpull(5.mm)
    tai2 = khung_group.entities.add_circle([width-15.mm, height-10.mm, -12.5.mm], [0,0,1], 5.mm, 24)
    khung_group.entities.add_face(tai2).pushpull(5.mm)

    # 2. Tấm nền alu xước bạc
    matbien_group = entities.add_group
    matbien = matbien_group.entities
    face = matbien.add_face([0,0,0],[width,0,0],[width,height,0],[0,height,0])
    face.pushpull(-3.mm)
    matbien_group.material = color_alu

    # 3. Viền nẹp alu/nhôm đen (bản 10mm)
    vien_group = entities.add_group
    vien = vien_group.entities
    vien_width = 10.mm
    # Viền ngoài
    outer = [
      [0,0,0],[width,0,0],[width,height,0],[0,height,0]
    ]
    inner = [
      [vien_width,vien_width,0],[width-vien_width,vien_width,0],[width-vien_width,height-vien_width,0],[vien_width,height-vien_width,0]
    ]
    vien_face = vien.add_face(outer)
    vien_face.followme(vien.add_face(inner).all_connected.select{|e|e.is_a?(Sketchup::Edge)})
    vien_group.material = color_vien

    # 4. Chữ phẳng (CÔNG TY TNHH, MST, ĐỊA CHỈ)
    text_group = entities.add_group
    text_height = 18.mm
    text_font = "Arial"
    # Dòng 1: CÔNG TY TNHH
    text1 = text_group.entities.add_3d_text(
      "CÔNG TY TNHH", 
      TextAlignCenter, 
      text_height, 
      2.mm, 
      false, 
      false, 
      text_font
    )
    text1.material = color_chu_phang
    text1.transform!(Geom::Transformation.translation([width/2, height-35.mm, 1.mm]))

    # Dòng 3: MST: 3401291249 (có 2 gạch ngang)
    text3 = text_group.entities.add_3d_text(
      "MST: 3401291249", 
      TextAlignCenter, 
      14.mm, 
      1.5.mm, 
      false, 
      false, 
      text_font
    )
    text3.material = color_chu_phang
    text3.transform!(Geom::Transformation.translation([width/2, height-85.mm, 1.mm]))
    # Gạch ngang 2 bên
    g_length = 35.mm
    g_width = 1.5.mm
    g_height = 1.5.mm
    # Bên trái
    text_group.entities.add_face(
      [width/2-55.mm, height-80.mm, 1.2.mm],
      [width/2-55.mm+g_length, height-80.mm, 1.2.mm],
      [width/2-55.mm+g_length, height-80.mm+g_height, 1.2.mm],
      [width/2-55.mm, height-80.mm+g_height, 1.2.mm]
    ).pushpull(1.5.mm)
    # Bên phải
    text_group.entities.add_face(
      [width/2+55.mm, height-80.mm, 1.2.mm],
      [width/2+55.mm+g_length, height-80.mm, 1.2.mm],
      [width/2+55.mm+g_length, height-80.mm+g_height, 1.2.mm],
      [width/2+55.mm, height-80.mm+g_height, 1.2.mm]
    ).pushpull(1.5.mm)

    # Dòng 4: ĐỊA CHỈ (dòng 1)
    text4 = text_group.entities.add_3d_text(
      "ĐỊA CHỈ: D12 LƯƠNG THẾ VINH,", 
      TextAlignCenter, 
      10.mm, 
      1.mm, 
      false, 
      false, 
      text_font
    )
    text4.material = color_chu_phang
    text4.transform!(Geom::Transformation.translation([width/2, height-110.mm, 1.mm]))
    # Dòng 5: PHƯỜNG PHÚ THỦY, TỈNH LÂM ĐỒNG, VIỆT NAM
    text5 = text_group.entities.add_3d_text(
      "PHƯỜNG PHÚ THỦY, TỈNH LÂM ĐỒNG, VIỆT NAM", 
      TextAlignCenter, 
      10.mm, 
      1.mm, 
      false, 
      false, 
      text_font
    )
    text5.material = color_chu_phang
    text5.transform!(Geom::Transformation.translation([width/2, height-122.mm, 1.mm]))

    # 5. Chữ nổi 3D vàng đồng: "CÀ BIỂN MŨI"
    chu_noi_group = entities.add_group
    chu_noi_height = 28.mm
    chu_noi_depth = 6.mm
    chu_noi_font = "Arial Black"
    chu_noi = chu_noi_group.entities.add_3d_text(
      "CÀ BIỂN MŨI", 
      TextAlignCenter, 
      chu_noi_height, 
      chu_noi_depth, 
      false, 
      false, 
      chu_noi_font
    )
    chu_noi.material = color_chu_noi
    chu_noi_group.material = color_chu_noi
    chu_noi.transform!(Geom::Transformation.translation([width/2, height-60.mm, 3.mm]))

    # 6. Đường viền chỉ trang trí trong mặt biển (line đen)
    vien_trang_tri = entities.add_group
    offset = 7.mm
    pts = [
      [offset, offset, 0],
      [width-offset, offset, 0],
      [width-offset, height-offset, 0],
      [offset, height-offset, 0],
      [offset, offset, 0]
    ]
    for i in 0..3
      vien_trang_tri.entities.add_line(pts[i], pts[i+1])
    end

    model.commit_operation
  end
end
BienSoNhaNenAluChuNoiDong.build