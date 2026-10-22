# Mã nguồn Ruby hoàn chỉnh
module BangHieuChuNoiMicaLedVienFullMau400X140
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuChuNoiMicaLedVienFullMau400X140', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [4000.mm, 0.mm, 0.mm],
      [4000.mm, 30.mm, 0.mm],
      [0.mm, 30.mm, 0.mm]
    ]
    frame_grp = entities.add_group
    frame_face = frame_grp.entities.add_face(frame_pts)
    frame_face.pushpull(30.mm) # Độ dày của khung
    frame_grp.material = "Gray"

    # Tạo bề mặt biển
    surface_pts = [
      [0.mm, 0.mm, 30.mm],
      [4000.mm, 0.mm, 30.mm],
      [4000.mm, 1400.mm, 30.mm],
      [0.mm, 1400.mm, 30.mm]
    ]
    surface_grp = entities.add_group
    surface_face = surface_grp.entities.add_face(surface_pts)
    surface_face.pushpull(5.mm) # Độ dày của bề mặt biển
    surface_grp.material = "White"

    # Tạo chữ nổi 3D
    text_grp = entities.add_group
    text = "Bảng hiệu LED"
    text_entity = text_grp.entities.add_3d_text(text, TextAlignCenter, "Arial", true, false, 100.mm, 0.mm, 0.mm)
    text_grp.transform!(Geom::Transformation.new([2000.mm, 700.mm, 35.mm])) # Đặt chữ nổi lên bề mặt
    text_grp.material = "Blue"

    # Tạo đèn LED viền
    led_grp = entities.add_group
    led_face = led_grp.entities.add_face(surface_pts)
    led_face.pushpull(10.mm) # Độ dày của đèn LED
    led_grp.material = "Yellow"

    model.commit_operation
  end
end
BangHieuChuNoiMicaLedVienFullMau400X140.build