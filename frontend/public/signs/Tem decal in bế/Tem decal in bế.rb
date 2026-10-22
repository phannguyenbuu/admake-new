# Mã nguồn Ruby hoàn chỉnh 100%
module TemDecalInBe
  def self.build
    model = Sketchup.active_model
    model.start_operation('TemDecalInBe', true)
    entities = model.active_entities

    # Kích thước tem
    width = 200.mm
    height = 100.mm
    thickness = 2.mm

    # Tạo mặt nền decal (dạng cloud/bo tròn lượn sóng)
    center = Geom::Point3d.new(0, 0, 0)
    num_points = 32
    radius_x = width / 2 - 5.mm
    radius_y = height / 2 - 5.mm
    wave_amp = 8.mm
    wave_freq = 6

    points = []
    (0...num_points).each do |i|
      angle = 2 * Math::PI * i / num_points
      r_x = radius_x + Math.sin(angle * wave_freq) * wave_amp
      r_y = radius_y + Math.sin(angle * wave_freq) * wave_amp
      x = center.x + r_x * Math.cos(angle)
      y = center.y + r_y * Math.sin(angle)
      points << Geom::Point3d.new(x, y, 0)
    end
    face = entities.add_face(points)
    face.pushpull(thickness)

    # Tô màu nền decal
    decal_color = Sketchup::Color.new("#F6FAFF")
    face.material = decal_color
    face.back_material = decal_color

    # Viền ngoài decal (vàng kem nhạt)
    offset = 4.mm
    outer_points = []
    (0...num_points).each do |i|
      angle = 2 * Math::PI * i / num_points
      r_x = radius_x + offset + Math.sin(angle * wave_freq) * (wave_amp + 2)
      r_y = radius_y + offset + Math.sin(angle * wave_freq) * (wave_amp + 2)
      x = center.x + r_x * Math.cos(angle)
      y = center.y + r_y * Math.sin(angle)
      outer_points << Geom::Point3d.new(x, y, thickness/2)
    end
    outer_face = entities.add_face(outer_points)
    outer_face.erase! if outer_face.normal.z < 0
    outer_face.pushpull(-thickness/2)
    outer_face.material = Sketchup::Color.new("#FFF3D1")
    outer_face.back_material = Sketchup::Color.new("#FFF3D1")

    # Vẽ chữ nổi "MOON"
    moon_group = entities.add_group
    moon_text = "MOON"
    moon_pos = Geom::Point3d.new(-60.mm, 15.mm, thickness)
    moon_group.entities.add_3d_text(
      moon_text, TextAlignCenter, "Arial Rounded MT Bold", false, false,
      22.mm, 30.mm, 0, true, moon_pos, 0
    )
    moon_group.material = Sketchup::Color.new("#8B5C2B") # Nâu chocolate
    moon_group.entities.each { |e| e.material = Sketchup::Color.new("#8B5C2B") }
    # Viền trắng cho chữ "MOON" (tạo offset)
    moon_outline = moon_group.entities.add_3d_text(
      moon_text, TextAlignCenter, "Arial Rounded MT Bold", false, false,
      24.mm, 30.mm, 0, true, moon_pos, 0
    )
    moon_outline.material = Sketchup::Color.new("#FFFFFF")

    # Chữ nổi "COFFEE AND"
    coffee_group = entities.add_group
    coffee_text = "COFFEE\nAND"
    coffee_pos = Geom::Point3d.new(-5.mm, -10.mm, thickness)
    coffee_group.entities.add_3d_text(
      coffee_text, TextAlignCenter, "Arial Rounded MT Bold", false, false,
      7.mm, 15.mm, 0, true, coffee_pos, 0
    )
    coffee_group.material = Sketchup::Color.new("#4B2E12")

    # Chữ nổi "Tea"
    tea_group = entities.add_group
    tea_text = "Tea"
    tea_pos = Geom::Point3d.new(55.mm, -20.mm, thickness)
    tea_group.entities.add_3d_text(
      tea_text, TextAlignCenter, "Arial Rounded MT Bold", false, false,
      18.mm, 20.mm, 0, true, tea_pos, 0
    )
    tea_group.material = Sketchup::Color.new("#B98B5A")
    # Viền trắng cho chữ "Tea"
    tea_outline = tea_group.entities.add_3d_text(
      tea_text, TextAlignCenter, "Arial Rounded MT Bold", false, false,
      20.mm, 20.mm, 0, true, tea_pos, 0
    )
    tea_outline.material = Sketchup::Color.new("#FFFFFF")

    # Icon giọt nước (hình elip màu hồng cam)
    drop_group = entities.add_group
    drop_center = Geom::Point3d.new(-70.mm, 40.mm, thickness+0.5.mm)
    drop_face = drop_group.entities.add_circle(drop_center, [0,0,1], 7.mm, 24)
    drop_face = drop_group.entities.add_face(drop_face)
    drop_face.pushpull(2.mm)
    drop_face.material = Sketchup::Color.new("#F47C7C")

    # Icon hạt cà phê (hình elip nâu)
    bean_group = entities.add_group
    bean_center = Geom::Point3d.new(70.mm, -30.mm, thickness+0.5.mm)
    bean_face = bean_group.entities.add_circle(bean_center, [0,0,1], 8.mm, 24)
    bean_face = bean_group.entities.add_face(bean_face)
    bean_face.pushpull(2.mm)
    bean_face.material = Sketchup::Color.new("#8B5C2B")

    # Icon tách trà (hình cung tròn + hình chữ nhật)
    cup_group = entities.add_group
    cup_center = Geom::Point3d.new(-45.mm, -35.mm, thickness+0.5.mm)
    arc = cup_group.entities.add_arc(cup_center, [0,0,1], [1,0,0], 18.mm, 0, Math::PI, 24)
    arc_face = cup_group.entities.add_face(arc)
    arc_face.pushpull(2.mm)
    arc_face.material = Sketchup::Color.new("#FFFFFF")
    # Viền nâu cho tách trà
    cup_outline = cup_group.entities.add_arc(cup_center, [0,0,1], [1,0,0], 20.mm, 0, Math::PI, 24)
    cup_outline_face = cup_group.entities.add_face(cup_outline)
    cup_outline_face.pushpull(1.mm)
    cup_outline_face.material = Sketchup::Color.new("#8B5C2B")

    # Các chấm tròn nhỏ trang trí (nâu)
    [Geom::Point3d.new(-30.mm, 45.mm, thickness+1.mm),
     Geom::Point3d.new(40.mm, 40.mm, thickness+1.mm),
     Geom::Point3d.new(60.mm, 10.mm, thickness+1.mm)].each do |pt|
      dot = entities.add_circle(pt, [0,0,1], 2.5.mm, 16)
      dot_face = entities.add_face(dot)
      dot_face.pushpull(1.5.mm)
      dot_face.material = Sketchup::Color.new("#8B5C2B")
    end

    model.commit_operation
  end
end
TemDecalInBe.build