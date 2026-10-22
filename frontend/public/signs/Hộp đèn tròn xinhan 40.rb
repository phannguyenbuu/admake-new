# Mã nguồn Ruby hoàn chỉnh 100%
module HopDenTronXinhan40
  def self.build
    model = Sketchup.active_model
    model.start_operation('HopDenTronXinhan40', true)
    ents = model.active_entities

    # === Thông số chính ===
    dia = 400.mm
    radius = dia / 2
    depth = 120.mm
    frame_thick = 25.mm
    rim_width = 40.mm
    text_thick_main = 30.mm
    text_thick_sub = 15.mm

    # === Khung xương sắt hộp ===
    frame_group = ents.add_group
    frame_ents = frame_group.entities

    # Vòng tròn khung sắt hộp (2 mặt trước/sau)
    [0, depth - frame_thick].each do |z|
      circle = frame_ents.add_circle([0, 0, z], [0, 0, 1], radius - frame_thick / 2, 64)
      frame_ents.add_face(circle)
    end

    # Thanh nối xương ngang (4 thanh chia đều)
    4.times do |i|
      angle = i * Math::PI / 2
      x = Math.cos(angle) * (radius - frame_thick / 2)
      y = Math.sin(angle) * (radius - frame_thick / 2)
      p1 = [x, y, 0]
      p2 = [x, y, depth - frame_thick]
      frame_ents.add_line(p1, p2)
      # Tạo thanh hộp 25x25 nối 2 mặt
      vec = Geom::Vector3d.new(x, y, 0)
      tr = Geom::Transformation.translation(vec)
      box = frame_ents.add_group
      box.entities.add_face([0, -frame_thick/2, 0], [0, frame_thick/2, 0], [0, frame_thick/2, depth], [0, -frame_thick/2, depth])
      box.entities.grep(Sketchup::Face).each { |f| f.pushpull(frame_thick) }
      box.transform!(Geom::Transformation.rotation([0,0,0], [0,0,1], angle))
      box.transform!(Geom::Transformation.translation([0,0,0]))
      box.transform!(tr)
    end

    # === Tai treo/cần đỡ ===
    # Thanh sắt hộp 25x25, dài 200mm, gắn bên trái hộp
    arm_group = ents.add_group
    arm_ents = arm_group.entities
    arm_len = 200.mm
    arm_face = arm_ents.add_face([-(radius+frame_thick), -frame_thick/2, depth/2-frame_thick/2],
                                [-(radius+frame_thick), frame_thick/2, depth/2-frame_thick/2],
                                [-(radius+frame_thick), frame_thick/2, depth/2+frame_thick/2],
                                [-(radius+frame_thick), -frame_thick/2, depth/2+frame_thick/2])
    arm_face.pushpull(-arm_len)
    # Plate gắn tường (40x120mm)
    plate = arm_ents.add_face([-(radius+frame_thick+arm_len), -20.mm, depth/2-60.mm],
                             [-(radius+frame_thick+arm_len), 20.mm, depth/2-60.mm],
                             [-(radius+frame_thick+arm_len), 20.mm, depth/2+60.mm],
                             [-(radius+frame_thick+arm_len), -20.mm, depth/2+60.mm])
    plate.pushpull(5.mm)

    # === Thân hộp đèn tròn (mặt mica + viền alu) ===
    # Mặt mica trắng (2 mặt)
    [0, depth].each do |z|
      face = ents.add_circle([0,0,z], [0,0,1], radius, 128)
      f = ents.add_face(face)
      f.material = "#FFFFFF"
      f.back_material = "#FFFFFF"
    end

    # Viền alu đen (bao quanh)
    rim_group = ents.add_group
    rim_ents = rim_group.entities
    rim_face = rim_ents.add_circle([0,0,0], [0,0,1], radius, 128)
    rim_hole = rim_ents.add_circle([0,0,0], [0,0,1], radius - rim_width, 128)
    rim = rim_ents.add_face(rim_face)
    rim.erase_inner_loop(rim_hole)
    rim.pushpull(depth)
    rim.material = "#222222"

    # === Nội dung chữ nổi 3D và icon/logo ===
    text_group = ents.add_group
    text_ents = text_group.entities

    # Logo xe hơi cách điệu (dạng khối cong, mô phỏng bằng 2 đường cong đỏ/đen)
    # Đen
    logo_curve1 = text_ents.add_arc([0, 60.mm, depth+1.mm], [1,0,0], [0,1,0], 120.mm, 0, Math::PI, 24)
    logo_face1 = text_ents.add_face(logo_curve1)
    logo_face1.pushpull(3.mm)
    logo_face1.material = "#222222"
    # Đỏ
    logo_curve2 = text_ents.add_arc([0, 50.mm, depth+1.5.mm], [1,0,0], [0,1,0], 100.mm, 0, Math::PI, 24)
    logo_face2 = text_ents.add_face(logo_curve2)
    logo_face2.pushpull(3.mm)
    logo_face2.material = "#E53935"

    # Dòng "DETAILING"
    text_ents.add_3d_text("DETAILING", TextAlignCenter, "Arial Black", false, false, 40.mm, 0, text_thick_sub).transform!(Geom::Transformation.translation([0, 30.mm, depth+2.mm]))
    text_ents.grep(Sketchup::ComponentInstance).last.material = "#222222"

    # Dòng "THANH HẰNG"
    text_ents.add_3d_text("THANH HẰNG", TextAlignCenter, "Arial Black", false, false, 48.mm, 0, text_thick_main).transform!(Geom::Transformation.translation([0, -10.mm, depth+2.mm]))
    text_ents.grep(Sketchup::ComponentInstance).last.material = "#E53935"

    # Các dịch vụ (icon + chữ)
    # Icon mô phỏng bằng hình vuông nhỏ, chữ nổi đỏ
    icons_y = [-50.mm, -70.mm, -90.mm]
    services = ["RỬA XE", "THAY NHỚT", "NƯỚC GIẢI KHÁT"]
    services.each_with_index do |txt, i|
      # Icon
      icon = text_ents.add_face([-60.mm, icons_y[i], depth+2.mm], [-50.mm, icons_y[i], depth+2.mm],
                                [-50.mm, icons_y[i]+10.mm, depth+2.mm], [-60.mm, icons_y[i]+10.mm, depth+2.mm])
      icon.pushpull(5.mm)
      icon.material = "#E53935"
      # Text
      t = text_ents.add_3d_text(txt, TextAlignLeft, "Arial Black", false, false, 22.mm, 0, text_thick_sub)
      t.transform!(Geom::Transformation.translation([-40.mm, icons_y[i], depth+2.mm]))
      text_ents.grep(Sketchup::ComponentInstance).last.material = "#E53935"
    end

    # Chân biển đỏ (hình quạt tròn dưới cùng)
    wedge_group = ents.add_group
    wedge_ents = wedge_group.entities
    wedge_face = wedge_ents.add_arc([0,0,depth+1.5.mm], [1,0,0], [0,1,0], radius, Math::PI, 2*Math::PI, 64)
    wedge_face2 = wedge_ents.add_arc([0,0,depth+1.5.mm], [1,0,0], [0,1,0], 0, Math::PI, 2*Math::PI, 64)
    wedge = wedge_ents.add_face(wedge_face + wedge_face2.reverse)
    wedge.pushpull(10.mm)
    wedge.material = "#E53935"

    # "CHĂM SÓC XE" (trắng, trên nền đỏ)
    t1 = text_ents.add_3d_text("CHĂM SÓC XE", TextAlignCenter, "Arial Black", false, false, 28.mm, 0, text_thick_sub)
    t1.transform!(Geom::Transformation.translation([0, -120.mm, depth+12.mm]))
    text_ents.grep(Sketchup::ComponentInstance).last.material = "#FFFFFF"

    # "CHUYÊN NGHIỆP" (trắng, nhỏ hơn)
    t2 = text_ents.add_3d_text("CHUYÊN NGHIỆP", TextAlignCenter, "Arial", false, false, 16.mm, 0, text_thick_sub)
    t2.transform!(Geom::Transformation.translation([0, -140.mm, depth+12.mm]))
    text_ents.grep(Sketchup::ComponentInstance).last.material = "#FFFFFF"

    model.commit_operation
  end
end
HopDenTronXinhan40.build