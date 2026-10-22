# encoding: UTF-8
# ============================================================
# CHU INOX VANG GUONG 3D - SKETCHUP RUBY
# Dung chu noi kim loai, mat guong vang, canh extrude day.
# SketchUp Ruby API
# ============================================================

require 'sketchup.rb'

module ADMAKE_GOLD_LETTERS

  extend self

  # ----------------------------------------------------------
  # 1. CAU HINH
  # Don vi nhap: mm
  # ----------------------------------------------------------

  CONFIG = {
    group_name:       'ADMAKE_CHU_INOX_VANG_GUONG',
    main_text:        'GOLD',
    sub_text:         'IN THUOC',
    font_main:        'Arial Black',
    font_sub:         'Arial',
    main_height:      220.0,
    sub_height:       65.0,
    letter_depth:     25.0,
    sub_depth:        12.0,
    spacing:          8.0,
    sub_spacing:      5.0,
    bevel_size:       1.2,
    board_width:      1200.0,
    board_height:     450.0,
    board_thickness:  5.0,
    make_board:       false,
    rotate_z:         -12.0,
    gold_color:       [235, 177, 35],
    side_color:       [173, 112, 18],
    dark_gold_color:  [75, 45, 8],
    board_color:      [245, 245, 242],
    create_bom:       true
  }.freeze

  # ----------------------------------------------------------
  # 2. VAT LIEU
  # ----------------------------------------------------------

  def create_material(model, name, color, metallic = false)
    mat = model.materials[name] || model.materials.add(name)
    mat.color = Sketchup::Color.new(*color)
    mat.alpha = 1.0

    # Reflection-related rendering differs by SketchUp version.
    # A strong gold color is used as a portable fallback.
    if mat.respond_to?(:metallic=)
      mat.metallic = metallic ? 1.0 : 0.0
    end

    mat
  end

  # ----------------------------------------------------------
  # 3. TAO MAT PHANG TU HINH CHU NHAT
  # ----------------------------------------------------------

  def add_box(entities, x, y, z, sx, sy, sz, material, name)
    group = entities.add_group
    group.name = name
    pts = [
      [x,      y,      z],
      [x + sx, y,      z],
      [x + sx, y + sy, z],
      [x,      y + sy, z]
    ].map { |p| Geom::Point3d.new(*p) }

    face = group.entities.add_face(pts)
    if face
      face.reverse! if face.normal.z < 0
      face.pushpull(sz)
      group.entities.grep(Sketchup::Face).each do |f|
        f.material = material
        f.back_material = material
      end
    end

    group
  end

  # ----------------------------------------------------------
  # 4. TAO CHU 3D
  # SketchUp Text geometry is converted to faces when possible.
  # ----------------------------------------------------------

  def add_3d_text(parent, text, height, depth, font,
                  front_mat, side_mat, x, y, z, group_name)

    group = parent.add_group
    group.name = group_name
    ents = group.entities

    begin
      # add_3d_text(text, alignment, font, bold, italic,
      #             height, tolerance, z, filled, extrusion)
      ents.add_3d_text(
        text,
        TextAlignLeft = 0,
        font,
        true,
        false,
        height.mm,
        0.0,
        0.0,
        true,
        depth.mm
      )
    rescue => e
      UI.messagebox(
        "Khong tao duoc chu: #{text}\n" \
        "Kiem tra font '#{font}'.\n#{e.message}"
      )
      group.erase!
      return nil
    end

    # Gan vat lieu theo mat truoc/sau.
    ents.grep(Sketchup::Face).each do |face|
      face.material = front_mat
      face.back_material = front_mat
    end

    # Pushpull cua add_3d_text da tao canh ben.
    # Gan side material cho cac mat ben bang phan tich normal.
    ents.grep(Sketchup::Face).each do |face|
      next if face.normal.z.abs > 0.98
      face.material = side_mat
      face.back_material = side_mat
    end

    # Dinh vi theo goc trai duoi.
    group.transform!(
      Geom::Transformation.translation([x.mm, y.mm, z.mm])
    )

    group
  end

  # ----------------------------------------------------------
  # 5. LAM TRON CANH NHE
  # Khong lam thay doi duong bien chu.
  # ----------------------------------------------------------

  def soften_edges(group, angle = 20.degrees)
    return unless group && group.valid?

    group.entities.grep(Sketchup::Edge).each do |edge|
      begin
        edge.soft = true if edge.respond_to?(:soft=)
        edge.smooth = true if edge.respond_to?(:smooth=)
      rescue
        # Bo qua edge khong ho tro.
      end
    end
  end

  # ----------------------------------------------------------
  # 6. LAY KICH THUOC HINH HOC
  # ----------------------------------------------------------

  def bounds_size(group)
    bb = group.bounds
    [
      bb.width.to_mm,
      bb.height.to_mm,
      bb.depth.to_mm
    ]
  end

  # ----------------------------------------------------------
  # 7. TAO MO HINH CHINH
  # ----------------------------------------------------------

  def build
    model = Sketchup.active_model
    model.start_operation('ADMAKE - Chu inox vang guong 3D', true)

    begin
      # Vat lieu
      gold = create_material(
        model, 'INOX_VANG_GUONG',
        CONFIG[:gold_color], true
      )

      side = create_material(
        model, 'CANH_INOX_VANG',
        CONFIG[:side_color], true
      )

      dark_gold = create_material(
        model, 'MAT_TOP_VANG_BRONZE',
        CONFIG[:dark_gold_color], true
      )

      board_mat = create_material(
        model, 'NEN_TRANG',
        CONFIG[:board_color], false
      )

      # Group tong
      root = model.active_entities.add_group
      root.name = CONFIG[:group_name]

      letters = root.entities.add_group
      letters.name = '01_CHU_NOI_3D'

      # ------------------------------------------------------
      # Chu dong
      # ------------------------------------------------------

      main = add_3d_text(
        letters,
        CONFIG[:main_text],
        CONFIG[:main_height],
        CONFIG[:letter_depth],
        CONFIG[:font_main],
        gold,
        side,
        0,
        0,
        CONFIG[:board_thickness],
        'CHU_DONG'
      )

      # ------------------------------------------------------
      # Chu phu
      # ------------------------------------------------------

      sub = add_3d_text(
        letters,
        CONFIG[:sub_text],
        CONFIG[:sub_height],
        CONFIG[:sub_depth],
        CONFIG[:font_sub],
        gold,
        side,
        0,
        -CONFIG[:sub_height] * 1.5,
        CONFIG[:board_thickness],
        'CHU_PHU'
      )

      # ------------------------------------------------------
      # Nen lap chu (tuy chon)
      # ------------------------------------------------------

      
      if CONFIG[:make_board]
        board = add_box(
          root.entities,
          -CONFIG[:board_width] * 0.03,
          -CONFIG[:board_height] * 0.30,
          0,
          CONFIG[:board_width],
          CONFIG[:board_height],
          CONFIG[:board_thickness],
          base_mat,
          'NEN_BANG'
        )
      end
    rescue => e
    ensure
      model.commit_operation
    end
  end
end
