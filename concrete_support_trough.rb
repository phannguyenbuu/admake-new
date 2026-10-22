# ==============================================================================
# SketchUp Ruby Script: Concrete Support Trough (Máng Đỡ Bê Tông)
# Job ID: job_1792111885854
# Units: Millimeters (mm)
# ==============================================================================
require 'sketchup.rb'

module ConcreteSupportTroughBuilder
  def self.create_model
    model = Sketchup.active_model
    model.start_operation('Create Concrete Support Trough', true)

    entities = model.active_entities
    main_group = entities.add_group
    main_group.name = "Concrete_Support_Trough_Assembly"
    g_ent = main_group.entities

    # Materials
    materials = model.materials
    mat_concrete = materials['Mat_Concrete_Grey'] || materials.add('Mat_Concrete_Grey')
    mat_concrete.color = [160, 165, 175]

    mat_dark_concrete = materials['Mat_Concrete_Base'] || materials.add('Mat_Concrete_Base')
    mat_dark_concrete.color = [110, 120, 135]

    mat_finish = materials['Mat_Concrete_Finish'] || materials.add('Mat_Concrete_Finish')
    mat_finish.color = [200, 205, 215]

    # Helper: Add Box
    add_box = lambda do |w, d, h, x, y, z, mat, name|
      grp = g_ent.add_group
      grp.name = name
      pts = [
        [x - w/2.0, y - d/2.0, z],
        [x + w/2.0, y - d/2.0, z],
        [x + w/2.0, y + d/2.0, z],
        [x - w/2.0, y + d/2.0, z]
      ]
      face = grp.entities.add_face(pts)
      face.pushpull(h)
      grp.material = mat
      grp
    end

    # 1. Gờ đáy (Base Flange): 1900 x 950 x 25 mm, z = 0 -> 25 mm
    add_box.call(1900.mm, 950.mm, 25.mm, 0, 0, 0, mat_dark_concrete, "1_Go_Day_BaseFlange")

    # 2. Bệ móng chính (Main Footing): 1850 x 900 x 250 mm, z = 25 -> 275 mm
    add_box.call(1850.mm, 900.mm, 250.mm, 0, 0, 25.mm, mat_concrete, "2_Be_Mong_MainFooting")

    # 3. Lớp hoàn thiện mặt bệ: 1850 x 900 x 8 mm, z = 275 -> 283 mm
    add_box.call(1850.mm, 900.mm, 8.mm, 0, 0, 275.mm, mat_finish, "3_Hoan_Thien_Mat_Be")

    # 4. Trụ đỡ trung tâm (Central Support Pier): z = 283 -> 880 mm (h = 597 mm)
    pier_grp = g_ent.add_group
    pier_grp.name = "4_Tru_Do_Trung_Tam"
    p_ent = pier_grp.entities

    # Lõi hộp trung tâm: 1000 x 400 mm
    p_box = [
      [-500.mm, -200.mm, 283.mm],
      [500.mm, -200.mm, 283.mm],
      [500.mm, 200.mm, 283.mm],
      [-500.mm, 200.mm, 283.mm]
    ]
    f_pbox = p_ent.add_face(p_box)
    f_pbox.pushpull(597.mm)

    # Hai đầu tròn bán nguyệt tại X = -500 và X = +500
    c_left = p_ent.add_circle([-500.mm, 0, 283.mm], [0, 0, 1], 200.mm, 32)
    f_left = p_ent.add_face(c_left)
    f_left.pushpull(597.mm)

    c_right = p_ent.add_circle([500.mm, 0, 283.mm], [0, 0, 1], 200.mm, 32)
    f_right = p_ent.add_face(c_right)
    f_right.pushpull(597.mm)
    pier_grp.material = mat_concrete

    # 5. Dầm ngang chính (Main Transverse Beam): 2200 x 500 x 300 mm, z = 880 -> 1180 mm
    add_box.call(2200.mm, 500.mm, 300.mm, 0, 0, 880.mm, mat_concrete, "5_Dam_Ngang_MainBeam")

    # 6. Lớp hoàn thiện mặt dầm / lòng máng: 2190 x 490 x 10 mm, z = 1180 -> 1190 mm
    add_box.call(2190.mm, 490.mm, 10.mm, 0, 0, 1180.mm, mat_finish, "6_Hoan_Thien_Long_Mang")

    # 7. Vách máng (Trough Walls): cao 420 mm, dày 35 mm, z = 1180 -> 1600 mm
    wall_grp = g_ent.add_group
    wall_grp.name = "7_Vach_Mang_U_Channel"
    w_ent = wall_grp.entities

    # Vách dọc 1 (+Y)
    f_w1 = w_ent.add_face([
      [-1100.mm, 215.mm, 1180.mm],
      [1100.mm, 215.mm, 1180.mm],
      [1100.mm, 250.mm, 1180.mm],
      [-1100.mm, 250.mm, 1180.mm]
    ])
    f_w1.pushpull(420.mm)

    # Vách dọc 2 (-Y)
    f_w2 = w_ent.add_face([
      [-1100.mm, -250.mm, 1180.mm],
      [1100.mm, -250.mm, 1180.mm],
      [1100.mm, -215.mm, 1180.mm],
      [-1100.mm, -215.mm, 1180.mm]
    ])
    f_w2.pushpull(420.mm)

    # Vách đầu hồi (-X)
    f_e1 = w_ent.add_face([
      [-1100.mm, -215.mm, 1180.mm],
      [-1065.mm, -215.mm, 1180.mm],
      [-1065.mm, 215.mm, 1180.mm],
      [-1100.mm, 215.mm, 1180.mm]
    ])
    f_e1.pushpull(420.mm)

    # Vách đầu hồi (+X)
    f_e2 = w_ent.add_face([
      [1065.mm, -215.mm, 1180.mm],
      [1100.mm, -215.mm, 1180.mm],
      [1100.mm, 215.mm, 1180.mm],
      [1065.mm, 215.mm, 1180.mm]
    ])
    f_e2.pushpull(420.mm)
    wall_grp.material = mat_concrete

    # 8. 5 Cụm gờ vuông giật cấp (5 sets of stepped ribs / stiffener brackets)
    ribs_grp = g_ent.add_group
    ribs_grp.name = "8_Nam_Cum_Go_Vuong_Giat_Cap"
    rib_x_coords = [-800.mm, -400.mm, 0.mm, 400.mm, 800.mm]

    rib_x_coords.each_with_index do |rx, idx|
      [1, -1].each do |dir|
        side_tag = dir > 0 ? "Front" : "Back"
        c_grp = ribs_grp.entities.add_group
        c_grp.name = "Rib_Set_#{idx + 1}_#{side_tag}"

        # Tier 1 (Base): 80 x 40 x 250 mm
        t1 = c_grp.entities.add_face([
          [rx - 40.mm, dir * 250.mm, 920.mm],
          [rx + 40.mm, dir * 250.mm, 920.mm],
          [rx + 40.mm, dir * (250.mm + 40.mm), 920.mm],
          [rx - 40.mm, dir * (250.mm + 40.mm), 920.mm]
        ])
        t1.pushpull(250.mm)

        # Tier 2 (Mid): 60 x 25 x 180 mm
        t2 = c_grp.entities.add_face([
          [rx - 30.mm, dir * (250.mm + 40.mm), 960.mm],
          [rx + 30.mm, dir * (250.mm + 40.mm), 960.mm],
          [rx + 30.mm, dir * (250.mm + 65.mm), 960.mm],
          [rx - 30.mm, dir * (250.mm + 65.mm), 960.mm]
        ])
        t2.pushpull(180.mm)

        # Tier 3 (Top): 40 x 15 x 120 mm
        t3 = c_grp.entities.add_face([
          [rx - 20.mm, dir * (250.mm + 65.mm), 990.mm],
          [rx + 20.mm, dir * (250.mm + 65.mm), 990.mm],
          [rx + 20.mm, dir * (250.mm + 80.mm), 990.mm],
          [rx - 20.mm, dir * (250.mm + 80.mm), 990.mm]
        ])
        t3.pushpull(120.mm)
        c_grp.material = mat_concrete
      end
    end

    # 9. 2 Khối bê tông đứng (Two vertical concrete stops inside trough)
    add_box.call(120.mm, 180.mm, 220.mm, -650.mm, 0, 1190.mm, mat_concrete, "9_Khoi_Dung_Trai")
    add_box.call(120.mm, 180.mm, 220.mm, 650.mm, 0, 1190.mm, mat_concrete, "9_Khoi_Dung_Phai")

    model.commit_operation
    UI.messagebox("Đã dựng hoàn chỉnh Mô Hình Máng Đỡ Bê Tông (2200 x 950 x 1600 mm)!")
  end
end

# Auto-execute when loaded
ConcreteSupportTroughBuilder.create_model
