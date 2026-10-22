# Mã nguồn Ruby hoàn chỉnh
module TemDecalInBe
  def self.build
    model = Sketchup.active_model
    model.start_operation('TemDecalInBe', true)
    entities = model.active_entities

    # Tạo khung đỡ
    base_height = 2.mm
    base_width = 200.mm
    base_depth = 100.mm
    base_pts = [
      [0, 0, 0],
      [base_width, 0, 0],
      [base_width, base_depth, 0],
      [0, base_depth, 0]
    ]
    base_face = entities.add_face(base_pts)
    base_face.pushpull(base_height)
    base_group = entities.add_group(base_face)
    base_group.name = "KhungDe"

    # Tạo bề mặt biển
    surface_height = 2.mm
    surface_pts = [
      [0, 0, base_height],
      [base_width, 0, base_height],
      [base_width, base_depth, base_height],
      [0, base_depth, base_height]
    ]
    surface_face = entities.add_face(surface_pts)
    surface_face.pushpull(surface_height)
    surface_group = entities.add_group(surface_face)
    surface_group.name = "BeMatBien"
    surface_group.material = "White"

    # Tạo chữ nổi 3D
    text = "Tem Decal"
    text_height = 5.mm
    text_group = entities.add_group
    text_group.name = "ChuNoi"
    text_face = text_group.entities.add_text(text, [50.mm, 50.mm, base_height + 2.mm])
    text_face.pushpull(text_height)
    text_group.material = "Red"

    # Tạo họa tiết trang trí
    decoration_group = entities.add_group
    decoration_group.name = "HoaTiet"
    decoration_face = decoration_group.entities.add_face([0, 0, base_height + 2.mm], [200.mm, 0, base_height + 2.mm], [200.mm, 100.mm, base_height + 2.mm], [0, 100.mm, base_height + 2.mm])
    decoration_face.pushpull(1.mm)
    decoration_group.material = "Blue"

    # Tạo đèn LED
    led_group = entities.add_group
    led_group.name = "DenLED"
    led_pts = [
      [10.mm, 10.mm, base_height + 3.mm],
      [20.mm, 10.mm, base_height + 3.mm],
      [20.mm, 20.mm, base_height + 3.mm],
      [10.mm, 20.mm, base_height + 3.mm]
    ]
    led_face = led_group.entities.add_face(led_pts)
    led_face.pushpull(1.mm)
    led_group.material = "Yellow"

    model.commit_operation
  end
end
TemDecalInBe.build