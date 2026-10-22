# Mã nguồn Ruby hoàn chỉnh 100%
module BangHieuVachPvcVanDa
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuVachPvcVanDa', true)
    entities = model.active_entities

    # Thông số kích thước
    width = 3000.mm
    height = 1000.mm
    depth = 150.mm
    khung_size = 30.mm
    nẹp_vien = 20.mm

    # === 1. Khung xương sắt hộp ===
    khung_group = entities.add_group
    kg = khung_group.entities

    # Khung viền ngoài
    [[0,0,0],[width,0,0],[width,height,0],[0,height,0]].each_with_index do |pt,i|
      next_pt = [[width,0,0],[width,height,0],[0,height,0],[0,0,0]][i]
      kg.add_face(pt, [pt[0],pt[1],pt[2]+khung_size], [next_pt[0],next_pt[1],next_pt[2]+khung_size], next_pt)
    end

    # Xương đứng (cách 500mm)
    (1..5).each do |i|
      x = i*500.mm
      next if x >= width
      kg.add_face([x,0,0],[x+khung_size,0,0],[x+khung_size,height,0],[x,height,0])
    end

    # Xương ngang tăng cứng (cách 300mm)
    (1..2).each do |i|
      y = i*300.mm
      kg.add_face([0,y,0],[width,y,0],[width,y+khung_size,0],[0,y+khung_size,0])
    end

    khung_group.material = 'gray'

    # === 2. Tấm nền vách PVC vân đá ===
    nen_group = entities.add_group
    face = nen_group.entities.add_face([0,0,khung_size],[width,0,khung_size],[width,height,khung_size],[0,height,khung_size])
    face.pushpull(depth - khung_size)
    nen_group.material = model.materials.add('PVC_VanDa')
    nen_group.material.color = Sketchup::Color.new('#e5e6ea')

    # === 3. Viền nẹp nhôm vàng ===
    vien_group = entities.add_group
    # Viền ngoài
    vien_faces = [
      [[0-nẹp_vien,0-nẹp_vien,khung_size],[width+nẹp_vien,0-nẹp_vien,khung_size],[width+nẹp_vien,0,khung_size],[0-nẹp_vien,0,khung_size]],
      [[width,0-nẹp_vien,khung_size],[width+nẹp_vien,0-nẹp_vien,khung_size],[width+nẹp_vien,height+nẹp_vien,khung_size],[width,height+nẹp_vien,khung_size]],
      [[0-nẹp_vien,height,khung_size],[width+nẹp_vien,height,khung_size],[width+nẹp_vien,height+nẹp_vien,khung_size],[0-nẹp_vien,height+nẹp_vien,khung_size]],
      [[0-nẹp_vien,0,khung_size],[0,0,khung_size],[0,height,khung_size],[0-nẹp_vien,height,khung_size]]
    ]
    vien_faces.each do |pts|
      f = vien_group.entities.add_face(pts)
      f.pushpull(nẹp_vien)
    end
    vien_group.material = model.materials.add('NepVang')
    vien_group.material.color = Sketchup::Color.new('#ffe066')

    # === 4. Logo tròn nổi ===
    logo_group = entities.add_group
    logo_center = [width/2, height*0.7, depth-10.mm]
    logo_radius = 250.mm
    logo_face = logo_group.entities.add_circle(logo_center, [0,0,1], logo_radius)
    logo_face = logo_group.entities.add_face(logo_face)
    logo_face.pushpull(20.mm)
    logo_group.material = model.materials.add('LogoVienVang')
    logo_group.material.color = Sketchup::Color.new('#ffe066')

    # Vẽ nền logo trắng
    logo_inner = logo_group.entities.add_circle(logo_center, [0,0,1], logo_radius-10.mm)
    logo_inner_face = logo_group.entities.add_face(logo_inner)
    logo_inner_face.pushpull(19.mm)
    logo_inner_face.material = Sketchup::Color.new('#ffffff')

    # Vẽ số 175 cách điệu (khối chữ xanh lá)
    text_175 = logo_group.entities.add_3d_text(
      "175",  # text
      TextAlignCenter,
      "Arial Black",
      false,  # Bold
      false,  # Italic
      120.mm, # height
      10.mm,  # tolerance
      20.mm,  # extrusion
      true,   # filled
      logo_center[0]-60.mm, logo_center[1]-40.mm, logo_center[2]+5.mm
    )
    text_175.material = Sketchup::Color.new('#218c5a')

    # === 5. Chữ nổi "VIỆN THẨM MỸ" ===
    text_group = entities.add_group
    text = "VIỆN THẨM MỸ"
    text_pos = [width/2-320.mm, height*0.35, depth+5.mm]
    text_3d = text_group.entities.add_3d_text(
      text,
      TextAlignLeft,
      "Arial Black",
      false,
      false,
      150.mm,
      10.mm,
      30.mm,
      true,
      text_pos[0], text_pos[1], text_pos[2]
    )
    text_group.material = Sketchup::Color.new('#ffe066')

    # === 6. Chữ nổi "175" ===
    text_175_group = entities.add_group
    text_175_pos = [width/2+180.mm, height*0.35, depth+5.mm]
    text_3d_175 = text_175_group.entities.add_3d_text(
      "175",
      TextAlignLeft,
      "Arial Black",
      false,
      false,
      200.mm,
      10.mm,
      40.mm,
      true,
      text_175_pos[0], text_175_pos[1], text_175_pos[2]
    )
    text_175_group.material = Sketchup::Color.new('#218c5a')

    # Viền trắng cho số 175
    # Tạo một khối trắng lớn hơn một chút phía sau số 175
    text_175_outline = text_175_group.entities.add_3d_text(
      "175",
      TextAlignLeft,
      "Arial Black",
      false,
      false,
      210.mm,
      10.mm,
      42.mm,
      true,
      text_175_pos[0]-5.mm, text_175_pos[1]-5.mm, text_175_pos[2]-2.mm
    )
    text_175_outline.material = Sketchup::Color.new('#ffffff')

    model.commit_operation
  end
end
BangHieuVachPvcVanDa.build