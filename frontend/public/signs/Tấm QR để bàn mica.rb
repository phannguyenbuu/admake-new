# ============================================================
# SKETCHUP RUBY 3D: Tấm QR để bàn mica
# Kích thước: 3.0m x 1.2m x 0.2m | Đơn vị: mm
# ============================================================

require 'sketchup.rb'

module Sign_tam_qr_e_ban_mica
  extend self

  def mat(model, name, rgb, alpha = 1.0)
    m = model.materials[name] || model.materials.add(name)
    m.color = Sketchup::Color.new(*rgb)
    m.alpha = alpha
    m
  end

  def box(entities, name, x, y, z, sx, sy, sz, material)
    g = entities.add_group
    g.name = name
    pts = [
      [x - sx/2.0, y - sy/2.0, z - sz/2.0],
      [x + sx/2.0, y - sy/2.0, z - sz/2.0],
      [x + sx/2.0, y + sy/2.0, z - sz/2.0],
      [x - sx/2.0, y + sy/2.0, z - sz/2.0]
    ].map { |p| Geom::Point3d.new(*p) }
    f = g.entities.add_face(pts)
    if f
      f.pushpull(sz)
      g.material = material
      g.entities.grep(Sketchup::Face).each do |face|
        face.material = material
        face.back_material = material
      end
    end
    g
  end

  def build
    model = Sketchup.active_model
    model.start_operation('Build Tấm QR để bàn mica', true)
    entities = model.active_entities

    mat_frame = mat(model, "Mat_Khung", [50, 65, 85])
    mat_face  = mat(model, "Mat_Nen", [240, 242, 245])
    mat_logo  = mat(model, "Mat_Chu3D", [235, 145, 20])
    mat_gold  = mat(model, "Mat_VangKim", [220, 180, 50])

    # 1. Khung hộp kết cấu
    box(entities, "Khung_Ket_Cau", 0, 0, 0, 3000.mm, 200.mm, 1200.mm, mat_frame)

    # 2. Mặt bảng hoàn thiện
    box(entities, "Mat_Bang_Pano", 0, (200/2.0 + 4).mm, 0, (3000 * 0.98).mm, 8.mm, (1200 * 0.98).mm, mat_face)

    # 3. Bộ chữ 3D thương hiệu nổi bật
    box(entities, "Chu_Noi_3D_Logo", 0, (200/2.0 + 16).mm, (1200 * 0.1).mm, (3000 * 0.65).mm, 20.mm, (1200 * 0.35).mm, mat_logo)

    # 4. Viền kim loại trang trí
    box(entities, "Vien_Kim_Loai_Nẹp", 0, (200/2.0 + 6).mm, 0, 3000.mm, 6.mm, 1200.mm, mat_gold)

    model.commit_operation
  end
end

Sign_tam_qr_e_ban_mica.build
