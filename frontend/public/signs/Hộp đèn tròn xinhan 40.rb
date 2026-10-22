# Mã nguồn Ruby hoàn chỉnh
module HopDenTronXinhan40
  def self.build
    model = Sketchup.active_model
    model.start_operation('HopDenTronXinhan40', true)
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
    frame_face.pushpull(-150.mm) # Độ dày khung
    frame_group.material = "Gray"

    # Tạo bề mặt biển
    surface_group = entities.add_group
    surface_group.name = "Bề Mặt Biển"
    surface_pts = [
      [0.mm, 0.mm, -150.mm],
      [3000.mm, 0.mm, -150.mm],
      [3000.mm, 150.mm, -150.mm],
      [0.mm, 150.mm, -150.mm]
    ]
    surface_face = surface_group.entities.add_face(surface_pts)
    surface_face.pushpull(10.mm) # Độ dày bề mặt
    surface_group.material = "White"

    # Tạo chữ nổi
    text_group = entities.add_group
    text_group.name = "Chữ Nổi"
    text = "Hộp đèn tròn xinhan 40"
    text_position = [1500.mm, 75.mm, -140.mm] # Vị trí chữ
    text_group.entities.add_3d_text(text, TextAlignCenter, text_position, 100.mm, false, false)
    text_group.material = "Red"

    # Tạo đèn LED
    led_group = entities.add_group
    led_group.name = "Đèn LED"
    led_pts = [
      [0.mm, 0.mm, -160.mm],
      [3000.mm, 0.mm, -160.mm],
      [3000.mm, 10.mm, -160.mm],
      [0.mm, 10.mm, -160.mm]
    ]
    led_face = led_group.entities.add_face(led_pts)
    led_face.pushpull(-5.mm) # Độ dày đèn LED
    led_group.material = "Yellow"

    model.commit_operation
  end
end
HopDenTronXinhan40.build