# Mã nguồn Ruby hoàn chỉnh 100%
module ChuInox304ChanChaoLed
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuInox304ChanChaoLed', true)
    entities = model.active_entities

    # Thông số cơ bản
    width = 1200.mm
    height = 400.mm
    depth_inox = 30.mm
    depth_mica = 10.mm
    depth_total = depth_inox + depth_mica

    # Màu sắc vật liệu
    inox_gold = Sketchup::Color.new("#D4AF37")
    mica_white = Sketchup::Color.new("#FFF8E1")
    led_glow = Sketchup::Color.new("#FFF8E1")
    bg_color = Sketchup::Color.new("#232323")

    # Tạo mặt phẳng nền giả lập (nếu muốn đặt chữ lên nền)
    bg_group = entities.add_group
    bg_face = bg_group.entities.add_face([0,0,0], [width,0,0], [width,height,0], [0,height,0])
    bg_face.pushpull(-5.mm)
    bg_group.material = bg_color
    bg_group.layer = "Nền"

    # Tạo chữ nổi 3D (ví dụ chữ "Ruby" dạng script)
    # Vị trí đặt chữ: căn giữa bảng
    text_main = "Ruby"
    font = "Pacifico" # hoặc font script gần giống
    text_height = 300.mm # chữ lớn, chiếm phần lớn chiều cao bảng
    text_depth = depth_inox

    # Tạo chữ inox nổi
    text_group = entities.add_group
    text_entities = text_group.entities
    # Chữ nổi inox (mặt + thành)
    text3d = text_entities.add_3d_text(
      text_main,
      TextAlignCenter,
      text_height,
      false, # không in đậm
      false, # không nghiêng
      font,
      true,  # extruded
      text_depth
    )
    # Căn giữa chữ trên bảng
    bounds = text_group.bounds
    dx = (width - bounds.width) / 2 - bounds.min.x
    dy = (height - bounds.height) / 2 - bounds.min.y
    dz = 10.mm # nổi lên khỏi nền
    text_group.transform!(Geom::Transformation.translation([dx, dy, dz + depth_mica]))
    text_group.material = inox_gold
    text_group.layer = "Chữ inox"

    # Tạo đế mica trắng sữa (hắt LED)
    # Đế mica là biên dạng chữ, dày 10mm, đặt dưới chữ inox
    # Dùng offset và pushpull để tạo đế mica
    # Lấy biên dạng đáy chữ
    text_faces = []
    text_group.entities.each do |e|
      if e.is_a?(Sketchup::Face)
        text_faces << e if (e.normal == [0,0,-1])
      end
    end
    # Tạo group đế mica
    mica_group = entities.add_group
    mica_entities = mica_group.entities
    text_faces.each do |face|
      # Copy biên dạng đáy chữ sang group mica
      new_face = mica_entities.add_face(face.vertices.map(&:position))
      new_face.pushpull(-depth_mica)
      new_face.material = mica_white
    end
    mica_group.transform!(Geom::Transformation.translation([dx, dy, dz]))
    mica_group.layer = "Đế mica"

    # Mô phỏng ánh sáng LED hắt chân (tạo viền phát sáng quanh đế mica)
    # Tạo outline lớn hơn biên dạng chữ 2mm, vật liệu màu vàng nhạt
    led_group = entities.add_group
    led_entities = led_group.entities
    text_faces.each do |face|
      # Offset biên dạng đáy chữ ra ngoài 2mm
      pts = face.vertices.map(&:position)
      # Đơn giản hóa: tạo hình chữ nhật phát sáng quanh chữ
      min = Geom::Point3d.new(pts.map(&:x).min-2.mm, pts.map(&:y).min-2.mm, dz-1.mm)
      max = Geom::Point3d.new(pts.map(&:x).max+2.mm, pts.map(&:y).max+2.mm, dz-1.mm)
      led_face = led_entities.add_face([min.x, min.y, min.z], [max.x, min.y, min.z], [max.x, max.y, min.z], [min.x, max.y, min.z])
      led_face.pushpull(-2.mm)
      led_face.material = led_glow
    end
    led_group.transform!(Geom::Transformation.translation([dx, dy, 0]))
    led_group.layer = "LED hắt chân"

    model.commit_operation
  end
end
ChuInox304ChanChaoLed.build