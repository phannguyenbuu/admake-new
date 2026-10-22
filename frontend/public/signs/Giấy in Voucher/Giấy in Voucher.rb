# Mã nguồn Ruby hoàn chỉnh 100%
module GiayInVoucher
  def self.build
    model = Sketchup.active_model
    model.start_operation('GiayInVoucher', true)
    entities = model.active_entities

    # Kích thước voucher
    width = 200.mm
    height = 100.mm
    thickness = 2.mm

    # Màu sắc
    color_black = Sketchup::Color.new("#181820")
    color_gold = Sketchup::Color.new("#FFD700")
    color_white = Sketchup::Color.new("#FFFFFF")
    color_blue = Sketchup::Color.new("#0099FF")
    color_green = Sketchup::Color.new("#3BC371")

    # Tạo tấm nền voucher (giả lập giấy couche)
    pts = [
      [0, 0, 0],
      [width, 0, 0],
      [width, height, 0],
      [0, height, 0]
    ]
    face = entities.add_face(pts)
    face.pushpull(thickness)
    face.material = color_black
    face.back_material = color_black

    # Logo KiotViet (hình tròn + text)
    logo_group = entities.add_group
    logo_entities = logo_group.entities
    # Vẽ hình tròn xanh dương
    logo_center = [10.mm, height - 15.mm, thickness + 0.1.mm]
    logo_radius = 4.mm
    circle1 = logo_entities.add_circle(logo_center, [0,0,1], logo_radius)
    logo_face1 = logo_entities.add_face(circle1)
    logo_face1.material = color_blue
    # Vẽ hình tròn nhỏ xanh lá
    circle2 = logo_entities.add_circle(logo_center, [0,0,1], 2.2.mm)
    logo_face2 = logo_entities.add_face(circle2)
    logo_face2.material = color_green
    # Text "KiotViet"
    logo_text = logo_entities.add_3d_text(
      "KiotViet",
      TextAlignLeft,
      "Arial",
      false,
      false,
      4.mm,
      1.2.mm,
      0.5,
      true,
      thickness + 0.2.mm
    )
    logo_text.transform!(Geom::Transformation.translation([18.mm, height - 19.mm, thickness + 0.2.mm]))
    logo_text.material = color_white

    # Dòng trên: PHẦN MỀM QUẢN LÝ BÁN HÀNG
    text1 = entities.add_3d_text(
      "PHẦN MỀM QUẢN LÝ BÁN HÀNG",
      TextAlignCenter,
      "Arial",
      true,
      false,
      5.mm,
      1.5.mm,
      0.5,
      true,
      thickness + 0.2.mm
    )
    text1.material = color_gold
    text1.transform!(Geom::Transformation.translation([width/2 - 55.mm, height - 28.mm, thickness + 0.2.mm]))

    # Dòng chính: VOUCHER
    text2 = entities.add_3d_text(
      "VOUCHER",
      TextAlignCenter,
      "Times New Roman",
      true,
      false,
      14.mm,
      2.5.mm,
      0.5,
      true,
      thickness + 0.2.mm
    )
    text2.material = color_gold
    text2.transform!(Geom::Transformation.translation([width/2 - 38.mm, height - 55.mm, thickness + 0.2.mm]))

    # Số tiền: 500.000đ (nền vàng, chữ đen)
    rect_group = entities.add_group
    rect_entities = rect_group.entities
    rect_pts = [
      [width/2 - 40.mm, height - 75.mm, thickness + 0.1.mm],
      [width/2 + 40.mm, height - 75.mm, thickness + 0.1.mm],
      [width/2 + 40.mm, height - 60.mm, thickness + 0.1.mm],
      [width/2 - 40.mm, height - 60.mm, thickness + 0.1.mm]
    ]
    rect_face = rect_entities.add_face(rect_pts)
    rect_face.pushpull(0.5.mm)
    rect_face.material = color_gold

    text3 = rect_entities.add_3d_text(
      "500.000đ",
      TextAlignCenter,
      "Arial Black",
      true,
      false,
      10.mm,
      2.mm,
      0.5,
      true,
      thickness + 0.7.mm
    )
    text3.material = color_black
    text3.transform!(Geom::Transformation.translation([width/2 - 25.mm, height - 73.mm, thickness + 0.7.mm]))

    # Dòng phụ: Áp dụng cho gói chuyên nghiệp (nền vàng, chữ trắng)
    rect2_group = entities.add_group
    rect2_entities = rect2_group.entities
    rect2_pts = [
      [width/2 - 40.mm, height - 80.mm, thickness + 0.1.mm],
      [width/2 + 40.mm, height - 80.mm, thickness + 0.1.mm],
      [width/2 + 40.mm, height - 75.mm, thickness + 0.1.mm],
      [width/2 - 40.mm, height - 75.mm, thickness + 0.1.mm]
    ]
    rect2_face = rect2_entities.add_face(rect2_pts)
    rect2_face.pushpull(0.5.mm)
    rect2_face.material = color_gold

    text4 = rect2_entities.add_3d_text(
      "Áp dụng cho gói chuyên nghiệp",
      TextAlignCenter,
      "Arial",
      false,
      false,
      3.5.mm,
      1.mm,
      0.5,
      true,
      thickness + 0.7.mm
    )
    text4.material = color_white
    text4.transform!(Geom::Transformation.translation([width/2 - 33.mm, height - 79.5.mm, thickness + 0.7.mm]))

    # Viền vàng dưới cùng
    line_group = entities.add_group
    line_entities = line_group.entities
    line_pts = [
      [0, 7.mm, thickness + 0.1.mm],
      [width, 7.mm, thickness + 0.1.mm],
      [width, 11.mm, thickness + 0.1.mm],
      [0, 11.mm, thickness + 0.1.mm]
    ]
    line_face = line_entities.add_face(line_pts)
    line_face.pushpull(0.5.mm)
    line_face.material = color_gold

    # Dòng nhỏ dưới cùng: Gọi ngay để được tư vấn, địa chỉ
    text5 = entities.add_3d_text(
      "Gọi ngay để được tư vấn   Địa chỉ: L08 Tôn Đức Thắng, Phường Buôn Ma Thuột, Tỉnh Đắk Lắk",
      TextAlignLeft,
      "Arial",
      false,
      false,
      2.5.mm,
      0.7.mm,
      0.5,
      true,
      thickness + 0.7.mm
    )
    text5.material = color_white
    text5.transform!(Geom::Transformation.translation([10.mm, 2.mm, thickness + 0.7.mm]))

    # Icon quà tặng (mô phỏng bằng khối hộp + nơ)
    gift_group = entities.add_group
    gift_entities = gift_group.entities
    # Hộp quà
    box = gift_entities.add_face([
      [width - 25.mm, height - 18.mm, thickness + 0.2.mm],
      [width - 15.mm, height - 18.mm, thickness + 0.2.mm],
      [width - 15.mm, height - 8.mm, thickness + 0.2.mm],
      [width - 25.mm, height - 8.mm, thickness + 0.2.mm]
    ])
    box.pushpull(4.mm)
    box.material = color_gold
    # Nơ trắng
    bow = gift_entities.add_face([
      [width - 22.mm, height - 6.mm, thickness + 4.2.mm],
      [width - 18.mm, height - 6.mm, thickness + 4.2.mm],
      [width - 18.mm, height - 4.mm, thickness + 4.2.mm],
      [width - 22.mm, height - 4.mm, thickness + 4.2.mm]
    ])
    bow.pushpull(1.2.mm)
    bow.material = color_white

    model.commit_operation
  end
end
GiayInVoucher.build