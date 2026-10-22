# Mã nguồn Ruby hoàn chỉnh 100%
module ChuChanNhomKhongGo
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuChanNhomKhongGo', true)
    entities = model.active_entities

    # Thông số chữ
    letter = "B"
    width = 1200.mm
    height = 400.mm
    depth = 60.mm
    face_color = "#FFFFFF" # Mica trắng
    side_color = "#B0BEC5" # Nhôm xước bạc

    # Tạo nhóm chữ nổi
    group = entities.add_group
    gents = group.entities

    # Vẽ mặt chữ bằng 3D Text
    text = gents.add_3d_text(
      letter,
      TextAlignLeft,
      "Arial Black",
      height,
      false, # không in nghiêng
      false, # không in đậm (Arial Black đã đậm)
      depth # Độ dày khối chữ
    )

    # Đặt vị trí chữ tại gốc toạ độ
    bounds = group.bounds
    min = bounds.min
    tr = Geom::Transformation.new([-min.x, -min.y, 0])
    group.transform!(tr)

    # Đặt màu mặt chữ (mặt trước)
    faces = []
    group.entities.grep(Sketchup::Face) { |f| faces << f if f.normal.z > 0.9 }
    faces.each { |f| f.material = face_color }

    # Đặt màu chân chữ (cạnh bên)
    group.entities.grep(Sketchup::Face) do |f|
      if (f.normal.z.abs < 0.1)
        f.material = side_color
      end
    end

    # Đặt tên nhóm
    group.name = "Chu chan nhom khong go"

    model.commit_operation
  end
end
ChuChanNhomKhongGo.build