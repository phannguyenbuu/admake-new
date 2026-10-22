# -*- coding: utf-8 -*-
"""
Pipeline tái thiết lập AI Studio từ đầu - TUYỆT ĐỐI KHÔNG FALLBACK:
1. Xóa toàn bộ file .obj và .mtl đã sinh ra trước đó (Downloads, frontend, backend).
2. Xóa toàn bộ 31 file .rb do pipeline cũ tự ý fallback sinh ra.
3. Chỉ quét và xử lý các file .rb THỰC SỰ có sẵn:
   - Dùng Ruby Sandbox phân tích.
   - NẾU và CHỈ NẾU mã .rb sinh ra được các cấu kiện 3D thực tế (elements > 0) -> Xuất ra .obj và .mtl chuẩn.
   - NẾU KHÔNG CÓ .rb hoặc .rb không sinh ra elements -> TUYỆT ĐỐI KHÔNG FALLBACK, KHÔNG TẠO OBJ GIẢ.
4. Cập nhật signs_catalog.json chính xác (chỉ gán obj_url khi thực sự có file .obj).
5. Đồng bộ hóa sạch sẽ sang frontend/public/signs và backend/static/signs.
"""

import os
import sys
import re
import json
import shutil
import math

SRC_DIR = r"C:\Users\nguyenbuu.DESKTOP-TOEFTR1\Downloads\sản phẩm"
FRONTEND_SIGNS_DIR = os.path.abspath(r"frontend\public\signs")
BACKEND_SIGNS_DIR = os.path.abspath(r"backend\static\signs")

sys.path.insert(0, os.path.abspath("backend"))
from api.ruby3d.export import ruby_to_model3d

def slugify(text):
    text = text.lower()
    replacements = {
        'à':'a','á':'a','ả':'a','ã':'a','ạ':'a','ă':'a','ằ':'a','ắ':'a','ẳ':'a','ẵ':'a','ặ':'a',
        'â':'a','ầ':'a','ấ':'a','ẩ':'a','ẫ':'a','ậ':'a',
        'è':'e','é':'e','ẻ':'e','ẽ':'e','ẹ':'e','ê':'e','ề':'e','ế':'e','ể':'e','ễ':'e','ệ':'e',
        'ì':'i','í':'i','ỉ':'i','ĩ':'i','ị':'i',
        'ò':'o','ó':'o','ỏ':'o','õ':'o','ọ':'o','ô':'o','ồ':'o','ố':'o','ổ':'o','ỗ':'o','ộ':'o',
        'ơ':'o','ờ':'o','ớ':'o','ở':'o','ỡ':'o','ợ':'o',
        'ù':'u','ú':'u','ủ':'u','ũ':'u','ụ':'u','ư':'u','ừ':'u','ứ':'u','ử':'u','ữ':'u','ự':'u',
        'ỳ':'y','ý':'y','ỷ':'y','ỹ':'y','ỵ':'y',
        'đ':'d'
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    text = re.sub(r'[^a-z0-9]+', '_', text).strip('_')
    return text

def triangulate_polygon_3d(pts):
    if len(pts) < 3: return []
    if len(pts) == 3: return [(0, 1, 2)]
    if len(pts) == 4: return [(0, 1, 2), (0, 2, 3)]
    
    # Simple ear clipping
    indices = list(range(len(pts)))
    tris = []
    
    # Calculate approximate normal
    def cross(a, b):
        return [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]]
    def dot(a, b):
        return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]
        
    v0 = [pts[1][i] - pts[0][i] for i in range(3)]
    v1 = [pts[2][i] - pts[0][i] for i in range(3)]
    normal = cross(v0, v1)
    
    while len(indices) > 2:
        ear_found = False
        n = len(indices)
        for i in range(n):
            prev_i = indices[(i - 1) % n]
            curr_i = indices[i]
            next_i = indices[(i + 1) % n]
            
            p0 = pts[prev_i]
            p1 = pts[curr_i]
            p2 = pts[next_i]
            
            cp = cross([p1[j] - p0[j] for j in range(3)], [p2[j] - p1[j] for j in range(3)])
            if dot(cp, normal) >= -1e-6:
                tris.append((prev_i, curr_i, next_i))
                indices.pop(i)
                ear_found = True
                break
        if not ear_found:
            for i in range(1, len(indices) - 1):
                tris.append((indices[0], indices[i], indices[i + 1]))
            break
    return tris

def model3d_to_obj_mtl(m3d, obj_name):
    elements = m3d.get('elements', [])
    vertices = []
    materials = {}
    obj_groups = []
    
    for el in elements:
        name = el.get('name', 'Part')
        el_type = el.get('type', 'box')
        color = el.get('color', '#38bdf8')
        
        mat_key = f"Mat_{slugify(color)}"
        if mat_key not in materials:
            c = color.lstrip('#')
            if len(c) == 6:
                r, g, b = int(c[0:2], 16)/255.0, int(c[2:4], 16)/255.0, int(c[4:6], 16)/255.0
            else:
                r, g, b = 0.7, 0.7, 0.7
            materials[mat_key] = (r, g, b)
            
        faces = []
        if el_type == 'prism':
            base = el.get('base', [])
            extrude = el.get('extrude', [0, 0, 0.1])
            if len(base) < 3: continue
            cur_start = len(vertices) + 1
            nb = len(base)
            for pt in base: vertices.append(pt)
            for pt in base: vertices.append([pt[0] + extrude[0], pt[1] + extrude[1], pt[2] + extrude[2]])
            
            b_tris = triangulate_polygon_3d(base)
            for t in b_tris:
                faces.append((cur_start + t[2], cur_start + t[1], cur_start + t[0]))
            for t in b_tris:
                faces.append((cur_start + nb + t[0], cur_start + nb + t[1], cur_start + nb + t[2]))
            
            extrude_len = math.hypot(*extrude)
            if extrude_len > 1e-5:
                for i in range(nb):
                    j = (i + 1) % nb
                    v_b1 = cur_start + i
                    v_b2 = cur_start + j
                    v_t2 = cur_start + nb + j
                    v_t1 = cur_start + nb + i
                    faces.append((v_b1, v_b2, v_t2))
                    faces.append((v_b1, v_t2, v_t1))
                    
        elif el_type == 'box':
            pos = el.get('position', [0, 0, 0])
            scale = el.get('scale', [1, 1, 1])
            dx, dy, dz = scale[0] * 0.5, scale[1] * 0.5, scale[2] * 0.5
            cx, cy, cz = pos
            cur_start = len(vertices) + 1
            box_v = [
                [cx - dx, cy - dy, cz - dz], [cx + dx, cy - dy, cz - dz],
                [cx + dx, cy + dy, cz - dz], [cx - dx, cy + dy, cz - dz],
                [cx - dx, cy - dy, cz + dz], [cx + dx, cy - dy, cz + dz],
                [cx + dx, cy + dy, cz + dz], [cx - dx, cy + dy, cz + dz],
            ]
            for v in box_v: vertices.append(v)
            box_faces = [
                (0, 2, 1), (0, 3, 2), (4, 5, 6), (4, 6, 7),
                (0, 1, 5), (0, 5, 4), (3, 6, 2), (3, 7, 6),
                (0, 4, 7), (0, 7, 3), (1, 2, 6), (1, 6, 5)
            ]
            for f in box_faces: faces.append((cur_start + f[0], cur_start + f[1], cur_start + f[2]))
            
        elif el_type == 'cylinder':
            pos = el.get('position', [0, 0, 0])
            scale = el.get('scale', [1, 1, 1])
            rx, h, rz = scale[0] * 0.5, scale[1], scale[2] * 0.5
            cx, cy, cz = pos
            cur_start = len(vertices) + 1
            segs = 20
            for s in range(segs):
                ang = 2 * math.pi * s / segs
                vertices.append([cx + rx * math.cos(ang), cy - h * 0.5, cz + rz * math.sin(ang)])
            for s in range(segs):
                ang = 2 * math.pi * s / segs
                vertices.append([cx + rx * math.cos(ang), cy + h * 0.5, cz + rz * math.sin(ang)])
            v_bc = len(vertices) + 1
            vertices.append([cx, cy - h * 0.5, cz])
            v_tc = len(vertices) + 1
            vertices.append([cx, cy + h * 0.5, cz])
            for s in range(segs):
                s2 = (s + 1) % segs
                v_b1 = cur_start + s
                v_b2 = cur_start + s2
                v_t1 = cur_start + segs + s
                v_t2 = cur_start + segs + s2
                faces.append((v_bc, v_b2, v_b1))
                faces.append((v_tc, v_t1, v_t2))
                faces.append((v_b1, v_b2, v_t2))
                faces.append((v_b1, v_t2, v_t1))
                
        if faces:
            obj_groups.append({'name': slugify(name), 'material': mat_key, 'faces': faces})

    obj_lines = [
        f"# Wavefront OBJ generated by ADMAKE 3D Studio (Authentic Geometry)",
        f"mtllib {obj_name}.mtl",
        f"o {obj_name}",
        ""
    ]
    for v in vertices: obj_lines.append(f"v {v[0]:.4f} {v[1]:.4f} {v[2]:.4f}")
    obj_lines.append("")
    for grp in obj_groups:
        obj_lines.append(f"g {grp['name']}")
        obj_lines.append(f"usemtl {grp['material']}")
        for f in grp['faces']:
            obj_lines.append(f"f {f[0]} {f[1]} {f[2]}")
        obj_lines.append("")
        
    mtl_lines = ["# Wavefront Material Library generated by ADMAKE 3D Studio", ""]
    for m_name, (r, g, b) in materials.items():
        mtl_lines.append(f"newmtl {m_name}")
        mtl_lines.append(f"Kd {r:.4f} {g:.4f} {b:.4f}")
        mtl_lines.append("Ka 0.2000 0.2000 0.2000")
        mtl_lines.append("Ks 0.1000 0.1000 0.1000")
        mtl_lines.append("d 1.0")
        mtl_lines.append("illum 2")
        mtl_lines.append("")
        
    return "\n".join(obj_lines), "\n".join(mtl_lines)

def run():
    print("=" * 70)
    print("BƯỚC 1: XÓA SẠCH DỮ LIỆU OBJ & MTL VÀ FILE RB FALLBACK")
    print("=" * 70)

    # 1.1 Xóa tất cả .obj và .mtl trong Downloads/sản phẩm
    sp_files = os.listdir(SRC_DIR)
    del_obj_cnt = 0
    del_mtl_cnt = 0
    del_rb_cnt = 0
    
    for f in sp_files:
        full = os.path.join(SRC_DIR, f)
        if f.endswith('.obj'):
            os.remove(full)
            del_obj_cnt += 1
        elif f.endswith('.mtl'):
            os.remove(full)
            del_mtl_cnt += 1
        elif f.endswith('.rb'):
            with open(full, 'r', encoding='utf-8', errors='ignore') as fp:
                c = fp.read()
            # Xóa các file .rb do pipeline fallback cũ tự tạo
            if 'Sign_' in c and 'def build\n    model = Sketchup.active_model\n    model.start_operation(\'Build ' in c:
                os.remove(full)
                del_rb_cnt += 1
                print(f"  [ĐÃ XÓA RB FALLBACK]: {f}")

    print(f"Đã xóa khỏi {SRC_DIR}: {del_obj_cnt} .obj, {del_mtl_cnt} .mtl, {del_rb_cnt} .rb fallback.")

    # 1.2 Dọn dẹp thư mục frontend và backend signs
    for target_dir in [FRONTEND_SIGNS_DIR, BACKEND_SIGNS_DIR]:
        if os.path.exists(target_dir):
            for f in os.listdir(target_dir):
                full = os.path.join(target_dir, f)
                try:
                    if f.endswith('.obj') or f.endswith('.mtl'):
                        os.remove(full)
                    elif f.endswith('.rb'):
                        with open(full, 'r', encoding='utf-8', errors='ignore') as fp:
                            c = fp.read()
                        if 'Sign_' in c and 'def build\n    model = Sketchup.active_model\n    model.start_operation(\'Build ' in c:
                            os.remove(full)
                except Exception:
                    pass

    print("=" * 70)
    print("BƯỚC 2: PHÂN TÍCH CHỈ CÁC FILE .RB THỰC SỰ - TUYỆT ĐỐI KHÔNG FALLBACK")
    print("=" * 70)

    # Lấy danh sách ảnh sản phẩm
    img_exts = ('.jpg', '.jpeg', '.png', '.webp', '.jfif')
    images = [f for f in sorted(os.listdir(SRC_DIR)) if os.path.splitext(f)[1].lower() in img_exts]
    print(f"Tổng số ảnh sản phẩm: {len(images)}")

    catalog = []
    generated_obj_count = 0
    no_3d_count = 0

    for idx, img in enumerate(images):
        base = os.path.splitext(img)[0]
        rb_path = os.path.join(SRC_DIR, f"{base}.rb")
        has_real_rb = os.path.exists(rb_path)

        m3d = None
        clean_rb_code = ""

        if has_real_rb:
            with open(rb_path, 'r', encoding='utf-8', errors='ignore') as fp:
                clean_rb_code = fp.read()

            # Sửa regex literal nếu có
            clean_rb_code = re.sub(r'\.gsub\s*\(\s*/[^/]+/\s*,\s*["\'][^"\']*["\']\s*\)', '.tr(" ", "_")', clean_rb_code)

            # Đảm bảo gọi hàm thực thi nếu module chưa được gọi
            m = re.search(r'module\s+([A-Za-z0-9_]+)', clean_rb_code)
            mod_name = m.group(1) if m else None
            if mod_name and f'{mod_name}.' not in clean_rb_code and f'include {mod_name}' not in clean_rb_code:
                if 'def build' in clean_rb_code:
                    clean_rb_code += f'\n{mod_name}.build\n'
                elif 'def create_sign' in clean_rb_code:
                    clean_rb_code += f'\n{mod_name}.create_sign\n'
                elif 'def run' in clean_rb_code:
                    clean_rb_code += f'\n{mod_name}.run\n'

            try:
                m3d = ruby_to_model3d(clean_rb_code, max_seconds=3.0)
            except Exception as e:
                m3d = None

        elements = m3d.get('elements', []) if m3d else []
        safe_name = slugify(base)

        # TUYỆT ĐỐI KHÔNG FALLBACK: Nếu elements rỗng, KHÔNG tạo OBJ
        if len(elements) > 0:
            obj_text, mtl_text = model3d_to_obj_mtl(m3d, safe_name)
            
            obj_fname = f"{base}.obj"
            mtl_fname = f"{base}.mtl"
            
            # Ghi ra thư mục gốc Downloads
            with open(os.path.join(SRC_DIR, obj_fname), 'w', encoding='utf-8') as f:
                f.write(obj_text)
            with open(os.path.join(SRC_DIR, mtl_fname), 'w', encoding='utf-8') as f:
                f.write(mtl_text)

            dims = m3d.get('dimensions', {'width': 3.0, 'height': 1.2, 'depth': 0.2})
            category = m3d.get('category', 'storefront')
            badge = m3d.get('category_label', 'Bảng hiệu mặt tiền')

            catalog_item = {
                'id': safe_name,
                'image_filename': img,
                'image_url': f"/signs/{img}",
                'rb_filename': f"{base}.rb",
                'rb_url': f"/signs/{base}.rb",
                'obj_filename': obj_fname,
                'obj_url': f"/signs/{obj_fname}",
                'mtl_filename': mtl_fname,
                'mtl_url': f"/signs/{mtl_fname}",
                'title': base,
                'description': f"Mô hình 3D thực tế {base}, gồm {len(elements)} cấu kiện được dựng bằng mã SketchUp Ruby.",
                'category': category,
                'badge': badge,
                'has_3d': True,
                'dimensions': dims,
                'materials': {
                    'iron_type': 'vuong_25',
                    'surface_type': 'alu_3mm',
                    'has_led': True,
                    'has_sheet_backing': True
                },
                'elements': elements,
                'ruby_code': clean_rb_code,
                'prompt': f"Bảng hiệu {base}, phối cảnh thực tế sắc nét 4K."
            }
            generated_obj_count += 1
            print(f"[{idx+1}/{len(images)}] [3D OBJ THẬT] {base} ({len(elements)} cấu kiện, {len(obj_text)}B obj)")
        else:
            # SẢN PHẨM KHÔNG CÓ .RB HOẶC .RB KHÔNG CÓ MÔ HÌNH HỢP LỆ: KHÔNG TẠO OBJ
            catalog_item = {
                'id': safe_name,
                'image_filename': img,
                'image_url': f"/signs/{img}",
                'rb_filename': f"{base}.rb" if has_real_rb else None,
                'rb_url': f"/signs/{base}.rb" if has_real_rb else None,
                'obj_filename': None,
                'obj_url': None,
                'mtl_filename': None,
                'mtl_url': None,
                'title': base,
                'description': f"Hình ảnh thiết kế mẫu {base}.",
                'category': 'storefront',
                'badge': 'Mẫu thiết kế',
                'has_3d': False,
                'dimensions': {'width': 3.0, 'height': 1.2, 'depth': 0.05},
                'materials': {
                    'iron_type': 'vuong_25',
                    'surface_type': 'alu_3mm',
                    'has_led': False,
                    'has_sheet_backing': False
                },
                'elements': [],
                'ruby_code': clean_rb_code if has_real_rb else "",
                'prompt': f"Bảng hiệu {base}, phối cảnh thực tế sắc nét 4K."
            }
            no_3d_count += 1
            print(f"[{idx+1}/{len(images)}] [ẢNH GỐC - KHÔNG OBJ] {base}")

        catalog.append(catalog_item)

    print("=" * 70)
    print("BƯỚC 3: ĐỒNG BỘ DỮ LIỆU SANG FRONTEND VÀ BACKEND")
    print("=" * 70)

    for target_dir in [FRONTEND_SIGNS_DIR, BACKEND_SIGNS_DIR]:
        os.makedirs(target_dir, exist_ok=True)
        # Xóa các file cũ trong target_dir
        for old_f in os.listdir(target_dir):
            old_p = os.path.join(target_dir, old_f)
            try:
                if os.path.isfile(old_p): os.remove(old_p)
                elif os.path.isdir(old_p): shutil.rmtree(old_p)
            except Exception:
                pass

        # Copy các file của catalog
        for item in catalog:
            # Copy ảnh
            img_src = os.path.join(SRC_DIR, item['image_filename'])
            if os.path.exists(img_src):
                shutil.copy2(img_src, os.path.join(target_dir, item['image_filename']))
            # Copy rb nếu có
            if item.get('rb_filename'):
                rb_src = os.path.join(SRC_DIR, item['rb_filename'])
                if os.path.exists(rb_src):
                    shutil.copy2(rb_src, os.path.join(target_dir, item['rb_filename']))
            # Copy obj nếu có
            if item.get('obj_filename'):
                obj_src = os.path.join(SRC_DIR, item['obj_filename'])
                if os.path.exists(obj_src):
                    shutil.copy2(obj_src, os.path.join(target_dir, item['obj_filename']))
            # Copy mtl nếu có
            if item.get('mtl_filename'):
                mtl_src = os.path.join(SRC_DIR, item['mtl_filename'])
                if os.path.exists(mtl_src):
                    shutil.copy2(mtl_src, os.path.join(target_dir, item['mtl_filename']))

        # Ghi signs_catalog.json
        cat_file = os.path.join(target_dir, "signs_catalog.json")
        with open(cat_file, 'w', encoding='utf-8') as f:
            json.dump(catalog, f, ensure_ascii=False, indent=2)

    print(f"Tổng kết:")
    print(f" - Tổng sản phẩm: {len(catalog)}")
    print(f" - Sản phẩm có mô hình 3D OBJ THẬT: {generated_obj_count}")
    print(f" - Sản phẩm không có 3D (giữ ảnh thiết kế gốc, không fallback): {no_3d_count}")
    print(f" - Dữ liệu đã được ghi chuẩn xác vào:")
    print(f"   + {FRONTEND_SIGNS_DIR}")
    print(f"   + {BACKEND_SIGNS_DIR}")

if __name__ == "__main__":
    run()
