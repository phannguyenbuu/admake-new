# Mã nguồn Ruby hoàn chỉnh 100%
module BangHieuAluChuNoiMica
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuAluChuNoiMica', true)
    entities = model.active_entities

    # Kích thước tổng thể
    width = 1200.mm
    height = 400.mm
    depth = 60.mm

    # Khung sắt hộp 30x30mm
    khung_group = entities.add_group
    khung = khung_group.entities
    khung_size = 30.mm

    # Khung viền ngoài
    pts = [
      [0, 0, 0],
      [width, 0, 0],
      [width, height, 0],
      [0, height, 0]
    ]
    khung.add_face(pts).pushpull(-khung_size)
    # Xương đứng
    (1..(width/500.mm-1)).each do |i|
      x = i*500.mm
      khung.add_face(
        [x, 0, 0],
        [x+khung_size, 0, 0],
        [x+khung_size, height, 0],
        [x, height, 0]
      ).pushpull(-khung_size)
    end
    # Xương ngang tăng cứng
    khung.add_face(
      [0, height/2-khung_size/2, 0],
      [width, height/2-khung_size/2, 0],
      [width, height/2+khung_size/2, 0],
      [0, height/2+khung_size/2, 0]
    ).pushpull(-khung_size)

    # Tấm nền alu (phía trước khung)
    alu_group = entities.add_group
    alu = alu_group.entities
    alu_thickness = 3.mm

    # Nền đỏ trên (2/3 trên)
    red_height = (height*0.6).to_i
    face_red = alu.add_face(
      [0, height-red_height, alu_thickness],
      [width, height-red_height, alu_thickness],
      [width, height, alu_thickness],
      [0, height, alu_thickness]
    )
    face_red.pushpull(-alu_thickness)
    mat_red = model.materials.add('AluRed')
    mat_red.color = '#E53935'
    face_red.material = mat_red
    face_red.back_material = mat_red

    # Nền trắng dưới (1/3 dưới)
    face_white = alu.add_face(
      [0, 0, alu_thickness],
      [width, 0, alu_thickness],
      [width, height-red_height, alu_thickness],
      [0, height-red_height, alu_thickness]
    )
    face_white.pushpull(-alu_thickness)
    mat_white = model.materials.add('AluWhite')
    mat_white.color = '#FFFFFF'
    face_white.material = mat_white
    face_white.back_material = mat_white

    # Viền alu cạnh (nẹp alu đỏ)
    vien_group = entities.add_group
    vien = vien_group.entities
    vien_width = 30.mm
    # Viền trái
    vien.add_face(
      [0, 0, alu_thickness],
      [vien_width, 0, alu_thickness],
      [vien_width, height, alu_thickness],
      [0, height, alu_thickness]
    ).pushpull(-vien_width)
    # Viền phải
    vien.add_face(
      [width-vien_width, 0, alu_thickness],
      [width, 0, alu_thickness],
      [width, height, alu_thickness],
      [width-vien_width, height, alu_thickness]
    ).pushpull(-vien_width)
    # Viền trên
    vien.add_face(
      [0, height-vien_width, alu_thickness],
      [width, height-vien_width, alu_thickness],
      [width, height, alu_thickness],
      [0, height, alu_thickness]
    ).pushpull(-vien_width)
    # Viền dưới
    vien.add_face(
      [0, 0, alu_thickness],
      [width, 0, alu_thickness],
      [width, vien_width, alu_thickness],
      [0, vien_width, alu_thickness]
    ).pushpull(-vien_width)
    mat_vien = model.materials.add('VienAluRed')
    mat_vien.color = '#E53935'
    vien_group.material = mat_vien

    # Chữ nổi HAFELE (mica trắng, viền đỏ)
    text_group = entities.add_group
    text_z = alu_thickness + 5.mm # cách nền 5mm
    text_height = 120.mm
    text_depth = 40.mm
    text_x = (width - 480.mm)/2 # căn giữa, ước lượng chiều dài chữ
    text_y = height - red_height + 60.mm
    h_text = text_group.entities.add_3d_text(
      "HAFELE",
      TextAlignCenter,
      text_height,
      false,
      true,
      text_depth
    )
    h_text.transform!(Geom::Transformation.translation([text_x, text_y, text_z]))
    mat_hafele = model.materials.add('HafeleWhite')
    mat_hafele.color = '#FFFFFF'
    h_text.material = mat_hafele

    # Chữ nổi ĐĂNG TUẤN (mica đỏ)
    text2_height = 80.mm
    text2_depth = 30.mm
    text2_x = (width - 400.mm)/2
    text2_y = height - red_height + 10.mm
    d_text = text_group.entities.add_3d_text(
      "ĐĂNG TUẤN",
      TextAlignCenter,
      text2_height,
      false,
      true,
      text2_depth
    )
    d_text.transform!(Geom::Transformation.translation([text2_x, text2_y, text_z]))
    mat_dang_tuan = model.materials.add('DangTuanRed')
    mat_dang_tuan.color = '#E53935'
    d_text.material = mat_dang_tuan

    # Chữ phụ nhỏ (đen)
    phu_group = entities.add_group
    phu_z = alu_thickness + 2.mm
    phu_size = 22.mm
    phu_depth = 5.mm
    phu_x = 60.mm
    phu_y = height - red_height - 30.mm
    phu1 = phu_group.entities.add_3d_text(
      "Thiết kế Gia Dụng Nội Thất",
      TextAlignLeft,
      phu_size,
      false,
      true,
      phu_depth
    )
    phu1.transform!(Geom::Transformation.translation([phu_x, phu_y, phu_z]))
    phu2 = phu_group.entities.add_3d_text(
      "Phụ Kiện Cửa & Ngũ Kim",
      TextAlignLeft,
      phu_size,
      false,
      true,
      phu_depth
    )
    phu2.transform!(Geom::Transformation.translation([phu_x, phu_y-28.mm, phu_z]))
    phu3 = phu_group.entities.add_3d_text(
      "Phụ Kiện Đồ Gỗ Nội Thất",
      TextAlignLeft,
      phu_size,
      false,
      true,
      phu_depth
    )
    phu3.transform!(Geom::Transformation.translation([phu_x, phu_y-56.mm, phu_z]))
    phu4 = phu_group.entities.add_3d_text(
      "www.hafele-dangtuan.com",
      TextAlignLeft,
      phu_size,
      false,
      true,
      phu_depth
    )
    phu4.transform!(Geom::Transformation.translation([phu_x, phu_y-84.mm, phu_z]))
    phu5 = phu_group.entities.add_3d_text(
      "ĐT: 0914 09 09 92 - 0941 78 38 48",
      TextAlignLeft,
      phu_size,
      false,
      true,
      phu_depth
    )
    phu5.transform!(Geom::Transformation.translation([phu_x, phu_y-112.mm, phu_z]))
    mat_phu = model.materials.add('PhuDen')
    mat_phu.color = '#222222'
    phu_group.material = mat_phu

    model.commit_operation
  end
end
BangHieuAluChuNoiMica.build