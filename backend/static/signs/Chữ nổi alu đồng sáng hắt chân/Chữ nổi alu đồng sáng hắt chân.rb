# Mã nguồn Ruby hoàn chỉnh 100%
module ChuNoiAluDongSangHatChan
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuNoiAluDongSangHatChan', true)
    entities = model.active_entities

    # Thông số tổng thể
    width = 1200.mm
    height = 400.mm
    depth_big = 30.mm
    depth_small = 15.mm

    # Tạo mặt tường (nền treo chữ)
    wall_face = entities.add_face([0,0,0], [width,0,0], [width,height,0], [0,height,0])
    wall_face.pushpull(-20.mm)
    wall_face.material = "#F5F5F0"

    # Tạo nhóm chữ nổi lớn "2H" + icon lá
    group_2h = entities.add_group
    # Chữ "2"
    text2 = group_2h.entities.add_3d_text(
      "2", 
      TextAlignLeft, 
      "Arial Black", 
      false, 
      false, 
      depth_big, 
      200.mm, 
      0, 
      true, 
      0
    )
    text2.material = "#FFD700"
    text2.back_material = "#FFD700"
    text2.transform!(Geom::Transformation.translation([100.mm, 120.mm, 20.mm]))
    # Chữ "H"
    textH = group_2h.entities.add_3d_text(
      "H", 
      TextAlignLeft, 
      "Arial Black", 
      false, 
      false, 
      depth_big, 
      200.mm, 
      0, 
      true, 
      0
    )
    textH.material = "#FFD700"
    textH.back_material = "#FFD700"
    textH.transform!(Geom::Transformation.translation([260.mm, 120.mm, 20.mm]))
    # Icon chiếc lá (vẽ đơn giản bằng 2 ellipse và 1 đường cong)
    leaf_group = group_2h.entities.add_group
    leaf1 = leaf_group.entities.add_circle([80.mm, 200.mm, 20.mm], [1,0,0], 12.mm, 24)
    leaf_face1 = leaf_group.entities.add_face(leaf1)
    leaf_face1.pushpull(depth_big)
    leaf_face1.material = "#FFD700"
    leaf2 = leaf_group.entities.add_circle([90.mm, 210.mm, 20.mm], [1,0,0], 7.mm, 24)
    leaf_face2 = leaf_group.entities.add_face(leaf2)
    leaf_face2.pushpull(depth_big)
    leaf_face2.material = "#FFD700"
    # Gân lá (đường cong)
    leaf_group.entities.add_curve(
      [80.mm, 200.mm, 35.mm],
      [85.mm, 205.mm, 35.mm],
      [90.mm, 210.mm, 35.mm]
    )
    # Gán màu vàng đồng cho gân lá
    leaf_group.material = "#FFD700"

    # Tạo ánh sáng LED hắt chân (vòng sáng vàng quanh chữ)
    led_group = entities.add_group
    led_ring1 = led_group.entities.add_circle([200.mm, 220.mm, 15.mm], [0,0,1], 120.mm, 48)
    led_face1 = led_group.entities.add_face(led_ring1)
    led_face1.material = "#FFEB99"
    led_face1.back_material = "#FFEB99"
    led_face1.pushpull(-2.mm)
    led_ring2 = led_group.entities.add_circle([360.mm, 220.mm, 15.mm], [0,0,1], 120.mm, 48)
    led_face2 = led_group.entities.add_face(led_ring2)
    led_face2.material = "#FFEB99"
    led_face2.back_material = "#FFEB99"
    led_face2.pushpull(-2.mm)

    # Tạo nhóm chữ "STORE"
    group_store = entities.add_group
    text_store = group_store.entities.add_3d_text(
      "STORE",
      TextAlignLeft,
      "Arial Black",
      false,
      false,
      depth_big,
      70.mm,
      0,
      true,
      0
    )
    text_store.material = "#FFD700"
    text_store.back_material = "#FFD700"
    text_store.transform!(Geom::Transformation.translation([100.mm, 60.mm, 20.mm]))

    # Tạo nhóm chữ phụ "MỸ PHẨM CHÍNH HÃNG"
    group_sub = entities.add_group
    text_sub = group_sub.entities.add_3d_text(
      "MỸ PHẨM CHÍNH HÃNG",
      TextAlignLeft,
      "Arial",
      false,
      false,
      depth_small,
      30.mm,
      0,
      true,
      0
    )
    text_sub.material = "#FFD700"
    text_sub.back_material = "#FFD700"
    text_sub.transform!(Geom::Transformation.translation([100.mm, 20.mm, 20.mm]))

    # Khung xương sắt hộp đỡ (ẩn phía sau, mô phỏng)
    frame_group = entities.add_group
    # Khung viền ngoài
    frame_profile = [
      [0,0,-10.mm],
      [width,0,-10.mm],
      [width,height,-10.mm],
      [0,height,-10.mm]
    ]
    for i in 0..3
      p1 = frame_profile[i]
      p2 = frame_profile[(i+1)%4]
      edge = frame_group.entities.add_line(p1, p2)
      face = frame_group.entities.add_face([
        p1,
        p2,
        [p2[0], p2[1], p2[2]-25.mm],
        [p1[0], p1[1], p1[2]-25.mm]
      ])
      face.material = "#888888"
    end
    # Xương ngang tăng cứng
    frame_group.entities.add_face([0, height/2, -10.mm], [width, height/2, -10.mm], [width, height/2, -35.mm], [0, height/2, -35.mm]).material = "#888888"
    # Xương đứng
    frame_group.entities.add_face([width/2, 0, -10.mm], [width/2, height, -10.mm], [width/2, height, -35.mm], [width/2, 0, -35.mm]).material = "#888888"

    # Tai treo tường (mô phỏng 2 tai)
    tai_group = entities.add_group
    tai1 = tai_group.entities.add_face([50.mm, height+10.mm, -10.mm], [90.mm, height+10.mm, -10.mm], [90.mm, height+30.mm, -10.mm], [50.mm, height+30.mm, -10.mm])
    tai1.pushpull(-5.mm)
    tai1.material = "#888888"
    tai2 = tai_group.entities.add_face([width-90.mm, height+10.mm, -10.mm], [width-50.mm, height+10.mm, -10.mm], [width-50.mm, height+30.mm, -10.mm], [width-90.mm, height+30.mm, -10.mm])
    tai2.pushpull(-5.mm)
    tai2.material = "#888888"

    model.commit_operation
  end
end
ChuNoiAluDongSangHatChan.build