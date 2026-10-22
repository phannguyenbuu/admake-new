# Mã nguồn Ruby hoàn chỉnh
module BienTenCongTyInoxAnMon40X30
  def self.build
    model = Sketchup.active_model
    model.start_operation('BienTenCongTyInoxAnMon40X30', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [400.mm, 0.mm, 0.mm],
      [400.mm, 300.mm, 0.mm],
      [0.mm, 300.mm, 0.mm]
    ]
    frame_face = entities.add_face(frame_pts)
    frame_face.reverse! # Đảo mặt nếu cần
    frame_face.pushpull(20.mm) # Kéo khối lên 20mm
    frame_group = entities.add_group(frame_face)
    frame_group.material = "Gray" # Màu khung sắt

    # Tạo bề mặt biển
    surface_pts = [
      [5.mm, 5.mm, 20.mm],
      [395.mm, 5.mm, 20.mm],
      [395.mm, 295.mm, 20.mm],
      [5.mm, 295.mm, 20.mm]
    ]
    surface_face = entities.add_face(surface_pts)
    surface_face.reverse! # Đảo mặt nếu cần
    surface_face.pushpull(5.mm) # Kéo khối lên 5mm
    surface_group = entities.add_group(surface_face)
    surface_group.material = "Silver" # Màu inox

    # Tạo chữ nổi 3D
    text = "CÔNG TY ABC"
    text_group = entities.add_group
    text_entity = text_group.entities.add_3d_text(text, TextAlignCenter, "Arial", true, false, 100.mm, 0.mm, 0.mm)
    text_group.transform!(Geom::Transformation.new([100.mm, 100.mm, 25.mm])) # Đặt chữ nổi lên bề mặt
    text_group.material = "Gold" # Màu chữ

    # Tạo đèn LED viền
    led_group = entities.add_group
    led_pts = [
      [0.mm, 0.mm, 25.mm],
      [400.mm, 0.mm, 25.mm],
      [400.mm, 300.mm, 25.mm],
      [0.mm, 300.mm, 25.mm]
    ]
    led_face = led_group.entities.add_face(led_pts)
    led_face.reverse! # Đảo mặt nếu cần
    led_face.pushpull(5.mm) # Kéo khối lên 5mm
    led_group.material = "Yellow" # Màu đèn LED

    model.commit_operation
  end
end
BienTenCongTyInoxAnMon40X30.build