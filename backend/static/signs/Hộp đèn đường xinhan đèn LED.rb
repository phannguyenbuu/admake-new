# Mã nguồn Ruby hoàn chỉnh
module HopDenDuongXinhanDenLed
  def self.build
    model = Sketchup.active_model
    model.start_operation('HopDenDuongXinhanDenLed', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [3000.mm, 0.mm, 0.mm],
      [3000.mm, 150.mm, 0.mm],
      [0.mm, 150.mm, 0.mm]
    ]
    frame_grp = entities.add_group
    frame_face = frame_grp.entities.add_face(frame_pts)
    frame_face.pushpull(100.mm) # Chiều cao khung
    frame_grp.material = "Gray"

    # Tạo bề mặt biển chính
    surface_pts = [
      [0.mm, 0.mm, 100.mm],
      [3000.mm, 0.mm, 100.mm],
      [3000.mm, 150.mm, 100.mm],
      [0.mm, 150.mm, 100.mm]
    ]
    surface_grp = entities.add_group
    surface_face = surface_grp.entities.add_face(surface_pts)
    surface_face.pushpull(10.mm) # Độ dày bề mặt
    surface_grp.material = "White"

    # Tạo chữ nổi 3D
    text_grp = entities.add_group
    text = "HỘP ĐÈN LED"
    text_position = Geom::Point3d.new(100.mm, 50.mm, 110.mm)
    text_face = text_grp.entities.add_face([text_position, text_position.offset(0, 0, 10.mm)])
    text_face.pushpull(5.mm) # Độ dày chữ
    text_grp.material = "Red"

    # Tạo đèn LED
    led_grp = entities.add_group
    led_pts = [
      [100.mm, 10.mm, 100.mm],
      [2900.mm, 10.mm, 100.mm],
      [2900.mm, 30.mm, 100.mm],
      [100.mm, 30.mm, 100.mm]
    ]
    led_face = led_grp.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Độ dày đèn LED
    led_grp.material = "Yellow"

    model.commit_operation
  end
end
HopDenDuongXinhanDenLed.build