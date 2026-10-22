# Mã nguồn Ruby hoàn chỉnh
module ChuChanNhomXuocCoGo
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuChanNhomXuocCoGo', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_group = entities.add_group
    frame_group.name = "KhungSatDo"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [1200.mm, 0.mm, 0.mm],
      [1200.mm, 400.mm, 0.mm],
      [0.mm, 400.mm, 0.mm]
    ]
    frame_face = frame_group.entities.add_face(frame_pts)
    frame_face.pushpull(60.mm) # Độ dày của khung
    frame_group.material = "Gray"

    # Tạo bề mặt biển
    surface_group = entities.add_group
    surface_group.name = "BeMatBien"
    surface_pts = [
      [0.mm, 0.mm, 60.mm],
      [1200.mm, 0.mm, 60.mm],
      [1200.mm, 400.mm, 60.mm],
      [0.mm, 400.mm, 60.mm]
    ]
    surface_face = surface_group.entities.add_face(surface_pts)
    surface_face.pushpull(-5.mm) # Độ dày của bề mặt
    surface_group.material = "White"

    # Tạo chữ nổi 3D
    text_group = entities.add_group
    text_group.name = "ChuNoi"
    text_face = text_group.entities.add_face([0.mm, 0.mm, 60.mm])
    text_face.pushpull(10.mm) # Độ dày của chữ
    text_group.material = "Blue"

    # Tạo đèn LED viền
    led_group = entities.add_group
    led_group.name = "DenLED"
    led_pts = [
      [0.mm, -10.mm, 60.mm],
      [1200.mm, -10.mm, 60.mm],
      [1200.mm, -10.mm, 70.mm],
      [0.mm, -10.mm, 70.mm]
    ]
    led_face = led_group.entities.add_face(led_pts)
    led_face.pushpull(10.mm) # Độ dày của đèn LED
    led_group.material = "Yellow"

    model.commit_operation
  end
end
ChuChanNhomXuocCoGo.build