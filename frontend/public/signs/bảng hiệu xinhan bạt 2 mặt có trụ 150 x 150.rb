# Mã nguồn Ruby hoàn chỉnh
module BangHieuXinhanBat2MatCoTru150X150
  def self.build
    model = Sketchup.active_model
    model.start_operation('BangHieuXinhanBat2MatCoTru150X150', true)
    entities = model.active_entities

    # Tạo khung trụ
    trụ = entities.add_group
    trụ.name = "Trụ 150x150"
    trụ_entities = trụ.entities
    trụ_face = trụ_entities.add_face([0.mm, 0.mm, 0.mm], [150.mm, 0.mm, 0.mm], [150.mm, 150.mm, 0.mm], [0.mm, 150.mm, 0.mm])
    trụ_face.pushpull(1500.mm) # Chiều cao trụ
    trụ.material = "Gray"

    # Tạo bề mặt biển
    biển = entities.add_group
    biển.name = "Bề mặt biển"
    biển_entities = biển.entities
    biển_face = biển_entities.add_face([0.mm, 0.mm, 1500.mm], [1500.mm, 0.mm, 1500.mm], [1500.mm, 30.mm, 1500.mm], [0.mm, 30.mm, 1500.mm])
    biển_face.pushpull(30.mm) # Độ dày biển
    biển.material = "White"

    # Tạo chữ nổi
    chữ_nổi = entities.add_group
    chữ_nổi.name = "Chữ nổi"
    chữ_nổi_entities = chữ_nổi.entities
    chữ_nổi_face = chữ_nổi_entities.add_face([100.mm, 10.mm, 1500.mm], [400.mm, 10.mm, 1500.mm], [400.mm, 60.mm, 1500.mm], [100.mm, 60.mm, 1500.mm])
    chữ_nổi_face.pushpull(10.mm) # Chiều cao chữ nổi
    chữ_nổi.material = "Red"

    # Tạo đèn LED
    đèn_LED = entities.add_group
    đèn_LED.name = "Đèn LED"
    đèn_LED_entities = đèn_LED.entities
    đèn_LED_face = đèn_LED_entities.add_face([0.mm, 0.mm, 1500.mm], [1500.mm, 0.mm, 1500.mm], [1500.mm, 10.mm, 1500.mm], [0.mm, 10.mm, 1500.mm])
    đèn_LED_face.pushpull(5.mm) # Chiều cao đèn LED
    đèn_LED.material = "Yellow"

    model.commit_operation
  end
end
BangHieuXinhanBat2MatCoTru150X150.build