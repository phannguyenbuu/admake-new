# Mã nguồn Ruby hoàn chỉnh 100%
module HopDenHutNoiVuong60
  def self.build
    model = Sketchup.active_model
    model.start_operation('HopDenHutNoiVuong60', true)
    entities = model.active_entities

    # Thông số chính
    width = 600.mm
    height = 600.mm
    depth = 60.mm
    radius = 50.mm # Bo tròn góc mặt hộp
    frame_thickness = 25.mm # Sắt hộp 25x25
    nẹp_width = 10.mm # Nẹp nhôm viền

    # Tạo khung xương sắt hộp vuông 25x25mm
    frame_group = entities.add_group
    frame = frame_group.entities

    # Khung ngoài (vuông, bo góc)
    pts = [
      Geom::Point3d.new(0, 0, 0),
      Geom::Point3d.new(width, 0, 0),
      Geom::Point3d.new(width, height, 0),
      Geom::Point3d.new(0, height, 0)
    ]
    # 4 thanh sắt hộp ngoài
    frame.add_face pts[0], pts[1], pts[2], pts[3]
    # 4 thanh sắt hộp viền (dạng khung)
    # Dưới đây là 4 thanh sắt hộp quanh viền
    [
      [0, 0, 0, width, 0, 0],
      [width, 0, 0, width, height, 0],
      [width, height, 0, 0, height, 0],
      [0, height, 0, 0, 0, 0]
    ].each do |x1, y1, z1, x2, y2, z2|
      edge = frame.add_line([x1, y1, z1], [x2, y2, z2])
      vec = Geom::Vector3d.new(0, 0, -frame_thickness)
      face = frame.add_face(edge.start.position, edge.end.position, edge.end.position.offset(vec), edge.start.position.offset(vec))
      face.pushpull(frame_thickness)
    end

    # Xương ngang tăng cứng (1 thanh giữa)
    x1 = frame_thickness
    x2 = width - frame_thickness
    y = height / 2
    z = -frame_thickness
    edge = frame.add_line([x1, y, z], [x2, y, z])
    vec = Geom::Vector3d.new(0, 0, -frame_thickness)
    face = frame.add_face([x1, y, z], [x2, y, z], [x2, y, z - frame_thickness], [x1, y, z - frame_thickness])
    face.pushpull(frame_thickness)

    # Chân đế sắt hộp 25x25mm
    leg_group = entities.add_group
    legs = leg_group.entities
    leg_height = 120.mm
    base_plate = 80.mm
    # Hai chân dọc
    [
      [width*0.25, -frame_thickness, -leg_height],
      [width*0.75, -frame_thickness, -leg_height]
    ].each do |x, y, z|
      leg = legs.add_face(
        [x, y, 0],
        [x+frame_thickness, y, 0],
        [x+frame_thickness, y, z],
        [x, y, z]
      )
      leg.pushpull(frame_thickness)
      # Bản mã chân
      plate = legs.add_face(
        [x-10.mm, y-5.mm, z],
        [x+frame_thickness+10.mm, y-5.mm, z],
        [x+frame_thickness+10.mm, y+frame_thickness+5.mm, z],
        [x-10.mm, y+frame_thickness+5.mm, z]
      )
      plate.pushpull(5.mm)
    end

    # Tạo mặt mica hút nổi (bo tròn 4 góc)
    face_group = entities.add_group
    face_ents = face_group.entities
    # Tạo hình chữ nhật bo góc
    require 'sketchup.rb'
    require 'extensions.rb'
    # Vẽ mặt bo góc
    center = Geom::Point3d.new(width/2, height/2, depth - 3.mm)
    rect = face_ents.add_face(
      [radius, radius, depth - 3.mm],
      [width - radius, radius, depth - 3.mm],
      [width - radius, height - radius, depth - 3.mm],
      [radius, height - radius, depth - 3.mm]
    )
    # Bo góc bằng 4 cung tròn
    face_ents.add_arc([radius, radius, depth - 3.mm], [radius, 0, depth - 3.mm], [0, radius, depth - 3.mm], radius, 0, 90.degrees)
    face_ents.add_arc([width - radius, radius, depth - 3.mm], [width, radius, depth - 3.mm], [width - radius, 0, depth - 3.mm], radius, 90.degrees, 180.degrees)
    face_ents.add_arc([width - radius, height - radius, depth - 3.mm], [width - radius, height, depth - 3.mm], [width, height - radius, depth - 3.mm], radius, 180.degrees, 270.degrees)
    face_ents.add_arc([radius, height - radius, depth - 3.mm], [0, height - radius, depth - 3.mm], [radius, height, depth - 3.mm], radius, 270.degrees, 360.degrees)
    # Đẩy nổi mặt mica lên 20mm
    rect.pushpull(20.mm)
    # Tô màu mica trắng đục
    mat_mica = model.materials.add('MicaTrangDuc')
    mat_mica.color = '#F8F8F8'
    face_group.material = mat_mica

    # Viền nẹp nhôm định hình (bo quanh mặt hộp)
    nẹp_group = entities.add_group
    nẹp_ents = nẹp_group.entities
    # Vẽ viền ngoài (hình chữ nhật bo góc, dày nẹp_width)
    # 4 cạnh ngoài
    [
      [[0, 0, depth-3.mm], [width, 0, depth-3.mm]],
      [[width, 0, depth-3.mm], [width, height, depth-3.mm]],
      [[width, height, depth-3.mm], [0, height, depth-3.mm]],
      [[0, height, depth-3.mm], [0, 0, depth-3.mm]]
    ].each do |p1, p2|
      edge = nẹp_ents.add_line(p1, p2)
      vec = Geom::Vector3d.new(0, 0, nẹp_width)
      face = nẹp_ents.add_face(p1, p2, [p2.x, p2.y, p2.z + nẹp_width], [p1.x, p1.y, p1.z + nẹp_width])
      face.pushpull(nẹp_width)
    end
    # Tô màu nẹp nhôm xước bạc
    mat_nep = model.materials.add('NepNhom')
    mat_nep.color = '#C0C0C0'
    nẹp_group.material = mat_nep

    # Đặt các nhóm đúng vị trí
    frame_group.move!([0, 0, 0])
    face_group.move!([0, 0, frame_thickness])
    nẹp_group.move!([0, 0, frame_thickness + 20.mm])

    # Đặt tên nhóm
    frame_group.name = "Khung sắt hộp"
    face_group.name = "Mặt mica hút nổi"
    nẹp_group.name = "Viền nẹp nhôm"
    leg_group.name = "Chân đế sắt hộp"

    model.commit_operation
  end
end
HopDenHutNoiVuong60.build