# Mã nguồn Ruby hoàn chỉnh 100%
module BangHieuTonSongChuNoiMicaDenLed
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuTonSongChuNoiMicaDenLed', true)
    entities = model.active_entities

    # Thông số tổng thể
    width = 1200.mm
    height = 400.mm
    depth = 60.mm
    khung_size = 30.mm
    ton_song_thickness = 1.2.mm
    nepsize = 10.mm

    # 1. Khung xương sắt hộp
    khung_group = entities.add_group
    khung = khung_group.entities

    # Khung viền ngoài
    pts = [
      [0,0,0],
      [width,0,0],
      [width,height,0],
      [0,height,0]
    ]
    khung.add_face(pts).pushpull(-khung_size)
    # Xương đứng (cách nhau ~500mm)
    khung.add_face([[width/2-khung_size/2,0,0],[width/2+khung_size/2,0,0],[width/2+khung_size/2,height,0],[width/2-khung_size/2,height,0]]).pushpull(-khung_size)
    # Xương ngang tăng cứng
    khung.add_face([[0,height/2-khung_size/2,0],[width,height/2-khung_size/2,0],[width,height/2+khung_size/2,0],[0,height/2+khung_size/2,0]]).pushpull(-khung_size)
    # Tai treo tường (2 bên trên)
    tai1 = khung.add_face([[-khung_size, height-khung_size, -khung_size],[0, height-khung_size, -khung_size],[0, height, -khung_size],[ -khung_size, height, -khung_size]])
    tai1.pushpull(-20.mm)
    tai2 = khung.add_face([[width, height-khung_size, -khung_size],[width+khung_size, height-khung_size, -khung_size],[width+khung_size, height, -khung_size],[width, height, -khung_size]])
    tai2.pushpull(-20.mm)

    # 2. Tấm nền tôn sóng
    ton_group = entities.add_group
    ton = ton_group.entities
    ton_face = ton.add_face([ [khung_size, khung_size, 0], [width-khung_size, khung_size, 0], [width-khung_size, height-khung_size, 0], [khung_size, height-khung_size, 0] ])
    ton_face.pushpull(ton_song_thickness)
    # Màu tôn sóng trắng
    mat_ton = model.materials.add('TonSongTrang')
    mat_ton.color = Sketchup::Color.new('#FFFFFF')
    ton_face.material = mat_ton
    ton_face.back_material = mat_ton

    # 3. Viền nẹp alu/nhôm
    nep_group = entities.add_group
    nep = nep_group.entities
    # Viền trên
    nep.add_face([
      [khung_size-nepsize, height-khung_size, ton_song_thickness],
      [width-khung_size+nepsize, height-khung_size, ton_song_thickness],
      [width-khung_size+nepsize, height-khung_size+nepsize, ton_song_thickness],
      [khung_size-nepsize, height-khung_size+nepsize, ton_song_thickness]
    ]).pushpull(depth/2)
    # Viền dưới
    nep.add_face([
      [khung_size-nepsize, khung_size-nepsize, ton_song_thickness],
      [width-khung_size+nepsize, khung_size-nepsize, ton_song_thickness],
      [width-khung_size+nepsize, khung_size, ton_song_thickness],
      [khung_size-nepsize, khung_size, ton_song_thickness]
    ]).pushpull(depth/2)
    # Viền trái
    nep.add_face([
      [khung_size-nepsize, khung_size, ton_song_thickness],
      [khung_size, khung_size, ton_song_thickness],
      [khung_size, height-khung_size, ton_song_thickness],
      [khung_size-nepsize, height-khung_size, ton_song_thickness]
    ]).pushpull(depth/2)
    # Viền phải
    nep.add_face([
      [width-khung_size, khung_size, ton_song_thickness],
      [width-khung_size+nepsize, khung_size, ton_song_thickness],
      [width-khung_size+nepsize, height-khung_size, ton_song_thickness],
      [width-khung_size, height-khung_size, ton_song_thickness]
    ]).pushpull(depth/2)
    # Màu viền cam vàng
    mat_nep = model.materials.add('NepCamVang')
    mat_nep.color = Sketchup::Color.new('#FFB300')
    nep_group.material = mat_nep

    # 4. Chữ nổi 3D "BÁNH BAO TƯƠI"
    chu_group = entities.add_group
    chu = chu_group.entities
    font_main = "Arial Black"
    text_main = "BÁNH BAO TƯƠI"
    # Tạo chữ nổi lớn (cao 120mm, dày 40mm)
    chu.add_3d_text(
      text_main,
      TextAlignCenter,
      false,
      120.mm,
      40.mm,
      true,
      true,
      font_main,
      0,
      0
    ).each { |e| e.transform!(Geom::Transformation.new([width/2, height-150.mm, ton_song_thickness+5.mm])) }
    # Màu chữ cam vàng
    mat_chu = model.materials.add('ChuCamVang')
    mat_chu.color = Sketchup::Color.new('#FFB300')
    chu_group.material = mat_chu

    # 5. Chữ phụ "Ăn Ngon Sống Khỏe"
    chu_phu_group = entities.add_group
    chu_phu = chu_phu_group.entities
    font_phu = "Arial Rounded MT Bold"
    text_phu = "Ăn Ngon Sống Khỏe"
    chu_phu.add_3d_text(
      text_phu,
      TextAlignCenter,
      false,
      60.mm,
      20.mm,
      true,
      true,
      font_phu,
      0,
      0
    ).each { |e| e.transform!(Geom::Transformation.new([width/2, height-250.mm, ton_song_thickness+5.mm])) }
    # Màu chữ phụ cam vàng
    chu_phu_group.material = mat_chu

    # 6. LED hắt sáng chân chữ (mô phỏng khối sáng phía sau chữ)
    led_group = entities.add_group
    led = led_group.entities
    led_face = led.add_face([
      [width/2-300.mm, height-150.mm-10.mm, ton_song_thickness+2.mm],
      [width/2+300.mm, height-150.mm-10.mm, ton_song_thickness+2.mm],
      [width/2+300.mm, height-150.mm+130.mm, ton_song_thickness+2.mm],
      [width/2-300.mm, height-150.mm+130.mm, ton_song_thickness+2.mm]
    ])
    mat_led = model.materials.add('LEDVangNhe')
    mat_led.color = Sketchup::Color.new('#FFF9C4')
    mat_led.alpha = 0.5
    led_face.material = mat_led

    # 7. Nhóm chữ dọc bên phải (BÁNH BAO TƯƠI)
    chu_doc_group = entities.add_group
    chu_doc = chu_doc_group.entities
    text_doc = "BÁNH\nBAO\nTƯƠI"
    chu_doc.add_3d_text(
      text_doc,
      TextAlignCenter,
      false,
      60.mm,
      20.mm,
      true,
      true,
      font_main,
      0,
      0
    ).each { |e| e.transform!(Geom::Transformation.new([width-80.mm, 60.mm, ton_song_thickness+5.mm])) }
    chu_doc_group.material = mat_chu

    model.commit_operation
  end
end
BangHieuTonSongChuNoiMicaDenLed.build