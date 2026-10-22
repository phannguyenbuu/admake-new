# Mã nguồn Ruby hoàn chỉnh
module HopDenHutNoiTron60
  def self.build
    model = Sketchup.active_model
    model.start_operation('HopDenHutNoiTron60', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_group = entities.add_group
    frame_group.name = "Khung Sắt Đỡ"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [3000.mm, 0.mm, 0.mm],
      [3000.mm, 150.mm, 0.mm],
      [0.mm, 150.mm, 0.mm]
    ]
    frame_face = frame_group.entities.add_face(frame_pts)
    frame_face.pushpull(1000.mm) # Chiều cao 1000mm
    frame_group.material = "Gray"

    # Tạo bề mặt biển
    surface_group = entities.add_group
    surface_group.name = "Bề Mặt Biển"
    surface_pts = [
      [0.mm, 0.mm, 1000.mm],
      [3000.mm, 0.mm, 1000.mm],
      [3000.mm, 150.mm, 1000.mm],
      [0.mm, 150.mm, 1000.mm]
    ]
    surface_face = surface_group.entities.add_face(surface_pts)
    surface_face.pushpull(-10.mm) # Độ dày 10mm
    surface_group.material = "White"

    # Tạo chữ nổi 3D
    text_group = entities.add_group
    text_group.name = "Chữ Nổi 3D"
    text = "Hộp đèn hút nổi tròn 60"
    text_position = [1500.mm, 75.mm, 1000.mm]
    text_entity = text_group.entities.add_text(text, text_position)
    text_group.entities.add_face(text_entity.bounds)
    text_group.entities.each { |e| e.transform!(Geom::Transformation.new([0, 0, 0])) }
    text_group.material = "Blue"

    # Tạo đèn LED
    led_group = entities.add_group
    led_group.name = "Đèn LED"
    led_pts = [
      [0.mm, 0.mm, 1010.mm],
      [3000.mm, 0.mm, 1010.mm],
      [3000.mm, 150.mm, 1010.mm],
      [0.mm, 150.mm, 1010.mm]
    ]
    led_face = led_group.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Độ dày 5mm
    led_group.material = "Yellow"

    model.commit_operation
  end
end
HopDenHutNoiTron60.build