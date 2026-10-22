# Mã nguồn Ruby hoàn chỉnh 100%
module ChuNoiMicaChanFomex
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuNoiMicaChanFomex', true)
    entities = model.active_entities

    # Thông số tổng thể
    width = 1200.mm
    height = 400.mm
    letter_thickness = 23.mm # Mica 3mm + Fomex 20mm

    # Vị trí xuất phát để căn giữa bộ chữ trên mặt phẳng
    start_x = 0
    start_y = 0
    base_z = 0

    # Dòng chữ chính: "THẢO MIN"
    # Font: Arial Black (hoặc font sans-serif nét dày tương tự)
    font = "Arial Black"
    letter_height = 180.mm
    letter_spacing = 30.mm

    # Nội dung từng chữ (chia thành 2 dòng)
    lines = ["THẢO", "MIN"]

    # Tính tổng chiều dài dòng chữ để căn giữa
    def self.get_line_width(text, font, height)
      Sketchup.active_model.entities.add_3d_text(text, {
        "Font" => font,
        "Bold" => true,
        "Italic" => false,
        "Height" => height,
        "Align" => TextAlignLeft,
        "Tolerance" => 0.0,
        "Filled" => true
      }).bounds.width
    end

    # Màu sắc
    mica_color = Sketchup::Color.new("#FFFFFF") # Mặt mica trắng sữa
    fomex_color = Sketchup::Color.new("#F8F8F8") # Chân fomex trắng

    # Dựng từng dòng chữ
    y_offset = 0
    lines.each_with_index do |line, idx|
      # Tạo 3D text cho dòng này
      group = entities.add_group
      text = group.entities.add_3d_text(line, {
        "Font" => font,
        "Bold" => true,
        "Italic" => false,
        "Height" => letter_height,
        "Align" => TextAlignCenter,
        "Tolerance" => 0.0,
        "Filled" => true
      })

      # Căn giữa dòng chữ
      bounds = group.bounds
      x_center = start_x + width / 2
      y_center = start_y + height / 2

      # Dịch chuyển dòng chữ đến vị trí phù hợp
      # Dòng 1 ở trên, dòng 2 ở dưới, cách nhau 40mm
      line_y = y_center + (lines.size == 2 ? (idx == 0 ? 60.mm : -60.mm) : 0)
      group.transform!(Geom::Transformation.translation([
        x_center - (bounds.min.x + bounds.width / 2),
        line_y - (bounds.min.y + bounds.height / 2),
        base_z
      ]))

      # Đùn nổi chân fomex trước (20mm)
      group.entities.each do |ent|
        if ent.is_a?(Sketchup::Face)
          ent.pushpull(20.mm)
          ent.material = fomex_color
          ent.back_material = fomex_color
        end
      end

      # Đùn nổi mặt mica (3mm) trên cùng
      # Lấy mặt trên cùng của mỗi chữ, đùn thêm 3mm
      faces = group.entities.grep(Sketchup::Face).select { |f| f.normal.z > 0 }
      faces.each do |face|
        # Tạo nhóm mặt mica riêng biệt
        mica_group = group.entities.add_group(face.all_connected)
        mica_group.entities.each do |ent|
          if ent.is_a?(Sketchup::Face)
            ent.pushpull(3.mm)
            ent.material = mica_color
            ent.back_material = mica_color
          end
        end
        # Đưa nhóm mica lên trên cùng
        mica_group.transform!(Geom::Transformation.translation([0, 0, 20.mm]))
      end
    end

    model.commit_operation
  end
end
ChuNoiMicaChanFomex.build