"""Prepare the product library; --apply imports drafts without overwriting admin edits."""
import argparse
import hashlib
import json
import re
import sys
import unicodedata
from pathlib import Path
from PIL import Image, ImageOps

BACKEND = Path(__file__).resolve().parents[1]


def plain(text):
    return ''.join(c for c in unicodedata.normalize('NFD', text.lower().replace('đ', 'd')) if not unicodedata.combining(c))


def build_recipe(name, defaults):
    n = plain(name)
    params = [{"key": "waste", "label": "Hao hụt", "unit": "%", "default": 5, "min": 0, "max": 100}]
    lines = []

    def param(key, label, default, unit="", maximum=100000):
        if not any(p['key'] == key for p in params):
            params.append({"key": key, "label": label, "default": default, "unit": unit, "min": 0, "max": maximum})

    def add(code, formula, kind="material", label="", unit="bộ", note="", selected=True):
        lines.append({"id": f"r{len(lines)+1}", "code": code, "name": label, "unit": unit,
                      "formula": formula, "kind": kind, "selected": selected, "unit_price": 0, "note": note})

    def custom(label, formula="1", kind="material", unit="bộ"):
        add("", formula, kind, label, unit, "Chốt quy cách và đơn giá")

    def frame():
        add("SH025010", "(P + ceil(L/0.6)*H + ceil(H/0.6)*L)*(1+waste/100)/6", note="Phân bổ cây 6m, bước xương 0,6m")
        param("labor_days", "Công xưởng", max(0.25, round(defaults['L']*defaults['H']/10000/8, 2)), "ngày")
        add("KIOT014", "labor_days", "labor")

    def letters(material="MC999002", lit=False, foam=False):
        param("letter_ratio", "Diện tích chữ / mặt bảng", 0.35, "tỷ lệ", 1)
        add(material, "A*F*letter_ratio*(1+waste/100)/2.9768", note="Phân bổ tấm 1,22×2,44m")
        if foam: add("FX001010", "A*F*letter_ratio*(1+waste/100)/2.9768")
        param("cut_factor", "Đường cắt / chu vi", 4, "lần", 100)
        add("GC003" if material == "CHU004" else "GC001" if material.startswith('AL') else "GC002", "P*F*cut_factor", "labor", note="Hệ số đường cắt cần chốt theo vector")
        if not foam:
            add("CHU016" if material == "CHU004" else "CHU015", "A*F*letter_ratio", "labor")
        if lit: lighting("A*F*letter_ratio")

    def lighting(area="A*F", edge=False):
        if edge:
            param("led_step", "Bước LED viền", 0.02, "m", 1)
            add("LED017", "ceil(P*F/max(led_step,0.001))*(1+waste/100)/100", note="12V, 100 bóng/dây")
            add("GC011", "P*F", "labor")
        else:
            add("LED002", f"ceil(({area})*100)", note="12V, 1W/module; 100 module/m²")
            add("CHU017", area, "labor")
        load = "ceil(P*F/max(led_step,0.001))*0.2" if edge else f"ceil(({area})*100)"
        add("LED060", f"max(1,ceil(({load})/160))", note="Chọn bản 12V-200W; tải thiết kế 160W/nguồn")

    if 'kiot' in n or 'xe ban' in n or 'quay thu' in n:
        category = "Kiot · Quầy · Xe"
        add("KIOT001" if 'kiot' in n else "SH025010", "(4*(L+W+H)+2*L+2*W)*(1+waste/100)/6")
        add("AL999310", "(L*H+2*W*H+L*W)*(1+waste/100)/2.9768")
        add("KIOT005", "L*W*(1+waste/100)/2.9768")
        if 'kinh' in n: add("XE007", "L*H*0.5")
        if 'da' in n: custom("Mặt đá theo quy cách", "L*W", unit="m²")
        if 'lam' in n: custom("Lam trang trí đúng loại", "L*H", unit="m²")
        add("XE009", "4", selected='xe ban' in n)
        param("labor_days", "Công xưởng", 3, "ngày");add("KIOT014", "labor_days", "labor")
        add("KIOT013" if 'kiot' in n else "XE014", "1")
        if 'led' in n: lighting("L*0.4")
    elif n.startswith('chu ') or n.startswith('chu noi'):
        category = "Chữ nổi"
        material = "CHU004" if 'inox' in n or 'ton' in n else "AL999310" if 'alu' in n or 'nhom' in n else "MC999002"
        letters(material, any(s in n for s in ('led','sang','den','bub')), 'fom' in n)
        if 'nhom' in n:
            add("CHU006", "P*F*cut_factor/50", note="Cuộn 50m; chốt gáy theo vector")
        if 'da' in n or 'arylic' in n: custom("Đá/Acrylic theo mẫu", "A*letter_ratio", unit="m²")
        if 'khung sat' in n: frame()
        add("CHU012", "1")
    elif any(s in n for s in ('decal','voucher','phieu bao hanh','tem ','menu ','hagtags','standee','tam qr')):
        category = "In · Decal · POSM"
        if 'fom' in n:
            add("FX001005" if '5mm' in n else "FX001003", "A*F*(1+waste/100)/2.9768")
        if 'mica' in n: add("MC000002", "(A*F+L*W)*(1+waste/100)/2.9768")
        if 'giay' in n or 'voucher' in n or 'phieu' in n:
            custom("Giấy đúng định lượng", "A*F*(1+waste/100)", unit="m²")
            custom("In / cắt giấy", "A*F", "labor", "m²")
        else:
            add("BD007" if 'kinh' in n else "BD006", "A*F*(1+waste/100)")
            add("GC009", "A*F", "labor");add("GC010", "A*F", "labor")
        if 'be' in n: custom("Công bế theo đường cắt", "P*F", "labor", "m")
        if 'standee' in n: custom("Chân standee X 60×160", "1")
    elif any(s in n for s in ('chuc danh','bien so nha','bien ten cong ty','mica ten phong','bang chuc danh')):
        category = "Biển tên · Số nhà"
        if 'go' in n: custom("Đế gỗ theo mẫu", "L*W*max(H*0.2,0.02)", unit="m³")
        add("CHU004" if 'inox' in n or 'an mon' in n else "AL999310" if 'alu' in n else "MC999002", "A*(1+waste/100)/2.9768")
        if 'an mon' in n or 'inox' in n: custom("Ăn mòn / sơn hoàn thiện", "A", "labor", "m²")
        else: add("GC007", "A", "labor")
        if 'noi' in n: letters("CHU004" if 'dong' in n or 'inox' in n else "MC999002")
        add("SN017", "1")
    elif 'neon' in n:
        category = "Neon"
        add("MC000005", "A*(1+waste/100)/2.9768")
        param("neon_m", "Chiều dài neon", 5, "m")
        add("LED014", "neon_m*(1+waste/100)")
        # Neon catalog is 24V: source explicitly must be 24V, not the 12V variant.
        add("LED060", "max(1,ceil(neon_m*13/160))", note="BẮT BUỘC chọn bản 24V-200W cho neon 24V")
        add("GC011", "neon_m", "labor")
    elif 'hop den' in n or 'tranh dien' in n or 'led vien sang mat' in n or 'led xinhan' in n:
        category = "Hộp đèn"
        frame()
        face = "BD016" if 'bat' in n else "BD013" if 'tranh' in n else "MC999002"
        face_expr = "A*F*(1+waste/100)" if face.startswith('BD') else "A*F*(1+waste/100)/2.9768"
        if 'tron' in n:
            face_expr = "pi*L*L/4*F*(1+waste/100)/2.9768"
            defaults['H'] = defaults['L']
        add(face, face_expr)
        add("AL999310", "P*W*(1+waste/100)/2.9768")
        if defaults['F']==1:add("AL999310", "A*(1+waste/100)/2.9768")
        lighting()
        if 'vien' in n or 'mui ten' in n: lighting(edge=True)
        if 'hut noi' in n or 'chibi' in n or 'mui ten' in n or 'ngoi sao' in n:
            custom("Hút nổi / biên dạng theo mẫu", "A*F", "labor", "m²")
        if face.startswith('MC'):add("GC007", "A*F", "labor")
        add("HD017", "1")
        if '5 mat' in n:custom("Mica và LED 4 hông", "P*W", unit="m²")
    else:
        category = "Bảng hiệu · Vách"
        frame()
        if 'bat' in n:
            add("BD001", "A*F*(1+waste/100)");add("GC008", "A*F", "labor")
            if 'ton' in n:add("HD005", "A*F/1.2*(1+waste/100)")
        elif 'ton' in n:
            add("HD005", "A/1.2*(1+waste/100)")
        elif 'pvc' in n:
            custom("PVC vân đá đúng quy cách", "A*(1+waste/100)", unit="m²")
        elif 'lam' in n:
            custom("Thanh lam nhôm đúng tiết diện", "A", unit="m²")
        else:add("AL004320" if 'guong' in n else "AL999310", "A*F*(1+waste/100)/2.9768")
        if 'chu' in n: letters("MC999002", 'led' in n or 'den' in n)
        if 'decal' in n:add("BD010", "A*F");add("GC010", "A*F", "labor")
        if 'tru' in n:
            param("post_m", "Tổng chiều dài trụ", 6, "m")
            add("SH040014", "post_m/6");custom("Móng / bản mã / neo trụ", "1")
        if 'vien' in n and 'led' in n:lighting(edge=True)
        if 'bub' in n: custom("Bóng trang trí và dây", "P", unit="m")
        add("HD017", "1")
    param("trips", "Vận chuyển", 0, "chuyến")
    add("VC001", "trips", "transport", selected=False)
    return category, {"defaults": defaults, "parameters": params, "lines": lines,
                      "note": "Định mức khởi tạo theo nhóm cấu tạo; xác nhận quy cách, tham số và vật tư trước khi áp dụng."}


def prepare(source):
    target = BACKEND/'static'/'product-bom'
    target.mkdir(parents=True, exist_ok=True)
    frontend_assets = BACKEND.parent/'frontend'/'public'/'product-references'
    frontend_assets.mkdir(parents=True, exist_ok=True)
    records = []
    references = []
    for folder in sorted(source.iterdir()):
        if not folder.is_dir(): continue
        images = sorted(p for p in folder.iterdir() if p.suffix.lower() in ('.jpg','.jpeg','.jfif','.png','.webp'))
        if not images: continue
        image = images[0]
        product_id = hashlib.sha256(folder.name.encode('utf-8')).hexdigest()[:32]
        asset = product_id + '.jpg'
        with Image.open(image) as im:
            im = ImageOps.exif_transpose(im).convert('RGB'); im.thumbnail((1400,1400)); im.save(target/asset, quality=90)
            im.thumbnail((480,360)); im.save(frontend_assets/(product_id+'.webp'), quality=82)
        nums = re.search(r'(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)(?:\s*[x×]\s*(\d+(?:[.,]\d+)?))?',folder.name,re.I)
        defaults = {"L":60,"H":80,"W":6,"F":2 if '2 mat' in plain(folder.name) else 1,"count":1}
        if nums:
            values=[float(x.replace(',','.')) for x in nums.groups() if x]
            defaults.update(L=values[0],H=values[1])
            if len(values)==3: defaults.update(W=values[1],H=values[2])
        else:
            rb = next(folder.glob('*.rb'),None)
            if rb:
                text=rb.read_text(encoding='utf-8',errors='replace')
                for keys,var in [(('width','length'),'L'),(('height',),'H'),(('depth','thickness'),'W')]:
                    m=re.search(r'\b(?:'+ '|'.join(keys)+r')\s*=\s*(\d+(?:\.\d+)?)\.(mm|cm|m)\b',text)
                    if m:defaults[var]=max(.01,float(m[1])*{'mm':.1,'cm':1,'m':100}[m[2]])
        category,definition=build_recipe(folder.name,defaults)
        records.append({"id":product_id,"name":folder.name,"category":category,"image_url":"/static/product-bom/"+asset,
                        "definition":definition,"source_image":image.name})
        references.append({"id":product_id,"name":folder.name,"category":category,"image_url":"/product-references/"+product_id+'.webp'})
    out=BACKEND/'config'/'product_formula_seed.json'
    out.write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
    (frontend_assets/'catalog.json').write_text(json.dumps(references,ensure_ascii=False),encoding='utf-8')
    print(f'Prepared {len(records)} products: {out}')
    return records


def apply(records):
    sys.path.insert(0,str(BACKEND))
    from dotenv import load_dotenv
    load_dotenv(BACKEND/'.env')
    from models import app,db,ProductFormula
    with app.app_context():
        count=0
        for record in records:
            if db.session.get(ProductFormula,record['id']):continue
            db.session.add(ProductFormula(id=record['id'],name=record['name'],category=record['category'],
                image_url=record['image_url'],definition=record['definition'],is_published=False,version=1))
            count+=1
        db.session.commit();print(f'Imported {count} drafts; existing formulas preserved.')


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--source',type=Path)
    parser.add_argument('--apply',action='store_true')
    args=parser.parse_args()
    records=prepare(args.source) if args.source else json.loads((BACKEND/'config'/'product_formula_seed.json').read_text(encoding='utf-8'))
    if args.apply:apply(records)
