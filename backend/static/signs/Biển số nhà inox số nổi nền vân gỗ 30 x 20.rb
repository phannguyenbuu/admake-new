# Mã nguồn Ruby hoàn chỉnh
module BienSoNhaInoxSoNoiNenVanGo30X20
  def self.build
    model = Sketchup.active_model
    model.start_operation('BienSoNhaInoxSoNoiNenVanGo30X20', true)
    entities = model.active_entities

    # Tạo khung đỡ
    base_group = entities.add_group
    base_group.name = "Khung Do"
    base_face = base_group.entities.add_face([0.mm, 0.mm, 0.mm], [300.mm, 0.mm, 0.mm], [300.mm, 200.mm, 0.mm], [0.mm, 200.mm, 0.mm])
    base_face.pushpull(20.mm)
    base_group.material = "Wood"

    # Tạo bề mặt biển
    surface_group = entities.add_group
    surface_group.name = "Be Mat Bien"
    surface_face = surface_group.entities.add_face([10.mm, 10.mm, 20.mm], [290.mm, 10.mm, 20.mm], [290.mm, 190.mm, 20.mm], [10.mm, 190.mm, 20.mm])
    surface_face.pushpull(5.mm)
    surface_group.material = "Wood Grain"

    # Tạo chữ số nổi
    number_group = entities.add_group
    number_group.name = "Chu So Noi"
    number_face = number_group.entities.add_face([50.mm, 50.mm, 25.mm], [100.mm, 50.mm, 25.mm], [100.mm, 150.mm, 25.mm], [50.mm, 150.mm, 25.mm])
    number_face.pushpull(5.mm)
    number_group.material = "Metallic"

    # Tạo viền trang trí
    border_group = entities.add_group
    border_group.name = "Vien Trang Tri"
    border_face = border_group.entities.add_face([0.mm, 0.mm, 25.mm], [300.mm, 0.mm, 25.mm], [300.mm, 200.mm, 25.mm], [0.mm, 200.mm, 25.mm])
    border_face.pushpull(2.mm)
    border_group.material = "Gold"

    model.commit_operation
  end
end
BienSoNhaInoxSoNoiNenVanGo30X20.build