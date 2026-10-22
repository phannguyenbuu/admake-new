# Mã nguồn Ruby hoàn chỉnh
module BangHieuAluDanDecalChuNoi500X90
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuAluDanDecalChuNoi500X90', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [5000.mm, 0.mm, 0.mm],
      [5000.mm, 150.mm, 0.mm],
      [0.mm, 150.mm, 0.mm]
    ]
    frame_face = entities.add_face(frame_pts)
    frame_face.pushpull(900.mm) # Chiều cao khung
    frame_group = entities.add_group(frame_face)
    frame_group.name = "Khung Sắt Đỡ"
    frame_group.material = "Gray"

    # Tạo bề mặt biển chính
    surface_pts = [
      [0.mm, 0.mm, 0.mm],
      [5000.mm, 0.mm, 0.mm],
      [5000.mm, 150.mm, 0.mm],
      [0.mm, 150.mm, 0.mm]
    ]
    surface_face = entities.add_face(surface_pts)
    surface_face.pushpull(-5.mm) # Độ dày bề mặt
    surface_group = entities.add_group(surface_face)
    surface_group.name = "Bề Mặt Biển"
    surface_group.material = "Aluminum"

    # Tạo chữ nổi 3D
    text_group = entities.add_group
    text = "Sản Phẩm"
    text_position = [1000.mm, 75.mm, 5.mm] # Vị trí chữ nổi
    text_entity = text_group.entities.add_3d_text(text, TextAlignCenter, text_position, 100.mm, false, false)
    text_group.name = "Chữ Nổi 3D"
    text_group.material = "Red"

    # Tạo đèn LED viền
    led_group = entities.add_group
    led_face = entities.add_face([[0.mm, 0.mm, 900.mm], [5000.mm, 0.mm, 900.mm], [5000.mm, 150.mm, 900.mm], [0.mm, 150.mm, 900.mm]])
    led_face.pushpull(10.mm) # Độ dày đèn LED
    led_group.name = "Đèn LED"
    led_group.material = "Yellow"

    model.commit_operation
  end
end
BangHieuAluDanDecalChuNoi500X90.build