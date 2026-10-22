# Mã nguồn Ruby hoàn chỉnh
module ChuMicaSangMatChanDungDon
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuMicaSangMatChanDungDon', true)
    entities = model.active_entities

    # Tạo khung đỡ
    base_height = 60.mm
    base_width = 1200.mm
    base_depth = 60.mm

    base_pts = [
      [0, 0, 0],
      [base_width, 0, 0],
      [base_width, base_depth, 0],
      [0, base_depth, 0]
    ]
    
    base_face = entities.add_face(base_pts)
    base_face.pushpull(base_height)
    base_group = entities.add_group(base_face)
    base_group.name = "Khung Đỡ"
    base_group.material = "Gray"

    # Tạo bề mặt biển
    surface_height = 400.mm
    surface_depth = 60.mm

    surface_pts = [
      [0, 0, base_height],
      [base_width, 0, base_height],
      [base_width, surface_depth, base_height],
      [0, surface_depth, base_height]
    ]

    surface_face = entities.add_face(surface_pts)
    surface_face.pushpull(surface_height)
    surface_group = entities.add_group(surface_face)
    surface_group.name = "Bề Mặt Biển"
    surface_group.material = "White"

    # Tạo chữ nổi 3D
    letter_height = 400.mm
    letter_depth = 10.mm
    letter_width = 100.mm

    letter_pts = [
      [100.mm, 30.mm, base_height + surface_height],
      [100.mm + letter_width, 30.mm, base_height + surface_height],
      [100.mm + letter_width, 30.mm + letter_depth, base_height + surface_height],
      [100.mm, 30.mm + letter_depth, base_height + surface_height]
    ]

    letter_face = entities.add_face(letter_pts)
    letter_face.pushpull(letter_height)
    letter_group = entities.add_group(letter_face)
    letter_group.name = "Chữ Nổi"
    letter_group.material = "Red"

    # Tạo đèn LED (biểu tượng)
    led_height = 5.mm
    led_depth = 5.mm

    led_pts = [
      [50.mm, 30.mm + letter_depth + 5.mm, base_height + surface_height + letter_height],
      [50.mm + led_depth, 30.mm + letter_depth + 5.mm, base_height + surface_height + letter_height],
      [50.mm + led_depth, 30.mm + letter_depth + 5.mm + led_height, base_height + surface_height + letter_height],
      [50.mm, 30.mm + letter_depth + 5.mm + led_height, base_height + surface_height + letter_height]
    ]

    led_face = entities.add_face(led_pts)
    led_face.pushpull(led_depth)
    led_group = entities.add_group(led_face)
    led_group.name = "Đèn LED"
    led_group.material = "Yellow"

    model.commit_operation
  end
end
ChuMicaSangMatChanDungDon.build