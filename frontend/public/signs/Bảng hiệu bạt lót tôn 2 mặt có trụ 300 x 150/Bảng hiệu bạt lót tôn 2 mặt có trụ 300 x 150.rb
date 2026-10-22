# Mã nguồn Ruby hoàn chỉnh 100%
module BangHieuBatLotTon2MatCoTru300X150
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuBatLotTon2MatCoTru300X150', true)
    entities = model.active_entities

    # Thông số chính
    width = 3000.mm
    height = 1500.mm
    depth = 30.mm
    khung_size = 25.mm
    tru_duongkinh = 90.mm
    tru_cao = 2000.mm
    tru_chon_dat = 400.mm
    tru_hien = tru_cao - tru_chon_dat
    khung_offset = khung_size / 2

    # Tạo nhóm bảng hiệu
    group_bang = entities.add_group

    # Khung viền sắt hộp 25x25
    khung = group_bang.entities.add_group
    pts = [
      [0, 0, 0],
      [width, 0, 0],
      [width, height, 0],
      [0, height, 0]
    ]
    # 4 cạnh ngoài
    khung.entities.add_face(pts).pushpull(-khung_size)
    # 2 xương ngang tăng cứng
    khung.entities.add_face(
      [khung_size, height/3, 0],
      [width-khung_size, height/3, 0],
      [width-khung_size, height/3+khung_size, 0],
      [khung_size, height/3+khung_size, 0]
    ).pushpull(-khung_size)
    khung.entities.add_face(
      [khung_size, 2*height/3, 0],
      [width-khung_size, 2*height/3, 0],
      [width-khung_size, 2*height/3+khung_size, 0],
      [khung_size, 2*height/3+khung_size, 0]
    ).pushpull(-khung_size)
    # 2 xương đứng giữa
    khung.entities.add_face(
      [width/3, khung_size, 0],
      [width/3+khung_size, khung_size, 0],
      [width/3+khung_size, height-khung_size, 0],
      [width/3, height-khung_size, 0]
    ).pushpull(-khung_size)
    khung.entities.add_face(
      [2*width/3, khung_size, 0],
      [2*width/3+khung_size, khung_size, 0],
      [2*width/3+khung_size, height-khung_size, 0],
      [2*width/3, height-khung_size, 0]
    ).pushpull(-khung_size)

    # Tấm nền bảng (tôn phẳng hoặc alu composite)
    mat_bang = Sketchup.active_model.materials.add('BangNen')
    mat_bang.color = Sketchup::Color.new('#FFFFFF')
    nen = group_bang.entities.add_group
    nen.entities.add_face(
      [khung_size, khung_size, khung_size],
      [width-khung_size, khung_size, khung_size],
      [width-khung_size, height-khung_size, khung_size],
      [khung_size, height-khung_size, khung_size]
    ).pushpull(depth - khung_size)
    nen.material = mat_bang

    # Viền nẹp nhôm/alu
    mat_vien = Sketchup.active_model.materials.add('VienAlu')
    mat_vien.color = Sketchup::Color.new('#D9D9D9')
    vien = group_bang.entities.add_group
    vien.entities.add_face(
      [0, 0, 0],
      [width, 0, 0],
      [width, khung_size, 0],
      [0, khung_size, 0]
    ).pushpull(depth)
    vien.entities.add_face(
      [0, height-khung_size, 0],
      [width, height-khung_size, 0],
      [width, height, 0],
      [0, height, 0]
    ).pushpull(depth)
    vien.entities.add_face(
      [0, khung_size, 0],
      [khung_size, khung_size, 0],
      [khung_size, height-khung_size, 0],
      [0, height-khung_size, 0]
    ).pushpull(depth)
    vien.entities.add_face(
      [width-khung_size, khung_size, 0],
      [width, khung_size, 0],
      [width, height-khung_size, 0],
      [width-khung_size, height-khung_size, 0]
    ).pushpull(depth)
    vien.material = mat_vien

    # Hai trụ sắt tròn D90mm
    mat_tru = Sketchup.active_model.materials.add('TruSat')
    mat_tru.color = Sketchup::Color.new('#B0B0B0')
    trugroup = entities.add_group
    [0, width].each do |x|
      tru = trugroup.entities.add_group
      circle = tru.entities.add_circle([x, height/2, -tru_chon_dat], [0,1,0], tru_duongkinh/2, 32)
      face = tru.entities.add_face(circle)
      face.pushpull(tru_cao)
      tru.material = mat_tru
    end

    # Đặt bảng lên trụ (giữa bảng cách mặt đất 500mm)
    group_bang.move!([0, 0, tru_hien - height/2])

    # Chữ nổi 3D (mô phỏng bằng 3D Text, thực tế là in trên bạt)
    mat_chu_xanh = Sketchup.active_model.materials.add('ChuXanh')
    mat_chu_xanh.color = Sketchup::Color.new('#00695C')
    mat_chu_cam = Sketchup.active_model.materials.add('ChuCam')
    mat_chu_cam.color = Sketchup::Color.new('#F57C00')
    mat_chu_den = Sketchup.active_model.materials.add('ChuDen')
    mat_chu_den.color = Sketchup::Color.new('#222222')

    # Dòng chữ chính "BIỂN BÁO DỰ ÁN"
    text1 = group_bang.entities.add_3d_text(
      "BIỂN BÁO DỰ ÁN",
      TextAlignCenter,
      "Arial Black",
      false, false,
      120.mm, 10.mm, 0, true, 0
    )
    text1.material = mat_chu_xanh
    text1.move!([width/2, height-180.mm, depth+2.mm])

    # Dòng chữ phụ cam "KẾT CẤU HẠ TẦNG KHU CÔNG NGHIỆP PHÚ XUÂN"
    text2 = group_bang.entities.add_3d_text(
      "KẾT CẤU HẠ TẦNG KHU CÔNG NGHIỆP PHÚ XUÂN",
      TextAlignCenter,
      "Arial Black",
      false, false,
      60.mm, 5.mm, 0, true, 0
    )
    text2.material = mat_chu_cam
    text2.move!([width/2, height-300.mm, depth+2.mm])

    # Các dòng thông tin bên phải (mô phỏng 3 dòng)
    thongtin = [
      "ĐỊA ĐIỂM: Khu công nghiệp Phú Xuân Xã Cư Dliê Mnông, H. Cư M’gar, Đắk Lắk",
      "CHỦ ĐẦU TƯ: Công ty Cổ phần DPV Đắk Lắk",
      "NGÀY KHỞI CÔNG: 24/4/2026"
    ]
    thongtin.each_with_index do |line, i|
      txt = group_bang.entities.add_3d_text(
        line,
        TextAlignLeft,
        "Arial",
        false, false,
        32.mm, 3.mm, 0, true, 0
      )
      txt.material = mat_chu_den
      txt.move!([width*0.52, height-420.mm-60.mm*i, depth+2.mm])
    end

    # Slogan phía dưới cùng
    slogan = [
      ["AN TOÀN", "LÀ TRÊN HẾT", "#F57C00"],
      ["CHẤT LƯỢNG", "LÀ DANH DỰ", "#F57C00"],
      ["TIẾN ĐỘ", "LÀ CAM KẾT", "#F57C00"],
      ["HIỆU QUẢ", "LÀ MỤC TIÊU", "#F57C00"]
    ]
    slogan.each_with_index do |(t1, t2, color), i|
      mat = Sketchup.active_model.materials.add("Slogan#{i}")
      mat.color = Sketchup::Color.new(color)
      txt1 = group_bang.entities.add_3d_text(
        t1,
        TextAlignCenter,
        "Arial Black",
        false, false,
        30.mm, 3.mm, 0, true, 0
      )
      txt1.material = mat
      txt1.move!([width*0.17+width*0.22*i, 80.mm, depth+2.mm])
      txt2 = group_bang.entities.add_3d_text(
        t2,
        TextAlignCenter,
        "Arial",
        false, false,
        18.mm, 2.mm, 0, true, 0
      )
      txt2.material = mat
      txt2.move!([width*0.17+width*0.22*i, 50.mm, depth+2.mm])
    end

    model.commit_operation
  end
end
BangHieuBatLotTon2MatCoTru300X150.build