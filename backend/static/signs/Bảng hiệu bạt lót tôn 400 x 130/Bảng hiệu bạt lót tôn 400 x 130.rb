# Mã nguồn Ruby hoàn chỉnh 100%
module BangHieuBatLotTon400X130
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuBatLotTon400X130', true)
    entities = model.active_entities

    # Thông số chính
    width = 4000.mm
    height = 1300.mm
    depth = 30.mm
    khung_size = 30.mm
    viền_nep = 30.mm

    # Màu sắc
    mau_nen = "#3A3DBB"
    mau_vien = "#FFFFFF"
    mau_chu_chinh = "#FFFFFF"
    mau_chu_phu = "#FFFFFF"
    mau_vien_nep = "#D9D9D9"
    mau_nen_phu = "#23247A"

    # 1. Khung xương sắt hộp
    khung_group = entities.add_group
    khung = khung_group.entities
    # Khung viền ngoài
    [
      [ORIGIN, [width,0,0]],
      [[width,0,0], [width,height,0]],
      [[width,height,0], [0,height,0]],
      [[0,height,0], ORIGIN]
    ].each do |start_pt, end_pt|
      khung.add_face([start_pt, [start_pt[0], start_pt[1], -khung_size], [end_pt[0], end_pt[1], -khung_size], end_pt]).pushpull(-khung_size)
    end
    # Xương đứng
    (1..7).each do |i|
      x = i * (width/8)
      khung.add_face([[x,0,0],[x+khung_size,0,0],[x+khung_size,height,0],[x,height,0]]).pushpull(-khung_size)
    end
    # Xương ngang tăng cứng
    (1..2).each do |i|
      y = i * (height/3)
      khung.add_face([[0,y,0],[width,y,0],[width,y+khung_size,0],[0,y+khung_size,0]]).pushpull(-khung_size)
    end

    # 2. Tấm nền bảng hiệu (bạt căng trên tôn/alu)
    nen_group = entities.add_group
    nen = nen_group.entities
    nen_face = nen.add_face([khung_size,khung_size,0],[width-khung_size,khung_size,0],[width-khung_size,height-khung_size,0],[khung_size,height-khung_size,0])
    nen_face.pushpull(depth)
    nen_face.material = mau_nen
    nen_face.back_material = mau_nen

    # 3. Viền nẹp nhôm alu xước bạc
    vien_group = entities.add_group
    vien = vien_group.entities
    # Viền trên
    vien.add_face([0,0,depth],[width,0,depth],[width,viền_nep,depth],[0,viền_nep,depth]).pushpull(viền_nep)
    # Viền dưới
    vien.add_face([0,height-viền_nep,depth],[width,height-viền_nep,depth],[width,height,depth],[0,height,depth]).pushpull(viền_nep)
    # Viền trái
    vien.add_face([0,viền_nep,depth],[viền_nep,viền_nep,depth],[viền_nep,height-viền_nep,depth],[0,height-viền_nep,depth]).pushpull(viền_nep)
    # Viền phải
    vien.add_face([width-viền_nep,viền_nep,depth],[width,viền_nep,depth],[width,height-viền_nep,depth],[width-viền_nep,height-viền_nep,depth]).pushpull(viền_nep)
    vien_group.material = mau_vien_nep

    # 4. Chữ nổi chính "XE ĐIỆN THU HIỀN"
    chu_chinh_group = entities.add_group
    chu_chinh = chu_chinh_group.entities
    chu_chinh_text = "XE ĐIỆN THU HIỀN"
    chu_chinh_x = width/2 - 900.mm
    chu_chinh_y = height - 500.mm
    chu_chinh.add_3d_text(chu_chinh_text,
      TextAlignCenter,
      "Arial Black",
      false,
      false,
      350.mm,
      40.mm,
      0,
      true,
      chu_chinh_x,
      chu_chinh_y,
      depth+1.mm
    ).material = mau_chu_chinh

    # 5. Dòng icon phụ: "XE ĐIỆN" | "XE MÁY ĐIỆN" | "PHỤ KIỆN"
    chu_phu_group = entities.add_group
    chu_phu = chu_phu_group.entities
    y_phu = height - 700.mm
    x_start = width/2 - 650.mm
    # Icon tròn
    3.times do |i|
      icon = chu_phu.add_circle([x_start + i*450.mm, y_phu, depth+2.mm], [0,0,1], 30.mm)
      chu_phu.add_face(icon).pushpull(5.mm).material = mau_chu_phu
    end
    # Chữ phụ
    chu_phu.add_3d_text("XE ĐIỆN", TextAlignCenter, "Arial", false, false, 60.mm, 20.mm, 0, true, x_start, y_phu-50.mm, depth+7.mm).material = mau_chu_phu
    chu_phu.add_3d_text("XE MÁY ĐIỆN", TextAlignCenter, "Arial", false, false, 60.mm, 20.mm, 0, true, x_start+450.mm, y_phu-50.mm, depth+7.mm).material = mau_chu_phu
    chu_phu.add_3d_text("PHỤ KIỆN", TextAlignCenter, "Arial", false, false, 60.mm, 20.mm, 0, true, x_start+900.mm, y_phu-50.mm, depth+7.mm).material = mau_chu_phu

    # 6. Dòng dưới cùng: slogan, địa chỉ, số điện thoại
    chu_duoi_group = entities.add_group
    chu_duoi = chu_duoi_group.entities
    nen_duoi = chu_duoi.add_face([khung_size,height-120.mm,depth+1.mm],[width-khung_size,height-120.mm,depth+1.mm],[width-khung_size,height-khung_size,depth+1.mm],[khung_size,height-khung_size,depth+1.mm])
    nen_duoi.pushpull(10.mm)
    nen_duoi.material = mau_nen_phu
    # Slogan trái
    chu_duoi.add_3d_text("CHẤT LƯỢNG - BỀN BỈ - TIẾT KIỆM", TextAlignLeft, "Arial", false, false, 40.mm, 15.mm, 0, true, khung_size+40.mm, height-100.mm, depth+12.mm).material = mau_chu_phu
    # Icon tia sét (mô phỏng bằng hình tam giác nhỏ)
    tia_set = chu_duoi.add_face([[khung_size+20.mm, height-90.mm, depth+12.mm], [khung_size+35.mm, height-80.mm, depth+12.mm], [khung_size+20.mm, height-70.mm, depth+12.mm]])
    tia_set.pushpull(5.mm).material = mau_chu_phu
    # Địa chỉ giữa
    chu_duoi.add_3d_text("05 GIẢI PHÓNG", TextAlignCenter, "Arial", false, false, 40.mm, 15.mm, 0, true, width/2-100.mm, height-100.mm, depth+12.mm).material = mau_chu_phu
    # Icon vị trí (mô phỏng hình tròn nhỏ)
    vitri = chu_duoi.add_circle([width/2-120.mm, height-90.mm, depth+12.mm], [0,0,1], 10.mm)
    chu_duoi.add_face(vitri).pushpull(5.mm).material = mau_chu_phu
    # Số điện thoại phải
    chu_duoi.add_3d_text("0835 47 6789", TextAlignRight, "Arial", false, false, 40.mm, 15.mm, 0, true, width-khung_size-300.mm, height-100.mm, depth+12.mm).material = mau_chu_phu
    # Icon điện thoại (mô phỏng hình chữ nhật nhỏ)
    dt = chu_duoi.add_face([[width-khung_size-320.mm, height-90.mm, depth+12.mm],[width-khung_size-310.mm, height-90.mm, depth+12.mm],[width-khung_size-310.mm, height-80.mm, depth+12.mm],[width-khung_size-320.mm, height-80.mm, depth+12.mm]])
    dt.pushpull(5.mm).material = mau_chu_phu

    # 7. Tai treo tường (2 bên)
    tai_group = entities.add_group
    tai = tai_group.entities
    [0, width-80.mm].each do |x|
      tai.add_face([[x, height+10.mm, 0], [x+80.mm, height+10.mm, 0], [x+80.mm, height+40.mm, 0], [x, height+40.mm, 0]]).pushpull(-40.mm)
    end

    model.commit_operation
  end
end
BangHieuBatLotTon400X130.build