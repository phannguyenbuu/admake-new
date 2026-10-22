# Mã nguồn Ruby hoàn chỉnh
module MicaHutNoiNgoiSaoBuaLiem
  def self.build
    model = Sketchup.active_model
    model.start_operation('MicaHutNoiNgoiSaoBuaLiem', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_group = entities.add_group
    frame_group.name = "Khung Sat Do"
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [3000.mm, 0.mm, 0.mm],
      [3000.mm, 150.mm, 0.mm],
      [0.mm, 150.mm, 0.mm]
    ]
    frame_face = frame_group.entities.add_face(frame_pts)
    frame_face.pushpull(100.mm) # Chiều cao khung
    frame_group.material = "Gray"

    # Tạo bề mặt biển
    surface_group = entities.add_group
    surface_group.name = "Be Mat Bien"
    surface_pts = [
      [0.mm, 0.mm, 100.mm],
      [3000.mm, 0.mm, 100.mm],
      [3000.mm, 150.mm, 100.mm],
      [0.mm, 150.mm, 100.mm]
    ]
    surface_face = surface_group.entities.add_face(surface_pts)
    surface_face.pushpull(10.mm) # Độ dày bề mặt
    surface_group.material = "White"

    # Tạo chữ nổi 3D
    text_group = entities.add_group
    text_group.name = "Chu Noi 3D"
    text = "Mica Hút Nổi"
    text_position = [100.mm, 50.mm, 110.mm] # Vị trí chữ
    text_entity = text_group.entities.add_3d_text(text, TextAlignCenter, text_position, 100.mm, 10.mm)
    text_group.material = "Red"

    # Tạo đèn LED viền
    led_group = entities.add_group
    led_group.name = "Den LED"
    led_pts = [
      [0.mm, -10.mm, 100.mm],
      [3000.mm, -10.mm, 100.mm],
      [3000.mm, 0.mm, 100.mm],
      [0.mm, 0.mm, 100.mm]
    ]
    led_face = led_group.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Chiều cao đèn LED
    led_group.material = "Yellow"

    model.commit_operation
  end
end
MicaHutNoiNgoiSaoBuaLiem.build