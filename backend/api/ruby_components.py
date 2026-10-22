# -*- coding: utf-8 -*-
"""
Module bóc tách và đánh giá cấu kiện kết cấu biển hiệu quảng cáo (Bill of Materials - BOM)
Phục vụ tính báo giá chuẩn xác, tạo bảng Markdown trong câu trả lời AI và
chèn khối comment chi tiết ở đầu file SketchUp Ruby (.rb).
"""

import re
import math


def guess_unit_price(name: str, dims: str, unit: str) -> int:
    nl = name.lower()
    dl = dims.lower()
    ul = unit.lower()
    if any(k in nl for k in ("nắp", "nap", "bịt", "bit")):
        return 150000
    if any(k in nl for k in ("bản đế", "ban de", "đế cột", "de cot")):
        return 450000
    if any(k in nl for k in ("bu lông", "bu long", "bulong", "neo")):
        return 85000
    if any(k in nl for k in ("bản mã", "ban ma")):
        return 180000
    if any(k in nl for k in ("móng", "mong")):
        return 2500000
    if any(k in nl for k in ("cột", "cot", "trụ", "tru")):
        return 3800000
    if any(k in nl for k in ("tay đỡ", "tay do")):
        return 350000
    if any(k in nl for k in ("giằng", "giang")):
        return 280000
    if any(k in nl for k in ("xương", "xuong")):
        return 280000
    if any(k in nl for k in ("khung viền", "khung vien", "khung")):
        return 1200000
    if any(k in nl for k in ("nẹp", "nep")):
        return 450000
    if any(k in nl for k in ("tôn lót", "ton lot", "tôn", "ton")):
        return 95000 if ("m2" in ul or "m²" in ul) else 1250000
    if any(k in nl for k in ("alu", "alucobest", "alcorest")):
        if "quy doi" in ul or "tấm" in ul or "tam" in ul or "bộ" in ul or "bo" in ul:
            m = re.findall(r"[\d\.]+", dl)
            if len(m) >= 2:
                try:
                    w_val = float(m[0])
                    h_val = float(m[1])
                    if w_val > 50:
                        w_val /= 1000.0
                    if h_val > 50:
                        h_val /= 1000.0
                    area = min(150.0, max(0.2, w_val * h_val))
                    return min(30000000, int(round(area * 480000)))
                except Exception:
                    pass
            return 8448000
        return 480000
    if any(k in nl for k in ("bạt", "bat", "hiflex")):
        if "thay the" in ul or "tấm" in ul or "bộ" in ul or "bo" in ul:
            m = re.findall(r"[\d\.]+", dl)
            if len(m) >= 2:
                try:
                    w_val = float(m[0])
                    h_val = float(m[1])
                    if w_val > 50:
                        w_val /= 1000.0
                    if h_val > 50:
                        h_val /= 1000.0
                    area = min(150.0, max(0.2, w_val * h_val))
                    return min(20000000, int(round(area * 280000)))
                except Exception:
                    pass
            return 4928000
        return 280000
    if "led" in nl or "đèn led" in nl:
        return 1500000 if ("bộ" in ul or "bo" in ul) else 250000
    if any(k in nl for k in ("chữ nổi", "chu noi")):
        return 2800000
    if any(k in nl for k in ("đèn pha", "den pha", "pha led")):
        return 450000
    if any(k in nl for k in ("phụ kiện", "phu kien", "sơn", "son", "vật tư phụ")):
        return 500000
    if any(k in nl for k in ("sàn", "san", "thang", "catwalk")):
        return 1800000
    return 350000


def parse_bom_from_comment(ruby_code: str) -> list:
    """
    Trích xuất bảng cấu kiện từ comment đầu file Ruby nếu có dạng bảng Markdown / text:
    # STT | Tên cấu kiện | Kích thước | SL | ĐVT | Đơn giá | Thành tiền
    """
    if not ruby_code:
        return []

    components = []
    lines = ruby_code.splitlines()
    in_table = False

    for line in lines:
        raw = line.strip()
        if not raw:
            continue
        if not raw.startswith("#"):
            if in_table and len(components) > 0:
                break
            continue

        clean = raw.lstrip("#").strip()
        if not clean:
            continue

        low = clean.lower()
        if (
            any(k in low for k in ("bảng thống kê cấu kiện", "bang thong ke", "boc tach vat tu", "bóc tách", "bom tham khao", "bom"))
            or ("|" in clean and "stt" in low and any(k in low for k in ("tên", "ten", "hạng", "hang", "quy cách", "quy cach")))
        ):
            in_table = True
            if "stt" not in low:
                continue

        if in_table and "|" in clean:
            parts = [p.strip() for p in clean.split("|")]
            if parts and parts[0] == "":
                parts.pop(0)
            if parts and parts[-1] == "":
                parts.pop()

            if len(parts) >= 4:
                first = parts[0]
                if set(first) <= {"-", " ", ":"}:
                    continue
                if any(k in first.lower() for k in ("stt", "hạng mục", "tên", "ten")):
                    continue

                try:
                    stt = int(first)
                except ValueError:
                    stt = len(components) + 1

                name = parts[1] if len(parts) > 1 else "Cấu kiện"
                dims = parts[2] if len(parts) > 2 else ""
                qty_str = parts[3] if len(parts) > 3 else "1"
                unit = parts[4] if len(parts) > 4 else "bộ"

                qty_match = re.search(r"[\d\.]+", qty_str.replace(",", "."))
                qty = float(qty_match.group(0)) if qty_match else 1.0
                if qty <= 0:
                    continue

                price = 0
                total = 0
                if len(parts) > 5:
                    p_digits = re.sub(r"[^\d]", "", parts[5])
                    price = int(p_digits) if p_digits else 0
                if len(parts) > 6:
                    t_digits = re.sub(r"[^\d]", "", parts[6])
                    total = int(t_digits) if t_digits else int(qty * price)

                if price == 0:
                    price = guess_unit_price(name, dims, unit)
                    total = int(round(qty * price))
                elif total == 0:
                    total = int(round(qty * price))

                # Giới hạn an toàn chống số liệu bất thường
                price = min(50000000, max(0, price))
                total = min(500000000, max(0, total))

                components.append({
                    "stt": stt,
                    "name": name,
                    "dimensions": dims,
                    "quantity": qty,
                    "unit": unit,
                    "unitPrice": price,
                    "total": total,
                    "detail": dims
                })

    return components


def estimate_structural_components(w: float, h: float, d: float, category: str = "storefront",
                                  ruby_code: str = "", materials_spec: dict = None) -> list:
    """
    Đánh giá và bóc tách đầy đủ tất cả cấu kiện thực tế của bảng hiệu dựa trên:
    - Kích thước thật (Dài x Cao x Sâu)
    - Phân loại (billboard / storefront / mini)
    - Phân tích mã Ruby (tìm trụ thép, móng, giàn truss, catwalk, thang, led...)
    """
    materials_spec = materials_spec or {}
    code_low = (ruby_code or "").lower()
    w = max(0.5, float(w or 6.0))
    h = max(0.4, float(h or 2.5))
    d = max(0.05, float(d or 0.25))
    area = round(w * h, 2)
    perimeter = round(2 * (w + h), 2)

    has_pillar = category == "billboard" or w >= 8.0 or "pillar" in code_low or "tru_thep" in code_low or "add_circle" in code_low
    has_catwalk = category == "billboard" or w >= 8.0 or "catwalk" in code_low or "san_thao_tac" in code_low
    has_led = materials_spec.get("has_led", True) or "led" in code_low
    has_backing = materials_spec.get("has_sheet_backing", True)

    iron_type = materials_spec.get("iron_type") or ("vuong_30" if w >= 8 else "vuong_25")
    surface_type = materials_spec.get("surface_type") or ("bat_3m_uv" if w >= 10 else "alu_3mm")

    surface_name_map = {
        "alu_3mm": "Mặt bảng tấm ốp Alu Alcorest 3mm (0.10mm)",
        "alu_gương": "Mặt bảng tấm Alu gương vàng/bạc ngoài trời",
        "bat_hiflex": "Mặt bạt Hiflex 3.6 zem chống rách",
        "bat_3m_uv": "Mặt bạt 3M in UV công nghệ Mỹ không gân",
        "mica_dai_loan": "Mặt tấm Mica Chochen Đài Loan 3mm",
    }
    surface_label = surface_name_map.get(surface_type, f"Mặt bảng phẳng ({surface_type})")
    surface_unit_price = 280000 if "hiflex" in surface_type else (650000 if "3m" in surface_type else 520000)

    iron_name_map = {
        "vuong_20": "Sắt hộp mạ kẽm 20x20x1.2mm",
        "vuong_25": "Sắt hộp mạ kẽm 25x25x1.4mm",
        "vuong_30": "Sắt hộp mạ kẽm 30x30x1.4mm",
        "hop_20_40": "Sắt hộp mạ kẽm 20x40x1.4mm",
        "hop_30_60": "Sắt hộp mạ kẽm 30x60x1.4mm",
    }
    iron_label = iron_name_map.get(iron_type, "Sắt hộp mạ kẽm chịu lực")
    iron_unit_price = 185000 if "25" in iron_type else (245000 if "30" in iron_type else 295000)

    components = []
    idx = 1

    # 1. Khối Móng bê tông cốt thép
    if has_pillar:
        num_footings = 2 if w >= 6.0 else 1
        f_w = round(max(1.0, min(2.5, w * 0.15)), 2)
        f_d = round(max(1.2, min(2.2, h * 0.4)), 2)
        components.append({
            "stt": idx,
            "name": "Móng bê tông cốt thép chịu lực",
            "dimensions": f"{num_footings} hố móng ({f_w}m x {f_w}m x sâu {f_d}m), mác 250",
            "quantity": num_footings,
            "unit": "hố móng",
            "unitPrice": 2800000,
            "total": num_footings * 2800000,
            "detail": f"Đào đắp, gia công thép giằng và đổ bê tông tươi mác 250 chịu bão cấp 12"
        })
        idx += 1

        # 2. Bu lông neo & Bản mã liên kết
        components.append({
            "stt": idx,
            "name": "Bản mã thép & Bu lông neo móng",
            "dimensions": f"Bản mã {int(f_w*250)}x{int(f_w*250)}x16mm + 8 Bu lông M24 mạ kẽm",
            "quantity": num_footings,
            "unit": "bộ",
            "unitPrice": 850000,
            "total": num_footings * 850000,
            "detail": "Gia công tiện ren, hàn bát đế móng và liên kết chân trụ vững chắc"
        })
        idx += 1

        # 3. Cột trụ thép tròn / hộp chịu lực chính
        col_diam = int(min(500, max(200, w * 35)))
        col_h = round(max(4.0, h * 1.4), 1)
        components.append({
            "stt": idx,
            "name": f"Trụ thép tròn chịu lực chính Ø{col_diam}mm",
            "dimensions": f"Thép ống đúc Ø{col_diam}mm x L={col_h}m, độ dày 6.5mm",
            "quantity": num_footings,
            "unit": "cây trụ",
            "unitPrice": 4200000,
            "total": num_footings * 4200000,
            "detail": "Sơn 2 lớp chống rỉ Epoxy + sơn phủ công nghiệp màu ghi xám"
        })
        idx += 1

    # 4. Khung giàn xương sắt hộp chịu lực
    span = 1.2
    grid_cols = max(1, math.ceil(w / span))
    grid_rows = max(1, math.ceil(h / span))
    total_iron_len = perimeter + ((grid_cols - 1) * h) + ((grid_rows - 1) * w)
    iron_bars = math.ceil(total_iron_len / 6.0)
    components.append({
        "stt": idx,
        "name": f"Khung xương giàn sắt hộp ({iron_label})",
        "dimensions": f"Đan xương nan caro nhịp {span}m, tổng chiều dài {round(total_iron_len, 1)}m",
        "quantity": iron_bars,
        "unit": "cây (6m)",
        "unitPrice": iron_unit_price,
        "total": iron_bars * iron_unit_price,
        "detail": f"Hàn liên kết giàn chịu lực, mối hàn kín sơn chống rỉ giáp mối"
    })
    idx += 1

    # 5. Thanh giằng xéo tăng cứng chống vặn
    brace_bars = max(2, math.ceil(w * 0.7))
    components.append({
        "stt": idx,
        "name": "Thanh giằng xéo tăng cứng chống vặn khung",
        "dimensions": f"Sắt hộp vuông 25x25x1.2mm đan chéo chữ X, dài {round(brace_bars * 6, 1)}m",
        "quantity": brace_bars,
        "unit": "cây (6m)",
        "unitPrice": 145000,
        "total": brace_bars * 145000,
        "detail": "Tăng độ cứng vững bề mặt biển hiệu, chống rung lắc khi gió giật"
    })
    idx += 1

    # 6. Mặt bảng tấm ốp nền phẳng
    components.append({
        "stt": idx,
        "name": surface_label,
        "dimensions": f"{w}m x {h}m (Diện tích thiết kế: {area} m²)",
        "quantity": area,
        "unit": "m²",
        "unitPrice": surface_unit_price,
        "total": int(area * surface_unit_price),
        "detail": "Gia công căng phẳng mặt bạt hoặc soi phay rãnh ghép mí Alu bắn keo silicon"
    })
    idx += 1

    # 7. Viền bo nhôm định hình V bọc quanh chu vi
    trim_bars = math.ceil(perimeter / 3.0)
    components.append({
        "stt": idx,
        "name": "Nẹp viền nhôm định hình V25 bo góc",
        "dimensions": f"V nhôm 25x25mm bọc kín 4 cạnh viền (Chu vi: {perimeter}m)",
        "quantity": trim_bars,
        "unit": "cây (3m)",
        "unitPrice": 45000,
        "total": trim_bars * 45000,
        "detail": "Bọc viền thẩm mỹ, bảo vệ mép tấm không bị ngấm nước mưa"
    })
    idx += 1

    # 8. Tôn lót mặt sau chống thấm dột
    if has_backing:
        components.append({
            "stt": idx,
            "name": "Tôn mạ màu chống thấm bảo vệ mặt sau",
            "dimensions": f"Tôn kẽm mạ màu 0.35mm che kín mặt lưng {w}m x {h}m ({area} m²)",
            "quantity": area,
            "unit": "m²",
            "unitPrice": 95000,
            "total": int(area * 95000),
            "detail": "Chống thấm nước dột vào hệ thống điện LED, tăng tuổi thọ biển hiệu"
        })
        idx += 1

    # 9. Bộ chữ nổi 3D thương hiệu phát sáng LED
    let_w = round(w * 0.7, 2)
    let_h = round(h * 0.35, 2)
    let_price = max(2200000, int(w * h * 420000))
    components.append({
        "stt": idx,
        "name": "Bộ chữ nổi 3D thương hiệu phát sáng LED",
        "dimensions": f"Khổ bộ chữ {let_w}m x {let_h}m, mặt Mica 3mm uốn chân nổi 60mm",
        "quantity": 1,
        "unit": "bộ",
        "unitPrice": let_price,
        "total": let_price,
        "detail": "Cắt laser CNC, uốn chân viền thẩm mỹ, hắt sáng LED module mắt ngọc 3 bóng"
    })
    idx += 1

    # 10. Sàn thao tác Catwalk & Thang leo bảo vệ (nếu có)
    if has_catwalk:
        cw_len = round(w * 0.9, 1)
        components.append({
            "stt": idx,
            "name": "Sàn thao tác Catwalk kỹ thuật & Thang an toàn",
            "dimensions": f"Sàn thép chống trượt rộng 0.8m x dài {cw_len}m + Lan can 0.9m + Thang leo",
            "quantity": 1,
            "unit": "hệ thống",
            "unitPrice": 4800000,
            "total": 4800000,
            "detail": "Phục vụ công tác thay bạt định kỳ, bảo trì hệ thống chiếu sáng an toàn"
        })
        idx += 1

    # 11. Đèn pha LED chiếu rọi ngoài trời
    if has_led or w >= 6.0:
        num_lights = max(2, round(w / 2.5))
        components.append({
            "stt": idx,
            "name": "Cần đỡ & Đèn pha LED chiếu rọi ngoài trời",
            "dimensions": f"{num_lights} cần vươn 1.2m + Đèn pha LED 50W/100W IP66 chống nước",
            "quantity": num_lights,
            "unit": "bộ",
            "unitPrice": 480000,
            "total": num_lights * 480000,
            "detail": "Chiếu sáng ban đêm rực rỡ, kèm dây nguồn Cadivi bọc ruột gà cách điện"
        })
        idx += 1

    # 12. Phụ kiện liên kết & Vật tư phụ trọn gói
    acc_price = max(350000, int(w * h * 55000))
    components.append({
        "stt": idx,
        "name": "Vật tư phụ & Phụ kiện liên kết chuyên dụng",
        "dimensions": "Que hàn, ốc vít tự khoan, silicone A500, bu lông neo & tắc kê đạn",
        "quantity": 1,
        "unit": "gói khoán",
        "unitPrice": acc_price,
        "total": acc_price,
        "detail": "Vật tư phụ thi công hoàn thiện đạt chuẩn chất lượng ADMAKE"
    })

    return components


def generate_bom_comment_header(components: list, w: float, h: float, d: float,
                                name: str = "Biển Hiệu Quảng Cáo", category: str = "storefront") -> str:
    """
    Tạo khối comment dạng bảng thống kê chi tiết đặt ở ngay đầu mã nguồn Ruby (.rb).
    Người dùng mở file Ruby là đọc và lấy được ngay danh sách cấu kiện, kích thước, số lượng.
    """
    area = round(w * h, 2)
    total_cost = sum(c.get("total", 0) for c in components)

    lines = [
        "# ==============================================================================",
        "# BẢNG THỐNG KÊ CẤU KIỆN & BÓC TÁCH VẬT TƯ THI CÔNG CHI TIẾT (BOM)",
        f"# Dự án: {name}",
        f"# Phân loại: {category.upper()} | Kích thước: {w}m (Dài) x {h}m (Cao) x {d}m (Sâu) • Diện tích: {area} m²",
        f"# Tổng số cấu kiện kết cấu: {len(components)} hạng mục",
        f"# Tự động đánh giá & lập trình bởi: ADMAKE AI Structural Engineering Studio",
        "# ------------------------------------------------------------------------------",
        "# STT | Tên Cấu Kiện                      | Kích Thước (Quy Cách)             | SL   | ĐVT    | Đơn Giá (VNĐ) | Thành Tiền (VNĐ)",
        "# ------------------------------------------------------------------------------",
    ]

    for c in components:
        stt = str(c.get("stt", "")).rjust(3)
        name_c = c.get("name", "")[:32].ljust(32)
        dims = c.get("dimensions", "")[:32].ljust(32)
        qty = str(c.get("quantity", 1)).rjust(4)
        unit = c.get("unit", "")[:7].ljust(7)
        price = f"{c.get('unitPrice', 0):,}".replace(",", ".").rjust(13)
        tot = f"{c.get('total', 0):,}".replace(",", ".").rjust(16)
        lines.append(f"# {stt} | {name_c} | {dims} | {qty} | {unit} | {price} | {tot}")

    # --------------------------------------------------------------------------
    # Bổ sung thông số dự trù vận hành & logistics
    # --------------------------------------------------------------------------
    logistics = parse_logistics_from_ruby(None, {"width": w, "height": h, "depth": d}, components)
    lines.extend([
        "# ------------------------------------------------------------------------------",
        "# THÔNG SỐ DỰ TRÙ VẬN HÀNH & LOGISTICS (AI STRUCTURAL ESTIMATE)",
        f"# 1. Nhân công sản xuất & lắp đặt: {logistics['labor_days']} công (Đơn giá: {logistics['labor_rate']:,} đ/công)".replace(",", "."),
        f"# 2. Cự ly vận chuyển công trình: {logistics['transport_km']} km (Đơn giá: {logistics['transport_rate']:,} đ/km)".replace(",", "."),
        f"# 3. % Hao hụt vật tư: {logistics['scrap_percent']}%",
        f"# 4. Trọng lượng vận chuyển: {logistics['shipping_weight_text']}",
        f"# 5. Kích thước đóng gói: {logistics['package_dimensions']}",
        f"# 6. Đề xuất loại xe sử dụng: {logistics['recommended_vehicle']}",
    ])

    lines.append("# ------------------------------------------------------------------------------")
    lines.append(f"# TỔNG DỰ TOÁN VẬT TƯ BÓC TÁCH: {total_cost:,} VNĐ".replace(",", "."))
    lines.append("# Hướng dẫn: Mở SketchUp -> Extensions -> Ruby Console -> Dán mã này và Enter")
    lines.append("# ==============================================================================")
    lines.append("")

    return "\n".join(lines)


def generate_bom_markdown_table(components: list, w: float, h: float, d: float,
                                name: str = "Biển Hiệu Quảng Cáo") -> str:
    """Tạo bảng Markdown thống kê cấu kiện để xuất trong nội dung câu trả lời của AI"""
    area = round(w * h, 2)
    total_cost = sum(c.get("total", 0) for c in components)
    logistics = parse_logistics_from_ruby(None, {"width": w, "height": h, "depth": d}, components)

    lines = [
        f"### 📋 BẢNG ĐÁNH GIÁ CẤU KIỆN & BÓC TÁCH VẬT TƯ CHI TIẾT (BOM)",
        f"• **Công trình**: {name}",
        f"• **Kích thước**: **{w}m (Dài) × {h}m (Cao) × {d}m (Sâu)** • Diện tích: **{area} m²**",
        f"• **Tổng số cấu kiện kết cấu**: **{len(components)} hạng mục**",
        "",
        "| STT | Tên Cấu Kiện | Kích Thước (Quy Cách Kỹ Thuật) | Số Lượng | Đơn Vị | Đơn Giá | Thành Tiền |",
        "| :---: | :--- | :--- | :---: | :---: | ---: | ---: |",
    ]

    for c in components:
        stt = c.get("stt", "")
        name_c = c.get("name", "")
        dims = c.get("dimensions", "")
        qty = c.get("quantity", 1)
        unit = c.get("unit", "")
        price = f"{c.get('unitPrice', 0):,} đ".replace(",", ".")
        tot = f"**{c.get('total', 0):,} đ**".replace(",", ".")
        lines.append(f"| {stt} | {name_c} | {dims} | {qty} | {unit} | {price} | {tot} |")

    lines.append("")
    lines.append(f"💰 **Tổng chi phí vật tư dự toán**: **{total_cost:,} VNĐ** (chưa gồm nhân công & vận chuyển)".replace(",", "."))
    lines.append("")
    lines.append("### 🚚 DỰ TRÙ VẬN HÀNH & LOGISTICS VẬN CHUYỂN")
    lines.append(f"- 👷 **Nhân công sản xuất & lắp đặt**: **{logistics['labor_days']} công** (đơn giá: **{logistics['labor_rate']:,} đ/công**)".replace(",", "."))
    lines.append(f"- 🛣️ **Cự ly vận chuyển công trình**: **{logistics['transport_km']} km** (đơn giá: **{logistics['transport_rate']:,} đ/km**)".replace(",", "."))
    lines.append(f"- 📐 **% Hao hụt vật tư**: **{logistics['scrap_percent']}%** (cắt gọt sắt, xén alu, bo viền)")
    lines.append(f"- ⚖️ **Trọng lượng vận chuyển ước tính**: **{logistics['shipping_weight_text']}**")
    lines.append(f"- 📦 **Kích thước đóng gói kiện hàng**: **{logistics['package_dimensions']}**")
    lines.append(f"- 🚛 **Đề xuất loại xe sử dụng**: **{logistics['recommended_vehicle']}**")
    lines.append("")
    lines.append("*(Bảng thống kê và dự trù logistics này đã được chèn tự động vào comment đầu file Ruby .rb để bạn mở file là xem được ngay)*")
    lines.append("")

    return "\n".join(lines)


def parse_logistics_from_ruby(ruby_code: str, dimensions: dict = None, components: list = None) -> dict:
    """
    Trích xuất hoặc tính toán dự trù:
    1. Nhân công sản xuất & lắp đặt (số công thợ, đơn giá / công)
    2. Vận chuyển công trình (cự ly km, đơn giá / km)
    3. % Hao hụt vật tư
    4. Trọng lượng vận chuyển ước tính (kg, tấn)
    5. Kích thước đóng gói kiện hàng
    6. Đề xuất loại xe sử dụng
    """
    dims = dimensions or {}
    w = float(dims.get("width", 6.0) or 6.0)
    h = float(dims.get("height", 2.2) or 2.2)
    d = float(dims.get("depth", 0.15) or 0.15)
    area = round(w * h, 2)
    comps = components or []
    num_comps = len(comps)

    default_days = max(2, min(40, int(round(area * 0.7 + num_comps * 0.4))))
    default_rate = 400000
    default_km = 15
    default_km_rate = 15000
    default_scrap = 7 if area > 10 else 5

    steel_weight = area * 16.0
    post_weight = (h * 2.0 * 22.0) if w >= 5.0 else (h * 12.0)
    sheet_weight = area * 4.2
    access_weight = 40.0
    calc_weight_kg = int(round(steel_weight + post_weight + sheet_weight + access_weight))
    calc_weight_kg = max(50, calc_weight_kg)

    if w > 6.0:
        pack_dims = f"{w/2:.1f}m × {h:.1f}m × 0.45m (chia 2 module)"
    elif w > 3.0:
        pack_dims = f"{w:.1f}m × {h:.1f}m × 0.35m (nguyên kiện)"
    else:
        pack_dims = f"{w:.1f}m × {h:.1f}m × 0.20m (nguyên kiện)"

    if w >= 7.0 or calc_weight_kg >= 2000:
        veh = "Xe cẩu tự hành 5 - 8 tấn (thùng dài 6.5 - 7.5m, có cẩu lắp dựng)"
    elif w >= 4.5 or calc_weight_kg >= 1000:
        veh = "Xe cẩu tự hành 3.5 - 5 tấn (thùng dài 5.2 - 6.0m)"
    elif w >= 3.0 or calc_weight_kg >= 500:
        veh = "Xe tải thùng dài 2.5 tấn (thùng dài 4.3m)"
    else:
        veh = "Xe tải nhẹ 1.25 - 1.9 tấn (thùng dài 3.2m)"

    code_text = ruby_code or ""
    lines = code_text.splitlines()

    labor_days = default_days
    labor_rate = default_rate
    transport_km = default_km
    transport_rate = default_km_rate
    scrap_percent = default_scrap
    shipping_weight_kg = calc_weight_kg
    package_dims = pack_dims
    recommended_vehicle = veh

    for line in lines:
        l = line.lower().strip().lstrip("#").strip()
        if not l:
            continue
        if any(k in l for k in ("số công", "so cong", "nhân công", "nhan cong")):
            m = re.search(r"(\d+(?:\.\d+)?)", l)
            if m:
                val = float(m.group(1))
                if 1 <= val <= 100:
                    labor_days = int(round(val))
        if any(k in l for k in ("đơn giá công", "don gia cong", "giá công", "gia cong")):
            m = re.search(r"(\d[\d\.\,]+)", l)
            if m:
                v = int(re.sub(r"[^\d]", "", m.group(1)))
                if 100000 <= v <= 3000000:
                    labor_rate = v
        if any(k in l for k in ("cự ly", "cu ly", "khoảng cách", "khoang cach")) and any(u in l for u in ("km", "cây")):
            m = re.search(r"(\d+(?:\.\d+)?)", l)
            if m:
                val = float(m.group(1))
                if 1 <= val <= 500:
                    transport_km = int(round(val))
        if any(k in l for k in ("đơn giá km", "don gia km", "giá km", "gia km", "cước", "cuoc")):
            m = re.search(r"(\d[\d\.\,]+)", l)
            if m:
                v = int(re.sub(r"[^\d]", "", m.group(1)))
                if 3000 <= v <= 200000:
                    transport_rate = v
        if any(k in l for k in ("hao hụt", "hao hut", "scrap")) and ("%" in l or "phần trăm" in l):
            m = re.search(r"(\d+(?:\.\d+)?)", l)
            if m:
                val = float(m.group(1))
                if 1 <= val <= 50:
                    scrap_percent = int(round(val))
        if any(k in l for k in ("trọng lượng", "trong luong", "khối lượng", "khoi luong", "weight")) and any(u in l for u in ("kg", "tấn", "tan")):
            m = re.search(r"(\d+(?:\.\d+)?)", l)
            if m:
                val = float(m.group(1))
                if "tấn" in l or "tan" in l:
                    val *= 1000
                if 30 <= val <= 50000:
                    shipping_weight_kg = int(round(val))
        if any(k in l for k in ("kích thước đóng gói", "kich thuoc dong goi", "đóng gói", "dong goi", "kiện hàng")):
            m = re.search(r"[:\|]\s*([^\|#]+)", line)
            if m:
                raw_pack = m.group(1).strip()
                if any(x in raw_pack for x in ("x", "×", "m")):
                    package_dims = raw_pack
        if any(k in l for k in ("đề xuất xe", "de xuat xe", "loại xe", "loai xe", "xe tải", "xe cẩu")):
            m = re.search(r"[:\|]\s*([^\|#]+)", line)
            if m:
                raw_veh = m.group(1).strip()
                if any(x in raw_veh.lower() for x in ("xe", "tấn", "tan", "cẩu", "thùng")):
                    recommended_vehicle = raw_veh

    if shipping_weight_kg >= 1000:
        weight_text = f"{shipping_weight_kg:,.0f} kg ({shipping_weight_kg/1000:.2f} tấn)".replace(",", ".")
    else:
        weight_text = f"{shipping_weight_kg} kg"

    return {
        "labor_days": labor_days,
        "labor_rate": labor_rate,
        "transport_km": transport_km,
        "transport_rate": transport_rate,
        "scrap_percent": scrap_percent,
        "shipping_weight_kg": shipping_weight_kg,
        "shipping_weight_text": weight_text,
        "package_dimensions": package_dims,
        "recommended_vehicle": recommended_vehicle,
    }
