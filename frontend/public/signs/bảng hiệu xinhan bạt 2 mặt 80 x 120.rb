# Mã nguồn Ruby hoàn chỉnh 100%
module BangHieuXinhanBat2Mat80X120
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuXinhanBat2Mat80X120', true)
    entities = model.active_entities

    # Kích thước tổng thể
    width = 800.mm
    height = 1200.mm
    depth = 30.mm

    # Khung sắt hộp 25x25mm
    khung_thickness = 25.mm
    khung_group = entities.add_group
    khung = khung_group.entities

    # 4 thanh khung viền ngoài
    # Trên
    khung.add_face([0,0,0], [width,0,0], [width,khung_thickness,0], [0,khung_thickness,0]).pushpull(depth)
    # Dưới
    khung.add_face([0,height-khung_thickness,0], [width,height-khung_thickness,0], [width,height,0], [0,height,0]).pushpull(depth)
    # Trái
    khung.add_face([0,khung_thickness,0], [khung_thickness,khung_thickness,0], [khung_thickness,height-khung_thickness,0], [0,height-khung_thickness,0]).pushpull(depth)
    # Phải
    khung.add_face([width-khung_thickness,khung_thickness,0], [width,khung_thickness,0], [width,height-khung_thickness,0], [width-khung_thickness,height-khung_thickness,0]).pushpull(depth)

    # Xương đứng giữa (cách nhau ~500mm)
    x1 = khung_thickness + 500.mm
    khung.add_face([x1,khung_thickness,0], [x1+khung_thickness,khung_thickness,0], [x1+khung_thickness,height-khung_thickness,0], [x1,height-khung_thickness,0]).pushpull(depth)

    # Xương ngang tăng cứng (ở giữa chiều cao)
    y1 = height/2 - khung_thickness/2
    khung.add_face([khung_thickness,y1,0], [width-khung_thickness,y1,0], [width-khung_thickness,y1+khung_thickness,0], [khung_thickness,y1+khung_thickness,0]).pushpull(depth)

    # Tấm nền bạt hiflex căng phẳng (lọt lòng khung)
    nen_group = entities.add_group
    nen = nen_group.entities
    nen_face = nen.add_face(
      [khung_thickness, khung_thickness, khung_thickness],
      [width - khung_thickness, khung_thickness, khung_thickness],
      [width - khung_thickness, height - khung_thickness, khung_thickness],
      [khung_thickness, height - khung_thickness, khung_thickness]
    )
    nen_face.pushpull(depth - khung_thickness)
    nen_group.material = "#ffe600" # Vàng tươi

    # Dải xanh trên (cao 140mm)
    dai_xanh_tren = entities.add_group
    dai_xanh_tren.entities.add_face(
      [khung_thickness, height - khung_thickness - 140.mm, khung_thickness+0.1.mm],
      [width - khung_thickness, height - khung_thickness - 140.mm, khung_thickness+0.1.mm],
      [width - khung_thickness, height - khung_thickness, khung_thickness+0.1.mm],
      [khung_thickness, height - khung_thickness, khung_thickness+0.1.mm]
    ).pushpull(2.mm)
    dai_xanh_tren.material = "#003399"

    # Dải xanh dưới (cao 90mm)
    dai_xanh_duoi = entities.add_group
    dai_xanh_duoi.entities.add_face(
      [khung_thickness, khung_thickness, khung_thickness+0.1.mm],
      [width - khung_thickness, khung_thickness, khung_thickness+0.1.mm],
      [width - khung_thickness, khung_thickness + 90.mm, khung_thickness+0.1.mm],
      [khung_thickness, khung_thickness + 90.mm, khung_thickness+0.1.mm]
    ).pushpull(2.mm)
    dai_xanh_duoi.material = "#003399"

    # Viền nẹp nhôm vàng mờ (bản 20mm)
    vien_group = entities.add_group
    vien = vien_group.entities
    vien_color = "#d4af37"
    # 4 cạnh viền
    vien.add_face([0,0,depth], [width,0,depth], [width,20.mm,depth], [0,20.mm,depth]).pushpull(-5.mm)
    vien.add_face([0,height-20.mm,depth], [width,height-20.mm,depth], [width,height,depth], [0,height,depth]).pushpull(-5.mm)
    vien.add_face([0,20.mm,depth], [20.mm,20.mm,depth], [20.mm,height-20.mm,depth], [0,height-20.mm,depth]).pushpull(-5.mm)
    vien.add_face([width-20.mm,20.mm,depth], [width,20.mm,depth], [width,height-20.mm,depth], [width-20.mm,height-20.mm,depth]).pushpull(-5.mm)
    vien_group.material = vien_color

    # Chữ nổi (dùng add_3d_text, thực tế là in bạt nhưng mô phỏng nổi cho rõ)
    text_group = entities.add_group

    # Dòng 1: TIỆM IN (trên dải xanh, màu vàng)
    text_group.entities.add_3d_text(
      "TIỆM IN",
      TextAlignCenter,
      "Arial Black",
      false, false,
      70.mm, 15.mm, 0, true, 0
    ).transform!(Geom::Transformation.new([width/2, height - khung_thickness - 70.mm, depth+2.mm]))
    text_group.material = "#ffe600"

    # Dòng 2: PHƯỚC TIÊN (trên dải xanh, màu vàng)
    text_group.entities.add_3d_text(
      "PHƯỚC TIÊN",
      TextAlignCenter,
      "Arial Black",
      false, false,
      90.mm, 20.mm, 0, true, 0
    ).transform!(Geom::Transformation.new([width/2, height - khung_thickness - 130.mm, depth+2.mm]))
    text_group.material = "#ffe600"

    # Dòng 3: IN MÀU (chính giữa, màu xanh)
    text_group.entities.add_3d_text(
      "IN MÀU",
      TextAlignCenter,
      "Arial Black",
      false, false,
      100.mm, 30.mm, 0, true, 0
    ).transform!(Geom::Transformation.new([width/2, height - khung_thickness - 250.mm, depth+2.mm]))
    text_group.material = "#003399"

    # Dòng 4: PHOTO (chính giữa, màu xanh)
    text_group.entities.add_3d_text(
      "PHOTO",
      TextAlignCenter,
      "Arial Black",
      false, false,
      100.mm, 30.mm, 0, true, 0
    ).transform!(Geom::Transformation.new([width/2, height - khung_thickness - 350.mm, depth+2.mm]))
    text_group.material = "#003399"

    # Dòng 5: ẢNH THẺ (chính giữa, màu xanh)
    text_group.entities.add_3d_text(
      "ẢNH THẺ",
      TextAlignCenter,
      "Arial Black",
      false, false,
      100.mm, 30.mm, 0, true, 0
    ).transform!(Geom::Transformation.new([width/2, height - khung_thickness - 450.mm, depth+2.mm]))
    text_group.material = "#003399"

    # Dòng 6: Số điện thoại (trên dải xanh dưới, màu vàng)
    text_group.entities.add_3d_text(
      "0329.663.642",
      TextAlignCenter,
      "Arial Black",
      false, false,
      70.mm, 15.mm, 0, true, 0
    ).transform!(Geom::Transformation.new([width/2, khung_thickness + 45.mm, depth+2.mm]))
    text_group.material = "#ffe600"

    model.commit_operation
  end
end
BangHieuXinhanBat2Mat80X120.build