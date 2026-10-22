# Mã nguồn Ruby hoàn chỉnh 100%
module HopDenTonRiSet45X25
  def self.build
    model = Sketchup.active_model
    model.start_operation('HopDenTonRiSet45X25', true)
    entities = model.active_entities

    # Thông số kích thước
    width = 450.mm
    height = 250.mm
    depth = 20.mm
    frame_thickness = 25.mm
    face_thickness = 2.mm
    text_main_height = 60.mm
    text_sub_height = 30.mm
    text_main_depth = 15.mm
    text_sub_depth = 8.mm

    # Màu sắc
    color_riset = Sketchup::Color.new("#6B4A2B")
    color_vang = Sketchup::Color.new("#FFD700")
    color_led = Sketchup::Color.new("#FFFACD")
    color_vien = Sketchup::Color.new("#3E2723")
    color_satk = Sketchup::Color.new("#222222")

    # 1. Khung xương sắt hộp 25x25mm
    frame_group = entities.add_group
    frame = frame_group.entities

    # 4 thanh viền ngoài
    # Trên
    frame.add_face([0,0,0], [width,0,0], [width,frame_thickness,0], [0,frame_thickness,0]).pushpull(frame_thickness)
    # Dưới
    frame.add_face([0,height-frame_thickness,0], [width,height-frame_thickness,0], [width,height,0], [0,height,0]).pushpull(frame_thickness)
    # Trái
    frame.add_face([0,frame_thickness,0], [frame_thickness,frame_thickness,0], [frame_thickness,height-frame_thickness,0], [0,height-frame_thickness,0]).pushpull(frame_thickness)
    # Phải
    frame.add_face([width-frame_thickness,frame_thickness,0], [width,frame_thickness,0], [width,height-frame_thickness,0], [width-frame_thickness,height-frame_thickness,0]).pushpull(frame_thickness)
    frame_group.material = color_satk

    # 2. Tấm nền mặt biển tôn rỉ sét
    mat_group = entities.add_group
    mat = mat_group.entities
    mat_face = mat.add_face([frame_thickness, frame_thickness, frame_thickness], 
                            [width-frame_thickness, frame_thickness, frame_thickness], 
                            [width-frame_thickness, height-frame_thickness, frame_thickness], 
                            [frame_thickness, height-frame_thickness, frame_thickness])
    mat_face.pushpull(face_thickness)
    mat_group.material = color_riset

    # 3. Viền nẹp alu/nhôm (vát cạnh)
    vien_group = entities.add_group
    vien = vien_group.entities
    vien_width = 8.mm
    # Viền trên
    vien.add_face([frame_thickness-vien_width, frame_thickness-vien_width, frame_thickness+face_thickness], 
                  [width-frame_thickness+vien_width, frame_thickness-vien_width, frame_thickness+face_thickness], 
                  [width-frame_thickness+vien_width, frame_thickness, frame_thickness+face_thickness], 
                  [frame_thickness-vien_width, frame_thickness, frame_thickness+face_thickness]).pushpull(vien_width)
    # Viền dưới
    vien.add_face([frame_thickness-vien_width, height-frame_thickness, frame_thickness+face_thickness], 
                  [width-frame_thickness+vien_width, height-frame_thickness, frame_thickness+face_thickness], 
                  [width-frame_thickness+vien_width, height-frame_thickness+vien_width, frame_thickness+face_thickness], 
                  [frame_thickness-vien_width, height-frame_thickness+vien_width, frame_thickness+face_thickness]).pushpull(vien_width)
    # Viền trái
    vien.add_face([frame_thickness-vien_width, frame_thickness, frame_thickness+face_thickness], 
                  [frame_thickness, frame_thickness, frame_thickness+face_thickness], 
                  [frame_thickness, height-frame_thickness, frame_thickness+face_thickness], 
                  [frame_thickness-vien_width, height-frame_thickness, frame_thickness+face_thickness]).pushpull(vien_width)
    # Viền phải
    vien.add_face([width-frame_thickness, frame_thickness, frame_thickness+face_thickness], 
                  [width-frame_thickness+vien_width, frame_thickness, frame_thickness+face_thickness], 
                  [width-frame_thickness+vien_width, height-frame_thickness, frame_thickness+face_thickness], 
                  [width-frame_thickness, height-frame_thickness, frame_thickness+face_thickness]).pushpull(vien_width)
    vien_group.material = color_vien

    # 4. Chữ nổi "Nhà Khế"
    text_main = entities.add_3d_text(
      "Nhà Khế",
      TextAlignCenter,
      false,
      text_main_height,
      "Arial Rounded MT Bold",
      true,
      false,
      text_main_depth
    )
    # Đặt vị trí chữ chính
    text_main_group = entities.add_group(text_main)
    text_main_group.material = color_vang
    text_main_group.move! Geom::Transformation.translation([
      width/2, 
      height/2 + 25.mm, 
      frame_thickness + face_thickness + 2.mm
    ])

    # 5. Chữ phụ "37 Nguyễn Khuyến"
    text_sub = entities.add_3d_text(
      "37 Nguyễn Khuyến",
      TextAlignCenter,
      false,
      text_sub_height,
      "Arial Rounded MT Bold",
      true,
      false,
      text_sub_depth
    )
    text_sub_group = entities.add_group(text_sub)
    text_sub_group.material = color_vang
    text_sub_group.move! Geom::Transformation.translation([
      width/2, 
      height/2 - 45.mm, 
      frame_thickness + face_thickness + 2.mm
    ])

    # 6. LED hắt sáng vàng (mô phỏng khối sáng phía sau)
    led_group = entities.add_group
    led = led_group.entities
    led_face = led.add_face(
      [frame_thickness, frame_thickness, frame_thickness-2.mm],
      [width-frame_thickness, frame_thickness, frame_thickness-2.mm],
      [width-frame_thickness, height-frame_thickness, frame_thickness-2.mm],
      [frame_thickness, height-frame_thickness, frame_thickness-2.mm]
    )
    led_face.pushpull(-4.mm)
    led_group.material = color_led
    led_group.material.alpha = 0.6

    # 7. Tai treo tường (2 tai sắt phía sau)
    tai_group = entities.add_group
    tai = tai_group.entities
    tai_width = 30.mm
    tai_height = 50.mm
    tai_thick = 3.mm
    # Tai trái
    tai.add_face(
      [-tai_thick, height/2-tai_height/2, depth/2-tai_width/2],
      [0, height/2-tai_height/2, depth/2-tai_width/2],
      [0, height/2+tai_height/2, depth/2-tai_width/2],
      [-tai_thick, height/2+tai_height/2, depth/2-tai_width/2]
    ).pushpull(tai_width)
    # Tai phải
    tai.add_face(
      [width, height/2-tai_height/2, depth/2-tai_width/2],
      [width+tai_thick, height/2-tai_height/2, depth/2-tai_width/2],
      [width+tai_thick, height/2+tai_height/2, depth/2-tai_width/2],
      [width, height/2+tai_height/2, depth/2-tai_width/2]
    ).pushpull(tai_width)
    tai_group.material = color_satk

    model.commit_operation
  end
end
HopDenTonRiSet45X25.build