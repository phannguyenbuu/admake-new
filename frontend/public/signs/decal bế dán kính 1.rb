# Mã nguồn Ruby hoàn chỉnh 100%
module DecalBeDanKinh1
  def self.build
    model = Sketchup.active_model
    model.start_operation('DecalBeDanKinh1', true)
    entities = model.active_entities

    # Kích thước tổng thể (3 tấm kính)
    total_width = 3000.mm
    total_height = 2500.mm
    glass_thickness = 10.mm

    # Tạo 3 tấm kính
    glass_width = total_width / 3
    3.times do |i|
      grp = entities.add_group
      face = grp.entities.add_face(
        [i * glass_width, 0, 0],
        [(i + 1) * glass_width, 0, 0],
        [(i + 1) * glass_width, 0, total_height],
        [i * glass_width, 0, total_height]
      )
      face.pushpull(-glass_thickness)
      mat = model.materials.add("Glass")
      mat.alpha = 0.15
      mat.color = Sketchup::Color.new(200, 220, 255)
      grp.material = mat
      grp.layer = "Glass"
    end

    # Decal đỏ lớn (VF8)
    decal1_width = 900.mm
    decal1_height = 1800.mm
    decal1_x = 0.55 * glass_width
    decal1_y = 0
    decal1_z = 400.mm
    grp1 = entities.add_group
    pts1 = [
      [decal1_x, glass_thickness + 0.1.mm, decal1_z],
      [decal1_x + decal1_width, glass_thickness + 0.1.mm, decal1_z + 100.mm],
      [decal1_x + decal1_width - 80.mm, glass_thickness + 0.1.mm, decal1_z + decal1_height],
      [decal1_x - 80.mm, glass_thickness + 0.1.mm, decal1_z + decal1_height - 100.mm]
    ]
    face1 = grp1.entities.add_face(pts1)
    face1.pushpull(1.mm)
    mat1 = model.materials.add("DecalRed")
    mat1.color = "#D32F2F"
    grp1.material = mat1

    # Decal đỏ lớn (WILD)
    decal2_width = 900.mm
    decal2_height = 1800.mm
    decal2_x = glass_width * 2 + 0.05 * glass_width
    decal2_y = 0
    decal2_z = 400.mm
    grp2 = entities.add_group
    pts2 = [
      [decal2_x, glass_thickness + 0.1.mm, decal2_z + 100.mm],
      [decal2_x + decal2_width, glass_thickness + 0.1.mm, decal2_z],
      [decal2_x + decal2_width - 80.mm, glass_thickness + 0.1.mm, decal2_z + decal2_height - 100.mm],
      [decal2_x - 80.mm, glass_thickness + 0.1.mm, decal2_z + decal2_height]
    ]
    face2 = grp2.entities.add_face(pts2)
    face2.pushpull(1.mm)
    mat2 = model.materials.add("DecalRed2")
    mat2.color = "#D32F2F"
    grp2.material = mat2

    # Chữ nổi 3D (mô phỏng decal dán nổi)
    # VF8
    vf8_grp = entities.add_group
    vf8_text = vf8_grp.entities.add_3d_text(
      "VF8",
      TextAlignCenter,
      "Arial Black",
      false,
      false,
      180.mm,
      30.mm,
      0,
      true,
      0
    )
    vf8_grp.material = "#FFFFFF"
    vf8_grp.move! Geom::Transformation.new([decal1_x + decal1_width / 2, glass_thickness + 2.mm, decal1_z + 120.mm])

    # WILD
    wild_grp = entities.add_group
    wild_text = wild_grp.entities.add_3d_text(
      "WILD",
      TextAlignCenter,
      "Arial Black",
      false,
      false,
      150.mm,
      30.mm,
      0,
      true,
      0
    )
    wild_grp.material = "#FFFFFF"
    wild_grp.move! Geom::Transformation.new([decal2_x + decal2_width / 2, glass_thickness + 2.mm, decal2_z + 120.mm])

    # VINFAST logo (dưới kính)
    3.times do |i|
      vinfast_grp = entities.add_group
      vinfast_text = vinfast_grp.entities.add_3d_text(
        "VINFAST",
        TextAlignCenter,
        "Arial",
        false,
        false,
        60.mm,
        8.mm,
        0,
        true,
        0
      )
      vinfast_grp.material = "#FFFFFF"
      vinfast_grp.move! Geom::Transformation.new([i * glass_width + glass_width / 2, glass_thickness + 2.mm, 120.mm])
      # Logo chữ V cách điệu (mô phỏng khối tam giác)
      v_grp = vinfast_grp.entities.add_group
      v_pts = [
        [0, 0, 80.mm],
        [20.mm, 0, 120.mm],
        [-20.mm, 0, 120.mm]
      ]
      v_face = v_grp.entities.add_face(v_pts)
      v_face.pushpull(2.mm)
      v_grp.material = "#FFFFFF"
      v_grp.move! Geom::Transformation.new([0, 0, 0])
    end

    # Slogan và số (dạng text nổi mô phỏng decal)
    # "BẢO HÀNH 10 NĂM"
    bh1_grp = entities.add_group
    bh1_text = bh1_grp.entities.add_3d_text(
      "BẢO HÀNH\n10 NĂM",
      TextAlignCenter,
      "Arial",
      false,
      false,
      40.mm,
      6.mm,
      0,
      true,
      0
    )
    bh1_grp.material = "#FFFFFF"
    bh1_grp.move! Geom::Transformation.new([decal1_x + decal1_width + 100.mm, glass_thickness + 2.mm, decal1_z + 400.mm])

    bh2_grp = entities.add_group
    bh2_text = bh2_grp.entities.add_3d_text(
      "BẢO HÀNH\n10 NĂM",
      TextAlignCenter,
      "Arial",
      false,
      false,
      40.mm,
      6.mm,
      0,
      true,
      0
    )
    bh2_grp.material = "#FFFFFF"
    bh2_grp.move! Geom::Transformation.new([decal2_x - 100.mm, glass_thickness + 2.mm, decal2_z + 400.mm])

    # Số lớn (782 triệu đồng)
    so1_grp = entities.add_group
    so1_text = so1_grp.entities.add_3d_text(
      "782",
      TextAlignCenter,
      "Arial Black",
      false,
      false,
      60.mm,
      10.mm,
      0,
      true,
      0
    )
    so1_grp.material = "#FF9800"
    so1_grp.move! Geom::Transformation.new([decal1_x + decal1_width + 120.mm, glass_thickness + 2.mm, decal1_z + 300.mm])

    so2_grp = entities.add_group
    so2_text = so2_grp.entities.add_3d_text(
      "684",
      TextAlignCenter,
      "Arial Black",
      false,
      false,
      60.mm,
      10.mm,
      0,
      true,
      0
    )
    so2_grp.material = "#FF9800"
    so2_grp.move! Geom::Transformation.new([decal2_x - 120.mm, glass_thickness + 2.mm, decal2_z + 300.mm])

    # Slogan xanh lá "LÊN ĐỜI XE ĐIỆN CHỌN VINFAST"
    slogan_grp = entities.add_group
    slogan_text = slogan_grp.entities.add_3d_text(
      "LÊN ĐỜI XE ĐIỆN\nCHỌN VINFAST",
      TextAlignCenter,
      "Arial Black",
      false,
      false,
      30.mm,
      5.mm,
      0,
      true,
      0
    )
    slogan_grp.material = "#43A047"
    slogan_grp.move! Geom::Transformation.new([decal1_x + decal1_width / 2, glass_thickness + 2.mm, decal1_z + 350.mm])

    slogan2_grp = entities.add_group
    slogan2_text = slogan2_grp.entities.add_3d_text(
      "LÊN ĐỜI XE ĐIỆN\nCHỌN VINFAST",
      TextAlignCenter,
      "Arial Black",
      false,
      false,
      30.mm,
      5.mm,
      0,
      true,
      0
    )
    slogan2_grp.material = "#43A047"
    slogan2_grp.move! Geom::Transformation.new([decal2_x + decal2_width / 2, glass_thickness + 2.mm, decal2_z + 350.mm])

    model.commit_operation
  end
end
DecalBeDanKinh1.build