# Mã nguồn Ruby hoàn chỉnh 100%
module HagtagsFomexCanDecal
  def self.build
    model = Sketchup.active_model
    model.start_operation('HagtagsFomexCanDecal', true)
    entities = model.active_entities

    # Kích thước tổng thể (mm)
    width = 400.mm
    height = 300.mm
    thickness = 5.mm
    handle_width = 40.mm
    handle_height = 120.mm
    handle_radius = 20.mm

    # Tạo nhóm tổng thể
    group = entities.add_group
    gents = group.entities

    # 1. Tạo tấm nền fomex (biên dạng đơn giản hóa: hình chữ nhật bo góc + lồi ra các phần icon)
    # Bo góc
    corner = 30.mm
    pts = [
      [0, 0, 0],
      [width, 0, 0],
      [width, height, 0],
      [0, height, 0]
    ]
    face = gents.add_face(pts)
    face.followme(gents.add_circle([corner, corner, 0], [0,0,1], corner))
    face.pushpull(thickness)

    # 2. Tạo tay cầm (hình chữ nhật bo tròn dưới đáy)
    handle_base = [width/2 - handle_width/2, -handle_height, 0]
    handle_pts = [
      handle_base,
      [handle_base[0] + handle_width, handle_base[1], 0],
      [handle_base[0] + handle_width, 0, 0],
      [handle_base[0], 0, 0]
    ]
    handle_face = gents.add_face(handle_pts)
    # Bo tròn đáy tay cầm
    arc = gents.add_arc(
      [width/2, -handle_height, 0],
      [1,0,0],
      [0,1,0],
      handle_radius,
      Math::PI,
      2*Math::PI,
      12
    )
    handle_face.followme(arc)
    handle_face.pushpull(thickness)

    # 3. Màu nền fomex trắng
    mat_fomex = model.materials.add('FomexWhite')
    mat_fomex.color = '#FFFFFF'
    group.material = mat_fomex

    # 4. Tạo các khối chữ nổi (dùng add_3d_text)
    # "MM" (xanh dương, lớn)
    mm_text = gents.add_3d_text(
      "MM",
      TextAlignLeft,
      "Arial Black",
      false,
      false,
      40.mm,
      5.mm,
      0,
      true,
      false
    )
    mm_text_group = mm_text.parent.entities.add_group(mm_text)
    mm_text_group.move! Geom::Transformation.translation([60.mm, 180.mm, thickness])
    mat_mm = model.materials.add('MMBlue')
    mat_mm.color = '#0052CC'
    mm_text_group.material = mat_mm

    # "ĐẾN ĐÂY" (đỏ, nhỏ)
    den_day_text = gents.add_3d_text(
      "ĐẾN ĐÂY",
      TextAlignLeft,
      "Arial Black",
      false,
      false,
      18.mm,
      3.mm,
      0,
      true,
      false
    )
    den_day_group = den_day_text.parent.entities.add_group(den_day_text)
    den_day_group.move! Geom::Transformation.translation([65.mm, 155.mm, thickness])
    mat_den_day = model.materials.add('RedText')
    mat_den_day.color = '#FF2D2D'
    den_day_group.material = mat_den_day

    # "Ngoại ngữ và ngoại quốc" (trắng, nền xanh nhạt)
    bg1 = gents.add_face([120.mm, 240.mm, thickness+0.1], [340.mm, 240.mm, thickness+0.1], [340.mm, 265.mm, thickness+0.1], [120.mm, 265.mm, thickness+0.1])
    mat_bg1 = model.materials.add('LightBlue')
    mat_bg1.color = '#4FC3F7'
    bg1.material = mat_bg1
    text1 = gents.add_3d_text(
      "Ngoại ngữ và ngoại quốc",
      TextAlignLeft,
      "Arial",
      false,
      false,
      12.mm,
      2.mm,
      0,
      true,
      false
    )
    text1_group = text1.parent.entities.add_group(text1)
    text1_group.move! Geom::Transformation.translation([125.mm, 243.mm, thickness+0.5])
    mat_white = model.materials.add('WhiteText')
    mat_white.color = '#FFFFFF'
    text1_group.material = mat_white

    # "Để ngoại tệ" (trắng, nền đỏ)
    bg2 = gents.add_face([140.mm, 210.mm, thickness+0.1], [320.mm, 210.mm, thickness+0.1], [320.mm, 235.mm, thickness+0.1], [140.mm, 235.mm, thickness+0.1])
    mat_bg2 = model.materials.add('RedBG')
    mat_bg2.color = '#E53935'
    bg2.material = mat_bg2
    text2 = gents.add_3d_text(
      "Để ngoại tệ",
      TextAlignLeft,
      "Arial",
      false,
      false,
      14.mm,
      2.mm,
      0,
      true,
      false
    )
    text2_group = text2.parent.entities.add_group(text2)
    text2_group.move! Geom::Transformation.translation([145.mm, 213.mm, thickness+0.5])
    text2_group.material = mat_white

    # 5. Icon máy bay (khối 3D đơn giản, màu xanh dương)
    plane = gents.add_face([30.mm, 250.mm, thickness+0.1], [55.mm, 250.mm, thickness+0.1], [42.5.mm, 270.mm, thickness+0.1])
    mat_plane = model.materials.add('PlaneBlue')
    mat_plane.color = '#1976D2'
    plane.material = mat_plane
    plane.pushpull(2.mm)

    # 6. Icon đồng tiền (khối trụ vàng)
    coin1 = gents.add_circle([370.mm, 215.mm, thickness+0.1], [0,0,1], 8.mm)
    coin1_face = gents.add_face(coin1)
    mat_coin = model.materials.add('CoinGold')
    mat_coin.color = '#FFD600'
    coin1_face.material = mat_coin
    coin1_face.pushpull(3.mm)
    coin2 = gents.add_circle([380.mm, 225.mm, thickness+0.1], [0,0,1], 6.mm)
    coin2_face = gents.add_face(coin2)
    coin2_face.material = mat_coin
    coin2_face.pushpull(3.mm)
    coin3 = gents.add_circle([375.mm, 235.mm, thickness+0.1], [0,0,1], 7.mm)
    coin3_face = gents.add_face(coin3)
    coin3_face.material = mat_coin
    coin3_face.pushpull(3.mm)

    model.commit_operation
  end
end
HagtagsFomexCanDecal.build