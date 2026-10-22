# Mã nguồn Ruby hoàn chỉnh
module ChuInoxVangGuong304
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuInoxVangGuong304', true)
    entities = model.active_entities

    # Tạo khung đỡ
    base_width = 1200.mm
    base_height = 400.mm
    base_depth = 60.mm

    # Tạo khung đỡ
    base_pts = [
      [0, 0, 0],
      [base_width, 0, 0],
      [base_width, base_depth, 0],
      [0, base_depth, 0]
    ]
    base_face = entities.add_face(base_pts)
    base_face.pushpull(-10.mm) # Độ dày của khung đỡ
    base_group = entities.add_group(base_face)
    base_group.name = "Khung Đỡ"
    base_group.material = "Gray"

    # Tạo bề mặt biển
    surface_pts = [
      [0, 0, 0],
      [base_width, 0, 0],
      [base_width, base_depth, 0],
      [0, base_depth, 0]
    ]
    surface_face = entities.add_face(surface_pts)
    surface_face.pushpull(base_height) # Chiều cao của biển
    surface_group = entities.add_group(surface_face)
    surface_group.name = "Bề Mặt Biển"
    surface_group.material = "White"

    # Tạo chữ nổi 3D
    letter_height = 400.mm
    letter_depth = 60.mm
    letter_group = entities.add_group
    letter_group.name = "Chữ Nổi 3D"

    # Tạo chữ "INOX VÀNG GƯƠNG"
    letter_pts = [
      [100.mm, 100.mm, 0],
      [100.mm, 100.mm + letter_depth, 0],
      [100.mm + 200.mm, 100.mm + letter_depth, 0],
      [100.mm + 200.mm, 100.mm, 0]
    ]
    letter_face = letter_group.entities.add_face(letter_pts)
    letter_face.pushpull(letter_height) # Độ cao của chữ
    letter_group.material = "Gold"

    # Tạo đèn LED (nếu cần)
    led_group = entities.add_group
    led_group.name = "Đèn LED"
    led_pts = [
      [100.mm, 100.mm + letter_depth + 10.mm, 0],
      [100.mm, 100.mm + letter_depth + 10.mm + 5.mm, 0],
      [100.mm + 200.mm, 100.mm + letter_depth + 10.mm + 5.mm, 0],
      [100.mm + 200.mm, 100.mm + letter_depth + 10.mm, 0]
    ]
    led_face = led_group.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Độ dày của đèn LED
    led_group.material = "Yellow"

    model.commit_operation
  end
end
ChuInoxVangGuong304.build