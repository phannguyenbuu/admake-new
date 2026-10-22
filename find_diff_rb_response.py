# -*- coding: utf-8 -*-
import os
import sys
import re

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

p = r"C:\Users\nguyenbuu.DESKTOP-TOEFTR1\Downloads\sản phẩm"
files = os.listdir(p)
img_exts = ('.jpg', '.jpeg', '.png', '.webp', '.jfif')
images = sorted([f for f in files if os.path.splitext(f)[1].lower() in img_exts])

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

def normalize_code(c):
    c = c.replace('\r\n', '\n').replace('\r', '\n')
    c = re.sub(r'\.gsub\s*\(\s*/[^/]+/\s*,\s*["\'][^"\']*["\']\s*\)', '.tr(" ", "_")', c)
    # Strip comments and extra blank lines for semantic comparison
    lines = [l.strip() for l in c.splitlines() if l.strip() and not l.strip().startswith('#')]
    return "\n".join(lines)

def get_module_name(c):
    m = re.search(r'module\s+([A-Za-z0-9_]+)', c)
    return m.group(1) if m else None

def get_title_in_response(resp):
    m = re.search(r'=== FILE:\s*([^\n\r=]+)\s*===', resp)
    return m.group(1).strip() if m else None

results = []

for img in images:
    base = os.path.splitext(img)[0]
    txt_path = os.path.join(p, f"{base}_response.txt")
    if not os.path.exists(txt_path):
        txt_path = os.path.join(p, f"{base}.txt")
    rb_path = os.path.join(p, f"{base}.rb")
    
    has_resp = os.path.exists(txt_path)
    has_rb = os.path.exists(rb_path)
    
    if not has_resp:
        results.append({
            'base': base,
            'status': 'MISSING_RESPONSE',
            'details': 'Không có file response.txt'
        })
        continue
        
    if not has_rb:
        results.append({
            'base': base,
            'status': 'MISSING_RB',
            'details': 'Không có file .rb'
        })
        continue
        
    with open(txt_path, 'r', encoding='utf-8', errors='ignore') as fp:
        resp_text = fp.read()
    with open(rb_path, 'r', encoding='utf-8', errors='ignore') as fp:
        rb_text = fp.read()
        
    # Check 1: Title in response header vs base name
    resp_header_title = get_title_in_response(resp_text)
    
    # Check 2: Module names
    rb_mod = get_module_name(rb_text)
    resp_mod = get_module_name(resp_text)
    
    # Check 3: Extract ruby from response and compare with rb
    extracted_rb = extract_ruby_clean(resp_text)
    norm_extracted = normalize_code(extracted_rb)
    norm_rb = normalize_code(rb_text)
    
    # Check 4: Is RB code actually from response?
    # Strip all whitespace from both
    pure_rb = re.sub(r'\s+', '', norm_rb)
    pure_extracted = re.sub(r'\s+', '', norm_extracted)
    pure_resp = re.sub(r'\s+', '', resp_text)
    
    is_diff = False
    diff_reasons = []
    
    if rb_mod != resp_mod:
        is_diff = True
        diff_reasons.append(f"Module khác nhau: .rb={rb_mod} vs response={resp_mod}")
        
    if pure_rb != pure_extracted:
        # Check if one is substring of other (e.g. .build call added at the end)
        if pure_rb.startswith(pure_extracted) or pure_extracted.startswith(pure_rb):
            len_diff = abs(len(pure_rb) - pure_extracted.count(pure_rb) if pure_rb in pure_extracted else len(pure_rb) - len(pure_extracted))
            if len_diff > 100:
                is_diff = True
                diff_reasons.append(f"Chênh lệch mã lệnh ({len(pure_rb)} chars vs {len(pure_extracted)} chars)")
        else:
            # Check how much they match
            is_diff = True
            diff_reasons.append("Nội dung logic/lệnh trong .rb khác với code trích xuất từ response")
            
    # Check 5: Check if response text describes a completely different product
    if resp_header_title:
        # Normalize comparison
        clean_header = os.path.splitext(resp_header_title)[0].strip()
        if clean_header.lower() != base.lower():
            diff_reasons.append(f"Tiêu đề trong header response là '{clean_header}' nhưng tên file là '{base}'")
            is_diff = True
            
    if is_diff:
        results.append({
            'base': base,
            'status': 'DIFFERENT',
            'rb_mod': rb_mod,
            'resp_mod': resp_mod,
            'reasons': diff_reasons,
            'rb_len': len(rb_text),
            'resp_len': len(resp_text)
        })
    else:
        results.append({
            'base': base,
            'status': 'MATCH',
            'rb_mod': rb_mod,
            'resp_mod': resp_mod
        })

matches = [r for r in results if r['status'] == 'MATCH']
diffs = [r for r in results if r['status'] == 'DIFFERENT']
missing = [r for r in results if r['status'] in ('MISSING_RESPONSE', 'MISSING_RB')]

print(f"Tổng số sản phẩm kiểm tra: {len(results)}")
print(f"Khớp hoàn toàn: {len(matches)}")
print(f"Có sự khác biệt: {len(diffs)}")
print(f"Thiếu file: {len(missing)}")

print("\n" + "=" * 80)
print(f"CHI TIẾT {len(diffs)} FILE RB ĐANG KHÁC NỘI DUNG VỚI RESPONSE:")
print("=" * 80)
for d in diffs:
    print(f"\n[!] Sản phẩm: {d['base']}")
    for r in d['reasons']:
        print(f"    - {r}")
    print(f"    (Dung lượng .rb: {d['rb_len']} chars | response: {d['resp_len']} chars)")
