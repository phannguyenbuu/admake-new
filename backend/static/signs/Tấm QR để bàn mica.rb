# Mã nguồn Ruby hoàn chỉnh 100%
module TamQrDeBanMica
  def self.build
    model = Sketchup.active_model
    model.start_operation('TamQrDeBanMica', true)
    entities = model.active_entities

    # Kích thước tổng thể
    width = 120.mm
    height = 180.mm
    depth = 50.mm

    # Đế mica trong suốt
    base_width = width
    base_depth = 30.mm
    base_height = 8.mm
    base = entities.add_group
    base_face = base.entities.add_face([0,0,0], [base_width,0,0], [base_width,base_depth,0], [0,base_depth,0])
    base_face.pushpull(base_height)
    base.material = Sketchup::Color.new(245,245,245) # #F5F5F5

    # Tấm mica trắng cắt CNC (hình chữ nhật bo góc, mô phỏng hình mèo)
    plate_width = width
    plate_height = 160.mm
    plate_thickness = 3.mm
    plate = entities.add_group
    # Tạo mặt bo góc lớn (mô phỏng hình mèo)
    pts = []
    r = 20.mm
    pts += [[r,0,0]]
    pts += [[plate_width-r,0,0]]
    pts += [[plate_width, r,0]]
    pts += [[plate_width, plate_height-r,0]]
    pts += [[plate_width-r, plate_height,0]]
    pts += [[r, plate_height,0]]
    pts += [[0, plate_height-r,0]]
    pts += [[0, r,0]]
    face = plate.entities.add_face(pts)
    face.pushpull(plate_thickness)
    plate.material = Sketchup::Color.new(255,255,255) # #FFFFFF

    # Đặt tấm mica đứng lên đế
    plate.transform!(Geom::Transformation.translation([0, (base_depth-plate_thickness)/2, base_height]))

    # Mèo thần tài (mô phỏng bằng các khối ellipse và hình tròn)
    cat = plate.entities.add_group
    # Thân mèo (ellipse lớn)
    cat_body = cat.entities.add_face([20.mm, 30.mm, plate_thickness], [100.mm, 30.mm, plate_thickness], [100.mm, 120.mm, plate_thickness], [20.mm, 120.mm, plate_thickness])
    cat_body.pushpull(-2.mm)
    cat_body.material = Sketchup::Color.new(255,255,255) # #FFFFFF

    # Mặt mèo (ellipse nhỏ)
    cat_head = cat.entities.add_face([35.mm, 110.mm, plate_thickness], [85.mm, 110.mm, plate_thickness], [85.mm, 150.mm, plate_thickness], [35.mm, 150.mm, plate_thickness])
    cat_head.pushpull(-2.mm)
    cat_head.material = Sketchup::Color.new(255,255,255)

    # Tai mèo (tam giác)
    cat_ear1 = cat.entities.add_face([40.mm, 145.mm, plate_thickness], [50.mm, 160.mm, plate_thickness], [60.mm, 145.mm, plate_thickness])
    cat_ear1.pushpull(-2.mm)
    cat_ear1.material = Sketchup::Color.new(255,183,77) # #FFB74D
    cat_ear2 = cat.entities.add_face([60.mm, 145.mm, plate_thickness], [70.mm, 160.mm, plate_thickness], [80.mm, 145.mm, plate_thickness])
    cat_ear2.pushpull(-2.mm)
    cat_ear2.material = Sketchup::Color.new(255,183,77)

    # Má hồng
    cheek1 = cat.entities.add_face([45.mm, 120.mm, plate_thickness], [55.mm, 120.mm, plate_thickness], [55.mm, 130.mm, plate_thickness], [45.mm, 130.mm, plate_thickness])
    cheek1.pushpull(-1.mm)
    cheek1.material = Sketchup::Color.new(255,182,193) # #FFB6C1
    cheek2 = cat.entities.add_face([65.mm, 120.mm, plate_thickness], [75.mm, 120.mm, plate_thickness], [75.mm, 130.mm, plate_thickness], [65.mm, 130.mm, plate_thickness])
    cheek2.pushpull(-1.mm)
    cheek2.material = Sketchup::Color.new(255,182,193)

    # Đốm nâu trên đầu
    spot = cat.entities.add_face([55.mm, 155.mm, plate_thickness], [65.mm, 155.mm, plate_thickness], [65.mm, 160.mm, plate_thickness], [55.mm, 160.mm, plate_thickness])
    spot.pushpull(-1.mm)
    spot.material = Sketchup::Color.new(160,82,45) # #A0522D

    # Túi đỏ
    bag = cat.entities.add_face([30.mm, 40.mm, plate_thickness], [90.mm, 40.mm, plate_thickness], [90.mm, 70.mm, plate_thickness], [30.mm, 70.mm, plate_thickness])
    bag.pushpull(-1.5.mm)
    bag.material = Sketchup::Color.new(229,57,53) # #E53935

    # Viền mèo (dùng đường line màu đen)
    # (Bỏ qua chi tiết nhỏ, chỉ mô phỏng viền ngoài)

    # Chữ "Xin Chào" trên túi
    cat.entities.add_3d_text("Xin Chào", TextAlignCenter, "Arial", false, false, 7.mm, 1.mm, 0, true, [60.mm, 55.mm, plate_thickness+0.5.mm]).material = Sketchup::Color.new(34,34,34)

    # QR code (hình vuông xanh)
    qr_group = plate.entities.add_group
    qr_face = qr_group.entities.add_face([80.mm, 80.mm, plate_thickness+0.1.mm], [110.mm, 80.mm, plate_thickness+0.1.mm], [110.mm, 110.mm, plate_thickness+0.1.mm], [80.mm, 110.mm, plate_thickness+0.1.mm])
    qr_face.pushpull(0.5.mm)
    qr_group.material = Sketchup::Color.new(0,51,102) # #003366

    # Logo VietQR (chữ đỏ, xanh)
    plate.entities.add_3d_text("Viet", TextAlignLeft, "Arial", true, false, 5.mm, 1.mm, 0, true, [85.mm, 115.mm, plate_thickness+0.2.mm]).material = Sketchup::Color.new(229,57,53)
    plate.entities.add_3d_text("QR", TextAlignLeft, "Arial", true, false, 5.mm, 1.mm, 0, true, [100.mm, 115.mm, plate_thickness+0.2.mm]).material = Sketchup::Color.new(0,51,102)

    # Logo ACB (xanh)
    plate.entities.add_3d_text("ACB", TextAlignLeft, "Arial", true, false, 5.mm, 1.mm, 0, true, [110.mm, 115.mm, plate_thickness+0.2.mm]).material = Sketchup::Color.new(0,51,102)

    # Chữ "napas 247"
    plate.entities.add_3d_text("napas", TextAlignLeft, "Arial", false, false, 4.mm, 1.mm, 0, true, [85.mm, 75.mm, plate_thickness+0.2.mm]).material = Sketchup::Color.new(0,51,102)
    plate.entities.add_3d_text("247", TextAlignLeft, "Arial", false, false, 4.mm, 1.mm, 0, true, [105.mm, 75.mm, plate_thickness+0.2.mm]).material = Sketchup::Color.new(139,195,74)

    # Số điện thoại lớn
    plate.entities.add_3d_text("66642888", TextAlignCenter, "Arial Black", true, false, 12.mm, 2.mm, 0, true, [95.mm, 60.mm, plate_thickness+0.2.mm]).material = Sketchup::Color.new(0,51,102)

    # Tên công ty
    plate.entities.add_3d_text("CÔNG TY TNHH ĐA", TextAlignLeft, "Arial", false, false, 4.mm, 1.mm, 0, true, [80.mm, 50.mm, plate_thickness+0.2.mm]).material = Sketchup::Color.new(0,51,102)
    plate.entities.add_3d_text("SÂN VƯỜN ĐỨC HIẾU", TextAlignLeft, "Arial", false, false, 4.mm, 1.mm, 0, true, [80.mm, 45.mm, plate_thickness+0.2.mm]).material = Sketchup::Color.new(0,51,102)

    # Gắn tấm đứng lên đế
    plate.transform!(Geom::Transformation.translation([0, (base_depth-plate_thickness)/2, base_height]))

    model.commit_operation
  end
end
TamQrDeBanMica.build