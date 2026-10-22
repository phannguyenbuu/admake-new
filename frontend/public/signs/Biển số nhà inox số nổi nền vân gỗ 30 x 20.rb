# Mã nguồn Ruby hoàn chỉnh 100%
module BienSoNhaInoxSoNoiNenVanGo30X20
  def self.build
    model = Sketchup.active_model
    model.start_operation('BienSoNhaInoxSoNoiNenVanGo30X20', true)
    entities = model.active_entities

    # Thông số chính
    width = 300.mm
    height = 200.mm
    depth = 20.mm
    border_thickness = 5.mm
    border_depth = 20.mm
    steel_frame = 25.mm
    steel_offset = 5.mm

    # Màu sắc
    color_wood = Sketchup::Color.new("#A97C50")
    color_gold = Sketchup::Color.new("#FFD700")
    color_black = Sketchup::Color.new("#111111")

    # 1. Khung xương sắt hộp phía sau (ẩn, mô phỏng)
    frame_group = entities.add_group
    frame = frame_group.entities
    # Khung ngoài
    frame.add_face([steel_offset, steel_offset, -steel_frame],
                   [width-steel_offset, steel_offset, -steel_frame],
                   [width-steel_offset, height-steel_offset, -steel_frame],
                   [steel_offset, height-steel_offset, -steel_frame]).pushpull(steel_frame)
    # Xương ngang tăng cứng
    frame.add_face([width/2-steel_frame/2, steel_offset, -steel_frame],
                   [width/2+steel_frame/2, steel_offset, -steel_frame],
                   [width/2+steel_frame/2, height-steel_offset, -steel_frame],
                   [width/2-steel_frame/2, height-steel_offset, -steel_frame]).pushpull(steel_frame)
    # Xương dọc tăng cứng
    frame.add_face([steel_offset, height/2-steel_frame/2, -steel_frame],
                   [width-steel_offset, height/2-steel_frame/2, -steel_frame],
                   [width-steel_offset, height/2+steel_frame/2, -steel_frame],
                   [steel_offset, height/2+steel_frame/2, -steel_frame]).pushpull(steel_frame)

    # 2. Tấm nền vân gỗ (alu/mica/gỗ)
    base_group = entities.add_group
    base_face = base_group.entities.add_face([0,0,0],[width,0,0],[width,height,0],[0,height,0])
    base_face.pushpull(-depth)
    base_group.material = color_wood

    # 3. Viền nẹp nhôm/inox vàng gương
    border_group = entities.add_group
    # Trên
    border_group.entities.add_face([0,0,0],[width,0,0],[width,border_thickness,0],[0,border_thickness,0]).pushpull(-border_depth)
    # Dưới
    border_group.entities.add_face([0,height-border_thickness,0],[width,height-border_thickness,0],[width,height,0],[0,height,0]).pushpull(-border_depth)
    # Trái
    border_group.entities.add_face([0,border_thickness,0],[border_thickness,border_thickness,0],[border_thickness,height-border_thickness,0],[0,height-border_thickness,0]).pushpull(-border_depth)
    # Phải
    border_group.entities.add_face([width-border_thickness,border_thickness,0],[width,border_thickness,0],[width,height-border_thickness,0],[width-border_thickness,height-border_thickness,0]).pushpull(-border_depth)
    border_group.material = color_gold

    # 4. Nền vàng gương phía dưới chữ (cao 60mm, sát đáy)
    gold_base_height = 60.mm
    gold_base_group = entities.add_group
    gold_base_face = gold_base_group.entities.add_face(
      [border_thickness, border_thickness, 0],
      [width-border_thickness, border_thickness, 0],
      [width-border_thickness, gold_base_height+border_thickness, 0],
      [border_thickness, gold_base_height+border_thickness, 0]
    )
    gold_base_face.pushpull(-depth+1.mm)
    gold_base_group.material = color_gold
    gold_base_group.move!([0, height-gold_base_height-border_thickness, 0])

    # 5. Số nổi inox vàng gương "28"
    text_group = entities.add_group
    text_height = 60.mm
    text_depth = 20.mm
    text = text_group.entities.add_3d_text(
      "28",
      TextAlignCenter,
      "Arial Black",
      false,
      false,
      text_height,
      text_depth,
      0,
      true,
      0.0
    )
    # Căn giữa trên nền
    bounds = text_group.bounds
    x_offset = (width - (bounds.max.x-bounds.min.x))/2 - bounds.min.x
    y_offset = height - border_thickness - text_height - 10.mm
    text_group.move!([x_offset, y_offset, depth])
    text_group.material = color_gold

    # 6. Chữ nổi đen "PI NĂNG TẮC"
    text2_group = entities.add_group
    text2_height = 25.mm
    text2_depth = 3.mm
    text2 = text2_group.entities.add_3d_text(
      "PI NĂNG TẮC",
      TextAlignCenter,
      "Arial Black",
      false,
      false,
      text2_height,
      text2_depth,
      0,
      true,
      0.0
    )
    # Căn giữa trên nền vàng gương
    bounds2 = text2_group.bounds
    x2_offset = (width - (bounds2.max.x-bounds2.min.x))/2 - bounds2.min.x
    y2_offset = height - gold_base_height - border_thickness + (gold_base_height-text2_height)/2
    text2_group.move!([x2_offset, y2_offset, depth])
    text2_group.material = color_black

    model.commit_operation
  end
end
BienSoNhaInoxSoNoiNenVanGo30X20.build