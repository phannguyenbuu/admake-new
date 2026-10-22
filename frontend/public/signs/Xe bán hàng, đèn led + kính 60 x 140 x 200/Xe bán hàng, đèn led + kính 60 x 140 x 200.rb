# Mã nguồn Ruby hoàn chỉnh 100%
module XeBanHangDenLedKinh60X140X200
  def self.build
    model = Sketchup.active_model
    model.start_operation('XeBanHangDenLedKinh60X140X200', true)
    entities = model.active_entities

    # Kích thước tổng thể
    width = 600.mm
    height = 1400.mm
    depth = 2000.mm

    # Thông số khung sắt
    frame_size = 30.mm
    frame_color = Sketchup::Color.new("#FF69B4") # Hồng đậm

    # Tạo khung sắt hộp
    frame_group = entities.add_group
    frame = frame_group.entities

    # 4 trụ đứng
    [[0,0,0],[width,0,0],[0,depth,0],[width,depth,0]].each do |x,y,z|
      frame.add_face([x,y,z],[x+frame_size,y,z],[x+frame_size,y,z+height],[x,y,z+height]).pushpull(frame_size)
    end

    # Khung trên/dưới
    [[0,0,0],[0,depth,0],[0,0,height-frame_size],[0,depth,height-frame_size]].each do |x,y,z|
      frame.add_face([x,y,z],[width,y,z],[width,y+frame_size,z],[x,y+frame_size,z]).pushpull(frame_size)
    end

    # Khung ngang tăng cứng (giữa)
    frame.add_face([0,0,height/2],[width,0,height/2],[width,frame_size,height/2],[0,frame_size,height/2]).pushpull(frame_size)
    frame.add_face([0,depth-frame_size,height/2],[width,depth-frame_size,height/2],[width,depth,height/2],[0,depth,height/2]).pushpull(frame_size)

    # Chân bánh xe
    4.times do |i|
      x = (i%2==0) ? 0 : width
      y = (i<2) ? 0 : depth
      cyl = frame.add_circle([x,y,0], [0,0,1], 25.mm, 24)
      frame.add_face(cyl).pushpull(-40.mm)
    end

    frame_group.material = frame_color

    # Tạo tấm nền alu mặt trước (hồng pastel)
    alu_color = Sketchup::Color.new("#FFB6C1")
    alu_group = entities.add_group
    alu = alu_group.entities
    alu_face = alu.add_face([0,0,0],[width,0,0],[width,0,900.mm],[0,0,900.mm])
    alu_face.pushpull(5.mm)
    alu_group.material = alu_color
    alu_group.move!([0,0,0])

    # Tạo tấm nền alu biển hiệu cong trên (hồng pastel)
    sign_group = entities.add_group
    sign = sign_group.entities
    sign_height = 300.mm
    sign_curve = []
    steps = 24
    (0..steps).each do |i|
      t = i.to_f/steps
      x = t*width
      y = 0
      z = 900.mm + sign_height*Math.sin(Math::PI*t)
      sign_curve << [x,y,z]
    end
    sign_curve << [width,0,900.mm]
    sign_curve << [0,0,900.mm]
    sign_face = sign.add_face(sign_curve)
    sign_face.pushpull(40.mm)
    sign_group.material = alu_color
    sign_group.move!([0,0,0])

    # Tạo kính cường lực mặt trước
    glass_group = entities.add_group
    glass = glass_group.entities
    glass_face = glass.add_face([0,0,900.mm],[width,0,900.mm],[width,0,1300.mm],[0,0,1300.mm])
    glass_face.pushpull(8.mm)
    glass_group.material = Sketchup::Color.new(200,255,255,80)
    glass_group.move!([0,0,0])

    # Tạo kính hai bên
    [0, width].each do |x|
      side_group = entities.add_group
      side = side_group.entities
      side_face = side.add_face([x,0,900.mm],[x,depth,900.mm],[x,depth,1300.mm],[x,0,1300.mm])
      side_face.pushpull(8.mm)
      side_group.material = Sketchup::Color.new(200,255,255,80)
    end

    # Viền nẹp alu quanh biển hiệu
    trim_group = entities.add_group
    trim = trim_group.entities
    trim.add_face([0,-10.mm,900.mm],[width,-10.mm,900.mm],[width,-10.mm,900.mm+sign_height],[0,-10.mm,900.mm+sign_height]).pushpull(10.mm)
    trim_group.material = frame_color

    # Chữ nổi "TIỆM TRÀ NHÀ MEOW" (trắng viền hồng)
    text_group = entities.add_group
    text = text_group.entities
    text.add_3d_text("TIỆM TRÀ NHÀ MEOW", 
      TextAlignCenter=true, 
      "Arial Black", 
      false, false, 120.mm, 30.mm, true, 0)
    text_group.material = Sketchup::Color.new("#FFFFFF")
    text_group.move!([width/2, 20.mm, 900.mm+sign_height/2+30.mm])

    # Chữ nổi "TRÀ NGON - ĐẬM VỊ" (xanh dương viền trắng)
    text2_group = entities.add_group
    text2 = text2_group.entities
    text2.add_3d_text("TRÀ NGON - ĐẬM VỊ", 
      TextAlignCenter=true, 
      "Arial Black", 
      false, false, 80.mm, 20.mm, true, 0)
    text2_group.material = Sketchup::Color.new("#1E90FF")
    text2_group.move!([width/2, 20.mm, 900.mm+40.mm])

    # Chữ nổi mặt trước (đỏ)
    ["TRÀ SỮA FULL TOPPING", "TRÀ TRÁI CÂY", "MÌ CAY - ĂN VẶT"].each_with_index do |line, i|
      g = entities.add_group
      e = g.entities
      e.add_3d_text(line, TextAlignLeft=true, "Arial Black", false, false, 60.mm, 15.mm, true, 0)
      g.material = Sketchup::Color.new("#FF3B3B")
      g.move!([40.mm, 20.mm, 700.mm-80.mm*i])
    end

    # Logo mèo tròn mặt trước
    logo_group = entities.add_group
    logo = logo_group.entities
    center = [width-120.mm, 60.mm, 400.mm]
    logo_circle = logo.add_circle(center, [0,0,1], 90.mm, 48)
    logo_face = logo.add_face(logo_circle)
    logo_face.pushpull(8.mm)
    logo_group.material = Sketchup::Color.new("#FFFACD")
    # Thêm chữ "TIỆM TRÀ NHÀ MEOW" và số điện thoại lên logo
    logo_text1 = logo.add_3d_text("TIỆM TRÀ NHÀ MEOW", TextAlignCenter=true, "Arial", false, false, 18.mm, 3.mm, true, 0)
    logo_text2 = logo.add_3d_text("0962 750 569", TextAlignCenter=true, "Arial", false, false, 18.mm, 3.mm, true, 0)
    logo_text1_group = logo.add_group(logo_text1)
    logo_text2_group = logo.add_group(logo_text2)
    logo_text1_group.material = Sketchup::Color.new("#FF69B4")
    logo_text2_group.material = Sketchup::Color.new("#FF69B4")
    logo_text1_group.move!([center[0], center[1], center[2]+10.mm])
    logo_text2_group.move!([center[0], center[1], center[2]-30.mm])

    # Icon ly trà sữa (trái biển hiệu)
    cup_group = entities.add_group
    cup = cup_group.entities
    cup_face = cup.add_face([0-60.mm, 40.mm, 900.mm+sign_height/2],[0-10.mm, 40.mm, 900.mm+sign_height/2],[0-10.mm, 40.mm, 900.mm+sign_height/2+120.mm],[0-60.mm, 40.mm, 900.mm+sign_height/2+120.mm])
    cup_face.pushpull(10.mm)
    cup_group.material = Sketchup::Color.new("#FFFACD")

    # Icon mèo (phải biển hiệu)
    cat_group = entities.add_group
    cat = cat_group.entities
    cat_face = cat.add_face([width+10.mm, 40.mm, 900.mm+sign_height/2],[width+60.mm, 40.mm, 900.mm+sign_height/2],[width+60.mm, 40.mm, 900.mm+sign_height/2+120.mm],[width+10.mm, 40.mm, 900.mm+sign_height/2+120.mm])
    cat_face.pushpull(10.mm)
    cat_group.material = Sketchup::Color.new("#FFB6C1")

    model.commit_operation
  end
end
XeBanHangDenLedKinh60X140X200.build