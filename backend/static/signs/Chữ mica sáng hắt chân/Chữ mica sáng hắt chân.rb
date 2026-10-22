# Mã nguồn Ruby hoàn chỉnh 100%
module ChuMicaSangHatChan
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuMicaSangHatChan', true)
    entities = model.active_entities

    # Thông số kích thước
    width = 1200.mm
    height = 400.mm
    depth = 60.mm
    frame_thickness = 25.mm
    alu_thickness = 3.mm
    border_width = 10.mm
    border_height = depth
    text_thickness = 30.mm
    led_glow_offset = 5.mm

    # Màu sắc
    color_alu = Sketchup::Color.new("#F5F5F5")
    color_frame = Sketchup::Color.new("#222222")
    color_border = Sketchup::Color.new("#E0E0E0")
    color_text = Sketchup::Color.new("#FFFFFF")
    color_text_edge = Sketchup::Color.new("#222222")
    color_led = Sketchup::Color.new("#FFD700")

    # 1. Khung xương sắt hộp 25x25mm
    frame_group = entities.add_group
    frame = frame_group.entities
    # Viền ngoài
    [
      [0,0,0], [width,0,0], [width,height,0], [0,height,0]
    ].each_with_index do |pt, i|
      next_pt = [
        [width,0,0], [width,height,0], [0,height,0], [0,0,0]
      ][i]
      frame.add_face(pt, [pt[0]+frame_thickness, pt[1], pt[2]], [next_pt[0]+frame_thickness, next_pt[1], next_pt[2]], next_pt)
      edge = frame.add_line(pt, next_pt)
      edge.find_faces
    end
    # Xương đứng tăng cứng
    frame.add_face([width/2-frame_thickness/2,0,0], [width/2+frame_thickness/2,0,0], [width/2+frame_thickness/2,height,0], [width/2-frame_thickness/2,height,0])
    # Xương ngang tăng cứng
    frame.add_face([0,height/2-frame_thickness/2,0], [width,height/2-frame_thickness/2,0], [width,height/2+frame_thickness/2,0], [0,height/2+frame_thickness/2,0])
    frame_group.material = color_frame

    # 2. Tấm nền alu composite
    alu_group = entities.add_group
    alu_face = alu_group.entities.add_face(
      [frame_thickness, frame_thickness, alu_thickness],
      [width-frame_thickness, frame_thickness, alu_thickness],
      [width-frame_thickness, height-frame_thickness, alu_thickness],
      [frame_thickness, height-frame_thickness, alu_thickness]
    )
    alu_face.pushpull(-alu_thickness)
    alu_group.material = color_alu

    # 3. Viền nẹp alu/nhôm
    border_group = entities.add_group
    # 4 cạnh viền
    [
      [[0,0,0],[width,0,0]],
      [[width,0,0],[width,height,0]],
      [[width,height,0],[0,height,0]],
      [[0,height,0],[0,0,0]]
    ].each do |start_pt, end_pt|
      edge = border_group.entities.add_line(start_pt, end_pt)
      face = border_group.entities.add_face(
        start_pt,
        [start_pt[0], start_pt[1], border_height],
        [end_pt[0], end_pt[1], border_height],
        end_pt
      )
      face.pushpull(border_width)
    end
    border_group.material = color_border

    # 4. Chữ nổi 3D "Highcut Vintage"
    text_group = entities.add_group
    text_string = "Highcut Vintage"
    text_height = 120.mm
    text_pos_x = width/2 - 300.mm
    text_pos_y = height/2 - 60.mm
    text_pos_z = alu_thickness + 2.mm

    text = text_group.entities.add_3d_text(
      text_string,
      TextAlignCenter,
      text_height,
      false,
      true,
      text_thickness
    )
    # Di chuyển chữ vào vị trí giữa biển
    tr = Geom::Transformation.new([text_pos_x, text_pos_y, text_pos_z])
    text_group.transform!(tr)
    text_group.material = color_text
    text_group.entities.each do |e|
      if e.is_a?(Sketchup::Face)
        e.material = color_text
        e.back_material = color_text
      end
    end

    # 5. Viền chữ (edge) màu đen
    text_group.entities.each do |e|
      if e.is_a?(Sketchup::Edge)
        e.material = color_text_edge
      end
    end

    # 6. LED hắt chân (mô phỏng ánh sáng vàng dưới chân chữ)
    led_group = entities.add_group
    led_face = led_group.entities.add_face(
      [text_pos_x, text_pos_y, alu_thickness],
      [text_pos_x+600.mm, text_pos_y, alu_thickness],
      [text_pos_x+600.mm, text_pos_y+120.mm, alu_thickness],
      [text_pos_x, text_pos_y+120.mm, alu_thickness]
    )
    led_face.pushpull(-led_glow_offset)
    led_group.material = color_led
    led_group.material.alpha = 0.3

    model.commit_operation
  end
end
ChuMicaSangHatChan.build