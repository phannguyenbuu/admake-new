# Mã nguồn Ruby hoàn chỉnh 100%
module BangMicaTenPhong20X10
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangMicaTenPhong20X10', true)
    entities = model.active_entities

    # Kích thước bảng
    width = 200.mm
    height = 100.mm
    thickness = 3.mm

    # Màu sắc
    color_blue = Sketchup::Color.new("#2B4CB2")
    color_white = Sketchup::Color.new("#FFFFFF")

    # 1. Tạo tấm mica nền
    pts = [
      [0, 0, 0],
      [width, 0, 0],
      [width, height, 0],
      [0, height, 0]
    ]
    face = entities.add_face(pts)
    face.pushpull(thickness)
    face.material = color_blue
    face.back_material = color_blue

    # 2. Tạo viền trắng mảnh bên trong (dạng decal/in UV)
    margin = 7.mm
    pts_inner = [
      [margin, margin, thickness + 0.01.mm],
      [width - margin, margin, thickness + 0.01.mm],
      [width - margin, height - margin, thickness + 0.01.mm],
      [margin, height - margin, thickness + 0.01.mm]
    ]
    face_inner = entities.add_face(pts_inner)
    face_inner.erase! if face_inner.normal.z < 0 # Xóa mặt trong nếu bị ngược
    # Vẽ 4 đoạn viền trắng
    for i in 0..3
      line = entities.add_line(pts_inner[i], pts_inner[(i+1)%4])
      line.material = color_white
      line.width = 2 # Chỉ hiển thị trong LayOut, không ảnh hưởng 3D
    end

    # 3. Tạo chữ "PHÒNG THUỐC" (dạng decal/in UV nổi trên mặt mica)
    text_group = entities.add_group
    text_entities = text_group.entities

    # Font chữ: Arial Black hoặc tương tự, in hoa, căn giữa
    text = "PHÒNG THUỐC"
    font = "Arial Black"
    text_height = 32.mm # Ước tính chiều cao chữ
    text_depth = 0.5.mm # Decal/in UV nổi nhẹ trên mặt mica

    # Tính toán vị trí căn giữa
    x_center = width / 2
    y_center = height / 2

    # Tạo chữ 3D (dạng decal nổi nhẹ)
    text3d = text_entities.add_3d_text(
      text,
      TextAlignCenter,
      text_height,
      false, # không nghiêng
      false, # không in đậm thêm
      font,
      true,  # filled
      text_depth
    )
    # Đặt chữ vào giữa bảng
    bounds = text3d.bounds
    text_width = bounds.width
    text_height_real = bounds.height
    # Di chuyển chữ vào giữa bảng
    tr = Geom::Transformation.new([
      x_center - text_width / 2,
      y_center - text_height_real / 2,
      thickness + 0.01.mm
    ])
    text_group.transform!(tr)
    text_group.material = color_white

    model.commit_operation
  end
end
BangMicaTenPhong20X10.build