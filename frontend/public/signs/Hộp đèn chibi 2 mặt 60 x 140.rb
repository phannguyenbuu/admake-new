# Mã nguồn Ruby hoàn chỉnh 100%
module HopDenChibi2Mat60X140
  def self.build
    model = Sketchup.active_model
    model.start_operation('HopDenChibi2Mat60X140', true)
    entities = model.active_entities

    # Kích thước tổng thể
    width = 600.mm
    height = 1400.mm
    depth = 30.mm
    base_height = 100.mm
    base_width = 500.mm
    base_depth = 500.mm
    frame_size = 30.mm

    # === 1. Khung chân đế sắt hộp ===
    base_group = entities.add_group
    base = base_group.entities

    # Khung vuông dưới chân
    base.add_face([0,0,0], [base_width,0,0], [base_width,base_depth,0], [0,base_depth,0]).pushpull(frame_size)
    # 2 xương đứng
    x1 = base_width*0.3
    x2 = base_width*0.7
    y = base_depth*0.5
    base.add_face([x1, y, frame_size], [x1+frame_size, y, frame_size], [x1+frame_size, y, base_height+height*0.7], [x1, y, base_height+height*0.7]).pushpull(frame_size)
    base.add_face([x2, y, frame_size], [x2+frame_size, y, frame_size], [x2+frame_size, y, base_height+height*0.7], [x2, y, base_height+height*0.7]).pushpull(frame_size)
    # Thanh giằng ngang
    base.add_face([x1, y, base_height+height*0.4], [x2+frame_size, y, base_height+height*0.4], [x2+frame_size, y, base_height+height*0.4+frame_size], [x1, y, base_height+height*0.4+frame_size]).pushpull(frame_size)
    # 2 thanh chống xiên
    base.add_face([x1, y, frame_size], [x1+frame_size, y, frame_size], [0,0,frame_size], [0,0,frame_size+frame_size]).pushpull(frame_size/2)
    base.add_face([x2, y, frame_size], [x2+frame_size, y, frame_size], [base_width,0,frame_size], [base_width,0,frame_size+frame_size]).pushpull(frame_size/2)

    # Tô màu khung sắt
    mat_black = model.materials.add('KhungDen')
    mat_black.color = '#222222'
    base_group.material = mat_black

    # === 2. Hộp đèn chibi 2 mặt ===
    sign_group = entities.add_group
    sign = sign_group.entities

    # Tạo mặt biển dạng bo tròn chibi (dạng polygon mô phỏng)
    # Đỉnh bo tròn, đáy bo tròn nhỏ (giả lập hình dạng)
    points = []
    n = 36
    r_top = width/2
    r_bottom = width*0.35
    center_top = [width/2, base_depth/2, base_height+height]
    center_bottom = [width/2, base_depth/2, base_height+height*0.15]
    # Nửa trên (bo tròn lớn)
    (0..n/2).each do |i|
      angle = Math::PI * i / (n/2)
      x = center_top[0] + r_top * Math.cos(angle)
      z = center_top[2] + r_top * Math.sin(angle)
      points << [x, center_top[1], z]
    end
    # Nửa dưới (bo tròn nhỏ)
    (n/2).downto(0) do |i|
      angle = Math::PI * i / (n/2)
      x = center_bottom[0] + r_bottom * Math.cos(angle)
      z = center_bottom[2] - r_bottom * Math.sin(angle)
      points << [x, center_bottom[1], z]
    end
    # Tạo mặt biển
    face = sign.add_face(points)
    face.pushpull(-depth)
    # Tô màu nền trắng
    mat_white = model.materials.add('NenTrang')
    mat_white.color = '#FFFFFF'
    sign_group.material = mat_white

    # === 3. Viền hộp đèn (nẹp alu đen) ===
    # Viền ngoài (tạo offset mặt biển, pushpull)
    offset = 15.mm
    outline = []
    points.each do |pt|
      dx = pt[0] - width/2
      dz = pt[2] - (base_height+height*0.5)
      len = Math.sqrt(dx*dx + dz*dz)
      scale = (len + offset)/len
      outline << [width/2 + dx*scale, pt[1], (base_height+height*0.5) + dz*scale]
    end
    viendn = sign.add_face(outline)
    viendn.erase! if viendn.normal.z < 0
    viendn = sign.add_face(outline)
    viendn.pushpull(-depth-10.mm)
    sign.add_face(points) # Đảm bảo mặt biển không bị mất

    mat_vienden = model.materials.add('VienDen')
    mat_vienden.color = '#222222'
    viendn.material = mat_vienden

    # === 4. Chữ nổi 3D ===
    # "Bánh Tráng Trộn" (vàng viền đen, bo tròn)
    text1 = sign.add_3d_text(
      "Bánh Tráng Trộn",
      TextAlignCenter,
      "Arial Rounded MT Bold",
      false, false,
      60.mm,  # chiều cao chữ
      20.mm   # độ dày nổi
    )
    t1_tran = Geom::Transformation.new([width/2, base_depth/2, base_height+height*0.92])
    text1.transform!(t1_tran)
    mat_yellow = model.materials.add('ChuVang')
    mat_yellow.color = '#FFD600'
    text1.material = mat_yellow

    # "Nước Ép" (đỏ, viết tay)
    text2 = sign.add_3d_text(
      "Nước Ép",
      TextAlignCenter,
      "Brush Script MT",
      false, false,
      80.mm,
      25.mm
    )
    t2_tran = Geom::Transformation.new([width/2, base_depth/2, base_height+height*0.75])
    text2.transform!(t2_tran)
    mat_red = model.materials.add('ChuDo')
    mat_red.color = '#FF1744'
    text2.material = mat_red

    # Hai ngôi sao vàng hai bên
    star1 = sign.add_3d_text("★", TextAlignRight, "Arial", false, false, 40.mm, 10.mm)
    star1.transform!(Geom::Transformation.new([width/2-150.mm, base_depth/2, base_height+height*0.92]))
    star1.material = mat_yellow
    star2 = sign.add_3d_text("★", TextAlignLeft, "Arial", false, false, 40.mm, 10.mm)
    star2.transform!(Geom::Transformation.new([width/2+150.mm, base_depth/2, base_height+height*0.92]))
    star2.material = mat_yellow

    # === 5. Hình ảnh nước ép, bánh tráng (khối mô phỏng) ===
    # Ly nước ép trái: hình trụ đỏ
    glass1 = sign.add_group
    glass1.entities.add_cylinder([width/2-70.mm, base_depth/2, base_height+height*0.45], 30.mm, 90.mm)
    mat_glass1 = model.materials.add('NuocDo')
    mat_glass1.color = '#FF1744'
    glass1.material = mat_glass1
    # Ly nước ép giữa: hình trụ vàng
    glass2 = sign.add_group
    glass2.entities.add_cylinder([width/2, base_depth/2, base_height+height*0.45], 30.mm, 90.mm)
    mat_glass2 = model.materials.add('NuocVang')
    mat_glass2.color = '#FFD600'
    glass2.material = mat_glass2
    # Ly nước ép phải: hình trụ hồng nhạt
    glass3 = sign.add_group
    glass3.entities.add_cylinder([width/2+70.mm, base_depth/2, base_height+height*0.45], 30.mm, 90.mm)
    mat_glass3 = model.materials.add('NuocHong')
    mat_glass3.color = '#FF80AB'
    glass3.material = mat_glass3
    # Đĩa bánh tráng tròn (màu cam vàng)
    plate = sign.add_group
    plate.entities.add_circle([width/2, base_depth/2, base_height+height*0.18], [0,0,1], 65.mm)
    plate.entities.add_face(plate.entities[0]).pushpull(10.mm)
    mat_plate = model.materials.add('BanhTrang')
    mat_plate.color = '#FFD180'
    plate.material = mat_plate

    # === 6. Gắn hộp đèn lên khung chân ===
    sign_group.move!([base_width*0.5-width*0.5, 0, base_height])

    model.commit_operation
  end
end
HopDenChibi2Mat60X140.build