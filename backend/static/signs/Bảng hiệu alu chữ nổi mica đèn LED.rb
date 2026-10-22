# Mã nguồn Ruby hoàn chỉnh 100%
module BangHieuAluChuNoiMicaDenLed
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuAluChuNoiMicaDenLed', true)
    entities = model.active_entities

    # Thông số tổng thể
    width = 1200.mm
    height = 400.mm
    depth = 60.mm
    khung_size = 30.mm
    viendep = 8.mm

    # 1. Khung xương sắt hộp 30x30mm
    khung_group = entities.add_group
    khung = khung_group.entities

    # Khung viền ngoài
    pts = [
      [0, 0, 0],
      [width, 0, 0],
      [width, height, 0],
      [0, height, 0]
    ]
    # 4 cạnh khung
    khung.add_face(pts).pushpull(-khung_size)
    # Xương đứng (2 xương giữa)
    khung.add_face([[width/3, 0, -khung_size], [width/3, height, -khung_size], [width/3+khung_size, height, -khung_size], [width/3+khung_size, 0, -khung_size]]).pushpull(khung_size)
    khung.add_face([[2*width/3, 0, -khung_size], [2*width/3, height, -khung_size], [2*width/3+khung_size, height, -khung_size], [2*width/3+khung_size, 0, -khung_size]]).pushpull(khung_size)
    # Xương ngang tăng cứng
    khung.add_face([[0, height/2, -khung_size], [width, height/2, -khung_size], [width, height/2+khung_size, -khung_size], [0, height/2+khung_size, -khung_size]]).pushpull(khung_size)

    # 2. Tấm nền alu composite
    nen_group = entities.add_group
    nen = nen_group.entities
    nen_face = nen.add_face([ [0,0,0], [width,0,0], [width,height,0], [0,height,0] ])
    nen_face.pushpull(depth - 2*viendep)
    nen_group.material = "#3A2323"

    # 3. Viền nẹp alu vàng
    vien_group = entities.add_group
    vien = vien_group.entities
    # Viền trên
    vien.add_face([[0,0,0],[width,0,0],[width,0,viendep],[0,0,viendep]]).pushpull(viendep)
    # Viền dưới
    vien.add_face([[0,height,0],[width,height,0],[width,height,viendep],[0,height,viendep]]).pushpull(viendep)
    # Viền trái
    vien.add_face([[0,0,0],[0,height,0],[0,height,viendep],[0,0,viendep]]).pushpull(viendep)
    # Viền phải
    vien.add_face([[width,0,0],[width,height,0],[width,height,viendep],[width,0,viendep]]).pushpull(viendep)
    vien_group.material = "#FFD600"

    # 4. Chữ nổi "TIỆM NHÀ"
    text_group = entities.add_group
    text = text_group.entities
    font = "Arial Black"
    text_height = 120.mm
    text_depth = 25.mm
    text_pos_x = 60.mm
    text_pos_y = height - 160.mm
    text_entities = text.add_3d_text(
      "TIỆM NHÀ",
      TextAlignLeft,
      false,
      text_height,
      text_depth,
      0,
      false,
      font
    )
    text_group.material = "#FFD600"
    text_group.move!([text_pos_x, text_pos_y, depth - 2*viendep + 2.mm])

    # 5. Logo "ỐC" (chữ cách điệu lớn)
    logo_group = entities.add_group
    logo = logo_group.entities
    logo_font = "Arial Black"
    logo_height = 250.mm
    logo_depth = 60.mm
    logo_pos_x = width/2 + 60.mm
    logo_pos_y = height - 270.mm
    logo_entities = logo.add_3d_text(
      "ỐC",
      TextAlignLeft,
      false,
      logo_height,
      logo_depth,
      0,
      false,
      logo_font
    )
    logo_group.material = "#E53935"
    logo_group.move!([logo_pos_x, logo_pos_y, depth - 2*viendep + 2.mm])

    # 6. Dòng phụ "Giá bình dân"
    phu_group = entities.add_group
    phu = phu_group.entities
    phu_font = "Arial"
    phu_height = 60.mm
    phu_depth = 15.mm
    phu_pos_x = 100.mm
    phu_pos_y = 60.mm
    phu_entities = phu.add_3d_text(
      "Giá bình dân",
      TextAlignLeft,
      false,
      phu_height,
      phu_depth,
      0,
      false,
      phu_font
    )
    phu_group.material = "#FFD600"
    phu_group.move!([phu_pos_x, phu_pos_y, depth - 2*viendep + 2.mm])

    # 7. Gạch chân vàng dưới "TIỆM NHÀ"
    gach_group = entities.add_group
    gach = gach_group.entities
    gach_width = 380.mm
    gach_height = 8.mm
    gach_depth = 8.mm
    gach_x = text_pos_x
    gach_y = text_pos_y - 20.mm
    gach_face = gach.add_face([
      [gach_x, gach_y, depth - 2*viendep + 2.mm],
      [gach_x + gach_width, gach_y, depth - 2*viendep + 2.mm],
      [gach_x + gach_width, gach_y + gach_height, depth - 2*viendep + 2.mm],
      [gach_x, gach_y + gach_height, depth - 2*viendep + 2.mm]
    ])
    gach_face.pushpull(gach_depth)
    gach_group.material = "#FFD600"

    # 8. LED mô phỏng (chỉ tạo khối tròn nhỏ phía dưới biển)
    led_group = entities.add_group
    led = led_group.entities
    led_radius = 10.mm
    led_center = [width/2, -20.mm, depth/2]
    led_face = led.add_circle(led_center, [0,0,1], led_radius)
    led_face = led.add_face(led_face)
    led_face.pushpull(8.mm)
    led_group.material = "white"

    model.commit_operation
  end
end
BangHieuAluChuNoiMicaDenLed.build