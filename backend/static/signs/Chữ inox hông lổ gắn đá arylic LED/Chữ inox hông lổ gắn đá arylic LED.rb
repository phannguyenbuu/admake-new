# Mã nguồn Ruby hoàn chỉnh 100%
module ChuInoxHongLoGanDaArylicLed
  extend self

  def hex_to_color(hex)
    hex = hex.delete('#')
    r = hex[0..1].to_i(16) / 255.0
    g = hex[2..3].to_i(16) / 255.0
    b = hex[4..5].to_i(16) / 255.0
    Sketchup::Color.new(r, g, b)
  end

  def build
    model = Sketchup.active_model
    model.start_operation('ChuInoxHongLoGanDaArylicLed', true)
    entities = model.active_entities

    # Thông số
    width = 1200.mm
    height = 400.mm
    depth = 60.mm
    khung_size = 25.mm

    # Màu sắc
    mau_nen = hex_to_color('#222222')
    mau_inox = hex_to_color('#FFD700')
    mau_led = hex_to_color('#FFB300')
    mau_logo = hex_to_color('#FFD700')

    # 1. Khung xương sắt hộp 25x25mm
    khung_group = entities.add_group
    khung = khung_group.entities

    # Khung viền ngoài
    pts = [
      [0, 0, 0],
      [width, 0, 0],
      [width, height, 0],
      [0, height, 0]
    ]
    # 4 cạnh ngoài
    khung.add_face(pts[0], pts[1], [pts[1][0], pts[1][1], khung_size], [pts[0][0], pts[0][1], khung_size]).pushpull(khung_size)
    khung.add_face(pts[1], pts[2], [pts[2][0], pts[2][1], khung_size], [pts[1][0], pts[1][1], khung_size]).pushpull(khung_size)
    khung.add_face(pts[2], pts[3], [pts[3][0], pts[3][1], khung_size], [pts[2][0], pts[2][1], khung_size]).pushpull(khung_size)
    khung.add_face(pts[3], pts[0], [pts[0][0], pts[0][1], khung_size], [pts[3][0], pts[3][1], khung_size]).pushpull(khung_size)

    # Xương đứng
    x1 = width / 3
    x2 = 2 * width / 3
    [x1, x2].each do |x|
      khung.add_face([x, 0, 0], [x + khung_size, 0, 0], [x + khung_size, height, 0], [x, height, 0]).pushpull(khung_size)
    end

    # Xương ngang tăng cứng
    y1 = height / 2
    khung.add_face([0, y1, 0], [width, y1, 0], [width, y1 + khung_size, 0], [0, y1 + khung_size, 0]).pushpull(khung_size)

    # Tai treo tường (2 bên trên)
    2.times do |i|
      x = i == 0 ? 0 : width - khung_size
      khung.add_face([x, height, 0], [x + khung_size, height, 0], [x + khung_size, height + 30.mm, 0], [x, height + 30.mm, 0]).pushpull(khung_size)
    end

    # 2. Tấm nền alu (giả định)
    nen_group = entities.add_group
    nen = nen_group.entities
    nen_face = nen.add_face([0, 0, khung_size], [width, 0, khung_size], [width, height, khung_size], [0, height, khung_size])
    nen_face.pushpull(3.mm)
    nen_face.material = mau_nen

    # 3. Viền nẹp alu/inox vàng
    nep_group = entities.add_group
    nep = nep_group.entities
    nep_width = 10.mm
    nep_face = nep.add_face([-nep_width, -nep_width, khung_size], [width+nep_width, -nep_width, khung_size], [width+nep_width, height+nep_width, khung_size], [-nep_width, height+nep_width, khung_size])
    hole = nep.add_face([0, 0, khung_size], [width, 0, khung_size], [width, height, khung_size], [0, height, khung_size])
    nep_face.followme(nep.add_circle([0,0,khung_size], [0,0,1], nep_width, 24))
    nep_face.material = mau_inox

    # 4. Chữ nổi "ĐÈN NHẬN"
    text_group = entities.add_group
    text = text_group.entities

    # Vị trí căn giữa bảng
    font_height = 200.mm
    font_depth = depth
    font = "Arial Black"
    text_main = "ĐÈN NHẬN"
    text_width = 0
    temp = text.add_3d_text(text_main, TextAlignCenter, font_height, font_depth, false, true, font)
    bounds = temp.bounds
    text_width = bounds.width
    x0 = (width - text_width) / 2
    y0 = (height - font_height) / 2

    # Xóa temp, tạo lại chữ từng ký tự để mô phỏng hông lỗ và mặt đá
    temp.erase!

    offset_x = x0
    text_main.each_char do |ch|
      next if ch == " "
      char_group = text.add_group
      char = char_group.entities
      char_3d = char.add_3d_text(ch, TextAlignLeft, font_height, font_depth, false, true, font)
      # Di chuyển ký tự về đúng vị trí
      char_group.transform!(Geom::Transformation.translation([offset_x, y0, khung_size+3.mm]))
      # Mặt đá acrylic vàng
      char_3d.material = mau_led
      # Hông inox vàng lỗ (mô phỏng bằng vật liệu vàng, không tạo lỗ thực)
      char_3d.back_material = mau_inox
      # Tăng offset_x cho ký tự tiếp theo
      offset_x += char_3d.bounds.width * 1.05
    end

    # 5. Logo đầu sư tử (mô phỏng khối tròn vàng nổi)
    logo_group = entities.add_group
    logo = logo_group.entities
    logo_center = [x0 - 60.mm, y0 + font_height/2, khung_size+3.mm+font_depth/2]
    logo.add_circle(logo_center, [0,0,1], 50.mm, 32)
    logo_face = logo.add_face(logo_center, [logo_center[0]+50.mm, logo_center[1], logo_center[2]], [logo_center[0], logo_center[1]+50.mm, logo_center[2]])
    logo_face.pushpull(20.mm)
    logo_face.material = mau_logo

    # 6. LED mô phỏng (các khối tròn nhỏ vàng trên mặt chữ)
    led_group = entities.add_group
    led = led_group.entities
    led_radius = 5.mm
    led_z = khung_size+3.mm+font_depth+5.mm
    (0..7).each do |i|
      led.add_circle([x0 + i*120.mm, y0 + font_height/2, led_z], [0,0,1], led_radius, 16)
      led_face = led.add_face([x0 + i*120.mm, y0 + font_height/2, led_z], [x0 + i*120.mm + led_radius, y0 + font_height/2, led_z], [x0 + i*120.mm, y0 + font_height/2 + led_radius, led_z])
      led_face.pushpull(5.mm)
      led_face.material = mau_led
    end

    model.commit_operation
  end
end
ChuInoxHongLoGanDaArylicLed.build