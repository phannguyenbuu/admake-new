# Mã nguồn Ruby hoàn chỉnh 100%
module ChuInox304GanNenDa
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuInox304GanNenDa', true)
    entities = model.active_entities

    # === Kích thước tổng thể ===
    width = 1200.mm
    height = 400.mm
    depth = 60.mm

    # === Khung xương sắt hộp 30x30mm ===
    frame_thick = 30.mm
    frame = entities.add_group
    fw = width
    fh = height
    fd = frame_thick

    # Khung viền ngoài
    pts = [
      [0,0,0], [fw,0,0], [fw,fh,0], [0,fh,0]
    ]
    face = frame.entities.add_face(pts)
    face.pushpull(-fd)
    # Xương đứng
    frame.entities.add_face([fw/2-frame_thick/2,0,0],[fw/2+frame_thick/2,0,0],[fw/2+frame_thick/2,fh,0],[fw/2-frame_thick/2,fh,0]).pushpull(-fd)
    # Xương ngang tăng cứng
    frame.entities.add_face([0,fh/2-frame_thick/2,0],[fw,fh/2-frame_thick/2,0],[fw,fh/2+frame_thick/2,0],[0,fh/2+frame_thick/2,0]).pushpull(-fd)
    # Tai treo tường (2 bên)
    tai1 = frame.entities.add_group
    tai1.entities.add_face([fw/10, -fd, fh/2-20.mm],[fw/10+20.mm, -fd, fh/2-20.mm],[fw/10+20.mm, -fd, fh/2+20.mm],[fw/10, -fd, fh/2+20.mm]).pushpull(-8.mm)
    tai2 = frame.entities.add_group
    tai2.entities.add_face([fw-fw/10-20.mm, -fd, fh/2-20.mm],[fw-fw/10, -fd, fh/2-20.mm],[fw-fw/10, -fd, fh/2+20.mm],[fw-fw/10-20.mm, -fd, fh/2+20.mm]).pushpull(-8.mm)

    # === Tấm nền đá granite đen ===
    nen = entities.add_group
    nen_pts = [
      [0,0,fd], [fw,0,fd], [fw,fh,fd], [0,fh,fd]
    ]
    nen_face = nen.entities.add_face(nen_pts)
    nen_face.pushpull(30.mm)
    # Màu đá granite đen ánh xám
    mat_nen = model.materials.add('GraniteDen')
    mat_nen.color = Sketchup::Color.new('#23272A')
    nen.material = mat_nen
    nen_face.back_material = mat_nen

    # === Viền đá granite xám nhạt (bo cạnh) ===
    vien = entities.add_group
    vien_w = 20.mm
    # Viền trên
    vien.entities.add_face([-vien_w,-vien_w,fd+30.mm],[fw+vien_w,-vien_w,fd+30.mm],[fw+vien_w,0,fd+30.mm],[0,0,fd+30.mm]).pushpull(20.mm)
    # Viền dưới
    vien.entities.add_face([-vien_w,fh,fd+30.mm],[fw+vien_w,fh,fd+30.mm],[fw+vien_w,fh+vien_w,fd+30.mm],[0,fh+vien_w,fd+30.mm]).pushpull(20.mm)
    # Viền trái
    vien.entities.add_face([-vien_w,0,fd+30.mm],[-vien_w,fh,fd+30.mm],[0,fh,fd+30.mm],[0,0,fd+30.mm]).pushpull(20.mm)
    # Viền phải
    vien.entities.add_face([fw,0,fd+30.mm],[fw,fh,fd+30.mm],[fw+vien_w,fh,fd+30.mm],[fw+vien_w,0,fd+30.mm]).pushpull(20.mm)
    mat_vien = model.materials.add('GraniteXam')
    mat_vien.color = Sketchup::Color.new('#B0AFAF')
    vien.material = mat_vien

    # === Logo/biểu tượng (3 ô vuông) ===
    logo_group = entities.add_group
    logo_size = 90.mm
    logo_gap = 15.mm
    logo_z = fd+30.mm+8.mm
    # Quốc kỳ Việt Nam
    flag_vn = logo_group.entities.add_face([fw/2-logo_size-logo_gap, fh-logo_size-30.mm, logo_z],
                                           [fw/2-logo_gap, fh-logo_size-30.mm, logo_z],
                                           [fw/2-logo_gap, fh-30.mm, logo_z],
                                           [fw/2-logo_size-logo_gap, fh-30.mm, logo_z])
    flag_vn.pushpull(5.mm)
    mat_vn = model.materials.add('FlagVN')
    mat_vn.color = Sketchup::Color.new('#E41C23')
    flag_vn.material = mat_vn
    # Sao vàng
    star = logo_group.entities.add_group
    star_center = Geom::Point3d.new((fw/2-logo_size/2-logo_gap), fh-logo_size/2-30.mm, logo_z+2.mm)
    r1 = 22.mm
    r2 = 9.mm
    pts = []
    5.times do |i|
      angle1 = Math::PI/2 + i*2*Math::PI/5
      angle2 = angle1 + Math::PI/5
      pts << Geom::Point3d.new(star_center.x + r1*Math.cos(angle1), star_center.y + r1*Math.sin(angle1), star_center.z)
      pts << Geom::Point3d.new(star_center.x + r2*Math.cos(angle2), star_center.y + r2*Math.sin(angle2), star_center.z)
    end
    star_face = star.entities.add_face(pts)
    mat_star = model.materials.add('StarVN')
    mat_star.color = Sketchup::Color.new('#FFD600')
    star_face.material = mat_star
    star_face.pushpull(2.mm)

    # Logo Sejin F&S
    logo_sejin = logo_group.entities.add_face([fw/2-logo_size/2, fh-logo_size-30.mm, logo_z],
                                              [fw/2+logo_size/2, fh-logo_size-30.mm, logo_z],
                                              [fw/2+logo_size/2, fh-30.mm, logo_z],
                                              [fw/2-logo_size/2, fh-30.mm, logo_z])
    logo_sejin.pushpull(5.mm)
    mat_sejin = model.materials.add('LogoSejin')
    mat_sejin.color = Sketchup::Color.new('#FFFFFF')
    logo_sejin.material = mat_sejin
    # Chữ xanh lá
    logo_group.entities.add_3d_text('sejin F&S', TextAlignCenter, 'Arial Black', false, false, 12.mm, 2.mm, logo_z+5.mm, true, [fw/2, fh-logo_size/2-30.mm+10.mm, logo_z+5.mm]).each do |e|
      e.material = Sketchup::Color.new('#8BC34A')
    end

    # Quốc kỳ Hàn Quốc
    flag_kr = logo_group.entities.add_face([fw/2+logo_gap, fh-logo_size-30.mm, logo_z],
                                           [fw/2+logo_size+logo_gap, fh-logo_size-30.mm, logo_z],
                                           [fw/2+logo_size+logo_gap, fh-30.mm, logo_z],
                                           [fw/2+logo_gap, fh-30.mm, logo_z])
    flag_kr.pushpull(5.mm)
    mat_kr = model.materials.add('FlagKR')
    mat_kr.color = Sketchup::Color.new('#FFFFFF')
    flag_kr.material = mat_kr
    # Vòng tròn đỏ/xanh
    kr_center = Geom::Point3d.new(fw/2+logo_size/2+logo_gap, fh-logo_size/2-30.mm, logo_z+2.5.mm)
    kr_r = 20.mm
    kr_circle = logo_group.entities.add_circle(kr_center, [0,0,1], kr_r)
    kr_face = logo_group.entities.add_face(kr_circle)
    kr_face.material = Sketchup::Color.new('#E41C23')
    kr_face.pushpull(2.mm)
    kr_circle2 = logo_group.entities.add_circle(kr_center, [0,0,1], kr_r/2)
    kr_face2 = logo_group.entities.add_face(kr_circle2)
    kr_face2.material = Sketchup::Color.new('#0066B3')
    kr_face2.pushpull(2.mm)
    # (Các sọc đen bỏ qua do mô phỏng đơn giản)

    # === Chữ nổi inox vàng gương ===
    text_group = entities.add_group
    # Dòng chính
    text_main = text_group.entities.add_3d_text(
      'SEJIN F&S VINA', TextAlignCenter, 'Arial Black', false, false, 90.mm, 40.mm, fd+30.mm+60.mm, true, [fw/2, fh/2+35.mm, fd+30.mm+10.mm]
    )
    mat_inox = model.materials.add('InoxVang')
    mat_inox.color = Sketchup::Color.new('#FFD700')
    text_main.each { |e| e.material = mat_inox }
    # Dòng phụ
    text_sub1 = text_group.entities.add_3d_text(
      'CÔNG TY TNHH SEJIN F&S VINA MST: 0400 48359', TextAlignCenter, 'Arial', false, false, 28.mm, 18.mm, fd+30.mm+10.mm, true, [fw/2, fh/2-10.mm, fd+30.mm+5.mm]
    )
    text_sub1.each { |e| e.material = mat_inox }
    text_sub2 = text_group.entities.add_3d_text(
      'LÔ CN1, KCN HÒA KHÁNH, XÃ CAM AN, TP. LẠNG SƠN, TỈNH LẠNG SƠN', TextAlignCenter, 'Arial', false, false, 24.mm, 18.mm, fd+30.mm+10.mm, true, [fw/2, fh/2-35.mm, fd+30.mm+5.mm]
    )
    text_sub2.each { |e| e.material = mat_inox }

    model.commit_operation
  end
end
ChuInox304GanNenDa.build