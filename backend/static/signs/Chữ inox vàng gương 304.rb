# Mã nguồn Ruby hoàn chỉnh 100%
module ChuInoxVangGuong304
  def self.build
    model = Sketchup.active_model
    model.start_operation('ChuInoxVangGuong304', true)
    entities = model.active_entities

    # Kích thước tổng thể
    width = 1200.mm
    height = 400.mm
    thickness = 8.mm # Tấm nền alu/kính

    # Tạo khung xương sắt hộp 25x25mm
    frame_thick = 25.mm
    frame_group = entities.add_group
    frame = frame_group.entities

    # Khung viền ngoài
    frame.add_face([0,0,0], [width,0,0], [width,height,0], [0,height,0]).pushpull(-frame_thick)
    # Xương đứng (cách nhau ~500mm)
    frame.add_face([width/2-frame_thick/2,0,0], [width/2+frame_thick/2,0,0], [width/2+frame_thick/2,height,0], [width/2-frame_thick/2,height,0]).pushpull(-frame_thick)
    # Xương ngang tăng cứng
    frame.add_face([0,height/2-frame_thick/2,0], [width,height/2-frame_thick/2,0], [width,height/2+frame_thick/2,0], [0,height/2+frame_thick/2,0]).pushpull(-frame_thick)

    # Tạo tấm nền alu/kính
    base_group = entities.add_group
    base = base_group.entities
    base_face = base.add_face([0,0,frame_thick], [width,0,frame_thick], [width,height,frame_thick], [0,height,frame_thick])
    base_face.pushpull(thickness)
    # Gán màu nền trắng ngà
    mat_base = model.materials.add('AluWhite')
    mat_base.color = '#F8F8F8'
    base_group.material = mat_base

    # Viền nẹp alu (vát cạnh 5mm)
    border_group = entities.add_group
    border = border_group.entities
    border_width = 5.mm
    # Viền trên
    border.add_face([0,0,frame_thick+thickness], [width,0,frame_thick+thickness], [width,border_width,frame_thick+thickness], [0,border_width,frame_thick+thickness]).pushpull(border_width)
    # Viền dưới
    border.add_face([0,height-border_width,frame_thick+thickness], [width,height-border_width,frame_thick+thickness], [width,height,frame_thick+thickness], [0,height,frame_thick+thickness]).pushpull(border_width)
    # Viền trái
    border.add_face([0,border_width,frame_thick+thickness], [border_width,border_width,frame_thick+thickness], [border_width,height-border_width,frame_thick+thickness], [0,height-border_width,frame_thick+thickness]).pushpull(border_width)
    # Viền phải
    border.add_face([width-border_width,border_width,frame_thick+thickness], [width,border_width,frame_thick+thickness], [width,height-border_width,frame_thick+thickness], [width-border_width,height-border_width,frame_thick+thickness]).pushpull(border_width)
    # Gán màu viền alu trắng
    mat_border = model.materials.add('AluBorder')
    mat_border.color = '#F8F8F8'
    border_group.material = mat_border

    # Tạo chữ nổi inox vàng gương 304
    # Thông số chữ lớn: "DOANH TRÍ" (cao 120mm, dày 60mm)
    text_main = "DOANH TRÍ"
    text_main_group = entities.add_group
    text_main_entities = text_main_group.entities
    text_main_height = 120.mm
    text_main_depth = 60.mm
    text_main_font = "Arial Black"
    text_main_pos = [100.mm, 200.mm, frame_thick+thickness+1.mm]
    text_main_entities.add_3d_text(
      text_main,
      TextAlignLeft,
      text_main_height,
      false,
      false,
      text_main_font,
      true,
      text_main_depth
    ).move!(text_main_pos)
    # Gán màu inox vàng gương
    mat_inox = model.materials.add('InoxGold')
    mat_inox.color = '#FFD700'
    text_main_group.material = mat_inox

    # Chữ phụ trên: "TOÀN" (cao 60mm, dày 30mm)
    text_top = "TOÀN"
    text_top_group = entities.add_group
    text_top_entities = text_top_group.entities
    text_top_height = 60.mm
    text_top_depth = 30.mm
    text_top_font = "Arial Black"
    text_top_pos = [100.mm, 320.mm, frame_thick+thickness+1.mm]
    text_top_entities.add_3d_text(
      text_top,
      TextAlignLeft,
      text_top_height,
      false,
      false,
      text_top_font,
      true,
      text_top_depth
    ).move!(text_top_pos)
    text_top_group.material = mat_inox

    # Chữ phụ dưới: "TRANG SỨC THUỐC" (cao 40mm, dày 20mm)
    text_bot = "TRANG SỨC THUỐC"
    text_bot_group = entities.add_group
    text_bot_entities = text_bot_group.entities
    text_bot_height = 40.mm
    text_bot_depth = 20.mm
    text_bot_font = "Arial"
    text_bot_pos = [100.mm, 80.mm, frame_thick+thickness+1.mm]
    text_bot_entities.add_3d_text(
      text_bot,
      TextAlignLeft,
      text_bot_height,
      false,
      false,
      text_bot_font,
      true,
      text_bot_depth
    ).move!(text_bot_pos)
    text_bot_group.material = mat_inox

    # Kết thúc thao tác
    model.commit_operation
  end
end
ChuInoxVangGuong304.build