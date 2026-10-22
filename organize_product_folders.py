# -*- coding: utf-8 -*-
"""
Script phân loại 79 cụm sản phẩm vào từng thư mục con tương ứng:
- Mỗi sản phẩm là 1 thư mục riêng mang tên sản phẩm đó.
- Chứa trọn vẹn cụm 5 file:
    + <Tên sản phẩm>.<ext> (ảnh thực tế)
    + <Tên sản phẩm>_response.txt (phản hồi phân tích AI)
    + <Tên sản phẩm>.rb (mã nguồn SketchUp Ruby)
    + <Tên sản phẩm>.obj (mô hình 3D Wavefront OBJ)
    + <Tên sản phẩm>.mtl (vật liệu Wavefront MTL)
- Cập nhật signs_catalog.json theo cấu trúc thư mục mới.
- Đồng bộ toàn bộ sang frontend/public/signs/ và backend/static/signs/.
"""

import os
import sys
import json
import shutil

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

SRC_DIR = r"C:\Users\nguyenbuu.DESKTOP-TOEFTR1\Downloads\sản phẩm"
FRONTEND_SIGNS_DIR = os.path.abspath(r"frontend\public\signs")
BACKEND_SIGNS_DIR = os.path.abspath(r"backend\static\signs")

def main():
    print("=" * 80)
    print("BẮT ĐẦU PHÂN LOẠI CỤM FILE VÀO TỪNG THƯ MỤC CON THEO SẢN PHẨM")
    print("=" * 80, flush=True)

    img_exts = ('.jpg', '.jpeg', '.png', '.webp', '.jfif')
    all_files = os.listdir(SRC_DIR)

    # Tìm danh sách ảnh gốc (nằm trực tiếp ở SRC_DIR hoặc trong thư mục đã tạo)
    images = []
    for f in all_files:
        full = os.path.join(SRC_DIR, f)
        if os.path.isfile(full) and os.path.splitext(f)[1].lower() in img_exts:
            images.append(f)
        elif os.path.isdir(full):
            # Nếu đã có thư mục, kiểm tra ảnh bên trong
            for sub_f in os.listdir(full):
                if os.path.splitext(sub_f)[1].lower() in img_exts and os.path.splitext(sub_f)[0] == f:
                    images.append((f, sub_f))
                    break

    # Chuẩn hóa danh sách
    prod_items = []
    for item in sorted(images, key=lambda x: x[0] if isinstance(x, tuple) else x):
        if isinstance(item, tuple):
            dir_name, img_name = item
            prod_items.append({'base': dir_name, 'img': img_name, 'already_in_dir': True})
        else:
            base = os.path.splitext(item)[0]
            prod_items.append({'base': base, 'img': item, 'already_in_dir': False})

    print(f"Tổng số sản phẩm cần phân loại: {len(prod_items)}\n", flush=True)

    moved_count = 0
    for idx, pinfo in enumerate(prod_items, 1):
        base = pinfo['base']
        img = pinfo['img']
        target_dir = os.path.join(SRC_DIR, base)
        os.makedirs(target_dir, exist_ok=True)

        expected_files = [
            img,
            f"{base}_response.txt",
            f"{base}.rb",
            f"{base}.obj",
            f"{base}.mtl"
        ]

        item_moved = 0
        for fname in expected_files:
            src_file = os.path.join(SRC_DIR, fname)
            dst_file = os.path.join(target_dir, fname)
            if os.path.exists(src_file) and not os.path.exists(dst_file):
                shutil.move(src_file, dst_file)
                item_moved += 1
            elif not os.path.exists(dst_file) and not os.path.exists(src_file):
                print(f"  [CẢNH BÁO] Không tìm thấy file: {fname}", flush=True)

        files_in_dir = len(os.listdir(target_dir))
        print(f"[{idx}/{len(prod_items)}] {base} -> thư mục con có {files_in_dir} file", flush=True)
        moved_count += 1

    # Đọc signs_catalog.json hiện có để cập nhật đường dẫn
    catalog_path = os.path.join(SRC_DIR, "signs_catalog.json")
    if not os.path.exists(catalog_path):
        catalog_path = os.path.join(FRONTEND_SIGNS_DIR, "signs_catalog.json")

    with open(catalog_path, "r", encoding="utf-8") as fp:
        catalog = json.load(fp)

    for item in catalog:
        title = item.get("title", "")
        img_fn = item.get("image_filename", "")
        rb_fn = item.get("rb_filename", "")
        obj_fn = item.get("obj_filename", "")
        mtl_fn = item.get("mtl_filename", "")

        # Cập nhật URL trỏ vào thư mục con của sản phẩm
        item["folder"] = title
        if img_fn:
            item["image_url"] = f"/signs/{title}/{img_fn}"
        if rb_fn:
            item["rb_url"] = f"/signs/{title}/{rb_fn}"
        if obj_fn:
            item["obj_url"] = f"/signs/{title}/{obj_fn}"
        if mtl_fn:
            item["mtl_url"] = f"/signs/{title}/{mtl_fn}"

    # Ghi lại catalog đã cập nhật
    new_catalog_path = os.path.join(SRC_DIR, "signs_catalog.json")
    with open(new_catalog_path, "w", encoding="utf-8") as fp:
        json.dump(catalog, fp, ensure_ascii=False, indent=2)

    print("\n" + "=" * 80)
    print("ĐỒNG BỘ TOÀN BỘ CẤU TRÚC THƯ MỤC MỚI SANG FRONTEND VÀ BACKEND")
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

    # Dọn dẹp thư mục signs cũ ở frontend và backend
    for d in (FRONTEND_SIGNS_DIR, BACKEND_SIGNS_DIR):
        for item in os.listdir(d):
            if item == "active_default_signboard.rb":
                continue
            item_path = os.path.join(d, item)
            try:
                if os.path.isdir(item_path):
                    shutil.rmtree(item_path)
                else:
                    os.remove(item_path)
            except Exception as e:
                print(f"Lỗi dọn dẹp {item_path}: {e}")

    # Copy 79 thư mục sản phẩm sang frontend và backend
    synced_folders = 0
    for pinfo in prod_items:
        base = pinfo['base']
        src_folder = os.path.join(SRC_DIR, base)
        if os.path.isdir(src_folder):
            shutil.copytree(src_folder, os.path.join(FRONTEND_SIGNS_DIR, base), dirs_exist_ok=True)
            shutil.copytree(src_folder, os.path.join(BACKEND_SIGNS_DIR, base), dirs_exist_ok=True)
            synced_folders += 1

    # Copy signs_catalog.json vào root của signs
    shutil.copy2(new_catalog_path, os.path.join(FRONTEND_SIGNS_DIR, "signs_catalog.json"))
    shutil.copy2(new_catalog_path, os.path.join(BACKEND_SIGNS_DIR, "signs_catalog.json"))

    # Khôi phục active_default_signboard.rb
    for d_path, content in preserved.items():
        with open(os.path.join(d_path, "active_default_signboard.rb"), "w", encoding="utf-8") as f:
            f.write(content)

    print(f"Đã đồng bộ {synced_folders} thư mục sản phẩm và file catalog sang frontend & backend.", flush=True)
    print("HOÀN TẤT PHÂN LOẠI!", flush=True)

if __name__ == '__main__':
    main()
