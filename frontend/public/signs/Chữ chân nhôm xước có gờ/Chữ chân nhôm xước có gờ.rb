# Mã nguồn Ruby hoàn chỉnh 100%
module ChuChanNhomXuocCoGo
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuChanNhomXuocCoGo', true)
    entities = model.active_entities

    # Thông số bảng giả định
    width = 1200.mm
    height = 400.mm
    depth = 60.mm
    margin = 40.mm

    # Tạo nền mica trắng (nếu cần)
    base_face = entities.add_face(
      [0, 0, 0],
      [width, 0, 0],
      [width, height, 0],
      [0, height, 0]
    )
    base_face.pushpull(-5.mm)
    base = base_face.all_connected
    base.each { |e| e.material = "#FFFFFF" }

    # Tạo các chữ nổi (ví dụ: "F", "O", "C")
    # Kích thước mỗi chữ: rộng ~200mm, cao ~250mm, sâu 60mm
    char_height = 250.mm
    char_depth = 60.mm
    char_margin = 50.mm
    font = "Arial Black"
    bold = true
    italic = false

    # Vị trí các chữ (giả định 3 chữ: "F", "O", "C")
    chars = ["F", "O", "C"]
    x = margin
    y = (height - char_height) / 2

    chars.each do |ch|
      group = entities.add_group
      char_entities = group.entities
      text = char_entities.add_3d_text(
        ch,
        TextAlignLeft,
        char_height,
        char_depth,
        false,
        font,
        bold,
        italic
      )
      # Đặt vị trí chữ
      bounds = group.bounds
      group.transform!(Geom::Transformation.translation([x, y, 5.mm]))
      # Gán vật liệu vàng xước
      group.material = "#D4AF37"
      group.entities.each { |e| e.material = "#D4AF37" }
      # Tạo gờ nổi (viền quanh mặt chữ)
      # Gờ cao 2mm, rộng 5mm quanh mặt chữ
      face = nil
      group.entities.each { |e| face = e if e.is_a?(Sketchup::Face) }
      if face
        edges = face.outer_loop.edges
        offset_faces = face.offset(5.mm)
        if offset_faces
          offset_faces.each do |f|
            f.pushpull(2.mm)
            f.material = "#D4AF37"
          end
        end
      end
      # Cập nhật vị trí x cho chữ tiếp theo
      x += char_height + char_margin
    end

    model.commit_operation
  end
end
ChuChanNhomXuocCoGo.build