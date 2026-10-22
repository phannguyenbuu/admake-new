# Mã nguồn Ruby hoàn chỉnh 100%
module BanHieuLedVienSangMat60X80
  def self.build
    model = Sketchup.active_model
    model.start_operation('BanHieuLedVienSangMat60X80', true)
    entities = model.active_entities

    # Thông số kích thước
    width = 600.mm
    height = 800.mm
    depth = 20.mm
    khung_size = 25.mm
    viền_nẹp = 20.mm
    radius = 40.mm

    # ======= Khung xương sắt hộp =======
    khung_group = entities.add_group
    khung = khung_group.entities

    # Khung ngoài
    pts = [
      [0,0,0], [width,0,0], [width,height,0], [0,height,0]
    ]
    khung_face = khung.add_face(pts)
    khung_face.pushpull(-khung_size)
    # Xương đứng giữa
    khung.add_face(
      [width/2-khung_size/2,0,0],
      [width/2+khung_size/2,0,0],
      [width/2+khung_size/2,height,0],
      [width/2-khung_size/2,height,0]
    ).pushpull(-khung_size)
    # Xương ngang tăng cứng (trên/dưới)
    khung.add_face(
      [0,khung_size,0],
      [width,khung_size,0],
      [width,khung_size+khung_size,0],
      [0,khung_size+khung_size,0]
    ).pushpull(-khung_size)
    khung.add_face(
      [0,height-khung_size*2,0],
      [width,height-khung_size*2,0],
      [width,height-khung_size,0],
      [0,height-khung_size,0]
    ).pushpull(-khung_size)
    # Chân đế đứng
    chan_de = khung.add_group
    chan_de.entities.add_face(
      [width/2-20.mm, -50.mm, -khung_size],
      [width/2+20.mm, -50.mm, -khung_size],
      [width/2+20.mm, 0, -khung_size],
      [width/2-20.mm, 0, -khung_size]
    ).pushpull(-25.mm)
    khung_group.material = "#222222"

    # ======= Tấm nền alu composite =======
    nen_group = entities.add_group
    nen = nen_group.entities
    # Bo góc
    nen_face = nen.add_face(
      Geom::Point3d.new(viền_nẹp,viền_nẹp,khung_size),
      Geom::Point3d.new(width-viền_nẹp,viền_nẹp,khung_size),
      Geom::Point3d.new(width-viền_nẹp,height-viền_nẹp,khung_size),
      Geom::Point3d.new(viền_nẹp,height-viền_nẹp,khung_size)
    )
    nen_face.pushpull(depth)
    nen_group.material = "#181A20"

    # ======= Viền nẹp alu bo cạnh =======
    vien_group = entities.add_group
    vien = vien_group.entities
    # 4 cạnh viền
    vien.add_face(
      [0,0,khung_size+depth],
      [width,0,khung_size+depth],
      [width,viền_nẹp,khung_size+depth],
      [0,viền_nẹp,khung_size+depth]
    ).pushpull(viền_nẹp)
    vien.add_face(
      [0,height-viền_nẹp,khung_size+depth],
      [width,height-viền_nẹp,khung_size+depth],
      [width,height,khung_size+depth],
      [0,height,khung_size+depth]
    ).pushpull(viền_nẹp)
    vien.add_face(
      [0,viền_nẹp,khung_size+depth],
      [viền_nẹp,viền_nẹp,khung_size+depth],
      [viền_nẹp,height-viền_nẹp,khung_size+depth],
      [0,height-viền_nẹp,khung_size+depth]
    ).pushpull(viền_nẹp)
    vien.add_face(
      [width-viền_nẹp,viền_nẹp,khung_size+depth],
      [width,viền_nẹp,khung_size+depth],
      [width,height-viền_nẹp,khung_size+depth],
      [width-viền_nẹp,height-viền_nẹp,khung_size+depth]
    ).pushpull(viền_nẹp)
    vien_group.material = "#C0C0C0"

    # ======= LED viền sáng =======
    led_group = entities.add_group
    led = led_group.entities
    led_radius = 3.mm
    led_spacing = 35.mm
    # LED trên viền (4 cạnh)
    (viền_nẹp+led_spacing).step(width-viền_nẹp-led_spacing, led_spacing) do |x|
      led.add_circle([x,viền_nẹp/2,khung_size+depth+viền_nẹp/2], [0,0,1], led_radius)
      led.entities[-1].material = "#B5E3FF"
      led.add_circle([x,height-viền_nẹp/2,khung_size+depth+viền_nẹp/2], [0,0,1], led_radius)
      led.entities[-1].material = "#B5E3FF"
    end
    (viền_nẹp+led_spacing).step(height-viền_nẹp-led_spacing, led_spacing) do |y|
      led.add_circle([viền_nẹp/2,y,khung_size+depth+viền_nẹp/2], [0,0,1], led_radius)
      led.entities[-1].material = "#B5E3FF"
      led.add_circle([width-viền_nẹp/2,y,khung_size+depth+viền_nẹp/2], [0,0,1], led_radius)
      led.entities[-1].material = "#B5E3FF"
    end

    # ======= Chữ nổi 3D =======
    # "Hương Giang"
    text1_group = entities.add_group
    text1 = text1_group.entities
    text1.add_3d_text(
      "Hương Giang",
      TextAlignCenter,
      "Arial",
      false,
      false,
      80.mm,
      30.mm,
      0,
      true,
      0
    ).each { |e| e.material = "#FFFFFF" }
    text1_group.transform!(Geom::Transformation.translation([width/2, height-220.mm, khung_size+depth+2.mm]))

    # "Cà Phê"
    text2_group = entities.add_group
    text2 = text2_group.entities
    text2.add_3d_text(
      "Cà Phê",
      TextAlignCenter,
      "Arial",
      true,
      false,
      65.mm,
      25.mm,
      0,
      true,
      0
    ).each { |e| e.material = "#FFC300" }
    text2_group.transform!(Geom::Transformation.translation([width/2, height-350.mm, khung_size+depth+2.mm]))

    # "Bên Suối"
    text3_group = entities.add_group
    text3 = text3_group.entities
    text3.add_3d_text(
      "Bên Suối",
      TextAlignCenter,
      "Arial",
      true,
      false,
      65.mm,
      25.mm,
      0,
      true,
      0
    ).each { |e| e.material = "#FFC300" }
    text3_group.transform!(Geom::Transformation.translation([width/2, height-420.mm, khung_size+depth+2.mm]))

    # ======= Địa chỉ (nền trắng, chữ đen) =======
    diachi_group = entities.add_group
    diachi = diachi_group.entities
    diachi_width = 350.mm
    diachi_height = 55.mm
    diachi_radius = 25.mm
    # Nền bo góc
    diachi_face = diachi.add_face(
      [width/2-diachi_width/2, 40.mm, khung_size+depth+1.mm],
      [width/2+diachi_width/2, 40.mm, khung_size+depth+1.mm],
      [width/2+diachi_width/2, 40.mm+diachi_height, khung_size+depth+1.mm],
      [width/2-diachi_width/2, 40.mm+diachi_height, khung_size+depth+1.mm]
    )
    diachi_face.pushpull(10.mm)
    diachi_group.material = "#F5F5F5"
    # Chữ địa chỉ
    text4_group = diachi_group.entities.add_group
    text4 = text4_group.entities
    text4.add_3d_text(
      "21 Nguyễn Tuân",
      TextAlignCenter,
      "Arial",
      false,
      false,
      30.mm,
      8.mm,
      0,
      true,
      0
    ).each { |e| e.material = "#222222" }
    text4_group.transform!(Geom::Transformation.translation([diachi_width/2, diachi_height/2, 10.mm]))

    model.commit_operation
  end
end
BanHieuLedVienSangMat60X80.build