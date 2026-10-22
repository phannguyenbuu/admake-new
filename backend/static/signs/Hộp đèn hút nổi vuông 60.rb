# Mã nguồn Ruby hoàn chỉnh
module HopDenHutNoiVuong60
  def self.build
    model = Sketchup.active_model
    model.start_operation('HopDenHutNoiVuong60', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    grp_frame = entities.add_group
    grp_frame.name = "Khung Sắt Đỡ"
    frame_pts = [
      [0, 0, 0],
      [3000.mm, 0, 0],
      [3000.mm, 150.mm, 0],
      [0, 150.mm, 0]
    ]
    frame_face = grp_frame.entities.add_face(frame_pts)
    frame_face.pushpull(1000.mm) # Chiều cao khung
    grp_frame.material = "Gray"

    # Tạo bề mặt biển
    grp_surface = entities.add_group
    grp_surface.name = "Bề Mặt Biển"
    surface_pts = [
      [0, 0, 1000.mm],
      [3000.mm, 0, 1000.mm],
      [3000.mm, 150.mm, 1000.mm],
      [0, 150.mm, 1000.mm]
    ]
    surface_face = grp_surface.entities.add_face(surface_pts)
    surface_face.pushpull(-10.mm) # Độ dày bề mặt
    grp_surface.material = "White"

    # Tạo chữ nổi 3D
    grp_text = entities.add_group
    grp_text.name = "Chữ Nổi 3D"
    text = "Hộp đèn hút nổi vuông 60"
    text_position = [1500.mm, 75.mm, 1000.mm]
    text_entity = grp_text.entities.add_3d_text(text, TextAlignCenter, text_position, 100.mm, false, false)
    grp_text.material = "Red"

    # Tạo đèn LED viền
    grp_led = entities.add_group
    grp_led.name = "Đèn LED"
    led_pts = [
      [0, 0, 1010.mm],
      [3000.mm, 0, 1010.mm],
      [3000.mm, 150.mm, 1010.mm],
      [0, 150.mm, 1010.mm]
    ]
    led_face = grp_led.entities.add_face(led_pts)
    led_face.pushpull(10.mm) # Độ dày đèn LED
    grp_led.material = "Yellow"

    model.commit_operation
  end
end
HopDenHutNoiVuong60.build