# Mã nguồn Ruby hoàn chỉnh
module LedXinhanMuiTen120X50
  def self.build
    model = Sketchup.active_model
    model.start_operation('LedXinhanMuiTen120X50', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    grp_frame = entities.add_group
    grp_frame.name = "KhungSat"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [1200.mm, 0.mm, 0.mm],
      [1200.mm, 500.mm, 0.mm],
      [0.mm, 500.mm, 0.mm]
    ]
    frame_face = grp_frame.entities.add_face(frame_pts)
    frame_face.pushpull(30.mm) # Độ dày của khung
    grp_frame.material = "Gray"

    # Tạo bề mặt biển
    grp_surface = entities.add_group
    grp_surface.name = "BeMatBien"
    surface_pts = [
      [0.mm, 0.mm, 30.mm],
      [1200.mm, 0.mm, 30.mm],
      [1200.mm, 500.mm, 30.mm],
      [0.mm, 500.mm, 30.mm]
    ]
    surface_face = grp_surface.entities.add_face(surface_pts)
    surface_face.pushpull(5.mm) # Độ dày của bề mặt biển
    grp_surface.material = "White"

    # Tạo chữ nổi 3D
    grp_text = entities.add_group
    grp_text.name = "ChuNoi"
    text_height = 50.mm
    text_depth = 10.mm
    text_pts = [
      [100.mm, 100.mm, 35.mm],
      [100.mm + 200.mm, 100.mm, 35.mm],
      [100.mm + 200.mm, 100.mm + text_height, 35.mm],
      [100.mm, 100.mm + text_height, 35.mm]
    ]
    text_face = grp_text.entities.add_face(text_pts)
    text_face.pushpull(text_depth) # Độ dày của chữ nổi
    grp_text.material = "Red"

    # Tạo viền LED
    grp_led = entities.add_group
    grp_led.name = "ViLed"
    led_pts = [
      [0.mm, 0.mm, 40.mm],
      [1200.mm, 0.mm, 40.mm],
      [1200.mm, 500.mm, 40.mm],
      [0.mm, 500.mm, 40.mm]
    ]
    led_face = grp_led.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Độ dày của viền LED
    grp_led.material = "Yellow"

    model.commit_operation
  end
end
LedXinhanMuiTen120X50.build