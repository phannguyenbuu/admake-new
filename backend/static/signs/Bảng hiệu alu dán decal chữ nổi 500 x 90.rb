# Mã nguồn Ruby hoàn chỉnh 100%
module BangHieuAluDanDecalChuNoi500X90
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuAluDanDecalChuNoi500X90', true)
    entities = model.active_entities

    # Thông số chính
    width = 5000.mm
    height = 900.mm
    depth = 150.mm
    khung_size = 30.mm
    viendo = 20.mm

    # Màu sắc
    mau_nen = Sketchup::Color.new("#222222")
    mau_vang = Sketchup::Color.new("#FFD600")
    mau_cam = Sketchup::Color.new("#FFA000")
    mau_trang = Sketchup::Color.new("#FFFFFF")
    mau_den = Sketchup::Color.new("#222222")

    # 1. Khung xương sắt hộp 30x30
    khung_group = entities.add_group
    khung = khung_group.entities

    # Khung viền ngoài
    [
      [ORIGIN, [width,0,0]],
      [[width,0,0], [width,height,0]],
      [[width,height,0], [0,height,0]],
      [[0,height,0], ORIGIN],
      # Khung sâu
      [ORIGIN, [0,0,depth]],
      [[width,0,0], [width,0,depth]],
      [[width,height,0], [width,height,depth]],
      [[0,height,0], [0,height,depth]],
      # Khung sau
      [[0,0,depth], [width,0,depth]],
      [[width,0,depth], [width,height,depth]],
      [[width,height,depth], [0,height,depth]],
      [[0,height,depth], [0,0,depth]],
      # Nối các góc
      [ORIGIN, [0,0,depth]],
      [[width,0,0], [width,0,depth]],
      [[width,height,0], [width,height,depth]],
      [[0,height,0], [0,height,depth]]
    ].each do |p1, p2|
      khung.add_face(p1, [p1[0]+khung_size,p1[1],p1[2]], [p2[0]+khung_size,p2[1],p2[2]], p2).pushpull(khung_size)
    end

    # Xương đứng cách nhau 500mm
    (1..9).each do |i|
      x = i*500.mm
      next if x >= width
      khung.add_face([x,0,0], [x+khung_size,0,0], [x+khung_size,height,0], [x,height,0]).pushpull(khung_size)
    end

    # Xương ngang tăng cứng (chia 3)
    [height/3, 2*height/3].each do |y|
      khung.add_face([0,y,0], [width,y,0], [width,y+khung_size,0], [0,y+khung_size,0]).pushpull(khung_size)
    end

    # 2. Tấm nền alu mặt biển
    nen_group = entities.add_group
    nen = nen_group.entities
    face = nen.add_face([0,0,khung_size],[width,0,khung_size],[width,height,khung_size],[0,height,khung_size])
    face.pushpull(3.mm)
    nen_group.material = mau_nen

    # 3. Viền nẹp alu vàng
    vien_group = entities.add_group
    vien = vien_group.entities
    # Viền trên
    vien.add_face([0,0,khung_size+3.mm],[width,0,khung_size+3.mm],[width,viendo,khung_size+3.mm],[0,viendo,khung_size+3.mm]).pushpull(viendo)
    # Viền dưới
    vien.add_face([0,height-viendo,khung_size+3.mm],[width,height-viendo,khung_size+3.mm],[width,height,khung_size+3.mm],[0,height,khung_size+3.mm]).pushpull(viendo)
    # Viền trái
    vien.add_face([0,viendo,khung_size+3.mm],[viendo,viendo,khung_size+3.mm],[viendo,height-viendo,khung_size+3.mm],[0,height-viendo,khung_size+3.mm]).pushpull(viendo)
    # Viền phải
    vien.add_face([width-viendo,viendo,khung_size+3.mm],[width,viendo,khung_size+3.mm],[width,height-viendo,khung_size+3.mm],[width-viendo,height-viendo,khung_size+3.mm]).pushpull(viendo)
    vien_group.material = mau_vang

    # 4. Chữ nổi "LỐP 66"
    text_group = entities.add_group
    # Tạo chữ nổi 3D
    text_opts = {
      :font => "Arial Black",
      :bold => true,
      :italic => false,
      :align => TextAlignCenter,
      :extrude => 40.mm
    }
    # Vị trí chữ chính
    x_text = width*0.45
    y_text = height*0.45
    text1 = text_group.entities.add_3d_text("LỐP 66", text_opts)
    text1.transform!(Geom::Transformation.translation([x_text, y_text, khung_size+3.mm+viendo]))
    text_group.material = mau_vang

    # 5. Dòng phụ địa chỉ
    text_opts2 = text_opts.dup
    text_opts2[:extrude] = 10.mm
    text_opts2[:height] = 60.mm
    diachi = text_group.entities.add_3d_text("66 ĐINH TIÊN HOÀNG, BMT, ĐẮK LẮK", text_opts2)
    diachi.transform!(Geom::Transformation.translation([width*0.15, height*0.13, khung_size+3.mm+viendo]))
    diachi.material = mau_trang

    # 6. Số điện thoại
    sdt1 = text_group.entities.add_3d_text("0981 217 430", text_opts2)
    sdt1.transform!(Geom::Transformation.translation([width*0.65, height*0.13, khung_size+3.mm+viendo]))
    sdt1.material = mau_trang
    sdt2 = text_group.entities.add_3d_text("0914 582 952", text_opts2)
    sdt2.transform!(Geom::Transformation.translation([width*0.80, height*0.13, khung_size+3.mm+viendo]))
    sdt2.material = mau_trang

    # 7. Icon lốp xe (mô phỏng khối trụ)
    icon_group = entities.add_group
    icon1 = icon_group.entities.add_circle([width*0.13, height*0.65, khung_size+3.mm+viendo], [0,0,1], 60.mm)
    icon1f = icon_group.entities.add_face(icon1)
    icon1f.pushpull(20.mm)
    icon_group.material = mau_trang

    # 8. Logo lốp xe lớn bên trái (mô phỏng khối trụ lớn)
    logo_group = entities.add_group
    logo1 = logo_group.entities.add_circle([width*0.08, height*0.55, khung_size+3.mm+viendo], [0,0,1], 120.mm)
    logo1f = logo_group.entities.add_face(logo1)
    logo1f.pushpull(40.mm)
    logo_group.material = mau_den

    model.commit_operation
  end
end
BangHieuAluDanDecalChuNoi500X90.build