# Mã nguồn Ruby hoàn chỉnh 100%
module BangHieuTonDanDecal600X120
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuTonDanDecal600X120', true)
    entities = model.active_entities

    # Thông số
    width = 6000.mm
    height = 1200.mm
    depth = 150.mm
    khung = 30.mm
    viền = 30.mm
    logo_w = 400.mm
    logo_h = height
    text_thick = 2.mm

    # 1. Khung sắt hộp 30x30mm
    khung_group = entities.add_group
    kg = khung_group.entities
    # Khung viền ngoài
    pts = [
      [0,0,0], [width,0,0], [width,height,0], [0,height,0]
    ]
    # 4 cạnh
    kg.add_face(pts).pushpull(-khung)
    # Xương đứng (12 cây, cách nhau ~500mm)
    (0..12).each do |i|
      x = i * (width/12)
      kg.add_face([[x,0,0],[x,khung,0],[x,khung,height],[x,0,height]]).pushpull(-khung)
    end
    # Xương ngang tăng cứng (2 cây)
    [height/3, 2*height/3].each do |y|
      kg.add_face([[0,y,0],[khung,y,0],[khung,y,width],[0,y,width]]).pushpull(-khung)
    end
    khung_group.material = "#222222"

    # 2. Tấm nền tôn phẳng dán decal
    nen_group = entities.add_group
    nen = nen_group.entities
    nen_face = nen.add_face([khung,khung,khung],[width-khung,khung,khung],[width-khung,height-khung,khung],[khung,height-khung,khung])
    nen_face.pushpull(-2.mm)
    nen_group.material = "#FFFFFF"

    # 3. Dải nền xanh đậm dưới cùng
    dai_xanh_group = entities.add_group
    dx = dai_xanh_group.entities
    dai_h = 120.mm
    dx_face = dx.add_face(
      [khung,khung,khung+0.5.mm],
      [width-khung,khung,khung+0.5.mm],
      [width-khung,khung+dai_h,khung+0.5.mm],
      [khung,khung+dai_h,khung+0.5.mm]
    )
    dx_face.pushpull(-2.mm)
    dai_xanh_group.material = "#1A237E"

    # 4. Viền nẹp nhôm xước bạc
    vien_group = entities.add_group
    vg = vien_group.entities
    # Trên
    vg.add_face([0,0,0],[width,0,0],[width,viền,0],[0,viền,0]).pushpull(depth)
    # Dưới
    vg.add_face([0,height-viền,0],[width,height-viền,0],[width,height,0],[0,height,0]).pushpull(depth)
    # Trái
    vg.add_face([0,0,0],[viền,0,0],[viền,height,0],[0,height,0]).pushpull(depth)
    # Phải
    vg.add_face([width-viền,0,0],[width,0,0],[width,height,0],[width-viền,height,0]).pushpull(depth)
    vien_group.material = "#B0BEC5"

    # 5. Logo góc trái (mô phỏng khối hộp + mặt decal)
    logo_group = entities.add_group
    lg = logo_group.entities
    logo_face = lg.add_face([khung,khung,khung+1.mm],[khung+logo_w,khung,khung+1.mm],[khung+logo_w,khung+logo_h,khung+1.mm],[khung,khung+logo_h,khung+1.mm])
    logo_face.pushpull(-2.mm)
    logo_group.material = "#1A237E"
    # Mặt decal vàng nhạt, trắng, đen (mô phỏng hình tròn)
    circle = lg.add_circle([khung+logo_w/2,khung+logo_h/2,khung+2.5.mm], [0,0,1], 160.mm)
    cface = lg.add_face(circle)
    cface.material = "#FFF176"

    # 6. Chữ nổi 3D (dán decal mô phỏng)
    # Dòng trên: "ĐẠI LÝ THỨC ĂN CHĂN NUÔI KYODO SOJITZ"
    text1_group = entities.add_group
    t1 = text1_group.entities
    t1.add_3d_text(
      "ĐẠI LÝ THỨC ĂN CHĂN NUÔI KYODO SOJITZ",
      TextAlignCenter,
      "Arial",
      false, false, 80.mm, text_thick, 0, true, 0
    )
    text1_group.material = "#222222"
    text1_group.transform!(Geom::Transformation.translation([width/2, khung+logo_h*0.05, khung+2.5.mm]))

    # Dòng chính: "NGỌC TIỆP"
    text2_group = entities.add_group
    t2 = text2_group.entities
    t2.add_3d_text(
      "NGỌC TIỆP",
      TextAlignCenter,
      "Arial Black",
      false, false, 400.mm, text_thick, 0, true, 0
    )
    text2_group.material = "#F44336"
    text2_group.transform!(Geom::Transformation.translation([width/2, khung+logo_h*0.35, khung+2.5.mm]))

    # Dòng dưới: Địa chỉ, điện thoại
    text3_group = entities.add_group
    t3 = text3_group.entities
    t3.add_3d_text(
      "* Địa chỉ: Ấp An Quý, Xã Thanh An, Huyện Hớn Quản, Tỉnh Bình Phước",
      TextAlignLeft,
      "Arial",
      false, false, 50.mm, text_thick, 0, true, 0
    )
    text3_group.material = "#FFFFFF"
    text3_group.transform!(Geom::Transformation.translation([khung+logo_w+30.mm, khung+30.mm, khung+3.mm]))

    text4_group = entities.add_group
    t4 = text4_group.entities
    t4.add_3d_text(
      "* Điện thoại: 0978.080.339 - 0919.43.81.41",
      TextAlignLeft,
      "Arial",
      false, false, 50.mm, text_thick, 0, true, 0
    )
    text4_group.material = "#FFFFFF"
    text4_group.transform!(Geom::Transformation.translation([khung+logo_w+30.mm, khung+80.mm, khung+3.mm]))

    # 7. Icon nhỏ (mô phỏng hình tròn trắng)
    icon_group = entities.add_group
    ig = icon_group.entities
    3.times do |i|
      c = ig.add_circle([khung+60.mm+i*60.mm, khung+logo_h-60.mm, khung+2.5.mm], [0,0,1], 18.mm)
      f = ig.add_face(c)
      f.material = "#FFFFFF"
    end

    model.commit_operation
  end
end
BangHieuTonDanDecal600X120.build