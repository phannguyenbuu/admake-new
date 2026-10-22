# -*- coding: utf-8 -*-
import os
import sys
import re

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.abspath('backend'))
from api.ruby3d.export import ruby_to_model3d

p = r"C:\Users\nguyenbuu.DESKTOP-TOEFTR1\Downloads\sản phẩm"
files = os.listdir(p)
img_exts = ('.jpg', '.jpeg', '.png', '.webp', '.jfif')
images = sorted([f for f in files if os.path.splitext(f)[1].lower() in img_exts])

def extract_ruby_clean(content):
    matches = re.findall(r'```(?:ruby)?\s*(.*?)\s*```', content, re.DOTALL | re.IGNORECASE)
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

good = []
cut = []
missing = []

for img in images:
    base = os.path.splitext(img)[0]
    txt_path = os.path.join(p, f"{base}_response.txt")
    if not os.path.exists(txt_path):
        txt_path = os.path.join(p, f"{base}.txt")
    if not os.path.exists(txt_path):
        missing.append(base)
        continue
    with open(txt_path, 'r', encoding='utf-8', errors='ignore') as fp:
        raw = fp.read()
    code = extract_ruby_clean(raw)
    if not code or len(code) < 150:
        cut.append((base, 'empty/short ruby', len(raw)))
        continue
    clean_c = re.sub(r'\.gsub\s*\(\s*/[^/]+/\s*,\s*["\'][^"\']*["\']\s*\)', '.tr(" ", "_")', code)
    m = re.search(r'module\s+([A-Za-z0-9_]+)', clean_c)
    mod_name = m.group(1) if m else None
    if mod_name and f'{mod_name}.' not in clean_c and f'include {mod_name}' not in clean_c:
        if 'def build' in clean_c: clean_c += f'\n{mod_name}.build\n'
        elif 'def create_sign' in clean_c: clean_c += f'\n{mod_name}.create_sign\n'
        elif 'def run' in clean_c: clean_c += f'\n{mod_name}.run\n'
    try:
        m3d = ruby_to_model3d(clean_c, max_seconds=3.0)
        els = len(m3d.get('elements', [])) if m3d else 0
        if els > 0:
            good.append((base, els))
        else:
            cut.append((base, '0 elements', len(raw)))
    except Exception as e:
        cut.append((base, f'Error: {str(e)[:60]}', len(raw)))

print(f"Total images/products: {len(images)}")
print(f"GOOD ({len(good)}):")
for g in good:
    print(f"  + {g[0]} ({g[1]} els)")
print(f"\nCUT / TRUNCATED / BROKEN ({len(cut)}):")
for c in cut:
    print(f"  - {c[0]}: {c[1]} (resp len={c[2]})")
print(f"\nMISSING RESPONSE ({len(missing)}):")
for m in missing:
    print(f"  ? {m}")
