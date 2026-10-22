# Mã nguồn Ruby hoàn chỉnh 100% dựng hộp đèn hút nổi tròn 60cm
module HopDenHutNoiTron60
  def self.build
    model = Sketchup.active_model
    model.start_operation('HopDenHutNoiTron60', true)
    entities = model.active_entities

    # Thông số chính
    diameter = 600.mm
    radius = diameter / 2
    depth = 100.mm
    viendep = 10.mm # viền bo tròn mặt mica
    khung_satt = 25.mm
    chande_cao = 200.mm
    chande_rong = 120.mm
    chande_day = 6.mm

    # Màu sắc
    color_mica = "#F8F8FF"
    color_nhom = "#C0C0C0"
    color_satt = "#B0B0B0"

    # 1. Dựng mặt mica hút nổi (hình tròn, hơi lồi)
    group_mica = entities.add_group
    face_mica = group_mica.entities.add_circle([0, 0, depth], [0, 0, 1], radius)
    face_mica = group_mica.entities.add_face(face_mica)
    # Đẩy mặt mica lồi nhẹ (hút nổi ~15mm)
    face_mica.pushpull(-depth + 15.mm)
    # Bo tròn viền mặt trước
    group_mica.entities.add_circle([0, 0, depth+viendep], [0, 0, 1], radius-viendep)
    # Tô màu
    group_mica.material = color_mica

    # 2. Dựng viền nhôm/alu bao quanh (hình trụ rỗng)
    group_vien = entities.add_group
    # Viền ngoài
    path = group_vien.entities.add_circle([0, 0, 0], [0, 0, 1], radius)
    face_vien = group_vien.entities.add_face(path)
    # Viền trong
    path2 = group_vien.entities.add_circle([0, 0, 0], [0, 0, 1], radius-viendep)
    face_vien.followme(group_vien.entities.add_circle([0, 0, 0], [0, 0, 1], radius))
    # Đẩy viền lên cao
    face_vien.pushpull(depth)
    group_vien.material = color_nhom

    # 3. Khung xương sắt hộp bên trong (2 thanh ngang, 2 thanh dọc)
    group_khung = entities.add_group
    # Thanh dọc 1
    pt1 = [-khung_satt/2, 0, 0]
    pt2 = [khung_satt/2, 0, 0]
    pt3 = [khung_satt/2, 0, depth]
    pt4 = [-khung_satt/2, 0, depth]
    face_khung1 = group_khung.entities.add_face(pt1, pt2, pt3, pt4)
    face_khung1.pushpull(diameter)
    # Thanh ngang 1
    pt5 = [0, -khung_satt/2, 0]
    pt6 = [0, khung_satt/2, 0]
    pt7 = [0, khung_satt/2, depth]
    pt8 = [0, -khung_satt/2, depth]
    face_khung2 = group_khung.entities.add_face(pt5, pt6, pt7, pt8)
    face_khung2.pushpull(diameter)
    group_khung.material = color_satt

    # 4. Chân đế sắt hộp (2 chân)
    group_chan = entities.add_group
    # Chân trái
    chan1 = group_chan.entities.add_face(
      [-radius/2, -khung_satt/2, -chande_cao],
      [-radius/2 + khung_satt, -khung_satt/2, -chande_cao],
      [-radius/2 + khung_satt, khung_satt/2, -chande_cao],
      [-radius/2, khung_satt/2, -chande_cao]
    )
    chan1.pushpull(chande_cao)
    # Chân phải
    chan2 = group_chan.entities.add_face(
      [radius/2, -khung_satt/2, -chande_cao],
      [radius/2 + khung_satt, -khung_satt/2, -chande_cao],
      [radius/2 + khung_satt, khung_satt/2, -chande_cao],
      [radius/2, khung_satt/2, -chande_cao]
    )
    chan2.pushpull(chande_cao)
    # Đế chân trái
    de1 = group_chan.entities.add_face(
      [-radius/2 - chande_day, -chande_rong/2, -chande_cao-chande_day],
      [-radius/2 + khung_satt + chande_day, -chande_rong/2, -chande_cao-chande_day],
      [-radius/2 + khung_satt + chande_day, chande_rong/2, -chande_cao-chande_day],
      [-radius/2 - chande_day, chande_rong/2, -chande_cao-chande_day]
    )
    de1.pushpull(chande_day)
    # Đế chân phải
    de2 = group_chan.entities.add_face(
      [radius/2 - chande_day, -chande_rong/2, -chande_cao-chande_day],
      [radius/2 + khung_satt + chande_day, -chande_rong/2, -chande_cao-chande_day],
      [radius/2 + khung_satt + chande_day, chande_rong/2, -chande_cao-chande_day],
      [radius/2 - chande_day, chande_rong/2, -chande_cao-chande_day]
    )
    de2.pushpull(chande_day)
    group_chan.material = color_satt

    model.commit_operation
  end
end
HopDenHutNoiTron60.build