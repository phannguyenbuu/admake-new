# Mã nguồn Ruby hoàn chỉnh
module BienChucDanhChanGoInUv
  def self.build
    model = Sketchup.active_model
    model.start_operation('BienChucDanhChanGoInUv', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    grp_frame = entities.add_group
    grp_frame.name = "KhungSatDo"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [300.mm, 0.mm, 0.mm],
      [300.mm, 40.mm, 0.mm],
      [0.mm, 40.mm, 0.mm]
    ]
    frame_face = grp_frame.entities.add_face(frame_pts)
    frame_face.pushpull(150.mm) # Kéo khối lên cao 150mm
    grp_frame.material = "Gray"

    # Tạo bề mặt biển
    grp_surface = entities.add_group
    grp_surface.name = "BeMatBien"
    surface_pts = [
      [5.mm, 5.mm, 0.mm],
      [295.mm, 5.mm, 0.mm],
      [295.mm, 35.mm, 0.mm],
      [5.mm, 35.mm, 0.mm]
    ]
    surface_face = grp_surface.entities.add_face(surface_pts)
    surface_face.pushpull(5.mm) # Kéo khối lên cao 5mm
    grp_surface.material = "White"

    # Tạo chữ nổi 3D
    grp_text = entities.add_group
    grp_text.name = "ChuNoi"
    text = "Chuc Danh"
    text_position = [10.mm, 10.mm, 5.mm] # Vị trí chữ nổi
    text_entity = grp_text.entities.add_3d_text(text, TextAlignCenter, "Arial", true, false, 1.mm, 0.mm, 0.mm)
    text_entity.transform!(Geom::Transformation.translation(text_position))
    grp_text.material = "Blue"

    # Tạo đèn LED viền
    grp_led = entities.add_group
    grp_led.name = "DenLED"
    led_pts = [
      [0.mm, 0.mm, 155.mm],
      [300.mm, 0.mm, 155.mm],
      [300.mm, 40.mm, 155.mm],
      [0.mm, 40.mm, 155.mm]
    ]
    led_face = grp_led.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Kéo khối lên cao 5mm
    grp_led.material = "Yellow"

    model.commit_operation
  end
end
BienChucDanhChanGoInUv.build