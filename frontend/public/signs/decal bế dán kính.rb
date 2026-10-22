# Mã nguồn Ruby hoàn chỉnh 100%
module DecalBeDanKinh
  def self.build
    model = Sketchup.active_model
    model.start_operation('DecalBeDanKinh', true)
    entities = model.active_entities

    # Kích thước tổng thể decal
    width = 3000.mm
    height = 1000.mm
    decal_thickness = 2.mm

    # Tạo mặt decal chính (hình chữ nhật đại diện cho decal dán kính)
    pt1 = [0, 0, 0]
    pt2 = [width, 0, 0]
    pt3 = [width, height, 0]
    pt4 = [0, height, 0]
    face = entities.add_face(pt1, pt2, pt3, pt4)
    face.pushpull(-decal_thickness)
    # Gán vật liệu decal trong suốt (mô phỏng kính)
    decal_material = model.materials.add('DecalGlass')
    decal_material.alpha = 0.1
    decal_material.color = Sketchup::Color.new(255,255,255)
    face.material = decal_material
    face.back_material = decal_material

    # Tạo nhóm chữ nổi lớn "LÊN ĐỜI XE ĐIỆN"
    group_main_text = entities.add_group
    main_text = "LÊN ĐỜI XE ĐIỆN"
    main_text_height = 180.mm
    main_text_depth = 8.mm
    # Chữ "LÊN ĐỜI" (xanh dương)
    group_main_text.entities.add_3d_text(
      "LÊN ĐỜI",
      TextAlignLeft = 0,
      false,
      main_text_height,
      main_text_depth,
      Font = "Arial Black",
      Bold = true,
      Italic = false,
      true,
      0
    ).each { |e| 
      e.material = Sketchup::Color.new("#1A237E")
    }
    # Chữ "XE ĐIỆN" (xanh lá)
    group_main_text.entities.add_3d_text(
      "XE ĐIỆN",
      TextAlignLeft = 0,
      false,
      main_text_height,
      main_text_depth,
      Font = "Arial Black",
      Bold = true,
      Italic = false,
      true,
      0
    ).each { |e| 
      e.material = Sketchup::Color.new("#43A047")
    }
    # Đặt vị trí chữ "LÊN ĐỜI" và "XE ĐIỆN"
    group_main_text.transform!(Geom::Transformation.translation([100.mm, height-220.mm, decal_thickness+1.mm]))

    # Tạo nhóm chữ phụ "CHỌN XE CHỌN VINFAST"
    group_sub_text = entities.add_group
    sub_text_height = 90.mm
    sub_text_depth = 6.mm
    # "CHỌN XE" (nền xanh dương, chữ trắng)
    sub1 = group_sub_text.entities.add_3d_text(
      "CHỌN XE",
      TextAlignLeft = 0,
      false,
      sub_text_height,
      sub_text_depth,
      Font = "Arial Black",
      Bold = true,
      Italic = false,
      true,
      0
    )
    sub1.each { |e| e.material = Sketchup::Color.new("#FFFFFF") }
    # "CHỌN VINFAST" (nền trắng, chữ xanh dương)
    sub2 = group_sub_text.entities.add_3d_text(
      "CHỌN VINFAST",
      TextAlignLeft = 0,
      false,
      sub_text_height,
      sub_text_depth,
      Font = "Arial Black",
      Bold = true,
      Italic = false,
      true,
      0
    )
    sub2.each { |e| e.material = Sketchup::Color.new("#1A237E") }
    # Đặt vị trí chữ phụ
    group_sub_text.transform!(Geom::Transformation.translation([110.mm, height-320.mm, decal_thickness+1.mm]))

    # Tạo các khối số nổi "9% ƯU ĐÃI", "0đ SẠC PIN", "0đ LỆ PHÍ"
    group_numbers = entities.add_group
    num_text_height = 80.mm
    num_text_depth = 5.mm
    # "9% ƯU ĐÃI"
    num1 = group_numbers.entities.add_3d_text(
      "9% ƯU ĐÃI",
      TextAlignLeft = 0,
      false,
      num_text_height,
      num_text_depth,
      Font = "Arial Black",
      Bold = true,
      Italic = false,
      true,
      0
    )
    num1.each { |e| e.material = Sketchup::Color.new("#FFFFFF") }
    # "0đ SẠC PIN"
    num2 = group_numbers.entities.add_3d_text(
      "0đ SẠC PIN",
      TextAlignLeft = 0,
      false,
      num_text_height,
      num_text_depth,
      Font = "Arial Black",
      Bold = true,
      Italic = false,
      true,
      0
    )
    num2.each { |e| e.material = Sketchup::Color.new("#FFFFFF") }
    # "0đ LỆ PHÍ"
    num3 = group_numbers.entities.add_3d_text(
      "0đ LỆ PHÍ",
      TextAlignLeft = 0,
      false,
      num_text_height,
      num_text_depth,
      Font = "Arial Black",
      Bold = true,
      Italic = false,
      true,
      0
    )
    num3.each { |e| e.material = Sketchup::Color.new("#FFFFFF") }
    # Đặt vị trí các số
    group_numbers.entities.transform_entities(
      Geom::Transformation.translation([200.mm, height-420.mm, decal_thickness+1.mm]), num1
    )
    group_numbers.entities.transform_entities(
      Geom::Transformation.translation([800.mm, height-420.mm, decal_thickness+1.mm]), num2
    )
    group_numbers.entities.transform_entities(
      Geom::Transformation.translation([1400.mm, height-420.mm, decal_thickness+1.mm]), num3
    )

    # Tạo hình splash nền xe (hình chữ nhật bo tròn đại diện)
    splash_w = 1200.mm
    splash_h = 200.mm
    splash_x = (width - splash_w) / 2
    splash_y = 120.mm
    splash_face = entities.add_face(
      [splash_x, splash_y, decal_thickness+1.mm],
      [splash_x+splash_w, splash_y, decal_thickness+1.mm],
      [splash_x+splash_w, splash_y+splash_h, decal_thickness+1.mm],
      [splash_x, splash_y+splash_h, decal_thickness+1.mm]
    )
    splash_face.pushpull(4.mm)
    splash_face.material = Sketchup::Color.new("#1976D2")

    # Tạo các khối xe (đại diện bằng hình hộp màu)
    car_w = 220.mm
    car_h = 100.mm
    car_d = 40.mm
    car_colors = ["#F06292", "#FFEB3B", "#E53935", "#FFFFFF"]
    4.times do |i|
      car_x = splash_x + 60.mm + i*(car_w+40.mm)
      car_y = splash_y + 40.mm
      car = entities.add_group
      car.entities.add_face(
        [car_x, car_y, decal_thickness+5.mm],
        [car_x+car_w, car_y, decal_thickness+5.mm],
        [car_x+car_w, car_y+car_h, decal_thickness+5.mm],
        [car_x, car_y+car_h, decal_thickness+5.mm]
      ).pushpull(car_d)
      car.material = Sketchup::Color.new(car_colors[i])
    end

    model.commit_operation
  end
end
DecalBeDanKinh.build