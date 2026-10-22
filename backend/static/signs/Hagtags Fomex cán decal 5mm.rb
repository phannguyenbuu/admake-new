# Mã nguồn Ruby hoàn chỉnh
module HagtagsFomexCanDecal5mm
  def self.build
    model = Sketchup.active_model
    model.start_operation('HagtagsFomexCanDecal5mm', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_grp = entities.add_group
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [3000.mm, 0.mm, 0.mm],
      [3000.mm, 150.mm, 0.mm],
      [0.mm, 150.mm, 0.mm]
    ]
    frame_face = frame_grp.entities.add_face(frame_pts)
    frame_face.pushpull(100.mm) # Chiều cao khung
    frame_grp.material = "Gray"

    # Tạo bề mặt biển chính
    surface_grp = entities.add_group
    surface_pts = [
      [0.mm, 0.mm, 100.mm],
      [3000.mm, 0.mm, 100.mm],
      [3000.mm, 150.mm, 100.mm],
      [0.mm, 150.mm, 100.mm]
    ]
    surface_face = surface_grp.entities.add_face(surface_pts)
    surface_face.pushpull(5.mm) # Độ dày Fomex
    surface_grp.material = "White"

    # Tạo chữ nổi 3D
    text_grp = entities.add_group
    text = "Hagtags"
    text_position = [1500.mm, 75.mm, 105.mm] # Vị trí chữ nổi
    text_face = text_grp.entities.add_text(text, text_position, 100.mm)
    text_face.pushpull(10.mm) # Độ dày chữ nổi
    text_grp.material = "Red"

    # Tạo đèn LED hoặc viền nẹp trang trí
    led_grp = entities.add_group
    led_pts = [
      [0.mm, 0.mm, 110.mm],
      [3000.mm, 0.mm, 110.mm],
      [3000.mm, 10.mm, 110.mm],
      [0.mm, 10.mm, 110.mm]
    ]
    led_face = led_grp.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Độ dày viền nẹp
    led_grp.material = "Yellow"

    model.commit_operation
  end
end
HagtagsFomexCanDecal5mm.build