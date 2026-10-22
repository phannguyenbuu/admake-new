# Mã nguồn Ruby hoàn chỉnh 100%
module ChuMicaUonNoiFomDenLed
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuMicaUonNoiFomDenLed', true)
    entities = model.active_entities

    # Thông số tổng thể
    width = 1200.mm
    height = 400.mm
    depth = 60.mm

    # Tạo nhóm chữ nổi
    group = entities.add_group
    gents = group.entities

    # Tạo mặt chữ "B"
    b_face = gents.add_3d_text(
      "B",
      TextAlignLeft,
      "Arial Black",
      false, # Bold
      false, # Italic
      350.mm, # Chiều cao chữ
      0, # Độ nghiêng
      true, # Filled
      0
    )
    b_group = gents.add_group(b_face)
    b_group.move! Geom::Transformation.new([100.mm, 25.mm, 0])
    # Đẩy nổi chữ "B"
    b_group.entities.each do |e|
      if e.is_a?(Sketchup::Face)
        e.pushpull(depth)
      end
    end

    # Tạo mặt chữ "L"
    l_face = gents.add_3d_text(
      "L",
      TextAlignLeft,
      "Arial Black",
      false,
      false,
      350.mm,
      0,
      true,
      0
    )
    l_group = gents.add_group(l_face)
    l_group.move! Geom::Transformation.new([600.mm, 25.mm, 0])
    # Đẩy nổi chữ "L"
    l_group.entities.each do |e|
      if e.is_a?(Sketchup::Face)
        e.pushpull(depth)
      end
    end

    # Tô màu mặt chữ (mica xanh lá)
    green = model.materials.add('MicaGreen')
    green.color = '#39FF14'
    [b_group, l_group].each do |letter_group|
      letter_group.entities.each do |e|
        if e.is_a?(Sketchup::Face)
          # Mặt trên cùng
          if e.normal.z > 0.9
            e.material = green
          end
        end
      end
    end

    # Tô màu thành chữ (xám đậm)
    gray = model.materials.add('MicaGray')
    gray.color = '#3A3A3A'
    [b_group, l_group].each do |letter_group|
      letter_group.entities.each do |e|
        if e.is_a?(Sketchup::Face)
          # Thành bên
          if e.normal.z.abs < 0.1
            e.material = gray
          end
        end
      end
    end

    # Mô phỏng đèn LED (tạo khối mỏng bên trong chữ)
    led_mat = model.materials.add('LEDGlow')
    led_mat.color = '#BFFF00'
    led_mat.alpha = 0.4
    [b_group, l_group].each do |letter_group|
      letter_group.entities.each do |e|
        if e.is_a?(Sketchup::Face)
          # Mặt trên cùng
          if e.normal.z > 0.9
            led_face = e
            led = gents.add_face(led_face.vertices.map(&:position))
            led.pushpull(-5.mm)
            led.material = led_mat
          end
        end
      end
    end

    # Đặt nhóm chữ vào vị trí giữa bảng (nếu cần)
    group.move! Geom::Transformation.new([0, 0, 0])

    model.commit_operation
  end
end
ChuMicaUonNoiFomDenLed.build