# -*- coding: utf-8 -*-
"""
Biên dịch lại toàn bộ 79 file .rb bằng sandbox Ruby3D đã hoàn thiện (hỗ trợ line tubes, vertex normals, character blocks),
xuất OBJ + MTL chuẩn xác, cập nhật signs_catalog.json, và đồng bộ sang frontend & backend.
"""

import os
import sys
import json
import time
import shutil

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.abspath('backend'))
from api.ruby3d.export import ruby_to_model3d
from rerun_chatgpt_vision_all import (
    SRC_DIR, FRONTEND_SIGNS_DIR, BACKEND_SIGNS_DIR,
    model3d_to_obj_mtl_with_normals, slugify, sanitize_and_prepare_ruby
)

def main():
    print("=" * 80)
    print("BIÊN DỊCH LẠI TOÀN BỘ 79 SẢN PHẨM VỚI SANDBOX MỚI & XUẤT OBJ CHUẨN")
    print("=" * 80, flush=True)

    files = os.listdir(SRC_DIR)
    img_exts = ('.jpg', '.jpeg', '.png', '.webp', '.jfif')
    images = sorted([f for f in files if os.path.splitext(f)[1].lower() in img_exts])
    total = len(images)

    catalog = []
    success_cnt = 0
    t0 = time.time()

    for idx, img in enumerate(images, 1):
        base = os.path.splitext(img)[0]
        rb_file = f"{base}.rb"
        rb_path = os.path.join(SRC_DIR, rb_file)
        obj_file = f"{base}.obj"
        mtl_file = f"{base}.mtl"
        slug = slugify(base)

        if not os.path.exists(rb_path):
            print(f"[{idx}/{total}] {base}: THIẾU FILE .RB", flush=True)
            continue

        with open(rb_path, 'r', encoding='utf-8') as fp:
            raw_code = fp.read()

        clean_code = sanitize_and_prepare_ruby(raw_code)
        m3d = ruby_to_model3d(clean_code, max_seconds=8.0)
        elements = m3d.get('elements', [])

        if len(elements) > 0:
            obj_content, mtl_content = model3d_to_obj_mtl_with_normals(m3d, base, mtl_file)
            obj_path = os.path.join(SRC_DIR, obj_file)
            mtl_path = os.path.join(SRC_DIR, mtl_file)

            with open(obj_path, 'w', encoding='utf-8') as fp:
                fp.write(obj_content)
            with open(mtl_path, 'w', encoding='utf-8') as fp:
                fp.write(mtl_content)

            sz_kb = len(obj_content.encode('utf-8')) / 1024.0
            print(f"[{idx}/{total}] {base}: {len(elements)} elements | OBJ: {sz_kb:.2f} KB", flush=True)
            success_cnt += 1

            catalog.append({
                'id': slug,
                'image_filename': img,
                'image_url': f"/signs/{img}",
                'rb_filename': rb_file,
                'rb_url': f"/signs/{rb_file}",
                'obj_filename': obj_file,
                'obj_url': f"/signs/{obj_file}",
                'mtl_filename': mtl_file,
                'mtl_url': f"/signs/{mtl_file}",
                'title': base,
                'description': f"Mô hình 3D thực tế {base}, gồm {len(elements)} cấu kiện được dựng bằng mã SketchUp Ruby.",
                'category': m3d.get('category', 'storefront'),
                'badge': m3d.get('category_label', '3D SketchUp'),
                'has_3d': True,
                'dimensions': m3d.get('dimensions', {'width': 3.0, 'height': 1.0, 'depth': 0.15}),
                'materials': m3d.get('materials_spec', {'iron_type': 'vuong_25', 'surface_type': 'alu_3mm', 'has_led': True, 'has_sheet_backing': True}),
                'elements': elements,
                'ruby_code': clean_code,
                'prompt': f"Bảng hiệu {base}, phối cảnh thực tế sắc nét 4K."
            })
        else:
            print(f"[{idx}/{total}] {base}: 0 elements (WARNING: {m3d.get('warnings')})", flush=True)

    print(f"\n===> Hoàn thành xuất OBJ & MTL cho {success_cnt}/{total} sản phẩm trong {time.time()-t0:.1f}s!", flush=True)

    catalog_path = os.path.join(SRC_DIR, "signs_catalog.json")
    with open(catalog_path, 'w', encoding='utf-8') as fp:
        json.dump(catalog, fp, ensure_ascii=False, indent=2)

    print("\n" + "=" * 80)
    print("ĐỒNG BỘ TOÀN BỘ SANG FRONTEND VÀ BACKEND")
    print("=" * 80, flush=True)

    os.makedirs(FRONTEND_SIGNS_DIR, exist_ok=True)
    os.makedirs(BACKEND_SIGNS_DIR, exist_ok=True)

    preserved = {}
    for d_path in (FRONTEND_SIGNS_DIR, BACKEND_SIGNS_DIR):
        p_def = os.path.join(d_path, "active_default_signboard.rb")
        if os.path.exists(p_def):
            with open(p_def, "r", encoding="utf-8") as f:
                preserved[d_path] = f.read()

    for d in (FRONTEND_SIGNS_DIR, BACKEND_SIGNS_DIR):
        for f in os.listdir(d):
            if f.endswith(('.obj', '.mtl', '.rb', '.json', '.jpg', '.jpeg', '.png', '.webp', '.jfif')):
                if f != "active_default_signboard.rb":
                    try:
                        os.remove(os.path.join(d, f))
                    except Exception:
                        pass

    synced_count = 0
    for f in os.listdir(SRC_DIR):
        if f.endswith(('.obj', '.mtl', '.rb', '.json', '.jpg', '.jpeg', '.png', '.webp', '.jfif')):
            src = os.path.join(SRC_DIR, f)
            shutil.copy2(src, os.path.join(FRONTEND_SIGNS_DIR, f))
            shutil.copy2(src, os.path.join(BACKEND_SIGNS_DIR, f))
            synced_count += 1

    for d_path, content in preserved.items():
        with open(os.path.join(d_path, "active_default_signboard.rb"), "w", encoding="utf-8") as f:
            f.write(content)

    print(f"Đã đồng bộ {synced_count} file sang frontend và backend.", flush=True)
    print("HOÀN TẤT!", flush=True)

if __name__ == '__main__':
    main()
