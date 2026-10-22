# Mã nguồn Ruby hoàn chỉnh
module ChuInox304MatMica
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuInox304MatMica', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    grp_frame = entities.add_group
    grp_frame.name = "KhungSatDo"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [1200.mm, 0.mm, 0.mm],
      [1200.mm, 60.mm, 0.mm],
      [0.mm, 60.mm, 0.mm]
    ]
    frame_face = grp_frame.entities.add_face(frame_pts)
    frame_face.pushpull(400.mm) # Kéo khối lên cao 400mm
    grp_frame.material = "Gray"

    # Tạo mặt nền mica
    grp_mica = entities.add_group
    grp_mica.name = "MatMica"
    mica_pts = [
      [0.mm, 0.mm, 0.mm],
      [1200.mm, 0.mm, 0.mm],
      [1200.mm, 60.mm, 0.mm],
      [0.mm, 60.mm, 0.mm]
    ]
    mica_face = grp_mica.entities.add_face(mica_pts)
    mica_face.pushpull(10.mm) # Độ dày mặt mica
    grp_mica.material = "White"

    # Tạo chữ nổi 3D
    grp_text = entities.add_group
    grp_text.name = "ChuNoi"
    text_pts = [
      [100.mm, 10.mm, 10.mm],
      [1100.mm, 10.mm, 10.mm],
      [1100.mm, 50.mm, 10.mm],
      [100.mm, 50.mm, 10.mm]
    ]
    text_face = grp_text.entities.add_face(text_pts)
    text_face.pushpull(20.mm) # Độ dày chữ nổi
    grp_text.material = "Silver"

    # Tạo đèn LED
    grp_led = entities.add_group
    grp_led.name = "DenLED"
    led_pts = [
      [0.mm, 0.mm, 60.mm],
      [1200.mm, 0.mm, 60.mm],
      [1200.mm, 10.mm, 60.mm],
      [0.mm, 10.mm, 60.mm]
    ]
    led_face = grp_led.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Độ dày đèn LED
    grp_led.material = "Yellow"

    model.commit_operation
  end
end
ChuInox304MatMica.build