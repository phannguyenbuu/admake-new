# Mã nguồn Ruby hoàn chỉnh
module ChuInox304SangHatChan
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuInox304SangHatChan', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [1200.mm, 0.mm, 0.mm],
      [1200.mm, 60.mm, 0.mm],
      [0.mm, 60.mm, 0.mm]
    ]
    frame_grp = entities.add_group
    frame_face = frame_grp.entities.add_face(frame_pts)
    frame_face.pushpull(20.mm) # Độ dày của khung
    frame_grp.material = "Gray"

    # Tạo bề mặt biển chính
    surface_pts = [
      [0.mm, 0.mm, 20.mm],
      [1200.mm, 0.mm, 20.mm],
      [1200.mm, 400.mm, 20.mm],
      [0.mm, 400.mm, 20.mm]
    ]
    surface_grp = entities.add_group
    surface_face = surface_grp.entities.add_face(surface_pts)
    surface_face.pushpull(60.mm) # Độ dày của bề mặt
    surface_grp.material = "White"

    # Tạo chữ nổi 3D
    text_grp = entities.add_group
    text = "Chữ inox 304"
    text_pts = [0.mm, 100.mm, 20.mm]
    text_face = text_grp.entities.add_text(text, text_pts, 100.mm)
    text_face.pushpull(10.mm) # Độ dày của chữ
    text_grp.material = "Silver"

    # Tạo đèn LED viền
    led_grp = entities.add_group
    led_pts = [
      [0.mm, 0.mm, 30.mm],
      [1200.mm, 0.mm, 30.mm],
      [1200.mm, 400.mm, 30.mm],
      [0.mm, 400.mm, 30.mm]
    ]
    led_face = led_grp.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Độ dày của đèn LED
    led_grp.material = "Yellow"

    model.commit_operation
  end
end
ChuInox304SangHatChan.build