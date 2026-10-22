# Mã nguồn Ruby hoàn chỉnh 100%
module BangHieuBatLotTon1300X120
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuBatLotTon1300X120', true)
    entities = model.active_entities

    # Thông số chính
    width = 13000.mm
    height = 1200.mm
    depth = 150.mm
    khung_size = 30.mm
    khung_spacing = 500.mm

    # Màu sắc
    mau_nen = "#F5A623"
    mau_chu = "#FFFFFF"
    mau_logo_vien = "#F5A623"
    mau_logo_xanh = "#3CB371"

    # === Khung xương sắt hộp ===
    khung_group = entities.add_group
    khung_entities = khung_group.entities

    # Khung viền ngoài
    [
      [0,0,0], [width,0,0], [width,height,0], [0,height,0]
    ].each_with_index do |pt, i|
      next_pt = [ [0,0,0], [width,0,0], [width,height,0], [0,height,0] ][(i+1)%4]
      edge = khung_entities.add_line(pt, next_pt)
      face = khung_entities.add_face(
        pt,
        [pt[0]+khung_size, pt[1], pt[2]],
        [next_pt[0]+khung_size, next_pt[1], next_pt[2]],
        next_pt
      )
      face.pushpull(-khung_size)
    end

    # Xương đứng
    x = khung_spacing
    while x < width
      khung_entities.add_face(
        [x,0,0],
        [x+khung_size,0,0],
        [x+khung_size,height,0],
        [x,height,0]
      ).pushpull(-khung_size)
      x += khung_spacing
    end

    # Xương ngang tăng cứng (2 thanh ngang)
    [height/3, 2*height/3].each do |y|
      khung_entities.add_face(
        [0,y,0],
        [width,y,0],
        [width,y+khung_size,0],
        [0,y+khung_size,0]
      ).pushpull(-khung_size)
    end

    khung_group.name = "Khung xương sắt hộp"

    # === Tấm nền bảng hiệu (bạt/alu) ===
    nen_group = entities.add_group
    nen_face = nen_group.entities.add_face(
      [0,0,khung_size],
      [width,0,khung_size],
      [width,height,khung_size],
      [0,height,khung_size]
    )
    nen_face.pushpull(depth - khung_size)
    nen_face.material = mau_nen
    nen_group.name = "Tấm nền bảng hiệu"

    # === Viền nẹp alu/nhôm ===
    vien_group = entities.add_group
    vien_entities = vien_group.entities
    vien_width = 20.mm
    # Viền trên
    vien_entities.add_face(
      [-vien_width, -vien_width, khung_size],
      [width+vien_width, -vien_width, khung_size],
      [width+vien_width, 0, khung_size],
      [-vien_width, 0, khung_size]
    ).pushpull(depth - khung_size)
    # Viền dưới
    vien_entities.add_face(
      [-vien_width, height, khung_size],
      [width+vien_width, height, khung_size],
      [width+vien_width, height+vien_width, khung_size],
      [-vien_width, height+vien_width, khung_size]
    ).pushpull(depth - khung_size)
    # Viền trái
    vien_entities.add_face(
      [-vien_width, 0, khung_size],
      [0, 0, khung_size],
      [0, height, khung_size],
      [-vien_width, height, khung_size]
    ).pushpull(depth - khung_size)
    # Viền phải
    vien_entities.add_face(
      [width, 0, khung_size],
      [width+vien_width, 0, khung_size],
      [width+vien_width, height, khung_size],
      [width, height, khung_size]
    ).pushpull(depth - khung_size)
    vien_group.name = "Viền nẹp alu"

    # === Logo tròn bên trái ===
    logo_group = entities.add_group
    logo_center = [200.mm + 150.mm, height/2 + khung_size, depth/2 + khung_size]
    logo_radius = 150.mm
    logo_face = logo_group.entities.add_circle(logo_center, [0,0,1], logo_radius)
    logo_face = logo_group.entities.add_face(logo_face)
    logo_face.pushpull(10.mm)
    logo_face.material = "white"
    # Viền logo
    logo_vien = logo_group.entities.add_circle(logo_center, [0,0,1], logo_radius+10.mm)
    logo_vien_face = logo_group.entities.add_face(logo_vien)
    logo_vien_face.material = mau_logo_vien
    logo_vien_face.erase!
    # Chữ "PT" cách điệu (mô phỏng bằng 2 khối chữ)
    logo_group.entities.add_3d_text("P", false, "Arial", false, false, 80.mm, 10.mm, 0, true, true).each do |ent|
      ent.move!([logo_center[0]-50.mm, logo_center[1]-40.mm, logo_center[2]+2.mm])
      ent.material = mau_logo_vien
    end
    logo_group.entities.add_3d_text("T", false, "Arial", false, false, 80.mm, 10.mm, 0, true, true).each do |ent|
      ent.move!([logo_center[0]+10.mm, logo_center[1]-40.mm, logo_center[2]+2.mm])
      ent.material = mau_logo_xanh
    end
    logo_group.name = "Logo tròn"

    # === Chữ nổi "Phúc Thuận 福順" ===
    text_group = entities.add_group
    # Chữ "Phúc Thuận"
    text1 = text_group.entities.add_3d_text("Phúc Thuận", false, "Arial", false, false, 250.mm, 30.mm, 0, true, true)
    text1.each do |ent|
      ent.material = mau_chu
      ent.move!([logo_center[0]+logo_radius+80.mm, height/2 + 100.mm, depth-60.mm])
    end
    # Chữ "福順"
    text2 = text_group.entities.add_3d_text("福順", false, "Arial", false, false, 120.mm, 20.mm, 0, true, true)
    text2.each do |ent|
      ent.material = mau_chu
      ent.move!([logo_center[0]+logo_radius+700.mm, height/2 + 110.mm, depth-60.mm])
    end
    text_group.name = "Chữ nổi"

    model.commit_operation
  end
end
BangHieuBatLotTon1300X120.build