# -*- coding: utf-8 -*-
"""
Pipeline Tái Tạo Toàn Bộ 79 Sản Phẩm Bằng ChatGPT Vision API Đa Luồng (Model: gpt-4.1):
1. Đọc ảnh thực tế từng sản phẩm từ thư mục C:\\Users\\nguyenbuu.DESKTOP-TOEFTR1\\Downloads\\sản phẩm.
2. Mã hóa Base64 ảnh và gửi cùng prompt thiết kế 3D chuyên gia tới model gpt-4.1 (OpenAI Vision).
3. Đa luồng 5 workers (ThreadPoolExecutor).
4. Phân tích chi tiết hình ảnh thực tế -> sinh mã SketchUp Ruby (.rb) hoàn chỉnh 100%.
5. Biên dịch thực tế qua sandbox ruby_to_model3d để thẩm định cấu kiện.
6. Xuất file OBJ chuẩn Wavefront đầy đủ đỉnh (v), pháp tuyến đỉnh (vn), vật liệu (mtl) và các group (g) cấu kiện.
7. Cập nhật signs_catalog.json, đồng bộ frontend/backend, build và deploy lên VPS 103.163.219.87.
"""

import os
import sys
import re
import json
import time
import math
import shutil
import base64
import urllib.request
import subprocess
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
    raise RuntimeError("Không tìm thấy GPTKey trong D:\\vps_go.md hoặc biến môi trường")

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

def get_mime_type(filename):
    ext = os.path.splitext(filename)[1].lower()
    if ext == '.png':
        return 'image/png'
    elif ext == '.webp':
        return 'image/webp'
    return 'image/jpeg'

def generate_ai_vision_response(img_path, product_title, retry_feedback=None):
    w, h, d = infer_dimensions(product_title)
    mod_name = sanitize_module_name(product_title)
    mime = get_mime_type(img_path)

    with open(img_path, 'rb') as fp:
        b64_data = base64.b64encode(fp.read()).decode('utf-8')

    prompt = f"""Bạn là một kỹ sư thiết kế 3D CAD chuyên nghiệp hàng đầu về bảng hiệu quảng cáo, hộp đèn và chữ nổi (SketchUp Ruby API).
Quan sát THỰC TẾ bức ảnh chụp sản phẩm đính kèm: '{product_title}':
1. Hãy quan sát và phân tích chi tiết hình ảnh thực tế:
   - Tên thương hiệu, dòng chữ chính hoặc số hiển thị trên sản phẩm (ví dụ tên quán, thương hiệu, số nhà, chức danh,...).
   - Nội dung chữ phụ, slogan, số điện thoại, địa chỉ, icon mạng xã hội hoặc logo (nếu có).
   - Màu sắc thực tế chuẩn xác của các phần (mã hex: nền alu/gỗ/mica, màu chữ inox/vàng/đen/trắng, màu viền nẹp, màu đèn LED,...).
   - Vật liệu và quy cách gia công nhận diện từ ảnh (tấm alu composite, mica uốn nổi, inox vàng gương/xước, đế gỗ, tôn sóng, bạt 3M/hiflex, khung sắt hộp,...).
   - Kích thước ước tính: Rộng {w}mm x Cao {h}mm x Sâu {d}mm.

2. Viết mã nguồn SketchUp Ruby (.rb) hoàn chỉnh 100% để tái dựng chân thực mô hình 3D của CHÍNH SẢN PHẨM TRONG ẢNH NÀY:
   - Module: `module {mod_name} ... end`
   - Đơn vị mm: sử dụng {w}.mm, {h}.mm, v.v.
   - Cấu trúc hệ khung xương sắt đỡ:
     * Khung viền sắt hộp (sắt 25x25 hoặc 30x30).
     * Xương đứng cách nhau ~500mm và xương ngang tăng cứng.
     * Tai treo tường hoặc chân đế / cột chống phù hợp kiểu dáng sản phẩm.
   - Tấm nền mặt biển / bảng: tạo bằng `add_face` và `pushpull` với màu sắc hex đúng như ảnh thực tế.
   - Viền nẹp nhôm / alu hoặc vát cạnh bao quanh biển.
   - Chữ nổi 3D, số nổi và nội dung:
     * Dùng `entities.add_3d_text` hoặc vẽ các khối 3D cho từng dòng chữ/số cụ thể nhìn thấy trong ảnh!
     * Tạo khối nổi 3D rõ nét (độ dày 30mm - 60mm cho chữ lớn, 15mm - 25mm cho chữ phụ/số điện thoại).
     * Gán đúng mã màu hex theo ảnh thực tế.
   - Logo / biểu tượng hoặc đèn LED: dựng khối 3D mô phỏng vị trí và hình dạng.
   - Phương thức khởi tạo:
     * `def self.build`
     * `model = Sketchup.active_model; model.start_operation('{mod_name}', true)`
     * Dựng các nhóm cấu kiện vào `model.active_entities`.
     * `model.commit_operation`
   - Dòng cuối cùng gọi: `{mod_name}.build`.

3. ĐẶT TOÀN BỘ MÃ RUBY TRONG KHỐI ```ruby ... ```.
Không dùng `// TODO`, không dùng mã cắt xén `...`. Toàn bộ mã phải hoàn chỉnh có thể chạy ngay!

Định dạng phản hồi:
=== FILE: {os.path.basename(img_path)} ===
--- PHÂN TÍCH HÌNH ẢNH & THIẾT KẾ THỰC TẾ ---
[Mô tả chi tiết những gì nhìn thấy trong ảnh: tên chữ, số, màu sắc, vật liệu, cấu kiện]
```ruby
# Mã nguồn Ruby hoàn chỉnh 100%
module {mod_name}
  def self.build
    # ...
  end
end
{mod_name}.build
```
--- THÔNG SỐ VÀ VẬT LIỆU GIA CÔNG ---
[Bảng tóm tắt thông số cấu kiện và vật liệu]
"""

    if retry_feedback:
        prompt += f"\nLƯU Ý: Lần chạy trước gặp lỗi sau, hãy sửa đổi hoàn toàn trong mã mới: {retry_feedback}\n"

    payload = {
        'model': 'gpt-4.1',
        'messages': [
            {
                'role': 'user',
                'content': [
                    {'type': 'text', 'text': prompt},
                    {'type': 'image_url', 'image_url': {'url': f'data:{mime};base64,{b64_data}', 'detail': 'high'}}
                ]
            }
        ],
        'temperature': 0.2,
        'max_tokens': 4000
    }

    req = urllib.request.Request(
        'https://api.openai.com/v1/chat/completions',
        headers={'Authorization': f'Bearer {GPT_KEY}', 'Content-Type': 'application/json'},
        data=json.dumps(payload).encode('utf-8')
    )

    with urllib.request.urlopen(req, timeout=90) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        return data['choices'][0]['message']['content']

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

def model3d_to_obj_mtl_with_normals(m3d, obj_name, mtl_filename):
    elements = m3d.get('elements', [])
    vertices = []
    normals = []
    materials = {}
    obj_groups = []
    
    def add_norm(n):
        l = math.hypot(*n)
        if l < 1e-9: return (0.0, 0.0, 1.0)
        return (n[0]/l, n[1]/l, n[2]/l)

    for el in elements:
        name = el.get('name', 'Part')
        el_type = el.get('type', 'box')
        color = el.get('color', '#38bdf8')
        
        mat_key = 'Mat_' + slugify(color)
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

        elif el_type == 'line':
            base = el.get('base', [])
            if len(base) >= 2:
                p1, p2 = base[0], base[1]
                v = [p2[k] - p1[k] for k in range(3)]
                l = math.hypot(*v)
                if l > 1e-6:
                    dir_v = (v[0]/l, v[1]/l, v[2]/l)
                    temp = (1.0, 0.0, 0.0) if abs(dir_v[0]) < 0.9 else (0.0, 1.0, 0.0)
                    def cross_v(a, b):
                        return (a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0])
                    u = add_norm(cross_v(dir_v, temp))
                    w = add_norm(cross_v(dir_v, u))
                    r = 0.0015
                    c0 = [p1[k] - r*u[k] - r*w[k] for k in range(3)]
                    c1 = [p1[k] + r*u[k] - r*w[k] for k in range(3)]
                    c2 = [p1[k] + r*u[k] + r*w[k] for k in range(3)]
                    c3 = [p1[k] - r*u[k] + r*w[k] for k in range(3)]
                    c4 = [p2[k] - r*u[k] - r*w[k] for k in range(3)]
                    c5 = [p2[k] + r*u[k] - r*w[k] for k in range(3)]
                    c6 = [p2[k] + r*u[k] + r*w[k] for k in range(3)]
                    c7 = [p2[k] - r*u[k] + r*w[k] for k in range(3)]
                    cur_start = len(vertices) + 1
                    for pt in (c0, c1, c2, c3, c4, c5, c6, c7):
                        vertices.append(pt)
                    l_faces = [
                        (0, 2, 1), (0, 3, 2), (4, 5, 6), (4, 6, 7),
                        (0, 1, 5), (0, 5, 4), (1, 2, 6), (1, 6, 5),
                        (2, 3, 7), (2, 7, 6), (3, 0, 4), (3, 4, 7)
                    ]
                    for f in l_faces:
                        faces.append((cur_start + f[0], cur_start + f[1], cur_start + f[2]))
                
        if faces:
            face_with_norm = []
            for f in faces:
                p0 = vertices[f[0]-1]
                p1 = vertices[f[1]-1]
                p2 = vertices[f[2]-1]
                v0 = [p1[k] - p0[k] for k in range(3)]
                v1 = [p2[k] - p0[k] for k in range(3)]
                fn = (v0[1]*v1[2] - v0[2]*v1[1], v0[2]*v1[0] - v0[0]*v1[2], v0[0]*v1[1] - v0[1]*v1[0])
                normals.append(add_norm(fn))
                norm_idx = len(normals)
                face_with_norm.append((f, norm_idx))
            obj_groups.append({'name': slugify(name), 'material': mat_key, 'faces': face_with_norm})

    obj_lines = [
        f'# Wavefront OBJ generated by ADMAKE 3D Studio',
        f'mtllib {mtl_filename}',
        f'o {slugify(obj_name)}',
        ''
    ]
    for v in vertices: obj_lines.append(f'v {v[0]:.4f} {v[1]:.4f} {v[2]:.4f}')
    obj_lines.append('')
    for n in normals: obj_lines.append(f'vn {n[0]:.4f} {n[1]:.4f} {n[2]:.4f}')
    obj_lines.append('')
    for grp in obj_groups:
        obj_lines.append('g ' + grp['name'])
        obj_lines.append('usemtl ' + grp['material'])
        for (f, n_idx) in grp['faces']:
            obj_lines.append(f'f {f[0]}//{n_idx} {f[1]}//{n_idx} {f[2]}//{n_idx}')
        obj_lines.append('')
        
    mtl_lines = ['# Wavefront Material Library generated by ADMAKE 3D Studio', '']
    for m_name, (r, g, b) in materials.items():
        mtl_lines.append(f'newmtl {m_name}')
        mtl_lines.append(f'Kd {r:.4f} {g:.4f} {b:.4f}')
        mtl_lines.append('Ka 0.2000 0.2000 0.2000')
        mtl_lines.append('Ks 0.1000 0.1000 0.1000')
        mtl_lines.append('d 1.0')
        mtl_lines.append('illum 2')
        mtl_lines.append('')
        
    return '\n'.join(obj_lines), '\n'.join(mtl_lines)

def process_single_product_vision(img_file):
    base_name = os.path.splitext(img_file)[0]
    img_path = os.path.join(SRC_DIR, img_file)
    txt_path = os.path.join(SRC_DIR, f"{base_name}_response.txt")
    rb_path = os.path.join(SRC_DIR, f"{base_name}.rb")
    
    last_err = None
    for attempt in range(2):
        try:
            print(f"  [AI VISION (att {attempt+1})]: {base_name}...", flush=True)
            resp_text = generate_ai_vision_response(img_path, base_name, retry_feedback=last_err)
            extracted = extract_ruby_clean(resp_text)
            if not extracted:
                last_err = "Không tìm thấy khối mã ```ruby ... ``` trong phản hồi."
                continue
                
            candidate_code = sanitize_and_prepare_ruby(extracted)
            m3d = ruby_to_model3d(candidate_code, max_seconds=8.0)
            
            if m3d and len(m3d.get('elements', [])) > 0:
                # Ghi response mới
                with open(txt_path, 'w', encoding='utf-8') as fp:
                    fp.write(resp_text)
                # Ghi file .rb
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
            time.sleep(2)

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
    print("KHỞI CHẠY TÁI TẠO 79 SẢN PHẨM BẰNG CHATGPT VISION API (MODEL: gpt-4.1) ĐA LUỒNG")
    print("=" * 80, flush=True)

    files = os.listdir(SRC_DIR)
    img_exts = ('.jpg', '.jpeg', '.png', '.webp', '.jfif')
    images = sorted([f for f in files if os.path.splitext(f)[1].lower() in img_exts])
    total = len(images)
    print(f"Tổng số sản phẩm cần xử lý: {total}\n", flush=True)

    results = {}
    completed_cnt = 0
    t0 = time.time()

    # Chạy 5 luồng đồng thời
    with ThreadPoolExecutor(max_workers=5) as executor:
        future_to_img = {executor.submit(process_single_product_vision, img): img for img in images}
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
    print(f"HOÀN THÀNH BƯỚC SINH MÃ BẰNG VISION TRONG {time.time()-t0:.1f} GIÂY")
    print("BƯỚC TIẾP THEO: XUẤT OBJ & MTL CHUẨN ĐẦY ĐỦ PHÁP TUYẾN ĐỈNH")
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
            obj_content, mtl_content = model3d_to_obj_mtl_with_normals(m3d, base, mtl_filename)
            
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
