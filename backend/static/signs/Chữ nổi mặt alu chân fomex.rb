# Mã nguồn Ruby hoàn chỉnh 100%
module ChuNoiMatAluChanFomex
  extend self

  def build
    model = Sketchup.active_model
    model.start_operation('ChuNoiMatAluChanFomex', true)
    entities = model.active_entities

    # Thông số tổng thể
    width = 1200.mm
    height = 400.mm
    depth = 30.mm

    # Vị trí xuất phát (góc trái dưới)
    base_x = 0
    base_y = 0
    base_z = 0

    # Thông số chữ lớn "ALCOM"
    main_text = "ALCOM"
    main_font = "Arial Black"
    main_height = 200.mm
    main_depth = 30.mm
    main_color = Sketchup::Color.new("#FFFFFF") # Mặt alu trắng
    main_logo_color = Sketchup::Color.new("#1A237E") # Xanh dương logo
    main_logo_orange = Sketchup::Color.new("#FF6F00") # Cam logo

    # Thông số chữ phụ
    sub_text = "Aluminium Composite"
    sub_font = "Arial"
    sub_height = 40.mm
    sub_depth = 15.mm
    sub_color = Sketchup::Color.new("#1A237E") # Xanh dương

    # Tạo nhóm chữ nổi chính
    group_main = entities.add_group
    ents_main = group_main.entities

    # Vẽ từng ký tự "ALCOM" nổi
    offset_x = base_x + 50.mm
    offset_y = base_y + height/2 + 30.mm
    main_text.chars.each_with_index do |char, i|
      t = ents_main.add_3d_text(
        char,
        TextAlignLeft,
        main_height,
        true,
        false,
        main_depth,
        0,
        main_font
      )
      t.material = main_color
      t.back_material = main_color
      # Dịch chuyển từng ký tự theo chiều ngang
      t.transform!(Geom::Transformation.translation([offset_x, offset_y, base_z]))
      offset_x += main_height * 0.65 # Khoảng cách giữa các chữ
    end

    # Tạo logo cách điệu chữ "A" (tam giác + sọc xanh)
    group_logo = entities.add_group
    ents_logo = group_logo.entities
    # Tam giác lớn (chữ A)
    pts = [
      [base_x + 30.mm, base_y + height/2 + 70.mm, base_z],
      [base_x + 70.mm, base_y + height/2 + 70.mm, base_z],
      [base_x + 50.mm, base_y + height/2 + 130.mm, base_z]
    ]
    face = ents_logo.add_face(pts)
    face.pushpull(main_depth)
    face.material = main_logo_color
    face.back_material = main_logo_color
    # Sọc chéo (biểu tượng logo)
    stripe = ents_logo.add_face([
      [base_x + 47.mm, base_y + height/2 + 80.mm, base_z + 1.mm],
      [base_x + 53.mm, base_y + height/2 + 80.mm, base_z + 1.mm],
      [base_x + 63.mm, base_y + height/2 + 120.mm, base_z + 1.mm],
      [base_x + 57.mm, base_y + height/2 + 120.mm, base_z + 1.mm]
    ])
    stripe.pushpull(main_depth - 2.mm)
    stripe.material = main_logo_orange
    stripe.back_material = main_logo_orange

    # Tạo chữ phụ "Aluminium Composite"
    group_sub = entities.add_group
    ents_sub = group_sub.entities
    t_sub = ents_sub.add_3d_text(
      sub_text,
      TextAlignLeft,
      sub_height,
      true,
      false,
      sub_depth,
      0,
      sub_font
    )
    t_sub.material = sub_color
    t_sub.back_material = sub_color
    # Đặt dưới dòng chữ chính
    t_sub.transform!(Geom::Transformation.translation([base_x + 60.mm, base_y + height/2 - 40.mm, base_z]))

    # Tạo chân fomex cho từng chữ (khối hộp phía sau)
    offset_x = base_x + 50.mm
    main_text.chars.each_with_index do |char, i|
      group_fomex = entities.add_group
      ents_fomex = group_fomex.entities
      t_fomex = ents_fomex.add_3d_text(
        char,
        TextAlignLeft,
        main_height,
        true,
        false,
        main_depth,
        0,
        main_font
      )
      # Đẩy chân fomex lùi vào trong 2mm để tạo hiệu ứng nổi
      t_fomex.material = Sketchup::Color.new("#F5F5F5")
      t_fomex.back_material = Sketchup::Color.new("#F5F5F5")
      t_fomex.transform!(Geom::Transformation.translation([offset_x, offset_y, base_z - 2.mm]))
      offset_x += main_height * 0.65
    end

    # Chữ phụ trên mặt chữ (vd: "9001:2015")
    group_sub2 = entities.add_group
    ents_sub2 = group_sub2.entities
    t_sub2 = ents_sub2.add_3d_text(
      "9001:2015",
      TextAlignLeft,
      30.mm,
      true,
      false,
      10.mm,
      0,
      sub_font
    )
    t_sub2.material = main_logo_color
    t_sub2.back_material = main_logo_color
    t_sub2.transform!(Geom::Transformation.translation([base_x + 350.mm, base_y + height/2 + 90.mm, base_z + 1.mm]))

    model.commit_operation
  end
end
ChuNoiMatAluChanFomex.build