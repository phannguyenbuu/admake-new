# Mã nguồn Ruby hoàn chỉnh 100%
module HopDenSang5Mat
  def self.build
    model = Sketchup.active_model
    model.start_operation('HopDenSang5Mat', true)
    entities = model.active_entities

    # Thông số chính
    width = 3000.mm
    height = 1000.mm
    depth = 150.mm
    frame_size = 25.mm
    frame_color = "#222222"
    face_color = "#FAFAFA"
    text_color = "#222222"
    text_thick = 20.mm

    # 1. Khung xương sắt hộp
    frame_group = entities.add_group
    frame = frame_group.entities

    # Khung ngoài
    pts = [
      [0,0,0], [width,0,0], [width,height,0], [0,height,0]
    ]
    # 4 cạnh ngoài
    frame.add_face(pts).pushpull(-frame_size)
    frame.add_face([[0,0,depth],[width,0,depth],[width,height,depth],[0,height,depth]]).pushpull(-frame_size)
    # 4 cạnh dọc
    frame.add_face([[0,0,0],[frame_size,0,0],[frame_size,0,depth],[0,0,depth]]).pushpull(height)
    frame.add_face([[width-frame_size,0,0],[width,0,0],[width,0,depth],[width-frame_size,0,depth]]).pushpull(height)
    frame.add_face([[0,height-frame_size,0],[width, height-frame_size,0],[width, height-frame_size,depth],[0,height-frame_size,depth]]).pushpull(frame_size)
    frame.add_face([[0,0,0],[width,0,0],[width,frame_size,0],[0,frame_size,0]]).pushpull(depth)
    # Xương đứng (cách nhau ~500mm)
    (1..5).each do |i|
      x = i * width / 6
      frame.add_face([[x,0,frame_size],[x,0,depth-frame_size],[x,height,depth-frame_size],[x,height,frame_size]]).pushpull(frame_size)
    end
    # Xương ngang tăng cứng
    (1..2).each do |i|
      y = i * height / 3
      frame.add_face([[0,y,frame_size],[width,y,frame_size],[width,y,depth-frame_size],[0,y,depth-frame_size]]).pushpull(frame_size)
    end

    # Tô màu khung
    frame_group.material = frame_color

    # 2. Tấm nền mặt biển (mica trắng sữa)
    face_group = entities.add_group
    face = face_group.entities
    face_pts = [
      [frame_size, frame_size, depth-frame_size],
      [width-frame_size, frame_size, depth-frame_size],
      [width-frame_size, height-frame_size, depth-frame_size],
      [frame_size, height-frame_size, depth-frame_size]
    ]
    face_face = face.add_face(face_pts)
    face_face.pushpull(-3.mm) # Độ dày mica
    face_group.material = face_color

    # 3. Viền nẹp alu trắng sữa (bo quanh mặt biển)
    border_group = entities.add_group
    border = border_group.entities
    border_width = 15.mm
    # 4 cạnh viền
    [
      [[frame_size-border_width, frame_size-border_width, depth-frame_size+0.1], [width-frame_size+border_width, frame_size-border_width, depth-frame_size+0.1], [width-frame_size+border_width, frame_size+border_width, depth-frame_size+0.1], [frame_size-border_width, frame_size+border_width, depth-frame_size+0.1]],
      [[frame_size-border_width, height-frame_size-border_width, depth-frame_size+0.1], [width-frame_size+border_width, height-frame_size-border_width, depth-frame_size+0.1], [width-frame_size+border_width, height-frame_size+border_width, depth-frame_size+0.1], [frame_size-border_width, height-frame_size+border_width, depth-frame_size+0.1]],
      [[frame_size-border_width, frame_size-border_width, depth-frame_size+0.1], [frame_size+border_width, frame_size-border_width, depth-frame_size+0.1], [frame_size+border_width, height-frame_size+border_width, depth-frame_size+0.1], [frame_size-border_width, height-frame_size+border_width, depth-frame_size+0.1]],
      [[width-frame_size-border_width, frame_size-border_width, depth-frame_size+0.1], [width-frame_size+border_width, frame_size-border_width, depth-frame_size+0.1], [width-frame_size+border_width, height-frame_size+border_width, depth-frame_size+0.1], [width-frame_size-border_width, height-frame_size+border_width, depth-frame_size+0.1]]
    ].each do |bpts|
      border.add_face(bpts).pushpull(5.mm)
    end
    border_group.material = face_color

    # 4. Chữ nổi "SUE BRIDAL" (mica đen)
    text_group = entities.add_group
    text = text_group.entities
    font = "Arial Black"
    text_height = 220.mm
    text_thick = 20.mm
    text_string = "SUE BRIDAL"
    # Tính toán vị trí căn giữa
    text_width = 1800.mm # ước lượng chiều dài dòng chữ
    text_x = (width - text_width) / 2
    text_y = height / 2 - text_height / 2
    text_z = depth - frame_size - 3.mm + 0.5.mm

    text.add_3d_text(
      text_string,
      TextAlignCenter,
      false,
      text_height,
      text_thick,
      font,
      false,
      false,
      [text_x + text_width/2, text_y + text_height/2, text_z]
    )
    text_group.material = text_color

    # 5. LED mô phỏng (khối nhỏ trong hộp, không hiển thị ngoài)
    # Bỏ qua vì không thấy rõ trong ảnh

    model.commit_operation
  end
end
HopDenSang5Mat.build