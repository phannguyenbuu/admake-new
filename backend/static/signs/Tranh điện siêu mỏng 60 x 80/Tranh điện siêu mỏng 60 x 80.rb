# Mã nguồn Ruby hoàn chỉnh 100%
module TranhDienSieuMong60X80
  def self.build
    model = Sketchup.active_model
    model.start_operation('TranhDienSieuMong60X80', true)
    entities = model.active_entities

    # Thông số
    width = 600.mm
    height = 800.mm
    depth = 20.mm
    khung_size = 25.mm
    nẹp_width = 20.mm
    led_depth = 5.mm

    # Tạo nhóm tổng thể
    group = entities.add_group
    ents = group.entities

    # Khung sắt hộp (viền ngoài)
    khung = ents.add_group
    khung_ents = khung.entities
    # 4 cạnh khung
    [[0,0,0],[width,0,0],[width,height,0],[0,height,0]].each_with_index do |pt,i|
      next_pt = [[0,0,0],[width,0,0],[width,height,0],[0,height,0]][(i+1)%4]
      vec = Geom::Vector3d.new(next_pt[0]-pt[0], next_pt[1]-pt[1], 0)
      edge = khung_ents.add_face([pt, [pt[0],pt[1],khung_size], [pt[0]+vec.x,pt[1]+vec.y,khung_size], [pt[0]+vec.x,pt[1]+vec.y,0]])
      edge.pushpull(-khung_size)
    end
    khung.material = "#222222"

    # Xương tăng cứng (1 xương đứng giữa, 2 xương ngang)
    xuong = ents.add_group
    xuong_ents = xuong.entities
    # Xương đứng giữa
    x1 = width/2 - khung_size/2
    xuong_ents.add_face(
      [x1, khung_size, 0],
      [x1+khung_size, khung_size, 0],
      [x1+khung_size, height-khung_size, 0],
      [x1, height-khung_size, 0]
    ).pushpull(-khung_size)
    # Xương ngang trên/dưới
    [[height*0.33],[height*0.66]].each do |y|
      xuong_ents.add_face(
        [khung_size, y[0], 0],
        [width-khung_size, y[0], 0],
        [width-khung_size, y[0]+khung_size, 0],
        [khung_size, y[0]+khung_size, 0]
      ).pushpull(-khung_size)
    end
    xuong.material = "#222222"

    # Tai treo tường (2 tai trên)
    tai = ents.add_group
    tai_ents = tai.entities
    [[width*0.15, -khung_size/2, height+khung_size/2], [width*0.85, -khung_size/2, height+khung_size/2]].each do |x, y, z|
      tai_ents.add_face(
        [x, y, z],
        [x+khung_size, y, z],
        [x+khung_size, y, z+khung_size],
        [x, y, z+khung_size]
      ).pushpull(-khung_size/2)
    end
    tai.material = "#222222"

    # Tấm nền mica xuyên sáng (mặt biển)
    nen = ents.add_group
    nen_ents = nen.entities
    nen_face = nen_ents.add_face(
      [khung_size, khung_size, led_depth],
      [width-khung_size, khung_size, led_depth],
      [width-khung_size, height-khung_size, led_depth],
      [khung_size, height-khung_size, led_depth]
    )
    nen_face.pushpull(depth-led_depth*2)
    nen.material = "#7B5E3B" # Nền gỗ nâu (tranh giữa)

    # Viền nẹp nhôm/alu đen mờ
    nep = ents.add_group
    nep_ents = nep.entities
    # 4 cạnh viền nẹp
    [[khung_size, khung_size, depth-led_depth], [width-khung_size-nẹp_width, khung_size, depth-led_depth], [width-khung_size-nẹp_width, height-khung_size-nẹp_width, depth-led_depth], [khung_size, height-khung_size-nẹp_width, depth-led_depth]].each_with_index do |pt,i|
      next_pt = [[khung_size, khung_size, depth-led_depth], [width-khung_size-nẹp_width, khung_size, depth-led_depth], [width-khung_size-nẹp_width, height-khung_size-nẹp_width, depth-led_depth], [khung_size, height-khung_size-nẹp_width, depth-led_depth]][(i+1)%4]
      vec = Geom::Vector3d.new(next_pt[0]-pt[0], next_pt[1]-pt[1], 0)
      edge = nep_ents.add_face([pt, [pt[0],pt[1],pt[2]+nẹp_width], [pt[0]+vec.x,pt[1]+vec.y,pt[2]+nẹp_width], [pt[0]+vec.x,pt[1]+vec.y,pt[2]]])
      edge.pushpull(-nẹp_width)
    end
    nep.material = "#222222"

    # Đèn LED viền (mô phỏng khối mỏng trong khung)
    led = ents.add_group
    led_ents = led.entities
    led_face = led_ents.add_face(
      [khung_size+5.mm, khung_size+5.mm, led_depth/2],
      [width-khung_size-5.mm, khung_size+5.mm, led_depth/2],
      [width-khung_size-5.mm, height-khung_size-5.mm, led_depth/2],
      [khung_size+5.mm, height-khung_size-5.mm, led_depth/2]
    )
    led_face.pushpull(2.mm)
    led.material = "#FFFFFF"

    # Chữ nổi 3D (dùng add_3d_text)
    # Dòng: "1 KG HÀU SỮA HẤP SẢ"
    text1 = ents.add_group
    text1.entities.add_3d_text("1 KG", TextAlignCenter, "Arial Black", false, false, 60.mm, 15.mm).transform!(Geom::Transformation.new([width/2, height*0.18, depth-2.mm]))
    text1.entities.add_3d_text("HÀU SỮA", TextAlignCenter, "Arial Black", false, false, 90.mm, 30.mm).transform!(Geom::Transformation.new([width/2, height*0.28, depth-2.mm]))
    text1.entities.add_3d_text("HẤP SẢ", TextAlignCenter, "Arial Black", false, false, 65.mm, 18.mm).transform!(Geom::Transformation.new([width/2, height*0.38, depth-2.mm]))
    text1.material = "#E53935" # Đỏ tươi

    # Số lớn: "39"
    so39 = ents.add_group
    so39.entities.add_3d_text("39", TextAlignCenter, "Arial Black", false, false, 120.mm, 40.mm).transform!(Geom::Transformation.new([width*0.68, height*0.68, depth-2.mm]))
    so39.material = "#E53935"

    # Chữ phụ: "CHỈ", "XU"
    phu = ents.add_group
    phu.entities.add_3d_text("CHỈ", TextAlignCenter, "Arial", false, false, 30.mm, 10.mm).transform!(Geom::Transformation.new([width*0.68, height*0.60, depth-2.mm]))
    phu.entities.add_3d_text("XU", TextAlignCenter, "Arial", false, false, 30.mm, 10.mm).transform!(Geom::Transformation.new([width*0.68, height*0.80, depth-2.mm]))
    phu.material = "#FFFFFF"

    # Viền trắng cho chữ (mô phỏng bằng offset khối chữ phụ)
    # (Có thể dùng plugin hoặc thủ công, ở đây chỉ mô phỏng màu sắc)

    model.commit_operation
  end
end
TranhDienSieuMong60X80.build