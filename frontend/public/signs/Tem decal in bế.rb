# Mã nguồn Ruby hoàn chỉnh
module TemDecalInBe
  def self.build
    model = Sketchup.active_model
    model.start_operation('TemDecalInBe', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_group = entities.add_group
    frame_group.name = "KhungSatDo"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [200.mm, 0.mm, 0.mm],
      [200.mm, 100.mm, 0.mm],
      [0.mm, 100.mm, 0.mm]
    ]
    frame_face = frame_group.entities.add_face(frame_pts)
    frame_face.pushpull(5.mm) # Độ dày của khung
    frame_group.material = "Gray"

    # Tạo bề mặt biển chính
    surface_group = entities.add_group
    surface_group.name = "BeSurface"
    surface_pts = [
      [0.mm, 0.mm, 5.mm],
      [200.mm, 0.mm, 5.mm],
      [200.mm, 100.mm, 5.mm],
      [0.mm, 100.mm, 5.mm]
    ]
    surface_face = surface_group.entities.add_face(surface_pts)
    surface_face.pushpull(-2.mm) # Độ dày của biển
    surface_group.material = "White"

    # Tạo chữ nổi 3D
    text_group = entities.add_group
    text_group.name = "ChuNoi"
    text = "Tem Decal In Bế"
    text_position = [10.mm, 10.mm, 5.mm]
    text_group.entities.add_3d_text(text, TextAlignCenter, text_position, 10.mm, false, false)
    text_group.material = "Red"

    # Tạo đèn LED viền
    led_group = entities.add_group
    led_group.name = "DenLED"
    led_pts = [
      [0.mm, 0.mm, 7.mm],
      [200.mm, 0.mm, 7.mm],
      [200.mm, 100.mm, 7.mm],
      [0.mm, 100.mm, 7.mm]
    ]
    led_face = led_group.entities.add_face(led_pts)
    led_face.pushpull(2.mm) # Độ dày của đèn LED
    led_group.material = "Yellow"

    model.commit_operation
  end
end
TemDecalInBe.build