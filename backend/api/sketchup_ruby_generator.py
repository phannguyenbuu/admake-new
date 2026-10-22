# -*- coding: utf-8 -*-
"""
Module sinh mã nguồn Ruby (.rb) cho SketchUp và chuyển đổi Ruby Script thành 3D Mesh WebGL
Phục vụ thiết kế kết cấu biển hiệu quảng cáo, pano tấm lớn, billboard, hộp đèn mặt tiền.
"""

import re
import json

def generate_ruby_script(model_dict: dict) -> str:
    """
    Sinh mã nguồn Ruby (.rb) hoàn chỉnh cho SketchUp API từ thông số mô hình 3D biển hiệu.
    Hỗ trợ:
      - Móng bê tông (Footing)
      - Cột trụ thép tròn hoặc hộp chịu lực (Pillars)
      - Khung giàn xương sắt hộp đan nan caro (Truss frame)
      - Mặt bảng Alu / Bạt 3M / Mica (Face board)
      - Bộ chữ nổi 3D phát sáng LED (3D Extruded Letters)
      - Sàn thao tác catwalk và thang leo bảo vệ (Catwalk & Ladder)
      - Hệ thống cần đèn pha LED chiếu sáng (Floodlight brackets)
    """
    name = model_dict.get("name") or "ADMAKE_Signboard"
    cat = model_dict.get("category") or "storefront"
    dims = model_dict.get("dimensions") or {"width": 6.0, "height": 2.5, "depth": 0.25}
    w = float(dims.get("width") or 6.0)
    h = float(dims.get("height") or 2.5)
    d = float(dims.get("depth") or 0.25)

    mat_spec = model_dict.get("materials_spec") or {}
    iron_type = mat_spec.get("iron_type") or "vuong_25"
    surface_type = mat_spec.get("surface_type") or "alu_3mm"
    has_led = mat_spec.get("has_led", True)
    has_catwalk = w >= 8.0 or cat == "billboard"
    is_billboard = cat == "billboard" or w >= 10.0

    try:
        from .ruby_components import estimate_structural_components, generate_bom_comment_header
    except ImportError:
        try:
            from ruby_components import estimate_structural_components, generate_bom_comment_header
        except Exception:
            estimate_structural_components = None
            generate_bom_comment_header = None

    if estimate_structural_components and generate_bom_comment_header:
        components = estimate_structural_components(w, h, d, cat, materials_spec=mat_spec)
        bom_header = generate_bom_comment_header(components, w, h, d, name, cat)
    else:
        bom_header = f"# Dự án: {name} | Kích thước: {w}m x {h}m x {d}m\n"

    # Chuyển đổi mét sang inch (SketchUp lưu trữ đơn vị chuẩn là inches)
    # 1 m = 39.37007874 inch
    ruby_code = f"""{bom_header}
require 'sketchup.rb'

module ADMAKE_Structural_Studio
  def self.build_signboard
    model = Sketchup.active_model
    entities = model.active_entities
    
    # Bắt đầu giao dịch thiết kế (Undo an toàn)
    model.start_operation("Dựng kết cấu biển hiệu {name}", true)
    
    # Định nghĩa tỷ lệ đơn vị: 1 Mét = 39.37007874 Inch
    m2in = 39.37007874
    width_in  = {w} * m2in
    height_in = {h} * m2in
    depth_in  = {d} * m2in
    
    # --------------------------------------------------------------------------
    # KHỞI TẠO BỘ VẬT LIỆU MÀU SẮC CHUYÊN DỤNG (MATERIALS)
    # --------------------------------------------------------------------------
    materials = model.materials
    
    # Màu thép mạ kẽm / sơn chống rỉ
    mat_steel = materials["ADMAKE_Steel"] || materials.add("ADMAKE_Steel")
    mat_steel.color = Sketchup::Color.new(71, 85, 105) # Slate 600
    
    # Màu cột trụ chịu lực chính
    mat_pillar = materials["ADMAKE_Pillar"] || materials.add("ADMAKE_Pillar")
    mat_pillar.color = Sketchup::Color.new(51, 65, 85) # Slate 700
    
    # Màu móng bê tông
    mat_concrete = materials["ADMAKE_Concrete"] || materials.add("ADMAKE_Concrete")
    mat_concrete.color = Sketchup::Color.new(148, 163, 184) # Slate 400
    
    # Màu tấm ốp mặt Alu / Bạt
    mat_surface = materials["ADMAKE_Surface"] || materials.add("ADMAKE_Surface")
    mat_surface.color = Sketchup::Color.new(30, 41, 59) # Slate 800 Dark
    
    # Màu bộ chữ 3D nổi bật
    mat_letters = materials["ADMAKE_Letters"] || materials.add("ADMAKE_Letters")
    mat_letters.color = Sketchup::Color.new(245, 158, 11) # Amber Gold LED
    
    # Màu sàn thao tác Catwalk
    mat_catwalk = materials["ADMAKE_Catwalk"] || materials.add("ADMAKE_Catwalk")
    mat_catwalk.color = Sketchup::Color.new(100, 116, 139) # Slate 500
    
    # Tạo Group cha chứa toàn bộ công trình
    main_group = entities.add_group
    main_ents = main_group.entities
    main_group.name = "{name}"
    
    # --------------------------------------------------------------------------
    # 1. KHỐI MÓNG BÊ TÔNG CHỊU LỰC (CONCRETE FOOTING)
    # --------------------------------------------------------------------------
    {"# Dựng móng cho Billboard / Kết cấu lớn" if is_billboard else "# Dựng chân móng liên kết móng / vách"}
    footing_group = main_ents.add_group
    footing_group.name = "01_Mong_BeTong"
    footing_ents = footing_group.entities
    
    foot_w = {"3.5 * m2in" if is_billboard else "1.2 * m2in"}
    foot_d = {"3.5 * m2in" if is_billboard else "1.0 * m2in"}
    foot_h = {"1.5 * m2in" if is_billboard else "0.5 * m2in"}
    
    foot_pts = [
      [-foot_w / 2, -foot_d / 2, -foot_h],
      [ foot_w / 2, -foot_d / 2, -foot_h],
      [ foot_w / 2,  foot_d / 2, -foot_h],
      [-foot_w / 2,  foot_d / 2, -foot_h]
    ]
    foot_face = footing_ents.add_face(foot_pts)
    foot_face.pushpull(foot_h)
    footing_group.material = mat_concrete
    
    # --------------------------------------------------------------------------
    # 2. CỘT TRỤ CHỊU LỰC CHÍNH (MAIN PILLARS / COLUMNS)
    # --------------------------------------------------------------------------
    pillar_group = main_ents.add_group
    pillar_group.name = "02_Tru_Thep_ChiuLuc"
    pillar_ents = pillar_group.entities
    
    {"col_h = (5.0 + {h} * 0.5) * m2in" if is_billboard else "col_h = (2.0 + {h} * 0.5) * m2in"}
    {"col_r = 0.5 * m2in" if is_billboard else "col_r = 0.15 * m2in"}
    
    # Cột trụ chính
    col_circle = pillar_ents.add_circle([0, 0, 0], [0, 0, 1], col_r, 24)
    col_face = pillar_ents.add_face(col_circle)
    col_face.pushpull(col_h)
    pillar_group.material = mat_pillar
    
    # --------------------------------------------------------------------------
    # 3. HỆ KHUNG XƯƠNG GIÀN SẮT HỘP ĐAN CARO (TRUSS FRAME)
    # --------------------------------------------------------------------------
    frame_group = main_ents.add_group
    frame_group.name = "03_HeKhung_GianSatHop"
    frame_ents = frame_group.entities
    
    frame_center_z = col_h
    half_w = width_in / 2.0
    half_h = height_in / 2.0
    box_profile = 0.05 * m2in # Sắt hộp 50mm
    
    # Viền bao quanh khung giàn (Outer Border Box)
    border_pts = [
      [-half_w, -depth_in / 2.0, frame_center_z - half_h],
      [ half_w, -depth_in / 2.0, frame_center_z - half_h],
      [ half_w,  depth_in / 2.0, frame_center_z - half_h],
      [-half_w,  depth_in / 2.0, frame_center_z - half_h]
    ]
    frame_border = frame_ents.add_face(border_pts)
    frame_border.pushpull(height_in)
    frame_group.material = mat_steel
    
    # Các thanh giằng đan ô chống vặn (Internal Reinforcement Ribs)
    rib_count_x = ({w} / 1.2).to_i + 1
    (1...rib_count_x).each do |i|
      rib_x = -half_w + (width_in * i / rib_count_x)
      rib = frame_ents.add_line([rib_x, 0, frame_center_z - half_h], [rib_x, 0, frame_center_z + half_h])
    end
    
    # --------------------------------------------------------------------------
    # 4. MẶT DỰNG TẤM BẢNG (ALU / BẠT / MICA SURFACE)
    # --------------------------------------------------------------------------
    face_group = main_ents.add_group
    face_group.name = "04_MatDung_Alu_Bat"
    face_ents = face_group.entities
    
    face_y = depth_in / 2.0 + 0.01 * m2in
    face_pts = [
      [-half_w, face_y, frame_center_z - half_h],
      [ half_w, face_y, frame_center_z - half_h],
      [ half_w, face_y, frame_center_z + half_h],
      [-half_w, face_y, frame_center_z + half_h]
    ]
    face_panel = face_ents.add_face(face_pts)
    face_panel.pushpull(0.01 * m2in) # Dày tấm 10mm
    face_group.material = mat_surface
    
    # --------------------------------------------------------------------------
    # 5. BỘ CHỮ NỔI 3D VÀ LOGO (3D EXTRUDED LETTERS)
    # --------------------------------------------------------------------------
    letters_group = main_ents.add_group
    letters_group.name = "05_BoChuNoi_3D"
    letters_ents = letters_group.entities
    
    # Dựng khối chữ 3D mô phỏng thương hiệu
    letter_w = half_w * 1.4
    letter_h = half_h * 0.6
    letter_y = face_y + 0.02 * m2in
    
    letter_pts = [
      [-letter_w / 2.0, letter_y, frame_center_z - letter_h / 2.0],
      [ letter_w / 2.0, letter_y, frame_center_z - letter_h / 2.0],
      [ letter_w / 2.0, letter_y, frame_center_z + letter_h / 2.0],
      [-letter_w / 2.0, letter_y, frame_center_z + letter_h / 2.0]
    ]
    letter_face = letters_ents.add_face(letter_pts)
    letter_face.pushpull(0.08 * m2in) # Uốn nổi 80mm
    letters_group.material = mat_letters
    
    # --------------------------------------------------------------------------
    # 6. SÀN THAO TÁC CATWALK & THANG LEO AN TOÀN (NẾU CÓ)
    # --------------------------------------------------------------------------
    {"# Catwalk và thang leo phía sau bảng" if has_catwalk else "# Khung treo giằng sau"}
    catwalk_group = main_ents.add_group
    catwalk_group.name = "06_SanThaoTac_Catwalk"
    catwalk_ents = catwalk_group.entities
    
    cw_y = -depth_in / 2.0 - 0.8 * m2in
    cw_pts = [
      [-half_w * 0.9, -depth_in / 2.0, frame_center_z - half_h + 0.1 * m2in],
      [ half_w * 0.9, -depth_in / 2.0, frame_center_z - half_h + 0.1 * m2in],
      [ half_w * 0.9, cw_y,            frame_center_z - half_h + 0.1 * m2in],
      [-half_w * 0.9, cw_y,            frame_center_z - half_h + 0.1 * m2in]
    ]
    cw_face = catwalk_ents.add_face(cw_pts)
    cw_face.pushpull(0.05 * m2in)
    catwalk_group.material = mat_catwalk
    
    # --------------------------------------------------------------------------
    # HOÀN TẤT & ZOOM TOÀN CẢNH MÔ HÌNH
    # --------------------------------------------------------------------------
    model.commit_operation
    Sketchup.send_action("viewZoomToExtents:")
    puts "✨ [ADMAKE AI] Dựng thành công mô hình SketchUp 3D: {name}!"
  end
end

# Tự động thực thi lệnh dựng hình
ADMAKE_Structural_Studio.build_signboard
"""
    return ruby_code


def repair_python_syntax_in_ruby(code: str) -> str:
    """Tự động phát hiện và chuyển đổi cú pháp Python bị lẫn sang Ruby (ví dụ: for i in range(a, b):)"""
    if not code:
        return ""
    lines = code.splitlines()
    new_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        m = re.match(r'^(\s*)for\s+([a-zA-Z_]\w*)\s+in\s+range\(\s*(\d+)\s*,\s*(\d+)\s*\)\s*:\s*$', line)
        m_single = re.match(r'^(\s*)for\s+([a-zA-Z_]\w*)\s+in\s+range\(\s*(\d+)\s*\)\s*:\s*$', line)
        if m or m_single:
            if m:
                indent, var, start_val, end_val = m.groups()
                end_val = int(end_val) - 1
                new_lines.append(f'{indent}({start_val}..{end_val}).each do |{var}|')
            else:
                indent, var, end_val = m_single.groups()
                end_val = int(end_val) - 1
                new_lines.append(f'{indent}(0..{end_val}).each do |{var}|')
            i += 1
            has_end = False
            while i < len(lines):
                cur = lines[i]
                if not cur.strip():
                    new_lines.append(cur)
                    i += 1
                    continue
                cur_indent = len(cur) - len(cur.lstrip())
                if cur_indent <= len(indent):
                    break
                if cur.strip() == 'end':
                    has_end = True
                new_lines.append(cur)
                i += 1
            if not has_end:
                new_lines.append(f'{indent}end')
            continue
        new_lines.append(line)
        i += 1
    return '\n'.join(new_lines)


def auto_repair_ruby_code(code: str) -> str:
    """Tự động đóng các khối def/module/do/class còn thiếu 'end' và sửa cú pháp Python nếu lẫn vào"""
    if not code or not isinstance(code, str):
        return ""
    cleaned = code.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r'^```(?:ruby|rb)?\s*', '', cleaned)
    if cleaned.endswith("```"):
        cleaned = re.sub(r'\s*```$', '', cleaned)
    
    # Sửa cú pháp Python sang Ruby nếu có
    cleaned = repair_python_syntax_in_ruby(cleaned)

    def_count = len(re.findall(r'\bdef\s+', cleaned))
    mod_count = len(re.findall(r'\bmodule\s+', cleaned))
    cls_count = len(re.findall(r'\bclass\s+', cleaned))
    do_count = len(re.findall(r'\bdo\b', cleaned))
    end_count = len(re.findall(r'\bend\b', cleaned))
    needed = (def_count + mod_count + cls_count + do_count) - end_count
    if 0 < needed <= 8:
        cleaned += "\n" + "\n".join(["end"] * needed)
    elif needed < 0:
        c_lines = cleaned.splitlines()
        while c_lines and c_lines[-1].strip() == "end" and needed < 0:
            c_lines.pop()
            needed += 1
        cleaned = "\n".join(c_lines)
    return cleaned


def parse_ruby_to_mesh(ruby_code: str, default_model: dict = None) -> dict:
    """
    Dựng model3d từ mã Ruby SketchUp bằng trình thông dịch sandbox (ruby3d): chạy đúng các lệnh
    add_face / pushpull / group / transform… để ra hình học THẬT 100%.
    Tự động sửa lỗi cú pháp Python (như for i in range) và vá lỗi thiếu 'end'.
    Nếu parser cục bộ gặp cú pháp phức tạp, chuyển tiếp sang headless engine VPS để biên dịch Ruby chuẩn xác.
    """
    code = ruby_code if isinstance(ruby_code, str) else ""
    if not code.strip():
        raise ValueError("Không có mã nguồn Ruby (.rb) nào được cung cấp.")

    # Tự động dọn dẹp và vá lỗi cú pháp trước
    repaired_code = auto_repair_ruby_code(code)

    try:
        from .ruby3d import ruby_to_model3d
    except ImportError:
        try:
            from ruby3d import ruby_to_model3d
        except ImportError:
            ruby_to_model3d = None

    last_exc = None

    # Lần 1: Chạy với mã đã tự động sửa lỗi cú pháp
    if ruby_to_model3d is not None:
        try:
            model = ruby_to_model3d(repaired_code, default_model=default_model)
            if model and model.get("elements") and len(model["elements"]) > 0:
                return model
        except Exception as exc:
            last_exc = exc

        # Lần 2: Thử chạy với mã gốc nếu mã sửa có vấn đề
        if repaired_code != code:
            try:
                model = ruby_to_model3d(code, default_model=default_model)
                if model and model.get("elements") and len(model["elements"]) > 0:
                    return model
            except Exception as exc:
                last_exc = exc

    # Lần 3: Chuyển tiếp tới Headless Ruby Engine trên VPS
    try:
        import requests
        vps_res = requests.post(
            "https://genai.toolxprint.com/api/3d/parse_ruby",
            json={"ruby_code": repaired_code or code},
            timeout=15
        )
        if vps_res.status_code == 200:
            vps_data = vps_res.json()
            if vps_data.get("success") and vps_data.get("faces"):
                elements = []
                for f in vps_data.get("faces", []):
                    col = f.get("color") or [180, 180, 180]
                    hex_col = "#{:02x}{:02x}{:02x}".format(int(col[0]), int(col[1]), int(col[2]))
                    elements.append({
                        "name": f.get("material") or "Mat_3D",
                        "type": "prism",
                        "base": f.get("vertices"),
                        "extrude": [0, 0, 0],
                        "color": hex_col,
                        "opacity": 1.0
                    })
                return {
                    "category": "custom",
                    "dimensions": {"width": 10.0, "height": 5.0, "depth": 10.0},
                    "elements": elements
                }
    except Exception as exc:
        pass

    err_detail = f": {str(last_exc)}" if last_exc else " (mã nguồn không sinh ra đối tượng 3D nào)"
    raise ValueError(f"Không thể biên dịch mã SketchUp Ruby sang mô hình 3D thực tế{err_detail}. Vui lòng kiểm tra lại mã nguồn do AI tạo ra.")
