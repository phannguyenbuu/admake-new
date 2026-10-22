# ==============================================================================
# BẢNG THỐNG KÊ CẤU KIỆN & BÓC TÁCH VẬT TƯ THI CÔNG CHI TIẾT (BOM)
# Dự án: Mô hình 3D từ mã SketchUp
# Phân loại: MINI | Kích thước: 0.5m (Dài) x 0.1m (Cao) x 0.37m (Sâu) • Diện tích: 0.05 m²
# Tổng số cấu kiện kết cấu: 11 hạng mục
# Tự động đánh giá & lập trình bởi: ADMAKE AI Structural Engineering Studio
# ------------------------------------------------------------------------------
# STT | Tên Cấu Kiện                      | Kích Thước (Quy Cách)             | SL   | ĐVT    | Đơn Giá (VNĐ) | Thành Tiền (VNĐ)
# ------------------------------------------------------------------------------
#   1 | Móng bê tông cốt thép chịu lực   | 1 hố móng (1.0m x 1.0m x sâu 1.2 |    1 | hố móng |     2.800.000 |        2.800.000
#   2 | Bản mã thép & Bu lông neo móng   | Bản mã 250x250x16mm + 8 Bu lông  |    1 | bộ      |       850.000 |          850.000
#   3 | Trụ thép tròn chịu lực chính Ø20 | Thép ống đúc Ø200mm x L=4.0m, độ |    1 | cây trụ |     4.200.000 |        4.200.000
#   4 | Khung xương giàn sắt hộp (Sắt hộ | Đan xương nan caro nhịp 1.2m, tổ |    1 | cây (6m |       185.000 |          185.000
#   5 | Thanh giằng xéo tăng cứng chống  | Sắt hộp vuông 25x25x1.2mm đan ch |    2 | cây (6m |       145.000 |          290.000
#   6 | Mặt bảng tấm ốp Alu Alcorest 3mm | 0.5m x 0.4m (Diện tích thiết kế: |  0.2 | m²      |       650.000 |          130.000
#   7 | Nẹp viền nhôm định hình V25 bo g | V nhôm 25x25mm bọc kín 4 cạnh vi |    1 | cây (3m |        45.000 |           45.000
#   8 | Tôn mạ màu chống thấm bảo vệ mặt | Tôn kẽm mạ màu 0.35mm che kín mặ |  0.2 | m²      |        95.000 |           19.000
#   9 | Bộ chữ nổi 3D thương hiệu phát s | Khổ bộ chữ 0.35m x 0.14m, mặt Mi |    1 | bộ      |     2.200.000 |        2.200.000
#  10 | Cần đỡ & Đèn pha LED chiếu rọi n | 2 cần vươn 1.2m + Đèn pha LED 50 |    2 | bộ      |       480.000 |          960.000
#  11 | Vật tư phụ & Phụ kiện liên kết c | Que hàn, ốc vít tự khoan, silico |    1 | gói kho |       350.000 |          350.000
# ------------------------------------------------------------------------------
# THÔNG SỐ DỰ TRÙ VẬN HÀNH & LOGISTICS (AI STRUCTURAL ESTIMATE)
# 1. Nhân công sản xuất & lắp đặt: 4 công (Đơn giá: 400.000 đ/công)
# 2. Cự ly vận chuyển công trình: 15 km (Đơn giá: 15.000 đ/km)
# 3. % Hao hụt vật tư: 5%
# 4. Trọng lượng vận chuyển: 50 kg
# 5. Kích thước đóng gói: 0.5m × 0.1m × 0.20m (nguyên kiện)
# 6. Đề xuất loại xe sử dụng: Xe tải nhẹ 1.25 - 1.9 tấn (thùng dài 3.2m)
# ------------------------------------------------------------------------------
# TỔNG DỰ TOÁN VẬT TƯ BÓC TÁCH: 12.029.000 VNĐ
# Hướng dẫn: Mở SketchUp -> Extensions -> Ruby Console -> Dán mã này và Enter
# ==============================================================================

# ============================================================
# 3D GOLD LED CHANNEL LETTERS - DEL
# SketchUp Ruby API
# Units: mm
# Features:
# - 3D extruded lettering
# - Mirror gold sidewalls
# - Amber illuminated front faces
# - LED-like perforation details
# - Individual groups for each letter
# ============================================================

module GoldLEDLetters
  extend self

  MODEL_NAME = "DEL_GOLD_LED_3D"

  # Dimensions (mm)
  LETTER_HEIGHT = 500.mm
  LETTER_DEPTH  = 100.mm
  SIDE_THICKNESS = 2.mm
  BORDER_WIDTH = 12.mm
  LED_RADIUS = 5.mm
  LED_SPACING = 25.mm
  LETTER_GAP = 35.mm

  def material(model, name, color, alpha = 1.0)
    mat = model.materials[name] || model.materials.add(name)
    mat.color = Sketchup::Color.new(*color)
    mat.alpha = alpha
    mat
  end

  def assign_materials(entities, front_mat, gold_mat)
    entities.each do |entity|
      next unless entity.is_a?(Sketchup::Face)

      entity.material =
        entity.normal.z > 0.8 ? front_mat : gold_mat

      entity.back_material = gold_mat
    end
  end

  def add_led_dot(entities, center, radius, mat)
    circle = entities.add_circle(
      center,
      Z_AXIS,
      radius,
      12
    )

    face = entities.add_face(circle)
    return unless face

    face.material = mat
    face.back_material = mat
  end

  def create_letter(model, character, x_position,
                    front_mat, gold_mat, led_mat)

    group = model.active_entities.add_group
    group.name = "LETTER_#{character}"

    entities = group.entities

    # Create extruded 3D text
    success = entities.add_3d_text(
      character,
      TextAlignCenter = 1,
      "Arial Black",
      true,
      false,
      LETTER_HEIGHT,
      0.5.mm,
      0,
      true,
      LETTER_DEPTH
    )

    unless success
      group.erase!
      return nil
    end

    # Apply gold and amber materials
    assign_materials(entities, front_mat, gold_mat)

    # Bounding box
    bounds = group.bounds
    min_x = bounds.min.x
    min_y = bounds.min.y
    min_z = bounds.min.z

    # Place the letter on the baseline
    group.transform!(
      Geom::Transformation.translation(
        Geom::Vector3d.new(
          x_position - min_x,
          -min_y,
          -min_z
        )
      )
    )

    # LED detail along the front perimeter approximation
    # The dots are placed around the outer bounding box.
    bounds = group.bounds
    z_front = bounds.max.z + 1.mm

    x0 = bounds.min.x
    x1 = bounds.max.x
    y0 = bounds.min.y
    y1 = bounds.max.y

    # Top and bottom rows
    x = x0 + LED_SPACING
    while x < x1 - LED_SPACING
      add_led_dot(
        model.active_entities,
        [x, y0, z_front],
        LED_RADIUS,
        led_mat
      )

      add_led_dot(
        model.active_entities,
        [x, y1, z_front],
        LED_RADIUS,
        led_mat
      )

      x += LED_SPACING
    end

    # Left and right rows
    y = y0 + LED_SPACING
    while y < y1 - LED_SPACING
      add_led_dot(
        model.active_entities,
        [x0, y, z_front],
        LED_RADIUS,
        led_mat
      )

      add_led_dot(
        model.active_entities,
        [x1, y, z_front],
        LED_RADIUS,
        led_mat
      )

      y += LED_SPACING
    end

    group
  end

  def build
    model = Sketchup.active_model

    model.start_operation(
      "Create Gold LED 3D Letters",
      true
    )

    begin
      # Materials
      gold = material(
        model,
        "Gold_Mirror",
        [184, 134, 45]
      )

      amber = material(
        model,
        "Amber_Illuminated_Face",
        [255, 166, 20]
      )

      led = material(
        model,
        "Warm_White_LED",
        [255, 230, 130]
      )

      # Root group
      root = model.active_entities.add_group
      root.name = MODEL_NAME

      # Temporarily make root active for creating children
      model.active_entities.add_group

      # Build individual characters
      cursor = 0.0
      letters = ["D", "E", "L"]

      letters.each do |character|
        letter = root.entities.add_group
        letter.name = "LETTER_#{character}"

        result = letter.entities.add_3d_text(
          character,
          1,
          "Arial Black",
          true,
          false,
          LETTER_HEIGHT,
          0.5.mm,
          0,
          true,
          LETTER_DEPTH
        )

        if result
          assign_materials(
            letter.entities,
            amber,
            gold
          )

          bb = letter.bounds

          letter.transform!(
            Geom::Transformation.translation(
              Geom::Vector3d.new(
                cursor - bb.min.x,
                -bb.min.y,
                -bb.min.z
              )
            )
          )

          # Add luminous dots around each letter.
          bb = letter.bounds
          z = bb.max.z + 1.mm

          # Top and bottom rows
          px = bb.min.x + LED_SPACING

          while px < bb.max.x - LED_SPACING
            dot_group = root.entities.add_group
            c = dot_group.entities.add_circle(
              [px, bb.min.y, z],
              Z_AXIS,
              LED_RADIUS,
              12
            )

            f = dot_group.entities.add_face(c)
            if f
              f.material = led
              f.back_material = led
            end

            px += LED_SPACING
          end

          cursor += bb.width + LETTER_GAP
        end
      end

      # Remove the accidental empty group if present.
      model.active_entities.each do |entity|
        if entity.is_a?(Sketchup::Group) &&
           entity.entities.empty? &&
           entity != root
          entity.erase!
        end
      end

      model.selection.clear
      model.selection.add(root)
      model.active_view.zoom_extents

      model.commit_operation

      UI.messagebox(
        "Da tao mo hinh DEL 3D!\n" \
        "Chieu cao chu: 500 mm\n" \
        "Do day: 100 mm\n" \
        "Vat lieu: Gold + Amber LED"
      )

    rescue => e
      model.abort_operation
      UI.messagebox(
        "Loi tao mo hinh:\n#{e.message}\n#{e.backtrace.first}"
      )
    end
  end
end

GoldLEDLetters.build