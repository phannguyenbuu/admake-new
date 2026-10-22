# Mã nguồn Ruby hoàn chỉnh 100%
module TranhDienSieuMong
  def self.build
    model = Sketchup.active_model
    model.start_operation('TranhDienSieuMong', true)
    entities = model.active_entities

    # Thông số
    width = 600.mm
    height = 900.mm
    depth = 20.mm
    frame_thickness = 25.mm
    led_gap = 3.mm

    # Tạo 3 tranh điện siêu mỏng
    3.times do |i|
      group = entities.add_group
      base = group.entities

      # Khung sắt hộp (25x25mm)
      frame = base.add_group
      # 4 cạnh ngoài
      pts = [
        [0,0,0], [width,0,0], [width,height,0], [0,height,0]
      ]
      face = frame.entities.add_face(pts)
      face.pushpull(-frame_thickness)
      # Rỗng giữa
      inner_pts = [
        [frame_thickness, frame_thickness, 0],
        [width-frame_thickness, frame_thickness, 0],
        [width-frame_thickness, height-frame_thickness, 0],
        [frame_thickness, height-frame_thickness, 0]
      ]
      inner_face = frame.entities.add_face(inner_pts)
      inner_face.pushpull(-frame_thickness)

      # Tấm mica nền xuyên sáng (in UV)
      mica = base.add_group
      mica_face = mica.entities.add_face(
        [frame_thickness, frame_thickness, led_gap],
        [width-frame_thickness, frame_thickness, led_gap],
        [width-frame_thickness, height-frame_thickness, led_gap],
        [frame_thickness, height-frame_thickness, led_gap]
      )
      mica_face.pushpull(depth - 2*led_gap)
      mica.material = "#FFFFFF" # nền trắng sáng

      # Viền nẹp nhôm đen (2mm)
      nẹp = base.add_group
      nẹp_face = nẹp.entities.add_face(
        [-2.mm, -2.mm, depth],
        [width+2.mm, -2.mm, depth],
        [width+2.mm, height+2.mm, depth],
        [-2.mm, height+2.mm, depth]
      )
      nẹp_face.pushpull(2.mm)
      nẹp.material = "#222222"

      # Đèn LED viền (mô phỏng bằng khối mỏng sát viền trong)
      led = base.add_group
      led_face = led.entities.add_face(
        [frame_thickness+2.mm, frame_thickness+2.mm, led_gap+1.mm],
        [width-frame_thickness-2.mm, frame_thickness+2.mm, led_gap+1.mm],
        [width-frame_thickness-2.mm, height-frame_thickness-2.mm, led_gap+1.mm],
        [frame_thickness+2.mm, height-frame_thickness-2.mm, led_gap+1.mm]
      )
      led_face.pushpull(2.mm)
      led.material = "#FFFFFF"

      # Tai treo inox (2 cái trên)
      2.times do |j|
        tai = base.add_group
        x = width*0.2 + j*width*0.6
        tai_face = tai.entities.add_face(
          [x-7.mm, -7.mm, depth+2.mm],
          [x+7.mm, -7.mm, depth+2.mm],
          [x+7.mm, 0, depth+2.mm],
          [x-7.mm, 0, depth+2.mm]
        )
        tai_face.pushpull(-3.mm)
        tai.material = "#CCCCCC"
      end

      # Chữ nổi 3D (menu giữa và phải)
      if i == 1
        # "1 KG HÀU SỮA"
        text1 = base.add_3d_text("1 KG", TextAlignLeft, "Arial Black", false, false, 60.mm, 30.mm, 0, true, 0)
        text1_group = base.add_group(text1)
        text1_group.material = "#FFD600"
        text1_group.move!([width*0.08, height*0.82, depth+3.mm])

        text2 = base.add_3d_text("HÀU SỮA", TextAlignLeft, "Arial Black", false, false, 90.mm, 30.mm, 0, true, 0)
        text2_group = base.add_group(text2)
        text2_group.material = "#FF2D2D"
        text2_group.move!([width*0.08, height*0.74, depth+3.mm])

        text3 = base.add_3d_text("HẤP SẢ", TextAlignLeft, "Arial", false, false, 50.mm, 15.mm, 0, true, 0)
        text3_group = base.add_group(text3)
        text3_group.material = "#2ECC40"
        text3_group.move!([width*0.08, height*0.66, depth+3.mm])

        # "CHỈ 39 XU"
        text4 = base.add_3d_text("CHỈ", TextAlignLeft, "Arial", false, false, 30.mm, 10.mm, 0, true, 0)
        text4_group = base.add_group(text4)
        text4_group.material = "#FFD600"
        text4_group.move!([width*0.55, height*0.3, depth+3.mm])

        text5 = base.add_3d_text("39", TextAlignLeft, "Arial Black", false, false, 100.mm, 40.mm, 0, true, 0)
        text5_group = base.add_group(text5)
        text5_group.material = "#FF2D2D"
        text5_group.move!([width*0.62, height*0.25, depth+3.mm])

        text6 = base.add_3d_text("XU", TextAlignLeft, "Arial", false, false, 40.mm, 15.mm, 0, true, 0)
        text6_group = base.add_group(text6)
        text6_group.material = "#FFD600"
        text6_group.move!([width*0.82, height*0.28, depth+3.mm])
      elsif i == 2
        # "SỮA SỐT THÁI"
        text1 = base.add_3d_text("SỮA", TextAlignLeft, "Arial Black", false, false, 60.mm, 30.mm, 0, true, 0)
        text1_group = base.add_group(text1)
        text1_group.material = "#FFD600"
        text1_group.move!([width*0.08, height*0.82, depth+3.mm])

        text2 = base.add_3d_text("SỐT THÁI", TextAlignLeft, "Arial Black", false, false, 90.mm, 30.mm, 0, true, 0)
        text2_group = base.add_group(text2)
        text2_group.material = "#FF2D2D"
        text2_group.move!([width*0.08, height*0.74, depth+3.mm])

        text3 = base.add_3d_text("GIÒN MÁT", TextAlignLeft, "Arial", false, false, 50.mm, 15.mm, 0, true, 0)
        text3_group = base.add_group(text3)
        text3_group.material = "#FFFFFF"
        text3_group.move!([width*0.08, height*0.66, depth+3.mm])

        # "69 XU"
        text4 = base.add_3d_text("69", TextAlignLeft, "Arial Black", false, false, 100.mm, 40.mm, 0, true, 0)
        text4_group = base.add_group(text4)
        text4_group.material = "#FF2D2D"
        text4_group.move!([width*0.62, height*0.25, depth+3.mm])

        text5 = base.add_3d_text("XU", TextAlignLeft, "Arial", false, false, 40.mm, 15.mm, 0, true, 0)
        text5_group = base.add_group(text5)
        text5_group.material = "#FFD600"
        text5_group.move!([width*0.82, height*0.28, depth+3.mm])
      end

      # Dời từng tranh sang phải
      group.transform!(Geom::Transformation.translation([i*width, 0, 0]))
    end

    model.commit_operation
  end
end
TranhDienSieuMong.build