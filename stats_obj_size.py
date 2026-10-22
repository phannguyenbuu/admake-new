# -*- coding: utf-8 -*-
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

p = r"C:\Users\nguyenbuu.DESKTOP-TOEFTR1\Downloads\sản phẩm"
files = [f for f in os.listdir(p) if f.endswith('.obj')]

under_100k = []
over_100k = []

for f in sorted(files):
    full_path = os.path.join(p, f)
    sz = os.path.getsize(full_path)
    sz_kb = sz / 1024.0
    with open(full_path, 'r', encoding='utf-8', errors='ignore') as fp:
        lines = fp.readlines()
    v_count = sum(1 for l in lines if l.startswith('v '))
    f_count = sum(1 for l in lines if l.startswith('f '))
    g_count = sum(1 for l in lines if l.startswith('g '))
    
    item = {
        'name': f,
        'size_bytes': sz,
        'size_kb': sz_kb,
        'vertices': v_count,
        'faces': f_count,
        'groups': g_count
    }
    if sz < 100 * 1024:
        under_100k.append(item)
    else:
        over_100k.append(item)

print(f"Tổng số file OBJ: {len(files)}")
print(f"Số file < 100 KB: {len(under_100k)} ({len(under_100k)/len(files)*100:.1f}%)")
print(f"Số file >= 100 KB: {len(over_100k)} ({len(over_100k)/len(files)*100:.1f}%)")

print("\n" + "=" * 80)
print(f"DANH SÁCH {len(over_100k)} FILE >= 100 KB:")
print("=" * 80)
for x in sorted(over_100k, key=lambda i: i['size_bytes'], reverse=True):
    print(f"- {x['name']:<50} : {x['size_kb']:>8.2f} KB | {x['vertices']:>6} đỉnh | {x['faces']:>6} mặt")

print("\n" + "=" * 80)
print(f"DANH SÁCH {len(under_100k)} FILE < 100 KB (Xếp từ nhỏ nhất đến lớn nhất):")
print("=" * 80)

# Group by size ranges: < 5KB, 5-20KB, 20-50KB, 50-100KB
ranges = {
    "< 5 KB": [x for x in under_100k if x['size_kb'] < 5],
    "5 KB - 20 KB": [x for x in under_100k if 5 <= x['size_kb'] < 20],
    "20 KB - 50 KB": [x for x in under_100k if 20 <= x['size_kb'] < 50],
    "50 KB - 100 KB": [x for x in under_100k if 50 <= x['size_kb'] < 100],
}

for r_name, r_items in ranges.items():
    print(f"\n--- Phân khúc {r_name} ({len(r_items)} file) ---")
    for x in sorted(r_items, key=lambda i: i['size_bytes']):
        print(f"  + {x['name']:<50} : {x['size_kb']:>6.2f} KB ({x['size_bytes']:>5} bytes) | {x['vertices']:>4} đỉnh, {x['faces']:>4} mặt")
