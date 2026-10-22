# Mã nguồn Ruby hoàn chỉnh 100%
module HopDenBatInUv1Mat400X90
  def self.build
    model = Sketchup.active_model
    model.start_operation('HopDenBatInUv1Mat400X90', true)
    entities = model.active_entities

    # Thông số
    width = 4000.mm
    height = 900.mm
    depth = 30.mm
    khung_size = 25.mm
    vien_nep = 30.mm

    # Màu sắc
    mau_xanh = "#0057B7"
    mau_vang = "#FFE600"
    mau_trang = "#FFFFFF"
    mau_nhom = "#E5E5E5"
    mau_den = "#222222"

    materials = model.materials
    mat_xanh = materials.add('XanhBien'); mat_xanh.color = mau_xanh
    mat_vang = materials.add('VangTuoi'); mat_vang.color = mau_vang
    mat_trang = materials.add('Trang'); mat_trang.color = mau_trang
    mat_nhom = materials.add('Nhom'); mat_nhom.color = mau_nhom
    mat_den = materials.add('Den'); mat_den.color = mau_den

    # 1. Dựng khung xương sắt hộp
    khung_group = entities.add_group
    kg = khung_group.entities

    # Khung ngoài
    [
      [ORIGIN, [width, 0, 0]],
      [[width, 0, 0], [width, height, 0]],
      [[width, height, 0], [0, height, 0]],
      [[0, height, 0], ORIGIN]
    ].each do |p1, p2|
      edge = kg.add_line(p1, p2)
      edge.faces.each { |f| f.erase! }
      kg.add_face([p1, [p1[0], p1[1], p1[2]+khung_size], [p2[0], p2[1], p2[2]+khung_size], p2]).pushpull(-khung_size)
    end

    # Xương đứng (cách nhau ~500mm)
    (1..7).each do |i|
      x = i * (width/8)
      kg.add_face([[x, 0, 0], [x+khung_size, 0, 0], [x+khung_size, height, 0], [x, height, 0]]).pushpull(-khung_size)
    end

    # Xương ngang tăng cứng (trên/dưới)
    [khung_size, height-khung_size*2].each do |y|
      kg.add_face([[0, y, 0], [width, y, 0], [width, y+khung_size, 0], [0, y+khung_size, 0]]).pushpull(-khung_size)
    end

    khung_group.material = mat_nhom

    # 2. Tấm nền bạt in UV
    nen_group = entities.add_group
    face = nen_group.entities.add_face([ [0,0,khung_size], [width,0,khung_size], [width,height,khung_size], [0,height,khung_size] ])
    face.pushpull(depth-khung_size)
    nen_group.material = mat_xanh

    # 3. Viền nẹp nhôm/alu
    vien_group = entities.add_group
    # Trên
    vien_group.entities.add_face([[0,0,depth], [width,0,depth], [width,vien_nep,depth], [0,vien_nep,depth]]).pushpull(-vien_nep)
    # Dưới
    vien_group.entities.add_face([[0,height-vien_nep,depth], [width,height-vien_nep,depth], [width,height,depth], [0,height,depth]]).pushpull(-vien_nep)
    # Trái
    vien_group.entities.add_face([[0,0,depth], [vien_nep,0,depth], [vien_nep,height,depth], [0,height,depth]]).pushpull(-vien_nep)
    # Phải
    vien_group.entities.add_face([[width-vien_nep,0,depth], [width,0,depth], [width,height,depth], [width-vien_nep,height,depth]]).pushpull(-vien_nep)
    vien_group.material = mat_nhom

    # 4. Chữ nổi (dùng add_3d_text mô phỏng in UV)
    text_group = entities.add_group

    # Dòng trên cùng: "TIỆM IN PHƯỚC TIẾN - IN NHANH LẤY LIỀN"
    text1 = text_group.entities.add_3d_text(
      "TIỆM IN PHƯỚC TIẾN - IN NHANH LẤY LIỀN",
      TextAlignCenter,
      "Arial Black",
      false, false,
      120.mm, 10.mm, 0, true, 0
    )
    text1.material = mat_vang
    text1.transform!(Geom::Transformation.translation([width/2, 60.mm, depth+1.mm]))

    # Dòng giữa: "IN MÀU - PHOTOCOPY - ẢNH THẺ"
    text2 = text_group.entities.add_3d_text(
      "IN MÀU - PHOTOCOPY - ẢNH THẺ",
      TextAlignCenter,
      "Arial Black",
      false, false,
      140.mm, 10.mm, 0, true, 0
    )
    text2.material = mat_xanh
    text2.transform!(Geom::Transformation.translation([width/2, 220.mm, depth+1.mm]))

    # Dòng phụ nhỏ
    text3 = text_group.entities.add_3d_text(
      "SCAN - PHOTOCOPY - IN MÀU - ĐÓNG SÁCH - IN MENU\nTEM NHÃN CARD VISIT - TỜ RƠI QUẢNG CÁO - CHỈNH SỬA ĐỒ ÁN - IN 3D THEO YÊU CẦU - VĂN PHÒNG PHẨM - IN ẢNH",
      TextAlignCenter,
      "Arial",
      false, false,
      40.mm, 5.mm, 0, true, 0
    )
    text3.material = mat_trang
    text3.transform!(Geom::Transformation.translation([width/2, 350.mm, depth+1.mm]))

    # Góc phải: "HỖ TRỢ NHẬN FILE ..."
    text4 = text_group.entities.add_3d_text(
      "HỖ TRỢ NHẬN FILE\nSỬA & IN ONLINE TỪ XA\nGIAO HÀNG TẬN NƠI",
      TextAlignLeft,
      "Arial Black",
      false, false,
      40.mm, 5.mm, 0, true, 0
    )
    text4.material = mat_xanh
    text4.transform!(Geom::Transformation.translation([width-600.mm, 60.mm, depth+1.mm]))

    # Dòng địa chỉ dưới cùng
    text5 = text_group.entities.add_3d_text(
      "395 LÊ DUẨN - BUÔN MA THUỘT - ĐẮK LẮK",
      TextAlignCenter,
      "Arial Black",
      false, false,
      60.mm, 8.mm, 0, true, 0
    )
    text5.material = mat_trang
    text5.transform!(Geom::Transformation.translation([width/2, height-80.mm, depth+1.mm]))

    # Số điện thoại
    text6 = text_group.entities.add_3d_text(
      "Liên hệ: 0329.663.642",
      TextAlignRight,
      "Arial Black",
      false, false,
      40.mm, 5.mm, 0, true, 0
    )
    text6.material = mat_trang
    text6.transform!(Geom::Transformation.translation([width-80.mm, height-80.mm, depth+1.mm]))

    # 5. Logo (mô phỏng khối vuông + chữ)
    logo_group = entities.add_group
    # Nền logo
    logo_face = logo_group.entities.add_face([[60.mm, 60.mm, depth+2.mm], [160.mm, 60.mm, depth+2.mm], [160.mm, 160.mm, depth+2.mm], [60.mm, 160.mm, depth+2.mm]])
    logo_face.pushpull(8.mm)
    logo_group.material = mat_xanh
    # Chữ "PHUOCTIEN" (mô phỏng)
    logo_text = logo_group.entities.add_3d_text(
      "PHUOCTIEN",
      TextAlignCenter,
      "Arial Black",
      false, false,
      22.mm, 2.mm, 0, true, 0
    )
    logo_text.material = mat_trang
    logo_text.transform!(Geom::Transformation.translation([110.mm, 80.mm, depth+10.mm]))

    # 6. Tai treo tường (2 bên)
    tai_group = entities.add_group
    [[0, height/2-60.mm, 0], [width-60.mm, height/2-60.mm, 0]].each do |pos|
      tai = tai_group.entities.add_face([
        pos,
        [pos[0]+60.mm, pos[1], pos[2]],
        [pos[0]+60.mm, pos[1]+20.mm, pos[2]],
        [pos[0], pos[1]+20.mm, pos[2]]
      ])
      tai.pushpull(-60.mm)
    end
    tai_group.material = mat_nhom

    model.commit_operation
  end
end
HopDenBatInUv1Mat400X90.build