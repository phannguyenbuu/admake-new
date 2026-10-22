# Mã nguồn Ruby hoàn chỉnh 100%
module ChuNoiDanTuong
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuNoiDanTuong', true)
    entities = model.active_entities

    # Thông số tổng thể
    width = 1200.mm
    height = 400.mm
    wall_thickness = 20.mm

    # Tạo mặt tường (dùng làm nền tham chiếu, không phải tấm alu)
    wall_face = entities.add_face([0,0,0], [width,0,0], [width,height,0], [0,height,0])
    wall_face.pushpull(-wall_thickness)
    wall_face.material = "#F8F8F8"

    # Vị trí logo (ở giữa trên cùng)
    logo_width = 180.mm
    logo_height = 90.mm
    logo_thickness = 5.mm
    logo_x = (width - logo_width) / 2
    logo_y = height - logo_height - 30.mm
    logo_z = wall_thickness + 1.mm

    logo_group = entities.add_group
    logo_face = logo_group.entities.add_face(
      [logo_x, logo_y, logo_z],
      [logo_x + logo_width, logo_y, logo_z],
      [logo_x + logo_width, logo_y + logo_height, logo_z],
      [logo_x, logo_y + logo_height, logo_z]
    )
    logo_face.pushpull(logo_thickness)
    logo_face.material = "#FFFFFF"
    # Viền logo
    logo_edges = logo_group.entities.add_circle(
      [logo_x + logo_width/2, logo_y + logo_height/2, logo_z + logo_thickness/2],
      [0,0,1],
      logo_height/2 + 5.mm,
      48
    )
    logo_circle = logo_group.entities.add_face(logo_edges)
    logo_circle.material = "#8EC6E6"
    logo_circle.pushpull(1.mm)
    # Dải ruy băng đỏ (mô phỏng)
    ribbon_w = 90.mm
    ribbon_h = 15.mm
    ribbon_x = logo_x + (logo_width - ribbon_w)/2
    ribbon_y = logo_y + logo_height/2 + 20.mm
    ribbon_face = logo_group.entities.add_face(
      [ribbon_x, ribbon_y, logo_z + logo_thickness + 0.5.mm],
      [ribbon_x + ribbon_w, ribbon_y, logo_z + logo_thickness + 0.5.mm],
      [ribbon_x + ribbon_w, ribbon_y + ribbon_h, logo_z + logo_thickness + 0.5.mm],
      [ribbon_x, ribbon_y + ribbon_h, logo_z + logo_thickness + 0.5.mm]
    )
    ribbon_face.material = "#D94F8A"
    ribbon_face.pushpull(1.5.mm)

    # Chữ "Trường Mầm Non" (dòng trên, nhỏ)
    text1 = "Trường Mầm Non"
    text1_height = 60.mm
    text1_depth = 15.mm
    text1_x = (width - 400.mm) / 2
    text1_y = logo_y - 55.mm
    text1_z = wall_thickness + 2.mm
    text1_group = entities.add_group
    text1_group.entities.add_3d_text(
      text1,
      TextAlignCenter,
      text1_height,
      false,
      text1_depth,
      "Arial Rounded MT Bold"
    )
    text1_group.material = "#D94F8A"
    text1_group.move! Geom::Transformation.translation(
      [width/2, text1_y, text1_z]
    )

    # Chữ "Hoa Baby" (dòng dưới, lớn)
    text2 = "Hoa Baby"
    text2_height = 110.mm
    text2_depth = 25.mm
    text2_x = (width - 600.mm) / 2
    text2_y = text1_y - 110.mm
    text2_z = wall_thickness + 2.mm
    text2_group = entities.add_group
    text2_group.entities.add_3d_text(
      text2,
      TextAlignCenter,
      text2_height,
      false,
      text2_depth,
      "Arial Rounded MT Bold"
    )
    text2_group.material = "#D94F8A"
    text2_group.move! Geom::Transformation.translation(
      [width/2, text2_y, text2_z]
    )

    model.commit_operation
  end
end
ChuNoiDanTuong.build