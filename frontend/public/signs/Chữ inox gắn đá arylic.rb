# Mã nguồn Ruby hoàn chỉnh 100%
module ChuInoxGanDaArylic
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuInoxGanDaArylic', true)
    entities = model.active_entities

    # Thông số
    width = 1200.mm
    height = 400.mm
    depth = 60.mm
    khung_satt = 25.mm

    # 1. Khung xương sắt hộp (ẩn phía sau, mô phỏng đơn giản)
    khung_group = entities.add_group
    khung = khung_group.entities
    # Khung viền ngoài
    khung.add_face([0,0,0],[width,0,0],[width,height,0],[0,height,0]).pushpull(-khung_satt)
    # Xương đứng
    khung.add_face([width/2-khung_satt/2,0,0],[width/2+khung_satt/2,0,0],[width/2+khung_satt/2,height,0],[width/2-khung_satt/2,height,0]).pushpull(-khung_satt)
    # Xương ngang
    khung.add_face([0,height/2-khung_satt/2,0],[width,height/2-khung_satt/2,0],[width,height/2+khung_satt/2,0],[0,height/2+khung_satt/2,0]).pushpull(-khung_satt)
    khung_group.name = "Khung xương sắt hộp"

    # 2. Tấm nền bảng hiệu (tường/alu composite)
    nen_group = entities.add_group
    nen = nen_group.entities
    nen_face = nen.add_face([0,0,0],[width,0,0],[width,height,0],[0,height,0])
    nen_face.pushpull(depth)
    nen_group.name = "Tấm nền bảng hiệu"
    nen_group.material = "#F5E9D7"

    # 3. Viền nẹp (giả lập viền alu mỏng)
    vien_group = entities.add_group
    vien = vien_group.entities
    vien_face = vien.add_face([-5.mm,-5.mm,0],[width+5.mm,-5.mm,0],[width+5.mm,height+5.mm,0],[-5.mm,height+5.mm,0])
    hole = vien.add_face([0,0,0],[width,0,0],[width,height,0],[0,height,0])
    hole.erase!
    vien_face.pushpull(10.mm)
    vien_group.material = "#F5E9D7"
    vien_group.name = "Viền nẹp alu"

    # 4. Chữ nổi inox vàng gắn đá acrylic: "DÈNI MAISON"
    text_group = entities.add_group
    text_group.name = "Chữ nổi inox vàng"
    font = "Arial Black"
    text_height = 120.mm
    text_depth = 40.mm
    text_string = "DÈNI MAISON"
    # Tính toán căn giữa
    text_width = 900.mm # ước lượng chiều dài dòng chữ
    x0 = (width - text_width) / 2
    y0 = (height - text_height) / 2 + 30.mm

    # Tạo từng ký tự nổi, cách đều nhau
    chars = text_string.chars
    char_spacing = text_width / chars.size
    chars.each_with_index do |char, i|
      next if char == " "
      char_entities = text_group.entities.add_3d_text(
        char,
        TextAlignLeft,
        text_height,
        true,
        false,
        text_depth
      )
      # Đặt vị trí ký tự
      tr = Geom::Transformation.translation([
        x0 + i * char_spacing,
        y0,
        depth + 2.mm
      ])
      char_entities.transform!(tr)
      # Gán màu vàng ánh kim
      char_entities.material = "#FFD700"
      char_entities.back_material = "#FFD700"
    end

    # 5. Đèn trần (mô phỏng vị trí, không chi tiết)
    den_group = entities.add_group
    den = den_group.entities
    den_face = den.add_circle([width/2, height+30.mm, depth+10.mm], [0,0,1], 30.mm)
    den_face = den.add_face(den_face)
    den_face.pushpull(10.mm)
    den_group.material = "#FFFACD"
    den_group.name = "Đèn trần chiếu sáng"

    model.commit_operation
  end
end
ChuInoxGanDaArylic.build