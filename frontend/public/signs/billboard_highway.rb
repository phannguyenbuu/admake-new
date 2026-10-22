# ==============================================================================
# BẢNG QUẢNG CÁO TẤM LỚN NGOÀI TRỜI (HIGHWAY BILLBOARD / PANO ĐƠN CỘT)
# Tự động dựng hình 3D chính xác theo hình ảnh 1.webp cho SketchUp
# ==============================================================================

module BillboardHighway
  def self.create_billboard
    model = Sketchup.active_model
    model.start_operation('Tạo Biển Quảng Cáo Highway Pano', true)

    entities = model.active_entities
    main_group = entities.add_group
    main_group.name = "Pano_Quang_Cao_Don_Cot_14x7m"
    gent = main_group.entities

    # --------------------------------------------------------------------------
    # 1. TẠO VẬT LIỆU CHUẨN (MATERIALS)
    # --------------------------------------------------------------------------
    materials = model.materials
    
    mat_column = materials['Mat_Cot_Thep'] || materials.add('Mat_Cot_Thep')
    mat_column.color = Sketchup::Color.new(235, 238, 240) # Trắng xám nhạt như ảnh

    mat_steel = materials['Mat_Gian_Thep'] || materials.add('Mat_Gian_Thep')
    mat_steel.color = Sketchup::Color.new(180, 185, 190) # Thép mạ kẽm

    mat_screen = materials['Mat_Man_Hinh_Green'] || materials.add('Mat_Man_Hinh_Green')
    mat_screen.color = Sketchup::Color.new(0, 230, 60) # Xanh lá Chroma Green như ảnh

    mat_frame = materials['Mat_Vien_Kim_Loai'] || materials.add('Mat_Vien_Kim_Loai')
    mat_frame.color = Sketchup::Color.new(80, 85, 90) # Viền kim loại tối màu

    mat_concrete = materials['Mat_Mong_Be_Tong'] || materials.add('Mat_Mong_Be_Tong')
    mat_concrete.color = Sketchup::Color.new(150, 150, 150) # Bê tông móng

    mat_lamp = materials['Mat_Den_Pha'] || materials.add('Mat_Den_Pha')
    mat_lamp.color = Sketchup::Color.new(40, 40, 45) # Vỏ đèn pha

    # --------------------------------------------------------------------------
    # THÔNG SỐ HÌNH HỌC (ĐƠN VỊ MÉT)
    # --------------------------------------------------------------------------
    col_radius = 0.7.m         # Bán kính cột 0.7m (đường kính 1.4m)
    col_height = 14.0.m        # Chiều cao cột 14m
    board_w    = 14.0.m        # Bề ngang biển 14m
    board_h    = 7.0.m         # Chiều cao mặt biển 7m
    board_d    = 0.25.m        # Độ dày hộp biển 0.25m
    truss_h    = 1.8.m         # Chiều cao hệ giàn thép đáy 1.8m
    truss_d    = 1.8.m         # Bề sâu hệ giàn thép 1.8m

    # --------------------------------------------------------------------------
    # 2. MÓNG BÊ TÔNG CHÂN CỘT (CONCRETE BASE)
    # --------------------------------------------------------------------------
    base_group = gent.add_group
    base_group.name = "Mong_Be_Tong"
    bent = base_group.entities

    base_circle = bent.add_circle([0, 0, 0], [0, 0, 1], col_radius + 0.6.m, 24)
    base_face = bent.add_face(base_circle)
    base_face.pushpull(0.8.m)
    base_group.material = mat_concrete

    # --------------------------------------------------------------------------
    # 3. TRỤ TRÒN CHÍNH (MAIN STEEL COLUMN)
    # --------------------------------------------------------------------------
    col_group = gent.add_group
    col_group.name = "Tru_Thep_Chinh"
    cent = col_group.entities

    col_circle = cent.add_circle([0, 0, 0.8.m], [0, 0, 1], col_radius, 32)
    col_face = cent.add_face(col_circle)
    col_face.pushpull(col_height)
    col_group.material = mat_column

    # Bích liên kết đầu cột (Column Cap)
    cap_circle = cent.add_circle([0, 0, 0.8.m + col_height], [0, 0, 1], col_radius + 0.25.m, 32)
    cap_face = cent.add_face(cap_circle)
    cap_face.pushpull(0.2.m)

    # --------------------------------------------------------------------------
    # 4. THANG LEO KỸ THUẬT PHÍA SAU CỘT (MAINTENANCE LADDER & CAGE)
    # --------------------------------------------------------------------------
    ladder_group = gent.add_group
    ladder_group.name = "Thang_Leo_Bao_Tri"
    lent = ladder_group.entities

    ladder_y = -(col_radius + 0.15.m)
    ladder_w = 0.5.m
    rung_spacing = 0.35.m
    num_rungs = ((col_height - 2.0.m) / rung_spacing).to_i

    # Cây đứng 2 bên
    [-ladder_w/2, ladder_w/2].each do |lx|
      sc = lent.add_circle([lx, ladder_y, 1.0.m], [0, 0, 1], 0.025.m, 8)
      sf = lent.add_face(sc)
      sf.pushpull(col_height - 1.0.m)
    end

    # Các bậc thang (rungs)
    (0..num_rungs).each do |i|
      rz = 1.0.m + (i * rung_spacing)
      rc = lent.add_circle([-ladder_w/2, ladder_y, rz], [1, 0, 0], 0.015.m, 8)
      rf = lent.add_face(rc)
      rf.pushpull(ladder_w)
    end

    # Lồng bảo vệ (Safety cage) nửa trên
    cage_start_z = 3.5.m
    cage_r = 0.4.m
    (0..((col_height - cage_start_z) / 1.2.m).to_i).each do |j|
      cz = cage_start_z + (j * 1.2.m)
      # Vòng cung bảo vệ
      num_pts = 8
      arc_pts = []
      (0..num_pts).each do |k|
        ang = Math::PI * (k.to_f / num_pts)
        ax = Math.cos(ang) * cage_r
        ay = ladder_y - Math.sin(ang) * cage_r
        arc_pts << [ax, ay, cz]
      end
      lent.add_curve(arc_pts)
    end
    ladder_group.material = mat_steel

    # --------------------------------------------------------------------------
    # 5. HỆ GIÀN THÉP KHÔNG GIAN ĐỠ BẢNG (SPACE TRUSS STRUCTURE)
    # --------------------------------------------------------------------------
    truss_group = gent.add_group
    truss_group.name = "Gian_Thep_Khong_Gian"
    tent = truss_group.entities

    truss_base_z = 0.8.m + col_height + 0.2.m
    truss_top_z  = truss_base_z + truss_h

    # Dầm dọc chính đỡ đáy
    dams = [
      [[-board_w/2, -truss_d/2, truss_base_z], [board_w/2, -truss_d/2, truss_base_z]],
      [[-board_w/2,  truss_d/2, truss_base_z], [board_w/2,  truss_d/2, truss_base_z]],
      [[-board_w/2, -truss_d/2, truss_top_z],  [board_w/2, -truss_d/2, truss_top_z]],
      [[-board_w/2,  truss_d/2, truss_top_z],  [board_w/2,  truss_d/2, truss_top_z]]
    ]
    dams.each do |p1, p2|
      # Tạo thanh thép hộp
      bx = p1[0]
      by = p1[1]
      bz = p1[2]
      pts = [
        [bx, by - 0.08.m, bz - 0.08.m],
        [bx, by + 0.08.m, bz - 0.08.m],
        [bx, by + 0.08.m, bz + 0.08.m],
        [bx, by - 0.08.m, bz + 0.08.m]
      ]
      f = tent.add_face(pts)
      f.pushpull(board_w)
    end

    # Các nhịp giàn thép đan chéo (Chữ X & Z)
    num_bays = 10
    bay_w = board_w / num_bays
    (0..num_bays).each do |b|
      bx = -board_w/2 + (b * bay_w)
      # Thanh đứng trước & sau
      tent.add_line([bx, -truss_d/2, truss_base_z], [bx, -truss_d/2, truss_top_z])
      tent.add_line([bx,  truss_d/2, truss_base_z], [bx,  truss_d/2, truss_top_z])
      # Thanh ngang đáy & nóc
      tent.add_line([bx, -truss_d/2, truss_base_z], [bx,  truss_d/2, truss_base_z])
      tent.add_line([bx, -truss_d/2, truss_top_z],  [bx,  truss_d/2, truss_top_z])

      # Giằng chéo chữ X giữa các khoang
      if b < num_bays
        bx_next = bx + bay_w
        # Mặt trước
        tent.add_line([bx, -truss_d/2, truss_base_z], [bx_next, -truss_d/2, truss_top_z])
        tent.add_line([bx, -truss_d/2, truss_top_z],  [bx_next, -truss_d/2, truss_base_z])
        # Mặt sau
        tent.add_line([bx,  truss_d/2, truss_base_z], [bx_next,  truss_d/2, truss_top_z])
        tent.add_line([bx,  truss_d/2, truss_top_z],  [bx_next,  truss_d/2, truss_base_z])
        # Giằng chéo đáy
        tent.add_line([bx, -truss_d/2, truss_base_z], [bx_next,  truss_d/2, truss_base_z])
      end
    end
    truss_group.material = mat_steel

    # --------------------------------------------------------------------------
    # 6. SÀN THAO TÁC BẢO TRÌ & LAN CAN (CATWALK PLATFORM)
    # --------------------------------------------------------------------------
    catwalk_group = gent.add_group
    catwalk_group.name = "San_Thao_Tac_Catwalk"
    k_ent = catwalk_group.entities

    cw_z = truss_top_z
    cw_y = -(truss_d/2 + 0.3.m)
    cw_depth = 0.9.m

    # Bản sàn thép
    cw_pts = [
      [-board_w/2 - 0.3.m, cw_y, cw_z],
      [ board_w/2 + 0.3.m, cw_y, cw_z],
      [ board_w/2 + 0.3.m, cw_y + cw_depth, cw_z],
      [-board_w/2 - 0.3.m, cw_y + cw_depth, cw_z]
    ]
    cw_face = k_ent.add_face(cw_pts)
    cw_face.pushpull(-0.06.m)

    # Lan can tay vịn an toàn (cao 1.0m)
    rail_h = 1.0.m
    rail_y = cw_y
    # Tay vịn trên cùng
    k_ent.add_line([-board_w/2 - 0.3.m, rail_y, cw_z + rail_h], [board_w/2 + 0.3.m, rail_y, cw_z + rail_h])
    # Thanh ngang giữa
    k_ent.add_line([-board_w/2 - 0.3.m, rail_y, cw_z + rail_h/2], [board_w/2 + 0.3.m, rail_y, cw_z + rail_h/2])

    # Các cột đứng lan can
    (0..14).each do |rx|
      rx_pos = -board_w/2 - 0.3.m + (rx * (board_w + 0.6.m)/14)
      k_ent.add_line([rx_pos, rail_y, cw_z], [rx_pos, rail_y, cw_z + rail_h])
    end
    catwalk_group.material = mat_steel

    # --------------------------------------------------------------------------
    # 7. MẶT BIỂN PANO QUẢNG CÁO TẤM LỚN (BILLBOARD DISPLAY FACE)
    # --------------------------------------------------------------------------
    board_group = gent.add_group
    board_group.name = "Mat_Bien_Pano_14x7m"
    bent = board_group.entities

    board_z = truss_top_z
    board_y = -truss_d/2

    # Hộp bảng quảng cáo
    box_pts = [
      [-board_w/2, board_y - board_d, board_z],
      [ board_w/2, board_y - board_d, board_z],
      [ board_w/2, board_y, board_z],
      [-board_w/2, board_y, board_z]
    ]
    b_face = bent.add_face(box_pts)
    b_face.pushpull(board_h)
    board_group.material = mat_frame

    # Mặt hiển thị Green Screen phía trước
    disp_pts = [
      [-board_w/2 + 0.1.m, board_y - board_d - 0.01.m, board_z + 0.1.m],
      [ board_w/2 - 0.1.m, board_y - board_d - 0.01.m, board_z + 0.1.m],
      [ board_w/2 - 0.1.m, board_y - board_d - 0.01.m, board_z + board_h - 0.1.m],
      [-board_w/2 + 0.1.m, board_y - board_d - 0.01.m, board_z + board_h - 0.1.m]
    ]
    disp_face = bent.add_face(disp_pts)
    disp_face.material = mat_screen
    disp_face.back_material = mat_screen

    # --------------------------------------------------------------------------
    # 8. HỆ ĐÈN PHA CHIẾU SÁNG CAO ÁP (OVERHEAD FLOODLIGHTS)
    # --------------------------------------------------------------------------
    light_group = gent.add_group
    light_group.name = "Dan_Den_Pha_Chieu_Sang"
    dent = light_group.entities

    num_lights = 5
    light_spacing = board_w / (num_lights + 1)
    light_top_z = board_z + board_h

    (1..num_lights).each do |li|
      lx = -board_w/2 + (li * light_spacing)
      arm_reach = 1.6.m
      arm_y_start = board_y
      arm_y_end = board_y - board_d - arm_reach

      # Cần vươn đèn thép hộp
      dent.add_line([lx, arm_y_start, light_top_z], [lx, arm_y_end, light_top_z + 0.4.m])

      # Đầu đèn pha chiếu rọi
      lamp_box = [
        [lx - 0.3.m, arm_y_end - 0.15.m, light_top_z + 0.25.m],
        [lx + 0.3.m, arm_y_end - 0.15.m, light_top_z + 0.25.m],
        [lx + 0.3.m, arm_y_end + 0.15.m, light_top_z + 0.25.m],
        [lx - 0.3.m, arm_y_end + 0.15.m, light_top_z + 0.25.m]
      ]
      lf = dent.add_face(lamp_box)
      lf.pushpull(0.3.m)
    end
    light_group.material = mat_lamp

    # --------------------------------------------------------------------------
    # HOÀN TẤT & ZOOM TOÀN CẢNH
    # --------------------------------------------------------------------------
    model.commit_operation
    puts "================================================================="
    puts "🎉 ĐÃ TẠO THÀNH CÔNG MÔ HÌNH BIỂN QUẢNG CÁO PANO 14x7m (1.webp)!"
    puts "   - Chiều cao cột: 14m"
    puts "   - Kích thước mặt biển: 14m x 7m"
    puts "   - Kết cấu: Cột tròn, Thang leo có lồng, Giàn không gian, Sàn catwalk, Dàn đèn 5 pha"
    puts "================================================================="
  end
end

# Tự động thực thi khi nạp file vào SketchUp
BillboardHighway.create_billboard
