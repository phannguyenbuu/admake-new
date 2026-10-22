# Mã nguồn Ruby hoàn chỉnh
module ChuNoiMicaChanFomex
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuNoiMicaChanFomex', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    grp_frame = entities.add_group
    grp_frame.name = "Khung Sat Do"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [1200.mm, 0.mm, 0.mm],
      [1200.mm, 60.mm, 0.mm],
      [0.mm, 60.mm, 0.mm]
    ]
    frame_face = grp_frame.entities.add_face(frame_pts)
    frame_face.pushpull(20.mm) # Độ dày của khung
    grp_frame.material = "Gray"

    # Tạo bề mặt biển chính
    grp_surface = entities.add_group
    grp_surface.name = "Be Mat Bien"
    surface_pts = [
      [0.mm, 0.mm, 20.mm],
      [1200.mm, 0.mm, 20.mm],
      [1200.mm, 400.mm, 20.mm],
      [0.mm, 400.mm, 20.mm]
    ]
    surface_face = grp_surface.entities.add_face(surface_pts)
    surface_face.pushpull(60.mm) # Độ dày của bề mặt
    grp_surface.material = "White"

    # Tạo chữ nổi 3D
    grp_text = entities.add_group
    grp_text.name = "Chu Noi"
    text_pts = [
      [100.mm, 100.mm, 20.mm],
      [1100.mm, 100.mm, 20.mm],
      [1100.mm, 300.mm, 20.mm],
      [100.mm, 300.mm, 20.mm]
    ]
    text_face = grp_text.entities.add_face(text_pts)
    text_face.pushpull(40.mm) # Độ dày của chữ nổi
    grp_text.material = "Red"

    # Tạo đèn LED viền
    grp_led = entities.add_group
    grp_led.name = "Den LED"
    led_pts = [
      [0.mm, 0.mm, 60.mm],
      [1200.mm, 0.mm, 60.mm],
      [1200.mm, 400.mm, 60.mm],
      [0.mm, 400.mm, 60.mm]
    ]
    led_face = grp_led.entities.add_face(led_pts)
    led_face.pushpull(10.mm) # Độ dày của đèn LED
    grp_led.material = "Yellow"

    model.commit_operation
  end
end
ChuNoiMicaChanFomex.build