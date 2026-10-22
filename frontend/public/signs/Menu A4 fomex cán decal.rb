# Mã nguồn Ruby hoàn chỉnh
module MenuA4FomexCanDecal
  def self.build
    model = Sketchup.active_model
    model.start_operation('MenuA4FomexCanDecal', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [210.mm, 0.mm, 0.mm],
      [210.mm, 297.mm, 0.mm],
      [0.mm, 297.mm, 0.mm]
    ]
    frame_grp = entities.add_group
    frame_face = frame_grp.entities.add_face(frame_pts)
    frame_face.pushpull(10.mm) # Độ dày của khung
    frame_grp.material = "Gray"

    # Tạo bề mặt biển chính
    surface_pts = [
      [5.mm, 5.mm, 10.mm],
      [205.mm, 5.mm, 10.mm],
      [205.mm, 292.mm, 10.mm],
      [5.mm, 292.mm, 10.mm]
    ]
    surface_grp = entities.add_group
    surface_face = surface_grp.entities.add_face(surface_pts)
    surface_face.pushpull(0.5.mm) # Độ dày của bề mặt
    surface_grp.material = "White"

    # Tạo chữ nổi 3D
    text_grp = entities.add_group
    text = text_grp.entities.add_text("Menu A4", [10.mm, 10.mm, 10.mm], 20.mm)
    text_grp.transform!(Geom::Transformation.new([0.mm, 0.mm, 10.mm])) # Đưa lên trên bề mặt
    text_grp.material = "Red"

    # Tạo đèn LED viền
    led_grp = entities.add_group
    led_pts = [
      [0.mm, 0.mm, 10.mm],
      [210.mm, 0.mm, 10.mm],
      [210.mm, 10.mm, 10.mm],
      [0.mm, 10.mm, 10.mm]
    ]
    led_face = led_grp.entities.add_face(led_pts)
    led_face.pushpull(2.mm) # Độ dày của đèn LED
    led_grp.material = "Yellow"

    model.commit_operation
  end
end
MenuA4FomexCanDecal.build