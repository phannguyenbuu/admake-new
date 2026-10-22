# Mã nguồn Ruby hoàn chỉnh 100%
module ChuNoiMicaKhungSat
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuNoiMicaKhungSat', true)
    entities = model.active_entities

    # Kích thước tổng thể
    width = 1200.mm
    height = 400.mm
    frame_depth = 30.mm
    letter_depth = 60.mm

    # Khung sắt hộp 30x30mm
    khung_group = entities.add_group
    khung = khung_group.entities

    # Khung viền ngoài
    pts = [
      [0, 0, 0],
      [width, 0, 0],
      [width, height, 0],
      [0, height, 0]
    ]
    # 4 cạnh ngoài
    khung.add_face(pts[0], pts[1], [pts[1][0], pts[1][1], frame_depth], [pts[0][0], pts[0][1], frame_depth])
    khung.add_face(pts[1], pts[2], [pts[2][0], pts[2][1], frame_depth], [pts[1][0], pts[1][1], frame_depth])
    khung.add_face(pts[2], pts[3], [pts[3][0], pts[3][1], frame_depth], [pts[2][0], pts[2][1], frame_depth])
    khung.add_face(pts[3], pts[0], [pts[0][0], pts[0][1], frame_depth], [pts[3][0], pts[3][1], frame_depth])

    # 2 xương ngang tăng cứng
    x1 = width / 3
    x2 = 2 * width / 3
    [x1, x2].each do |x|
      khung.add_face([x, 0, 0], [x, height, 0], [x, height, frame_depth], [x, 0, frame_depth])
    end

    # 1 xương dọc giữa
    y1 = height / 2
    khung.add_face([0, y1, 0], [width, y1, 0], [width, y1, frame_depth], [0, y1, frame_depth])

    # Màu khung sắt
    mat_khung = model.materials.add('KhungSat')
    mat_khung.color = '#B0B0B0'
    khung_group.material = mat_khung

    # Dựng chữ nổi 3D: "PHÊ BUÔN", "ĐẮK LẮK", "THUỘC"
    # Vị trí tương đối trên khung
    text_data = [
      {text: "PHÊ BUÔN", x: 30.mm, y: 300.mm, height: 120.mm},
      {text: "ĐẮK LẮK", x: 30.mm, y: 170.mm, height: 90.mm},
      {text: "THUỘC", x: 30.mm, y: 70.mm, height: 90.mm}
    ]

    mat_mica_vang = model.materials.add('MicaVang')
    mat_mica_vang.color = '#FFD600'
    mat_mica_trang = model.materials.add('MicaTrang')
    mat_mica_trang.color = '#FFFFFF'

    text_data.each do |td|
      group = entities.add_group
      # Dựng từng ký tự rời, cách đều nhau
      offset_x = td[:x]
      td[:text].each_char do |char|
        next if char == " "
        letter = group.entities.add_3d_text(
          char,
          TextAlignLeft = 0,
          td[:height],
          true,
          false,
          1.0,
          false,
          0
        )
        # Đặt vị trí ký tự
        letter_group = group.entities.add_group(letter)
        letter_group.transform!(Geom::Transformation.translation([offset_x, td[:y], frame_depth]))
        # Đẩy nổi chữ
        letter_group.entities.each do |ent|
          if ent.is_a?(Sketchup::Face)
            ent.pushpull(letter_depth)
          end
        end
        # Mặt trên mica vàng
        letter_group.entities.each do |ent|
          if ent.is_a?(Sketchup::Face)
            ent.material = mat_mica_vang
            ent.back_material = mat_mica_vang
          end
        end
        # Hông chữ mica trắng
        letter_group.entities.each do |ent|
          if ent.is_a?(Sketchup::Face)
            next if ent.normal.z.abs > 0.9 # mặt trên/dưới
            ent.material = mat_mica_trang
            ent.back_material = mat_mica_trang
          end
        end
        # Tăng khoảng cách giữa các ký tự
        offset_x += td[:height] * 0.7
      end
    end

    model.commit_operation
  end
end
ChuNoiMicaKhungSat.build