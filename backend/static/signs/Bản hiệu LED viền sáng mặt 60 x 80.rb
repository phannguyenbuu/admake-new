# Mã nguồn Ruby hoàn chỉnh
module BanHieuLedVienSangMat60X80
  def self.build
    model = Sketchup.active_model
    model.start_operation('BanHieuLedVienSangMat60X80', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    grp_frame = entities.add_group
    grp_frame.name = "Khung Sat Do"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [600.mm, 0.mm, 0.mm],
      [600.mm, 20.mm, 0.mm],
      [0.mm, 20.mm, 0.mm]
    ]
    frame_face = grp_frame.entities.add_face(frame_pts)
    frame_face.pushpull(-20.mm) # Độ dày khung
    grp_frame.material = "Gray"

    # Tạo bề mặt biển
    grp_surface = entities.add_group
    grp_surface.name = "Be Mat Bien"
    surface_pts = [
      [0.mm, 0.mm, -20.mm],
      [600.mm, 0.mm, -20.mm],
      [600.mm, 800.mm, -20.mm],
      [0.mm, 800.mm, -20.mm]
    ]
    surface_face = grp_surface.entities.add_face(surface_pts)
    surface_face.pushpull(20.mm) # Độ dày bề mặt
    grp_surface.material = "White"

    # Tạo chữ nổi 3D
    grp_text = entities.add_group
    grp_text.name = "Chu Noi 3D"
    text_height = 50.mm
    text_depth = 10.mm
    text_pts = [
      [50.mm, 400.mm, -20.mm],
      [550.mm, 400.mm, -20.mm],
      [550.mm, 400.mm + text_height, -20.mm],
      [50.mm, 400.mm + text_height, -20.mm]
    ]
    text_face = grp_text.entities.add_face(text_pts)
    text_face.pushpull(-text_depth) # Độ dày chữ
    grp_text.material = "Red"

    # Tạo viền LED
    grp_led = entities.add_group
    grp_led.name = "Vien LED"
    led_pts = [
      [0.mm, 0.mm, -10.mm],
      [600.mm, 0.mm, -10.mm],
      [600.mm, 800.mm, -10.mm],
      [0.mm, 800.mm, -10.mm]
    ]
    led_face = grp_led.entities.add_face(led_pts)
    led_face.pushpull(-5.mm) # Độ dày viền LED
    grp_led.material = "Yellow"

    model.commit_operation
  end
end
BanHieuLedVienSangMat60X80.build