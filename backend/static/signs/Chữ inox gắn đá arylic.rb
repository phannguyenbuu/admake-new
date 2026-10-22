# Mã nguồn Ruby hoàn chỉnh
module ChuInoxGanDaArylic
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuInoxGanDaArylic', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_grp = entities.add_group
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [1200.mm, 0.mm, 0.mm],
      [1200.mm, 60.mm, 0.mm],
      [0.mm, 60.mm, 0.mm]
    ]
    frame_face = frame_grp.entities.add_face(frame_pts)
    frame_face.pushpull(400.mm) # Cao 400mm
    frame_grp.material = "Gray"

    # Tạo bề mặt biển
    surface_grp = entities.add_group
    surface_pts = [
      [0.mm, 0.mm, 0.mm],
      [1200.mm, 0.mm, 0.mm],
      [1200.mm, 60.mm, 0.mm],
      [0.mm, 60.mm, 0.mm]
    ]
    surface_face = surface_grp.entities.add_face(surface_pts)
    surface_face.pushpull(-10.mm) # Bề dày 10mm
    surface_grp.material = "White"

    # Tạo chữ nổi 3D
    text_grp = entities.add_group
    text = "Chữ Inox"
    text_position = [100.mm, 20.mm, 10.mm] # Vị trí chữ
    text_face = text_grp.entities.add_3d_text(text, TextAlignCenter, text_position, 100.mm, false, false)
    text_face.pushpull(10.mm) # Độ dày chữ 10mm
    text_grp.material = "Silver"

    # Tạo đèn LED
    led_grp = entities.add_group
    led_pts = [
      [0.mm, 0.mm, 60.mm],
      [1200.mm, 0.mm, 60.mm],
      [1200.mm, 10.mm, 60.mm],
      [0.mm, 10.mm, 60.mm]
    ]
    led_face = led_grp.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Độ dày đèn LED
    led_grp.material = "Yellow"

    model.commit_operation
  end
end
ChuInoxGanDaArylic.build