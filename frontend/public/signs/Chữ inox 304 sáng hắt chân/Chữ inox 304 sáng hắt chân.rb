# Mã nguồn Ruby hoàn chỉnh 100%
module ChuInox304SangHatChan
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuInox304SangHatChan', true)
    entities = model.active_entities

    # Thông số chữ nổi
    text = "THANH"
    font = "Arial Black"
    height = 400.mm
    extrusion = 40.mm
    color_inox = Sketchup::Color.new("#222222") # Inox đen gương
    color_led = Sketchup::Color.new("#FFD700")  # Ánh sáng vàng LED

    # Tạo nhóm chữ nổi
    group_text = entities.add_group
    # Tạo chữ nổi 3D
    text_entities = group_text.entities
    # Đặt chữ ở gốc toạ độ, căn giữa theo chiều dài 1200mm
    x_offset = -600.mm
    y_offset = 0
    z_offset = 0

    # Tạo chữ nổi 3D
    text3d = text_entities.add_3d_text(
      text,
      TextAlignCenter,
      height,
      extrusion,
      false, # không tô viền
      font,
      true,  # in hoa
      false  # không in nghiêng
    )
    # Di chuyển chữ về đúng vị trí
    bb = group_text.bounds
    center = Geom::Point3d.new(
      x_offset - bb.width / 2,
      y_offset,
      z_offset
    )
    group_text.move!(center - bb.corner(0))

    # Tô màu mặt chữ inox đen gương
    group_text.material = color_inox
    group_text.material.alpha = 1.0
    group_text.back_material = color_inox

    # Tạo hiệu ứng hắt sáng chân chữ (LED vàng)
    # Dùng một khối mỏng dưới chân chữ, lớn hơn chữ một chút
    led_group = entities.add_group
    led_entities = led_group.entities
    led_offset = 10.mm # LED hắt rộng ra ngoài chữ 10mm
    bb = group_text.bounds
    pt1 = [bb.min.x - led_offset, bb.min.y - led_offset, bb.min.z - 2.mm]
    pt2 = [bb.max.x + led_offset, bb.min.y - led_offset, bb.min.z - 2.mm]
    pt3 = [bb.max.x + led_offset, bb.max.y + led_offset, bb.min.z - 2.mm]
    pt4 = [bb.min.x - led_offset, bb.max.y + led_offset, bb.min.z - 2.mm]
    face = led_entities.add_face(pt1, pt2, pt3, pt4)
    face.pushpull(-2.mm)
    led_group.material = color_led
    led_group.material.alpha = 0.5 # Độ trong suốt để mô phỏng ánh sáng

    # Đưa nhóm LED xuống dưới chữ một chút
    led_group.move!([0, 0, -2.mm])

    model.commit_operation
  end
end
ChuInox304SangHatChan.build