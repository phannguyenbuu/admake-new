# -*- coding: utf-8 -*-
"""
Script quét thư mục C:\\Users\\nguyenbuu.DESKTOP-TOEFTR1\\Downloads\\signs,
ghép từng file ảnh với file mã nguồn Ruby (.rb) tương ứng,
parse các tham số kết cấu thực tế và sinh catalog JSON chuẩn cho Admake 3D Studio.
"""

import os
import re
import json

SIGNS_DIR = r"C:\Users\nguyenbuu.DESKTOP-TOEFTR1\Downloads\signs"
OUTPUT_PATHS = [
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "signs", "signs_catalog.json"),
    os.path.abspath(r"D:\Dropbox\_Documents\Admake\frontend\public\signs\signs_catalog.json"),
]

def parse_full_rb(content: str, img_name: str) -> dict:
    lines = content.split('\n')
    header_lines = []
    for l in lines[:30]:
        clean = l.strip().lstrip('#').strip('=-* ').strip()
        if clean and not clean.startswith('frozen_string') and not clean.startswith('require') and not clean.startswith('module') and not clean.startswith('extend'):
            header_lines.append(clean)

    title = header_lines[0] if header_lines else os.path.splitext(img_name)[0]
    desc = ' - '.join(header_lines[1:4]) if len(header_lines) > 1 else 'Mô hình kết cấu biển hiệu 3D'

    # Width
    m_w = re.search(r'\b(?:BOARD_WIDTH|BOARD_W|SIGN_WIDTH|SIGN_W|WIDTH|TOTAL_WIDTH)\s*=\s*([\d\.]+)', content)
    # Height
    m_h = re.search(r'\b(?:BOARD_HEIGHT|BOARD_H|SIGN_HEIGHT|SIGN_H|HEIGHT|TOTAL_HEIGHT)\s*=\s*([\d\.]+)', content)
    # Depth
    m_d = re.search(r'\b(?:BOARD_DEPTH|BOARD_D|SIGN_DEPTH|SIGN_T|SIGN_THICKNESS|DEPTH|FRAME_DEPTH)\s*=\s*([\d\.]+)', content)
    # Column
    m_col_r = re.search(r'\b(?:POST_RADIUS|COLUMN_RADIUS|COL_RADIUS)\s*=\s*([\d\.]+)', content)
    m_col_h = re.search(r'\b(?:POST_HEIGHT|BOARD_BOTTOM|SIGN_BOTTOM|COLUMN_TOP_Z|CENTER_Z)\s*=\s*([\d\.]+)', content)

    w = float(m_w.group(1)) if m_w else 6.0
    h = float(m_h.group(1)) if m_h else 2.5
    d = float(m_d.group(1)) if m_d else 0.25
    col_r = float(m_col_r.group(1)) if m_col_r else 0.0
    col_h = float(m_col_h.group(1)) if m_col_h else 0.0

    if w == 0.0: w = 6.0
    if h == 0.0: h = 2.5

    # Phân loại
    is_multi_col = ('COLUMN_X = [' in content) or ('[-' in content and 'COLUMN' in content)
    if col_r > 0 or col_h > 3.0 or w >= 10.0 or 'billboard' in title.lower() or 'tru' in desc.lower():
        category = 'billboard'
        badge = 'Billboard 2 Cột' if is_multi_col else 'Billboard 1 Cột'
    elif w <= 1.8 and h <= 1.2:
        category = 'mini'
        badge = 'Biển Vẫy / Hộp Đèn'
    else:
        category = 'storefront'
        badge = 'Bảng Hiệu Mặt Tiền'

    # Tạo Elements 3D
    elements = []
    # Cột trụ
    if col_r > 0 or col_h > 0 or category == 'billboard':
        cr = col_r if col_r > 0 else 0.45
        ch = col_h if col_h > 0 else round(h * 1.5, 2)
        if is_multi_col:
            elements.append({
                'name': f'Trụ thép chịu lực bên trái Ø{int(cr*2000)}mm',
                'type': 'cylinder',
                'position': [-round(w * 0.28, 2), -round(ch * 0.5, 2), 0],
                'scale': [cr * 2, ch, cr * 2],
                'color': '#334155'
            })
            elements.append({
                'name': f'Trụ thép chịu lực bên phải Ø{int(cr*2000)}mm',
                'type': 'cylinder',
                'position': [round(w * 0.28, 2), -round(ch * 0.5, 2), 0],
                'scale': [cr * 2, ch, cr * 2],
                'color': '#334155'
            })
            elements.append({
                'name': 'Móng bê tông đôi liên kết',
                'type': 'box',
                'position': [0, -round(ch, 2) - 0.3, 0],
                'scale': [round(w * 0.75, 2), 0.7, round(cr * 4, 2)],
                'color': '#94a3b8'
            })
        else:
            elements.append({
                'name': f'Trụ thép tròn chịu lực Ø{int(cr*2000)}mm',
                'type': 'cylinder',
                'position': [0, -round(ch * 0.5, 2), 0],
                'scale': [cr * 2, ch, cr * 2],
                'color': '#334155'
            })
            elements.append({
                'name': 'Móng bê tông cốt thép',
                'type': 'box',
                'position': [0, -round(ch, 2) - 0.3, 0],
                'scale': [round(cr * 4, 2), 0.7, round(cr * 4, 2)],
                'color': '#94a3b8'
            })

    # Khung giàn
    elements.append({
        'name': f'Khung giàn sắt hộp {w}m x {h}m',
        'type': 'box',
        'position': [0, 0, 0],
        'scale': [w, h, round(d * 0.6, 3)],
        'color': '#475569'
    })

    # Mặt bảng
    face_z = round(d * 0.35, 3)
    elements.append({
        'name': f'Mặt pano bảng hiệu ({w}m x {h}m)',
        'type': 'box',
        'position': [0, 0, face_z],
        'scale': [round(w * 0.99, 2), round(h * 0.99, 2), 0.015],
        'color': '#1e293b' if 'alu' in title.lower() else '#f8fafc'
    })

    # Bộ chữ nổi
    elements.append({
        'name': 'Bộ chữ 3D thương hiệu nổi bật',
        'type': 'box',
        'position': [0, round(h * 0.08, 2), round(face_z + 0.05, 3)],
        'scale': [round(w * 0.65, 2), round(h * 0.3, 2), 0.06],
        'color': '#f59e0b'
    })

    # Catwalk nếu có
    if 'catwalk' in content.lower() or category == 'billboard' or w >= 8:
        elements.append({
            'name': 'Sàn thao tác Catwalk bảo trì',
            'type': 'box',
            'position': [0, -round(h * 0.45, 2), -round(d * 0.5, 2)],
            'scale': [round(w * 0.95, 2), 0.08, 0.85],
            'color': '#64748b'
        })

    # Thang leo nếu có
    if 'ladder' in content.lower() or 'thang' in content.lower() or category == 'billboard':
        elements.append({
            'name': 'Thang leo kỹ thuật an toàn',
            'type': 'box',
            'position': [round(w * 0.45, 2), -round(ch * 0.5, 2) if col_h > 0 else -round(h * 0.4, 2), 0],
            'scale': [0.45, ch if col_h > 0 else round(h * 0.8, 2), 0.1],
            'color': '#334155'
        })

    # Biển vẫy thì thêm chân bát
    if category == 'mini':
        elements.insert(0, {
            'name': 'Chân bát chữ L gắn tường',
            'type': 'box',
            'position': [-round(w * 0.52, 2), 0, 0],
            'scale': [0.06, round(h * 0.8, 2), round(d * 1.2, 2)],
            'color': '#0f172a'
        })

    return {
        'title': title,
        'description': desc,
        'category': category,
        'badge': badge,
        'dimensions': {'width': w, 'height': h, 'depth': d},
        'elements': elements,
        'materials': {
            'iron_type': 'vuong_30' if w >= 8 else 'vuong_25',
            'surface_type': 'bat_3m_uv' if category == 'billboard' else 'alu_3mm',
            'has_led': True,
            'has_sheet_backing': True
        }
    }

def build_catalog():
    if not os.path.exists(SIGNS_DIR):
        print(f"Directory not found: {SIGNS_DIR}")
        return []

    files = os.listdir(SIGNS_DIR)
    images = [f for f in files if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.jfif'))]
    rbs = [f for f in files if f.lower().endswith('.rb')]

    catalog = []
    for img in sorted(images):
        name_no_ext = os.path.splitext(img)[0]
        target = f"{name_no_ext}_chatgpt.rb"
        matched_rb = target if target in rbs else next((r for r in rbs if name_no_ext in r), None)

        if matched_rb:
            rb_path = os.path.join(SIGNS_DIR, matched_rb)
            with open(rb_path, 'r', encoding='utf-8', errors='ignore') as fp:
                ruby_code = fp.read()

            parsed = parse_full_rb(ruby_code, img)

            # Dựng hình học 3D thật từ Ruby Sandbox Interpreter
            real_elements = parsed['elements']
            real_dims = parsed['dimensions']
            try:
                from .ruby3d import ruby_to_model3d
            except Exception:
                from ruby3d import ruby_to_model3d
            try:
                m3d = ruby_to_model3d(ruby_code)
                if m3d.get('elements') and len(m3d['elements']) > 0:
                    real_elements = m3d['elements']
                    if m3d.get('dimensions'):
                        real_dims = m3d['dimensions']
            except Exception as ex:
                print(f"Warning: could not parse {matched_rb} with ruby3d: {ex}")

            item = {
                'id': name_no_ext,
                'image_filename': img,
                'image_url': f'/signs/{img}',
                'rb_filename': matched_rb,
                'rb_url': f'/signs/{matched_rb}',
                'title': parsed['title'],
                'description': parsed['description'],
                'category': parsed['category'],
                'badge': parsed['badge'],
                'dimensions': real_dims,
                'materials': parsed['materials'],
                'elements': real_elements,
                'ruby_code': ruby_code,
                'prompt': f"Biển hiệu {parsed['title']}, kích thước {real_dims.get('width', 6.0)}m x {real_dims.get('height', 2.5)}m, kết cấu khung giàn thép tiêu chuẩn SketchUp."
            }
            catalog.append(item)

    print(f"Parsed {len(catalog)} sign samples with full 3D geometry.")

    for out_p in OUTPUT_PATHS:
        try:
            os.makedirs(os.path.dirname(out_p), exist_ok=True)
            with open(out_p, 'w', encoding='utf-8') as fp:
                json.dump(catalog, fp, ensure_ascii=False, indent=2)
            print(f"Saved: {out_p}")
        except Exception as e:
            print(f"Error saving to {out_p}: {e}")

    return catalog

if __name__ == "__main__":
    build_catalog()
