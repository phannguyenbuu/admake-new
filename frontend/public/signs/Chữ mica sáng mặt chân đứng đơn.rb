# Mã nguồn Ruby hoàn chỉnh
module ChuMicaSangMatChanDungDon
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuMicaSangMatChanDungDon', true)
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
    frame_face.pushpull(400.mm) # Kéo lên cao 400mm
    grp_frame.material = "Gray"

    # Tạo bề mặt biển
    grp_surface = entities.add_group
    grp_surface.name = "BeMatBien"
    surface_pts = [
      [0.mm, 0.mm, 0.mm],
      [1200.mm, 0.mm, 0.mm],
      [1200.mm, 60.mm, 0.mm],
      [0.mm, 60.mm, 0.mm]
    ]
    surface_face = grp_surface.entities.add_face(surface_pts)
    surface_face.pushpull(10.mm) # Độ dày 10mm
    grp_surface.material = "White"

    # Tạo chữ nổi 3D
    grp_text = entities.add_group
    grp_text.name = "ChuNoi3D"
    text = "SANG"
    text_position = [100.mm, 10.mm, 10.mm]
    text_entity = grp_text.entities.add_text(text, text_position)
    text_entity.transform!(Geom::Transformation.new([0, 0, 10.mm])) # Nâng chữ lên 10mm
    grp_text.material = "Blue"

    # Tạo đèn LED viền
    grp_led = entities.add_group
    grp_led.name = "DenLED"
    led_pts = [
      [0.mm, 0.mm, 10.mm],
      [1200.mm, 0.mm, 10.mm],
      [1200.mm, 60.mm, 10.mm],
      [0.mm, 60.mm, 10.mm]
    ]
    led_face = grp_led.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Độ dày 5mm
    grp_led.material = "Yellow"

    model.commit_operation
  end
end
ChuMicaSangMatChanDungDon.build