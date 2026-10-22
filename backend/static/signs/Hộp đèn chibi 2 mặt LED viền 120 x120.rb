# Mã nguồn Ruby hoàn chỉnh
module HopDenChibi2MatLedVien120X120
  def self.build
    model = Sketchup.active_model
    model.start_operation('HopDenChibi2MatLedVien120X120', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    grp_frame = entities.add_group
    grp_frame.name = "Khung Sắt Đỡ"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [1200.mm, 0.mm, 0.mm],
      [1200.mm, 1200.mm, 0.mm],
      [0.mm, 1200.mm, 0.mm]
    ]
    frame_face = grp_frame.entities.add_face(frame_pts)
    frame_face.pushpull(30.mm) # Độ dày khung
    grp_frame.material = "Gray"

    # Tạo bề mặt biển
    grp_surface = entities.add_group
    grp_surface.name = "Bề Mặt Biển"
    surface_pts = [
      [0.mm, 0.mm, 30.mm],
      [1200.mm, 0.mm, 30.mm],
      [1200.mm, 1200.mm, 30.mm],
      [0.mm, 1200.mm, 30.mm]
    ]
    surface_face = grp_surface.entities.add_face(surface_pts)
    surface_face.pushpull(-30.mm) # Độ dày bề mặt
    grp_surface.material = "White"

    # Tạo chữ nổi 3D
    grp_text = entities.add_group
    grp_text.name = "Chữ Nổi"
    text_height = 10.mm
    text_depth = 5.mm
    text_pts = [
      [100.mm, 100.mm, 30.mm],
      [200.mm, 100.mm, 30.mm],
      [200.mm, 100.mm + text_height, 30.mm],
      [100.mm, 100.mm + text_height, 30.mm]
    ]
    text_face = grp_text.entities.add_face(text_pts)
    text_face.pushpull(text_depth) # Độ dày chữ nổi
    grp_text.material = "Red"

    # Tạo đèn LED viền
    grp_led = entities.add_group
    grp_led.name = "Đèn LED Viền"
    led_pts = [
      [0.mm, 0.mm, 35.mm],
      [1200.mm, 0.mm, 35.mm],
      [1200.mm, 1200.mm, 35.mm],
      [0.mm, 1200.mm, 35.mm]
    ]
    led_face = grp_led.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Độ dày đèn LED
    grp_led.material = "Yellow"

    model.commit_operation
  end
end
HopDenChibi2MatLedVien120X120.build