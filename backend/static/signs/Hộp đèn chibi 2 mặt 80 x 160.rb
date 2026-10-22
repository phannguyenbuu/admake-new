# Mã nguồn Ruby hoàn chỉnh
module HopDenChibi2Mat80X160
  def self.build
    model = Sketchup.active_model
    model.start_operation('HopDenChibi2Mat80X160', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    grp_frame = entities.add_group
    grp_frame.name = "Khung Sắt Đỡ"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [800.mm, 0.mm, 0.mm],
      [800.mm, 30.mm, 0.mm],
      [0.mm, 30.mm, 0.mm]
    ]
    frame_face = grp_frame.entities.add_face(frame_pts)
    frame_face.pushpull(1600.mm) # Kéo dài khung lên cao 1600mm
    grp_frame.material = "Gray"

    # Tạo bề mặt biển quảng cáo
    grp_surface = entities.add_group
    grp_surface.name = "Bề Mặt Biển Quảng Cáo"
    surface_pts = [
      [0.mm, 0.mm, 0.mm],
      [800.mm, 0.mm, 0.mm],
      [800.mm, 30.mm, 0.mm],
      [0.mm, 30.mm, 0.mm]
    ]
    surface_face = grp_surface.entities.add_face(surface_pts)
    surface_face.pushpull(30.mm) # Độ dày 30mm
    grp_surface.material = "White"

    # Tạo chữ nổi 3D
    grp_text = entities.add_group
    grp_text.name = "Chữ Nổi 3D"
    text_pts = [
      [100.mm, 15.mm, 0.mm],
      [700.mm, 15.mm, 0.mm],
      [700.mm, 45.mm, 0.mm],
      [100.mm, 45.mm, 0.mm]
    ]
    text_face = grp_text.entities.add_face(text_pts)
    text_face.pushpull(10.mm) # Độ dày chữ nổi 10mm
    grp_text.material = "Red"

    # Tạo đèn LED viền
    grp_led = entities.add_group
    grp_led.name = "Đèn LED Viền"
    led_pts = [
      [0.mm, 0.mm, 0.mm],
      [800.mm, 0.mm, 0.mm],
      [800.mm, 30.mm, 0.mm],
      [0.mm, 30.mm, 0.mm]
    ]
    led_face = grp_led.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Độ dày viền đèn LED 5mm
    grp_led.material = "Yellow"

    model.commit_operation
  end
end
HopDenChibi2Mat80X160.build