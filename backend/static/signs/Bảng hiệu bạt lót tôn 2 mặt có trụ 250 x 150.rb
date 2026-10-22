# Mã nguồn Ruby hoàn chỉnh
module BangHieuBatLotTon2MatCoTru250X150
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuBatLotTon2MatCoTru250X150', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    grp_frame = entities.add_group
    grp_frame.name = "Khung Sắt Đỡ"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [2500.mm, 0.mm, 0.mm],
      [2500.mm, 30.mm, 0.mm],
      [0.mm, 30.mm, 0.mm]
    ]
    frame_face = grp_frame.entities.add_face(frame_pts)
    frame_face.pushpull(1500.mm) # Kéo khối lên cao 1500mm
    grp_frame.material = "Gray"

    # Tạo bề mặt biển
    grp_surface = entities.add_group
    grp_surface.name = "Bề Mặt Biển"
    surface_pts = [
      [0.mm, 0.mm, 0.mm],
      [2500.mm, 0.mm, 0.mm],
      [2500.mm, 30.mm, 0.mm],
      [0.mm, 30.mm, 0.mm]
    ]
    surface_face = grp_surface.entities.add_face(surface_pts)
    surface_face.pushpull(5.mm) # Kéo khối lên cao 5mm
    grp_surface.material = "Blue"

    # Tạo chữ nổi 3D
    grp_text = entities.add_group
    grp_text.name = "Chữ Nổi"
    text_pts = [
      [1000.mm, 15.mm, 5.mm],
      [1500.mm, 15.mm, 5.mm],
      [1500.mm, 45.mm, 5.mm],
      [1000.mm, 45.mm, 5.mm]
    ]
    text_face = grp_text.entities.add_face(text_pts)
    text_face.pushpull(10.mm) # Kéo khối lên cao 10mm
    grp_text.material = "White"

    # Tạo đèn LED
    grp_led = entities.add_group
    grp_led.name = "Đèn LED"
    led_pts = [
      [0.mm, 0.mm, 1550.mm],
      [2500.mm, 0.mm, 1550.mm],
      [2500.mm, 30.mm, 1550.mm],
      [0.mm, 30.mm, 1550.mm]
    ]
    led_face = grp_led.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Kéo khối lên cao 5mm
    grp_led.material = "Yellow"

    model.commit_operation
  end
end
BangHieuBatLotTon2MatCoTru250X150.build