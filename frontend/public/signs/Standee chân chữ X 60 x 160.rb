# Mã nguồn Ruby hoàn chỉnh
module StandeeChanChuX60X160
  def self.build
    model = Sketchup.active_model
    model.start_operation('StandeeChanChuX60X160', true)
    entities = model.active_entities

    # Tạo khung đỡ
    base_width = 600.mm
    base_height = 1600.mm
    base_depth = 30.mm
    leg_depth = 30.mm
    leg_height = 1000.mm
    leg_width = 20.mm

    # Tạo khung chân chữ X
    leg1 = entities.add_group
    leg1.name = "Leg1"
    leg1_face = leg1.entities.add_face([0, 0, 0], [leg_width, 0, 0], [leg_width, leg_depth, 0], [0, leg_depth, 0])
    leg1_face.pushpull(leg_height)

    leg2 = entities.add_group
    leg2.name = "Leg2"
    leg2_face = leg2.entities.add_face([base_width - leg_width, 0, 0], [base_width, 0, 0], [base_width, leg_depth, 0], [base_width - leg_width, leg_depth, 0])
    leg2_face.pushpull(leg_height)

    # Tạo bề mặt biển quảng cáo
    surface = entities.add_group
    surface.name = "Surface"
    surface_face = surface.entities.add_face([0, 0, leg_height], [base_width, 0, leg_height], [base_width, base_depth, leg_height], [0, base_depth, leg_height])
    surface_face.pushpull(-base_depth)

    # Gán màu cho các nhóm
    leg1.material = "Gray"
    leg2.material = "Gray"
    surface.material = "White"

    # Thêm chữ nổi 3D
    text_group = entities.add_group
    text_group.name = "Text"
    text = text_group.entities.add_3d_text("Standee", TextAlignCenter, "Arial", true, false, 100.mm, 1.mm, false)
    text_group.transform!(Geom::Transformation.new([base_width / 2 - 50.mm, base_depth / 2 - 20.mm, leg_height + 10.mm]))

    model.commit_operation
  end
end
StandeeChanChuX60X160.build