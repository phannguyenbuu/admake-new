# Mã nguồn Ruby hoàn chỉnh
module MenuCamTayA4FomexCanDecal
  def self.build
    model = Sketchup.active_model
    model.start_operation('MenuCamTayA4FomexCanDecal', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_group = entities.add_group
    frame_group.name = "Khung Sắt Đỡ"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [210.mm, 0.mm, 0.mm],
      [210.mm, 297.mm, 0.mm],
      [0.mm, 297.mm, 0.mm]
    ]
    frame_face = frame_group.entities.add_face(frame_pts)
    frame_face.pushpull(10.mm) # Độ dày của khung
    frame_group.material = "Gray"

    # Tạo bề mặt biển chính
    surface_group = entities.add_group
    surface_group.name = "Bề Mặt Biển"
    surface_pts = [
      [0.mm, 0.mm, 10.mm],
      [210.mm, 0.mm, 10.mm],
      [210.mm, 297.mm, 10.mm],
      [0.mm, 297.mm, 10.mm]
    ]
    surface_face = surface_group.entities.add_face(surface_pts)
    surface_face.pushpull(-0.5.mm) # Độ dày của bề mặt
    surface_group.material = "White"

    # Tạo chữ nổi 3D
    text_group = entities.add_group
    text_group.name = "Chữ Nổi"
    text = "Menu"
    text_position = [10.mm, 10.mm, 10.mm]
    text_entity = text_group.entities.add_3d_text(text, TextAlignCenter, text_position, 10.mm)
    text_group.material = "Red"

    # Tạo đèn LED viền
    led_group = entities.add_group
    led_group.name = "Đèn LED"
    led_pts = [
      [0.mm, 0.mm, 10.mm],
      [210.mm, 0.mm, 10.mm],
      [210.mm, 0.mm, 15.mm],
      [0.mm, 0.mm, 15.mm]
    ]
    led_face = led_group.entities.add_face(led_pts)
    led_face.pushpull(0.5.mm) # Độ dày của đèn LED
    led_group.material = "Yellow"

    model.commit_operation
  end
end
MenuCamTayA4FomexCanDecal.build