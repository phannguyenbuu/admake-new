# Mã nguồn Ruby hoàn chỉnh
module BienSoNhaInoxSoNoiNenVanGo30X20
  def self.build
    model = Sketchup.active_model
    model.start_operation('BienSoNhaInoxSoNoiNenVanGo30X20', true)
    entities = model.active_entities

    # Tạo khung sắt đỡ
    frame_pts = [
      [0.mm, 0.mm, 0.mm],
      [300.mm, 0.mm, 0.mm],
      [300.mm, 200.mm, 0.mm],
      [0.mm, 200.mm, 0.mm]
    ]
    frame_grp = entities.add_group
    frame_face = frame_grp.entities.add_face(frame_pts)
    frame_face.pushpull(20.mm) # Độ dày khung
    frame_grp.material = "Gray"

    # Tạo tấm nền chính
    base_pts = [
      [5.mm, 5.mm, 20.mm],
      [295.mm, 5.mm, 20.mm],
      [295.mm, 195.mm, 20.mm],
      [5.mm, 195.mm, 20.mm]
    ]
    base_grp = entities.add_group
    base_face = base_grp.entities.add_face(base_pts)
    base_face.pushpull(5.mm) # Độ dày tấm nền
    base_grp.material = "Wood"

    # Tạo chữ số nổi 3D
    number_grp = entities.add_group
    number_pts = [
      [100.mm, 100.mm, 20.mm],
      [120.mm, 100.mm, 20.mm],
      [120.mm, 140.mm, 20.mm],
      [100.mm, 140.mm, 20.mm]
    ]
    number_face = number_grp.entities.add_face(number_pts)
    number_face.pushpull(5.mm) # Độ dày chữ số
    number_grp.material = "Silver"

    # Tạo đèn LED viền
    led_grp = entities.add_group
    led_pts = [
      [0.mm, 0.mm, 25.mm],
      [300.mm, 0.mm, 25.mm],
      [300.mm, 200.mm, 25.mm],
      [0.mm, 200.mm, 25.mm]
    ]
    led_face = led_grp.entities.add_face(led_pts)
    led_face.pushpull(5.mm) # Độ dày đèn LED
    led_grp.material = "Yellow"

    model.commit_operation
  end
end
BienSoNhaInoxSoNoiNenVanGo30X20.build