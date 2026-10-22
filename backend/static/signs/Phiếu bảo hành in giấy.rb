# Mã nguồn Ruby hoàn chỉnh 100%
module PhieuBaoHanhInGiay
  def self.build
    model = Sketchup.active_model
    model.start_operation('PhieuBaoHanhInGiay', true)
    entities = model.active_entities

    # Kích thước phiếu
    width = 200.mm
    height = 100.mm
    thickness = 2.mm

    # Tạo nhóm phiếu bảo hành
    group = entities.add_group
    gents = group.entities

    # Tạo mặt phiếu (giấy)
    pts = [
      [0, 0, 0],
      [width, 0, 0],
      [width, height, 0],
      [0, height, 0]
    ]
    face = gents.add_face(pts)
    face.pushpull(thickness)

    # Tô màu nền trắng
    mat_white = model.materials.add('White')
    mat_white.color = '#ffffff'
    face.material = mat_white
    face.back_material = mat_white

    # Viền đen ngoài cùng (2mm)
    border_w = 2.mm
    border_face = gents.add_face([
      [-border_w, -border_w, thickness/2],
      [width+border_w, -border_w, thickness/2],
      [width+border_w, height+border_w, thickness/2],
      [-border_w, height+border_w, thickness/2]
    ])
    inner_border = gents.add_face([
      [0, 0, thickness/2],
      [width, 0, thickness/2],
      [width, height, thickness/2],
      [0, height, thickness/2]
    ])
    border_face.followme(gents.add_circle([0,0,thickness/2], [0,0,1], 0.1))
    border_face.erase!
    # Tô màu viền đen
    mat_black = model.materials.add('Black')
    mat_black.color = '#222222'
    inner_border.material = mat_black

    # Viền chỉ vàng (0.5mm)
    gold_w = 0.5.mm
    gold_face = gents.add_face([
      [border_w, border_w, thickness/2+0.01],
      [width-border_w, border_w, thickness/2+0.01],
      [width-border_w, height-border_w, thickness/2+0.01],
      [border_w, height-border_w, thickness/2+0.01]
    ])
    inner_gold = gents.add_face([
      [border_w+gold_w, border_w+gold_w, thickness/2+0.01],
      [width-border_w-gold_w, border_w+gold_w, thickness/2+0.01],
      [width-border_w-gold_w, height-border_w-gold_w, thickness/2+0.01],
      [border_w+gold_w, height-border_w-gold_w, thickness/2+0.01]
    ])
    gold_face.material = model.materials.add('Gold')
    gold_face.material.color = '#ffd700'
    inner_gold.erase!

    # Thêm chữ/logo chính (dùng 3D Text phẳng)
    # Logo NANOPXN
    gents.add_3d_text(
      "NANOPXN", 
      TextAlignLeft = true, 
      10.mm, 
      true, 
      false, 
      0, 
      [10.mm, height-18.mm, thickness+0.2.mm]
    ).material = model.materials.add('Red').tap { |m| m.color = '#d32f2f' }

    # Made in Korea (nhỏ)
    gents.add_3d_text(
      "Made in Korea", 
      TextAlignLeft = true, 
      4.mm, 
      true, 
      false, 
      0, 
      [60.mm, height-15.mm, thickness+0.2.mm]
    ).material = mat_black

    # PHIẾU BẢO HÀNH (chính giữa trên)
    gents.add_3d_text(
      "PHIẾU BẢO HÀNH", 
      TextAlignCenter = true, 
      8.mm, 
      true, 
      false, 
      0, 
      [width/2-35.mm, height-18.mm, thickness+0.2.mm]
    ).material = mat_black

    # Số: (trên phải)
    gents.add_3d_text(
      "Số:", 
      TextAlignLeft = true, 
      4.mm, 
      true, 
      false, 
      0, 
      [width-30.mm, height-15.mm, thickness+0.2.mm]
    ).material = mat_black

    # Hotline (dưới cùng phải)
    hotline = "0347.699.094, 0971.422.334"
    gents.add_3d_text(
      hotline, 
      TextAlignRight = true, 
      5.mm, 
      true, 
      false, 
      0, 
      [width-90.mm, 5.mm, thickness+0.2.mm]
    ).material = model.materials.add('Red2').tap { |m| m.color = '#d32f2f' }

    # Các mục điền thông tin (chữ nhỏ)
    info_fields = [
      ["Khách hàng:", 10.mm, height-30.mm],
      ["Nhãn hiệu xe:", 10.mm, height-40.mm],
      ["Biển KS/Số khung:", 10.mm, height-50.mm],
      ["Thời gian bảo hành:", 10.mm, height-60.mm],
      ["Thời gian lắp đặt:", 10.mm, height-70.mm]
    ]
    info_fields.each do |text, x, y|
      gents.add_3d_text(
        text, 
        TextAlignLeft = true, 
        4.mm, 
        true, 
        false, 
        0, 
        [x, y, thickness+0.2.mm]
      ).material = mat_black
    end

    # Sơ đồ xe (hình chữ nhật, mô phỏng)
    car_w = 40.mm
    car_h = 20.mm
    car_x = width/2 - car_w/2
    car_y = height/2 - car_h/2
    car_face = gents.add_face([
      [car_x, car_y, thickness+0.1.mm],
      [car_x+car_w, car_y, thickness+0.1.mm],
      [car_x+car_w, car_y+car_h, thickness+0.1.mm],
      [car_x, car_y+car_h, thickness+0.1.mm]
    ])
    car_face.material = model.materials.add('GrayCar').tap { |m| m.color = '#cccccc' }

    # Các ô kính xe
    glass_fields = [
      ["Phim kính lái", car_x+car_w/2-10.mm, car_y+car_h+2.mm],
      ["Phim kính sườn trước", car_x-25.mm, car_y+car_h/2],
      ["Phim kính sườn sau", car_x+car_w+2.mm, car_y+car_h/2],
      ["Phim kính hậu", car_x+car_w/2-10.mm, car_y-8.mm]
    ]
    glass_fields.each do |text, x, y|
      gents.add_3d_text(
        text, 
        TextAlignLeft = true, 
        3.mm, 
        true, 
        false, 
        0, 
        [x, y, thickness+0.2.mm]
      ).material = mat_black
    end

    # Hình xe ô tô góc trên phải (mô phỏng bằng hình chữ nhật nhỏ)
    car_icon_w = 18.mm
    car_icon_h = 7.mm
    car_icon_x = width-28.mm
    car_icon_y = height-15.mm
    car_icon = gents.add_face([
      [car_icon_x, car_icon_y, thickness+0.2.mm],
      [car_icon_x+car_icon_w, car_icon_y, thickness+0.2.mm],
      [car_icon_x+car_icon_w, car_icon_y+car_icon_h, thickness+0.2.mm],
      [car_icon_x, car_icon_y+car_icon_h, thickness+0.2.mm]
    ])
    car_icon.material = model.materials.add('GrayCarIcon').tap { |m| m.color = '#cccccc' }

    model.commit_operation
  end
end
PhieuBaoHanhInGiay.build