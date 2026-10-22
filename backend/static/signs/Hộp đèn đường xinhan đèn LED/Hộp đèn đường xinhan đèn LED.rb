# Mã nguồn Ruby hoàn chỉnh 100%
module HopDenDuongXinhanDenLed
  def self.build
    model = Sketchup.active_model
    model.start_operation('HopDenDuongXinhanDenLed', true)
    entities = model.active_entities

    # Thông số chính
    width = 1200.mm
    height = 1500.mm
    depth = 100.mm
    khung_satt = 30.mm
    khung_treo_dai = 800.mm
    khung_treo_cao = 100.mm

    # Tạo nhóm tổng thể
    group = entities.add_group
    ents = group.entities

    # 1. Khung xương sắt hộp đỡ (treo ngang ra từ cột)
    khung_treo = ents.add_group
    # Thanh ngang chính
    pt1 = [0, 0, 2000.mm]
    pt2 = [khung_treo_dai, 0, 2000.mm]
    khung_treo.entities.add_face([pt1, [pt1[0], pt1[1]+khung_satt, pt1[2]], [pt2[0], pt2[1]+khung_satt, pt2[2]], pt2]).pushpull(-khung_satt)
    # Thanh dọc gắn vào cột
    pt3 = [0, 0, 2000.mm]
    pt4 = [0, 0, 2000.mm - khung_treo_cao]
    khung_treo.entities.add_face([pt3, [pt3[0]+khung_satt, pt3[1], pt3[2]], [pt4[0]+khung_satt, pt4[1], pt4[2]], pt4]).pushpull(khung_satt)
    # Thanh dọc phụ đỡ hộp đèn
    pt5 = [khung_treo_dai, 0, 2000.mm]
    pt6 = [khung_treo_dai, 0, 2000.mm - khung_treo_cao]
    khung_treo.entities.add_face([pt5, [pt5[0]+khung_satt, pt5[1], pt5[2]], [pt6[0]+khung_satt, pt6[1], pt6[2]], pt6]).pushpull(khung_satt)
    khung_treo.material = "#B0BEC5"

    # 2. Hộp đèn chính (mica cắt CNC biên dạng đặc trưng)
    # Đơn giản hóa: mô phỏng bằng hình chữ nhật bo góc + 3 bông hoa + 2 lá cờ
    # Nền hộp đèn
    x0 = khung_treo_dai - width/2
    y0 = khung_satt + 10.mm
    z0 = 2000.mm - khung_treo_cao - height/2
    mat_face = ents.add_face(
      [x0, y0, z0],
      [x0+width, y0, z0],
      [x0+width, y0, z0+height],
      [x0, y0, z0+height]
    )
    mat_face.pushpull(depth)
    mat_face.material = "#E53935" # đỏ tươi

    # Viền ngoài trắng
    viendu = ents.add_face(
      [x0-20.mm, y0-5.mm, z0-20.mm],
      [x0+width+20.mm, y0-5.mm, z0-20.mm],
      [x0+width+20.mm, y0-5.mm, z0+height+20.mm],
      [x0-20.mm, y0-5.mm, z0+height+20.mm]
    )
    viendu.pushpull(depth+10.mm)
    viendu.material = "#FFFFFF"

    # 3. Hai lá cờ nổi (mô phỏng khối 3D đơn giản)
    # Cờ Đảng (trái)
    co_dang = ents.add_group
    co_dang.entities.add_face(
      [x0+width*0.25, y0+depth+5.mm, z0+height*0.7],
      [x0+width*0.45, y0+depth+5.mm, z0+height*0.95],
      [x0+width*0.35, y0+depth+5.mm, z0+height*0.95],
      [x0+width*0.15, y0+depth+5.mm, z0+height*0.7]
    ).pushpull(15.mm)
    co_dang.material = "#E53935"
    # Búa liềm vàng
    bua_liem = co_dang.entities.add_circle([x0+width*0.3, y0+depth+20.mm, z0+height*0.87], [0,1,0], 20.mm)
    bua_liem_face = co_dang.entities.add_face(bua_liem)
    bua_liem_face.pushpull(2.mm)
    bua_liem_face.material = "#FFD600"

    # Cờ Tổ quốc (phải)
    co_toquoc = ents.add_group
    co_toquoc.entities.add_face(
      [x0+width*0.55, y0+depth+5.mm, z0+height*0.95],
      [x0+width*0.75, y0+depth+5.mm, z0+height*0.7],
      [x0+width*0.85, y0+depth+5.mm, z0+height*0.7],
      [x0+width*0.65, y0+depth+5.mm, z0+height*0.95]
    ).pushpull(15.mm)
    co_toquoc.material = "#E53935"
    # Sao vàng
    sao = co_toquoc.entities.add_circle([x0+width*0.7, y0+depth+20.mm, z0+height*0.87], [0,1,0], 15.mm, 5)
    sao_face = co_toquoc.entities.add_face(sao)
    sao_face.pushpull(2.mm)
    sao_face.material = "#FFD600"

    # 4. Ba bông hoa mai vàng viền trắng (mô phỏng bằng khối tròn vàng, viền trắng)
    hoa_positions = [
      [x0+width*0.18, y0+depth+10.mm, z0+height*0.65],
      [x0+width*0.82, y0+depth+10.mm, z0+height*0.65],
      [x0+width*0.5, y0+depth+10.mm, z0+height*0.55]
    ]
    hoa_r = 40.mm
    hoa_vien = 50.mm
    hoa_positions.each do |pos|
      hoa = ents.add_circle(pos, [0,1,0], hoa_vien, 32)
      hoa_face = ents.add_face(hoa)
      hoa_face.pushpull(5.mm)
      hoa_face.material = "#FFFFFF"
      hoa2 = ents.add_circle(pos, [0,1,0], hoa_r, 32)
      hoa2_face = ents.add_face(hoa2)
      hoa2_face.pushpull(8.mm)
      hoa2_face.material = "#FFD600"
    end

    # 5. Dòng chữ nổi "XÃ DRAY BHĂNG" (mica trắng, nền đỏ, viền vàng)
    text_group = ents.add_group
    text = "XÃ DRAY BHĂNG"
    text_options = {
      "Font" => "Arial Black",
      "Bold" => true,
      "Italic" => false,
      "Align" => TextAlignCenter,
      "Extruded" => true
    }
    text_height = 80.mm
    text_depth = 20.mm
    text_pos = Geom::Point3d.new(x0+width/2, y0+depth+20.mm, z0+height*0.15)
    text_group.entities.add_3d_text(text, text_height, text_depth, true, false, "Arial Black", text_pos, X_AXIS)
    text_group.material = "#FFFFFF"

    # Nền chữ đỏ + viền vàng
    nen_chu = ents.add_face(
      [x0+width*0.25, y0+depth+10.mm, z0+height*0.1],
      [x0+width*0.75, y0+depth+10.mm, z0+height*0.1],
      [x0+width*0.75, y0+depth+10.mm, z0+height*0.2],
      [x0+width*0.25, y0+depth+10.mm, z0+height*0.2]
    )
    nen_chu.pushpull(8.mm)
    nen_chu.material = "#E53935"
    vien_chu = ents.add_face(
      [x0+width*0.23, y0+depth+8.mm, z0+height*0.08],
      [x0+width*0.77, y0+depth+8.mm, z0+height*0.08],
      [x0+width*0.77, y0+depth+8.mm, z0+height*0.22],
      [x0+width*0.23, y0+depth+8.mm, z0+height*0.22]
    )
    vien_chu.pushpull(4.mm)
    vien_chu.material = "#FFD600"

    # 6. Đèn LED (giả lập dải LED trắng quanh viền)
    led_vien = ents.add_circle([x0+width/2, y0+depth+25.mm, z0+height/2], [0,1,0], width/2+10.mm, 64)
    led_face = ents.add_face(led_vien)
    led_face.pushpull(2.mm)
    led_face.material = "#FFFFFF"

    model.commit_operation
  end
end
HopDenDuongXinhanDenLed.build