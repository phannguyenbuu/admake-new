# -*- coding: utf-8 -*-
"""
Pipeline Tái Sinh Toàn Bộ 79 Sản Phẩm Bằng API Key Đa Luồng (ThreadPoolExecutor):
- Chạy lại từ đầu toàn bộ 79 sản phẩm:
  + Dùng GPT-4o-mini với prompt chuyên gia 3D SketchUp Ruby.
  + Mỗi sản phẩm có response.txt và file .rb riêng biệt, đúng chuẩn tên sản phẩm.
  + Kiểm tra biên dịch thực tế qua sandbox ruby_to_model3d.
  + Xuất OBJ + MTL đầy đủ hình học đỉnh và mặt.
- Cập nhật signs_catalog.json và đồng bộ sang frontend & backend.
- Build và deploy lên VPS.
"""

import os
import sys
import re
import json
import time
import math
import shutil
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.abspath('backend'))
from api.ruby3d.export import ruby_to_model3d

SRC_DIR = r"C:\Users\nguyenbuu.DESKTOP-TOEFTR1\Downloads\sản phẩm"
FRONTEND_SIGNS_DIR = os.path.abspath(r"frontend\public\signs")
BACKEND_SIGNS_DIR = os.path.abspath(r"backend\static\signs")

# Đọc GPT Key từ D:\vps_go.md
def get_gpt_key():
    key = os.getenv("OPENAI_API_KEY", "")
    vps_paths = [r"D:\vps_go.md", "./vps_go.md", "/opt/vps_go.md"]
    for p in vps_paths:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    lines = [l.strip() for l in f.readlines()]
                    for i, l in enumerate(lines):
                        if l == "[GPTKey]" and i + 1 < len(lines):
                            return lines[i + 1]
            except Exception:
                pass
    return key

GPT_KEY = get_gpt_key()
if not GPT_KEY:
    raise RuntimeError("Không tìm thấy GPTKey trong D:\\vps_go.md")

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

def sanitize_module_name(title):
    slug = slugify(title)
    words = [w.capitalize() for w in slug.split('_') if w]
    name = "".join(words)
    if not name or not name[0].isalpha():
        name = "Sign" + name
    return name

def infer_dimensions(title):
    nums = re.findall(r'(\d+)\s*(?:x|\*)\s*(\d+)(?:\s*(?:x|\*)\s*(\d+))?', title, re.IGNORECASE)
    if nums:
        parts = [int(p) for p in nums[0] if p]
        if len(parts) == 2:
            w, h = parts
            if w <= 100 and h <= 100:
                return w * 10, h * 10, 20
            elif w < 2000 and h < 2000:
                if w < 500 and h < 500 and (w > 100 or h > 100):
                    return w * 10, h * 10, 30
                return w * 10, h * 10, 150
            else:
                return w * 10, h * 10, 200
        elif len(parts) == 3:
            return parts[0] * 10, parts[1] * 10, parts[2] * 10
    low = title.lower()
    if 'menu' in low or 'a4' in low: return 210, 297, 10
    if 'tem' in low or 'phiếu' in low or 'voucher' in low: return 200, 100, 2
    if 'chức danh' in low or 'tên công ty' in low or 'tên phòng' in low: return 300, 150, 40
    if 'số nhà' in low: return 300, 200, 25
    if 'qr' in low: return 120, 180, 50
    if 'standee' in low: return 600, 1600, 400
    if 'quầy' in low or 'kiot' in low or 'xe' in low: return 1500, 700, 1200
    if 'tranh điện' in low: return 600, 900, 20
    if 'chữ' in low: return 1200, 400, 60
    return 3000, 1000, 150

def extract_ruby_clean(content):
    matches = re.findall(r'```(?:ruby|rb)?\s*([\s\S]*?)```', content, re.IGNORECASE)
    if matches:
        candidates = [m.strip() for m in matches if 'module ' in m or 'def ' in m]
        if candidates:
            return max(candidates, key=len)
    mod_matches = list(re.finditer(r'module\s+([A-Za-z0-9_]+)', content))
    if not mod_matches:
        return ""
    last_mod = mod_matches[-1]
    mod_name = last_mod.group(1)
    start_pos = last_mod.start()
    comment_start = content.rfind('# ===', 0, start_pos)
    if comment_start != -1 and (start_pos - comment_start) < 500:
        start_pos = comment_start
    sub = content[start_pos:]
    call_markers = [f"{mod_name}.build", f"{mod_name}.create_sign", f"{mod_name}.run", f"{mod_name}.main", f"{mod_name}.generate"]
    end_pos = -1
    for cm in call_markers:
        idx = sub.rfind(cm)
        if idx != -1:
            end_pos = idx + len(cm)
            break
    if end_pos != -1:
        code = sub[:end_pos].strip()
    else:
        prose_markers = [
            'Cách chạy trong SketchUp', 'CÁCH CHẠY TRONG SKETCHUP', 'Lưu ý kỹ thuật',
            'Hướng dẫn sử dụng', 'Thông số mô hình', 'Cấu kiện', '--- PHẢN HỒI',
            'Mở SketchUp', 'Sao chép mã', '```'
        ]
        min_p = len(sub)
        for pm in prose_markers:
            idx = sub.find(pm)
            if idx != -1 and idx > 100:
                min_p = min(min_p, idx)
        code = sub[:min_p].strip()
        last_end = code.rfind('end')
        if last_end != -1:
            code = code[:last_end + 3]
    return code.strip()

def sanitize_and_prepare_ruby(code):
    clean = re.sub(r'\.gsub\s*\(\s*/[^/]+/\s*,\s*["\'][^"\']*["\']\s*\)', '.tr(" ", "_")', code)
    mod_match = re.search(r'module\s+([A-Za-z0-9_]+)', clean)
    if mod_match:
        mod_name = mod_match.group(1)
        if f"{mod_name}." not in clean and f"include {mod_name}" not in clean:
            if "def self.build" in clean or "def build" in clean:
                clean += f"\n{mod_name}.build\n"
            elif "def self.create_sign" in clean or "def create_sign" in clean:
                clean += f"\n{mod_name}.create_sign\n"
            elif "def self.run" in clean or "def run" in clean:
                clean += f"\n{mod_name}.run\n"
    return clean

def generate_ai_response(product_title, retry_feedback=None):
    w, h, d = infer_dimensions(product_title)
    mod_name = sanitize_module_name(product_title)
    
    prompt = f"""Bạn là chuyên gia lập trình 3D SketchUp Ruby API hàng đầu trong ngành bảng hiệu quảng cáo.
Hãy viết phản hồi kỹ thuật chi tiết và mã SketchUp Ruby (.rb) hoàn chỉnh 100% để dựng biển hiệu 3D:
Tên sản phẩm: {product_title}
Kích thước mô phỏng: Rộng {w}mm x Cao {h}mm x Sâu {d}mm.

Yêu cầu kỹ thuật bắt buộc:
1. Đơn vị: Sử dụng đơn vị mm của SketchUp (ví dụ: {w}.mm, {h}.mm, {d}.mm).
2. Toàn bộ mã được đóng gói trong một module duy nhất: `module {mod_name} ... end`.
3. Dựng hình 3D thực tế chi tiết với các cấu kiện đặc thù của {product_title}:
   - Hệ khung sắt đỡ hoặc tai treo / chân đế / trụ giằng phù hợp.
   - Bề mặt biển / tấm nền chính (alu, mica, bạt lót tôn, decal, gỗ, fomex, lam nhôm, inox,...).
   - Nội dung chữ nổi 3D, họa tiết, đèn LED hoặc viền nẹp trang trí.
4. Cách thức tạo hình trong SketchUp Ruby:
   - Dùng các group: `grp = entities.add_group; grp.name = "TenCauKien"`.
   - Tạo mặt bằng `grp.entities.add_face(pts)` và kéo nổi khối 3D bằng `face.pushpull(chieu_day)` hoặc vẽ các khối box đầy đủ.
   - Gán màu / vật liệu cho từng nhóm: `grp.material = "ColorName"`.
5. Phương thức khởi tạo:
   - `def self.build`
   - Gọi `model = Sketchup.active_model; model.start_operation('{mod_name}', true)`.
   - Dựng các nhóm cấu kiện vào `model.active_entities`.
   - Gọi `model.commit_operation`.
6. CUỐI CÙNG ở dòng cuối file gọi trực tiếp: `{mod_name}.build`.
7. ĐẶT TOÀN BỘ MÃ RUBY TRONG KHỐI ```ruby ... ```.

Định dạng phản hồi:
=== FILE: {product_title}.jpg ===
--- PHẢN HỒI BƯỚC 1 ---
Mô tả tóm tắt giải pháp dựng mô hình 3D cho sản phẩm {product_title}...
```ruby
# Mã nguồn Ruby hoàn chỉnh
module {mod_name}
  def self.build
    model = Sketchup.active_model
    model.start_operation('{mod_name}', true)
    entities = model.active_entities
    # ...
    model.commit_operation
  end
end
{mod_name}.build
```
--- THÔNG SỐ VÀ VẬT LIỆU ---
Bảng tóm tắt quy cách gia công và cấu kiện...
"""

    if retry_feedback:
        prompt += f"\nLƯU Ý: Lần chạy trước gặp lỗi sau, hãy khắc phục hoàn toàn trong mã mới: {retry_feedback}\n"

    req = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions',
        headers={'Authorization': f'Bearer {GPT_KEY}', 'Content-Type': 'application/json'},
        data=json.dumps({
            'model': 'gpt-4o-mini',
            'messages': [{'role': 'user', 'content': prompt}],
            'temperature': 0.2,
            'max_tokens': 3600
        }).encode('utf-8')
    )

    with urllib.request.urlopen(req, timeout=50) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        return data['choices'][0]['message']['content']

def triangulate_polygon_3d(pts):
    if len(pts) < 3: return []
    if len(pts) == 3: return [(0, 1, 2)]
    if len(pts) == 4: return [(0, 1, 2), (0, 2, 3)]
    
    indices = list(range(len(pts)))
    tris = []
    
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

def model3d_to_obj_mtl(m3d, obj_name, mtl_filename):
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
        if el_type in ('prism', 'text'):
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
                    faces.append((cur_start + i, cur_start + j, cur_start + nb + j))
                    faces.append((cur_start + i, cur_start + nb + j, cur_start + nb + i))
                    
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
                faces.append((v_bc, cur_start + s2, cur_start + s))
                faces.append((v_tc, cur_start + segs + s, cur_start + segs + s2))
                faces.append((cur_start + s, cur_start + s2, cur_start + segs + s2))
                faces.append((cur_start + s, cur_start + segs + s2, cur_start + segs + s))
                
        if faces:
            obj_groups.append({'name': slugify(name), 'material': mat_key, 'faces': faces})

    obj_lines = [
        f"# Wavefront OBJ generated by ADMAKE 3D Studio",
        f"mtllib {mtl_filename}",
        f"o {slugify(obj_name)}",
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

def process_single_product(img_file):
    base_name = os.path.splitext(img_file)[0]
    txt_path = os.path.join(SRC_DIR, f"{base_name}_response.txt")
    rb_path = os.path.join(SRC_DIR, f"{base_name}.rb")
    
    last_err = None
    for attempt in range(2):
        try:
            print(f"  [AI GENERATE (att {attempt+1})]: {base_name}...", flush=True)
            resp_text = generate_ai_response(base_name, retry_feedback=last_err)
            extracted = extract_ruby_clean(resp_text)
            if not extracted:
                last_err = "Không tìm thấy khối mã ```ruby ... ``` trong phản hồi."
                continue
                
            candidate_code = sanitize_and_prepare_ruby(extracted)
            m3d = ruby_to_model3d(candidate_code, max_seconds=4.0)
            
            if m3d and len(m3d.get('elements', [])) > 0:
                # Lưu response mới
                with open(txt_path, 'w', encoding='utf-8') as fp:
                    fp.write(resp_text)
                # Lưu file .rb
                with open(rb_path, 'w', encoding='utf-8') as fp:
                    fp.write(candidate_code)
                    
                return {
                    'base': base_name,
                    'img_file': img_file,
                    'status': 'SUCCESS',
                    'elements': len(m3d.get('elements', [])),
                    'ruby_code': candidate_code,
                    'm3d': m3d
                }
            else:
                last_err = "Mã Ruby thực thi nhưng không sinh ra cấu kiện 3D (elements = 0)."
        except Exception as e:
            last_err = str(e)
            print(f"  [ERROR] {base_name} attempt {attempt+1}: {e}", flush=True)
            time.sleep(1)

    return {
        'base': base_name,
        'img_file': img_file,
        'status': 'FAILED',
        'error': last_err,
        'elements': 0,
        'ruby_code': '',
        'm3d': None
    }

def main():
    print("=" * 80)
    print("KHỞI CHẠY TÁI TẠO TOÀN BỘ 79 SẢN PHẨM BẰNG API KEY ĐA LUỒNG (5 WORKERS)")
    print("=" * 80, flush=True)

    files = os.listdir(SRC_DIR)
    img_exts = ('.jpg', '.jpeg', '.png', '.webp', '.jfif')
    images = sorted([f for f in files if os.path.splitext(f)[1].lower() in img_exts])
    total = len(images)
    print(f"Tổng số sản phẩm cần xử lý: {total}\n", flush=True)

    results = {}
    completed_cnt = 0
    t0 = time.time()

    with ThreadPoolExecutor(max_workers=5) as executor:
        future_to_img = {executor.submit(process_single_product, img): img for img in images}
        for future in as_completed(future_to_img):
            img = future_to_img[future]
            try:
                res = future.result()
                results[res['base']] = res
                completed_cnt += 1
                print(f"[{completed_cnt}/{total}] {res['base']}: {res['status']} | {res['elements']} elements", flush=True)
            except Exception as e:
                print(f"[{completed_cnt}/{total}] [EXCEPTION] {img}: {e}", flush=True)

    print("\n" + "=" * 80)
    print(f"HOÀN THÀNH BƯỚC SINH MÃ TRONG {time.time()-t0:.1f} GIÂY")
    print("BƯỚC TIẾP THEO: XUẤT OBJ & MTL (TUYỆT ĐỐI KHÔNG FALLBACK)")
    print("=" * 80, flush=True)

    catalog = []
    has_3d_count = 0

    for img in images:
        base = os.path.splitext(img)[0]
        res = results.get(base)
        slug = slugify(base)
        
        obj_filename = f"{base}.obj"
        mtl_filename = f"{base}.mtl"
        rb_filename = f"{base}.rb"

        if res and res.get('status') == 'SUCCESS' and res.get('elements', 0) > 0:
            m3d = res['m3d']
            obj_content, mtl_content = model3d_to_obj_mtl(m3d, base, mtl_filename)
            
            # Ghi OBJ và MTL vào Downloads
            obj_path = os.path.join(SRC_DIR, obj_filename)
            mtl_path = os.path.join(SRC_DIR, mtl_filename)
            with open(obj_path, 'w', encoding='utf-8') as fp:
                fp.write(obj_content)
            with open(mtl_path, 'w', encoding='utf-8') as fp:
                fp.write(mtl_content)
                
            has_3d_count += 1
            catalog.append({
                'id': slug,
                'image_filename': img,
                'image_url': f"/signs/{img}",
                'rb_filename': rb_filename,
                'rb_url': f"/signs/{rb_filename}",
                'obj_filename': obj_filename,
                'obj_url': f"/signs/{obj_filename}",
                'mtl_filename': mtl_filename,
                'mtl_url': f"/signs/{mtl_filename}",
                'title': base,
                'description': f"Mô hình 3D thực tế {base}, gồm {res['elements']} cấu kiện được dựng bằng mã SketchUp Ruby.",
                'category': m3d.get('category', 'storefront'),
                'badge': m3d.get('category_label', '3D SketchUp'),
                'has_3d': True,
                'dimensions': m3d.get('dimensions', {'width': 3.0, 'height': 1.0, 'depth': 0.15}),
                'materials': m3d.get('materials_spec', {'iron_type': 'vuong_25', 'surface_type': 'alu_3mm', 'has_led': True, 'has_sheet_backing': True}),
                'elements': m3d.get('elements', []),
                'ruby_code': res['ruby_code'],
                'prompt': f"Bảng hiệu {base}, phối cảnh thực tế sắc nét 4K."
            })
        else:
            catalog.append({
                'id': slug,
                'image_filename': img,
                'image_url': f"/signs/{img}",
                'rb_filename': rb_filename if os.path.exists(os.path.join(SRC_DIR, rb_filename)) else None,
                'rb_url': f"/signs/{rb_filename}" if os.path.exists(os.path.join(SRC_DIR, rb_filename)) else None,
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
                'materials': {'iron_type': 'vuong_25', 'surface_type': 'alu_3mm', 'has_led': False, 'has_sheet_backing': False},
                'elements': [],
                'ruby_code': res.get('ruby_code', '') if res else '',
                'prompt': f"Bảng hiệu {base}, phối cảnh thực tế sắc nét 4K."
            })

    print(f"\n===> Xuất OBJ & MTL thành công cho {has_3d_count}/{total} sản phẩm!", flush=True)

    # Lưu signs_catalog.json
    catalog_path = os.path.join(SRC_DIR, "signs_catalog.json")
    with open(catalog_path, 'w', encoding='utf-8') as fp:
        json.dump(catalog, fp, ensure_ascii=False, indent=2)

    print("\n" + "=" * 80)
    print("ĐỒNG BỘ SANG FRONTEND VÀ BACKEND")
    print("=" * 80, flush=True)

    os.makedirs(FRONTEND_SIGNS_DIR, exist_ok=True)
    os.makedirs(BACKEND_SIGNS_DIR, exist_ok=True)

    # Bảo tồn active_default_signboard.rb
    preserved = {}
    for d_path in (FRONTEND_SIGNS_DIR, BACKEND_SIGNS_DIR):
        p_def = os.path.join(d_path, "active_default_signboard.rb")
        if os.path.exists(p_def):
            with open(p_def, "r", encoding="utf-8") as f:
                preserved[d_path] = f.read()

    # Dọn dẹp các file cũ
    for d in (FRONTEND_SIGNS_DIR, BACKEND_SIGNS_DIR):
        for f in os.listdir(d):
            if f.endswith(('.obj', '.mtl', '.rb', '.json', '.jpg', '.jpeg', '.png', '.webp', '.jfif')):
                if f != "active_default_signboard.rb":
                    try:
                        os.remove(os.path.join(d, f))
                    except Exception:
                        pass

    # Copy toàn bộ file mới từ Downloads sang
    synced_count = 0
    for f in os.listdir(SRC_DIR):
        if f.endswith(('.obj', '.mtl', '.rb', '.json', '.jpg', '.jpeg', '.png', '.webp', '.jfif')):
            src = os.path.join(SRC_DIR, f)
            shutil.copy2(src, os.path.join(FRONTEND_SIGNS_DIR, f))
            shutil.copy2(src, os.path.join(BACKEND_SIGNS_DIR, f))
            synced_count += 1

    # Khôi phục active_default_signboard.rb nếu bị ghi đè
    for d_path, content in preserved.items():
        with open(os.path.join(d_path, "active_default_signboard.rb"), "w", encoding="utf-8") as f:
            f.write(content)

    print(f"Đã đồng bộ {synced_count} file sang frontend và backend.", flush=True)
    print("TOÀN BỘ TIẾN TRÌNH HOÀN TẤT!", flush=True)

if __name__ == '__main__':
    main()
