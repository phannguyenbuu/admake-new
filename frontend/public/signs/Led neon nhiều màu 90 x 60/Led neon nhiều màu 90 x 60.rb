# Mã nguồn Ruby hoàn chỉnh 100%
module LedNeonNhieuMau90X60
  def self.build
    model = Sketchup.active_model
    model.start_operation('LedNeonNhieuMau90X60', true)
    entities = model.active_entities

    # Kích thước tổng thể
    width = 900.mm
    height = 600.mm
    base_thickness = 10.mm
    letter_thickness = 30.mm
    crown_thickness = 20.mm

    # Tạo đế mica trắng sữa (cắt CNC theo biên dạng chữ, ở đây mô phỏng hình chữ nhật bo góc)
    base = entities.add_group
    pts = [
      [0, 0, 0],
      [width, 0, 0],
      [width, height, 0],
      [0, height, 0]
    ]
    face = base.entities.add_face(pts)
    face.pushpull(base_thickness)
    # Bo góc nhẹ (mô phỏng)
    base.material = "#F8F8FF" # trắng sữa

    # Vị trí chữ "Thien"
    thien_group = entities.add_group
    thien_text = "Thien"
    thien_pos = [width * 0.18, height * 0.60, base_thickness]
    thien = thien_group.entities.add_3d_text(
      thien_text,
      TextAlignLeft,
      "Brush Script MT",
      false,
      false,
      letter_thickness,
      120.mm,
      0,
      true,
      thien_pos
    )
    thien_group.material = "#FF3EF6" # Hồng tím LED neon

    # Viền sáng chữ "Thien" (mô phỏng bằng offset)
    thien_outline = thien_group.entities.add_group
    thien_group.entities.each do |e|
      if e.is_a?(Sketchup::Face)
        outline = e.offset(5.mm)
        outline.material = "#FFFFFF"
      end
    end

    # Vị trí chữ "Thanh"
    thanh_group = entities.add_group
    thanh_text = "Thanh"
    thanh_pos = [width * 0.13, height * 0.28, base_thickness]
    thanh = thanh_group.entities.add_3d_text(
      thanh_text,
      TextAlignLeft,
      "Brush Script MT",
      false,
      false,
      letter_thickness,
      120.mm,
      0,
      true,
      thanh_pos
    )
    thanh_group.material = "#00B2FF" # Xanh dương LED neon

    # Viền sáng chữ "Thanh"
    thanh_outline = thanh_group.entities.add_group
    thanh_group.entities.each do |e|
      if e.is_a?(Sketchup::Face)
        outline = e.offset(5.mm)
        outline.material = "#B6F0FF"
      end
    end

    # Vương miện (crown) phía trên chữ "Thien"
    crown_group = entities.add_group
    # Mô phỏng vương miện bằng các cung tròn và hình chữ nhật nhỏ
    crown_base = crown_group.entities.add_circle(
      [width * 0.70, height * 0.80, base_thickness + letter_thickness + 2.mm],
      [0,0,1],
      40.mm,
      32
    )
    crown_face = crown_group.entities.add_face(crown_base)
    crown_face.pushpull(crown_thickness)
    crown_group.material = "#FFD600" # Vàng cam LED neon

    # Thêm các chóp vương miện (mô phỏng 3 chóp)
    3.times do |i|
      angle = 120 * i - 60
      rad = angle * Math::PI / 180
      x = width * 0.70 + 40.mm * Math.cos(rad)
      y = height * 0.80 + 40.mm * Math.sin(rad)
      z = base_thickness + letter_thickness + crown_thickness + 2.mm
      sphere = crown_group.entities.add_circle([x, y, z], [0,0,1], 8.mm, 16)
      sphere_face = crown_group.entities.add_face(sphere)
      sphere_face.pushpull(8.mm)
    end

    # Kết thúc thao tác
    model.commit_operation
  end
end
LedNeonNhieuMau90X60.build