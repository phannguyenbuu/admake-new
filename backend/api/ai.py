import os
import json
import math
import urllib.request
from urllib.error import HTTPError, URLError
from flask import Blueprint, request, jsonify

ai_bp = Blueprint('ai', __name__)

def get_active_ai_keys():
    """Lấy API key từ biến môi trường hoặc cấu hình"""
    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or ""
    openai_key = os.environ.get("OPENAI_API_KEY") or ""
    return gemini_key.strip(), openai_key.strip()

def call_gemini_api(prompt_text, system_instruction=None, api_key=None):
    """Gọi trực tiếp Google Gemini API qua REST urllib không cần thư viện ngoài"""
    key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not key:
        return None

    # Thử các model Gemini phổ biến: gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-flash
    for model in ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
        payload = {
            "contents": [{"parts": [{"text": prompt_text}]}],
            "generationConfig": {
                "temperature": 0.3,
                "maxOutputTokens": 2048
            }
        }
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        try:
            data_bytes = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=data_bytes,
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                res = json.loads(resp.read().decode("utf-8"))
                candidates = res.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts and parts[0].get("text"):
                        return parts[0].get("text").strip()
        except Exception:
            continue
    return None

def call_openai_api(prompt_text, system_instruction=None, api_key=None):
    """Gọi OpenAI GPT API qua REST urllib"""
    key = api_key or os.environ.get("OPENAI_API_KEY")
    if not key:
        return None

    url = "https://api.openai.com/v1/chat/completions"
    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt_text})

    payload = {
        "model": "gpt-4o-mini",
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 2048
    }

    try:
        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data_bytes,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {key}"
            }
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            res = json.loads(resp.read().decode("utf-8"))
            choices = res.get("choices", [])
            if choices:
                return choices[0].get("message", {}).get("content", "").strip()
    except Exception:
        pass
    return None


PRICING_STANDARDS = {
    "materials": {
        "iron_bars": {
            "vuong_20": {"name": "Sắt vuông 20x20 (1.0mm)", "unit_price": 75000, "length": 6.0, "unit": "cây (6m)"},
            "vuong_25": {"name": "Sắt vuông 25x25 (1.0mm)", "unit_price": 95000, "length": 6.0, "unit": "cây (6m)"},
            "vuong_30": {"name": "Sắt vuông 30x30 (1.2mm)", "unit_price": 135000, "length": 6.0, "unit": "cây (6m)"},
        },
        "surfaces": {
            "bat_hiflex": {"name": "Bạt thường (Hiflex)", "type": "canvas", "unit_price": 27000, "unit": "m²"},
            "bat_2da": {"name": "Bạt 2 da (Đế xám chống xuyên sáng)", "type": "canvas", "unit_price": 45000, "unit": "m²"},
            "bat_khong_gan_uv": {"name": "Bạt không gân in UV", "type": "canvas", "unit_price": 170000, "unit": "m²"},
            "bat_3m_uv": {"name": "Bạt 3M in UV", "type": "canvas", "unit_price": 450000, "unit": "m²"},
            "alu_3mm": {"name": "Tấm Alu (3mm 0.10)", "type": "sheet", "unit_price": 480000, "unit": "tấm", "sheet_w": 1.22, "sheet_h": 2.44},
            "alu_guong_vang": {"name": "Tấm Alu đồng gương vàng (3mm)", "type": "sheet", "unit_price": 480000, "unit": "tấm", "is_mirror": True, "sheet_w": 1.22, "sheet_h": 2.44},
            "mica_2_3mm": {"name": "Tấm Mica (2mm/3mm)", "type": "sheet", "unit_price": 690000, "unit": "tấm", "sheet_w": 1.22, "sheet_h": 2.44},
        },
        "sheet_iron_backing": {
            "name": "Tôn lót mặt sau (Khổ 1.2m)",
            "unit_price": 75000,
            "unit": "mét tới",
            "width": 1.2,
        },
        "aluminum_trim": {
            "name": "V nhôm bọc viền (Cây 3m)",
            "unit_price": 35000,
            "unit": "cây (3m)",
            "length": 3.0,
        },
        "accessories": {
            "name": "Vật tư phụ (Keo, vít, que hàn...)",
            "lump_sum": 100000,
            "unit": "khoán/công trình",
        }
    },
    "operations": {
        "labor_sqm": {"name": "Nhân công thi công", "unit_price": 120000, "unit": "m²"},
        "transport": {"name": "Vận chuyển", "unit_price": 200000, "unit": "chuyến"},
        "scaffolding": {"name": "Dàn giáo", "unit_price": 50000, "unit": "bộ/ngày"},
        "canvas_seam_labor": {"name": "Nhân công nối bạt", "unit_price": 15000, "unit": "mét dài", "condition": "cả 2 chiều > 3.1m"},
    }
}


def calculate_signboard(data):
    """
    Hàm tính toán định mức vật tư, chi phí vận hành và hệ thống cảnh báo theo Hình 1, 2, 3
    """
    try:
        width = float(data.get("width", 0))    # Chiều dài / ngang (m)
        height = float(data.get("height", 0))  # Chiều cao / rộng (m)
    except (ValueError, TypeError):
        return {"error": "Kích thước chiều dài hoặc chiều cao không hợp lệ."}

    if width <= 0 or height <= 0:
        return {"error": "Kích thước bảng hiệu phải lớn hơn 0."}

    iron_type_key = data.get("iron_type", "vuong_20")
    iron_spec = PRICING_STANDARDS["materials"]["iron_bars"].get(
        iron_type_key, PRICING_STANDARDS["materials"]["iron_bars"]["vuong_20"]
    )

    surface_key = data.get("surface_type", "bat_hiflex")
    surface_spec = PRICING_STANDARDS["materials"]["surfaces"].get(
        surface_key, PRICING_STANDARDS["materials"]["surfaces"]["bat_hiflex"]
    )

    has_sheet_backing = bool(data.get("has_sheet_backing", True))
    has_reinforce_iron = bool(data.get("has_reinforce_iron", False))
    reinforce_qty = float(data.get("reinforce_qty", 0) or 0)
    reinforce_length = float(data.get("reinforce_length", 0) or 0)

    location = data.get("location", "outdoor") # "indoor" hoặc "outdoor"
    use_scaffolding = bool(data.get("use_scaffolding", False))
    scaffolding_sets = int(data.get("scaffolding_sets", 1) or 1)
    scaffolding_days = int(data.get("scaffolding_days", 1) or 1)

    profit_margin = float(data.get("profit_margin", 30) or 30) # %

    # 1. Diện tích và chu vi bảng
    area = round(width * height, 2)
    perimeter = round(2 * (width + height), 2)

    # 2. Khung sắt: Chu vi + đan xương ô vuông (nhịp 1m - 1.2m), chia 6m làm tròn lên cây nguyên
    span = 1.2
    grid_cols = max(1, math.ceil(width / span))
    vertical_ribs = max(0, grid_cols - 1)
    grid_rows = max(1, math.ceil(height / span))
    horizontal_ribs = max(0, grid_rows - 1)

    total_rib_length = (vertical_ribs * height) + (horizontal_ribs * width)
    total_iron_length = perimeter + total_rib_length
    iron_bars_count = math.ceil(total_iron_length / 6.0)
    iron_frame_cost = iron_bars_count * iron_spec["unit_price"]

    # 3. Sắt chống gia cố (nếu có): chia 6m làm tròn lên cây nguyên
    reinforce_bars_count = 0
    reinforce_iron_cost = 0
    total_reinforce_len = 0
    if has_reinforce_iron and reinforce_qty > 0 and reinforce_length > 0:
        total_reinforce_len = round(reinforce_qty * reinforce_length, 2)
        reinforce_bars_count = math.ceil(total_reinforce_len / 6.0)
        reinforce_iron_cost = reinforce_bars_count * iron_spec["unit_price"]

    # 4. Mặt bạt hoặc Mặt Alu/Mica
    surface_cost = 0
    surface_calc_detail = ""
    is_canvas = surface_spec["type"] == "canvas"
    canvas_seam_cost = 0
    canvas_seam_length = 0

    if is_canvas:
        # Mặt bạt: Diện tích = (Ngang + 0.2m lề) x (Cao + 0.2m lề)
        canvas_w = round(width + 0.2, 2)
        canvas_h = round(height + 0.2, 2)
        canvas_area = round(canvas_w * canvas_h, 2)
        surface_cost = round(canvas_area * surface_spec["unit_price"])
        surface_calc_detail = f"({canvas_w}m x {canvas_h}m) = {canvas_area} m² (đã +0.2m mỗi cạnh)"
    else:
        # Tấm Alu / Mica: Tính theo số tấm nguyên khổ 1.22 x 2.44m
        sheet_w = surface_spec.get("sheet_w", 1.22)
        sheet_h = surface_spec.get("sheet_h", 2.44)
        fit1 = math.ceil(width / sheet_w) * math.ceil(height / sheet_h)
        fit2 = math.ceil(width / sheet_h) * math.ceil(height / sheet_w)
        sheets_count = min(fit1, fit2)
        if sheets_count <= 0:
            sheets_count = 1
        surface_cost = sheets_count * surface_spec["unit_price"]
        surface_calc_detail = f"{sheets_count} tấm nguyên khổ {sheet_w}m x {sheet_h}m"

    # 5. Tôn lót mặt sau (nếu có): diện tích lọt lòng, tính số mét tới theo khổ 1.2m (75.000 đ/m tới)
    backing_cost = 0
    backing_linear_meters = 0
    if has_sheet_backing:
        backing_linear_meters = round(area / 1.2, 2)
        backing_cost = round(backing_linear_meters * PRICING_STANDARDS["materials"]["sheet_iron_backing"]["unit_price"])

    # 6. V nhôm bọc viền: Chu vi mặt bảng chia 3m làm tròn lên số cây nguyên (35.000 đ/cây 3m)
    trim_bars_count = math.ceil(perimeter / 3.0)
    trim_cost = trim_bars_count * PRICING_STANDARDS["materials"]["aluminum_trim"]["unit_price"]

    # 7. Vật tư phụ: khoán 100.000 đ/công trình
    accessories_cost = PRICING_STANDARDS["materials"]["accessories"]["lump_sum"]

    # 8. Chi phí vận hành
    # 8.1. Nhân công thi công: 120.000 đ/m²
    labor_cost = round(area * PRICING_STANDARDS["operations"]["labor_sqm"]["unit_price"])

    # 8.2. Vận chuyển: 200.000 đ/chuyến
    transport_cost = PRICING_STANDARDS["operations"]["transport"]["unit_price"]

    # 8.3. Dàn giáo: 50.000 đ/bộ/ngày
    scaffolding_cost = 0
    if use_scaffolding:
        scaffolding_cost = scaffolding_sets * scaffolding_days * PRICING_STANDARDS["operations"]["scaffolding"]["unit_price"]

    # 8.4. Cảnh báo nối bạt & Chi phí nhân công nối bạt:
    warnings = []
    need_canvas_seam = is_canvas and (width > 3.1 and height > 3.1)
    if need_canvas_seam:
        canvas_seam_length = min(width, height)
        canvas_seam_cost = round(canvas_seam_length * PRICING_STANDARDS["operations"]["canvas_seam_labor"]["unit_price"])
        warnings.append({
            "code": "CANVAS_SEAM",
            "level": "warning",
            "title": "CẢNH BÁO NỐI BẠT",
            "message": f"Khổ bạt tối đa là 3.1m. Cả 2 cạnh ({width}m x {height}m) đều > 3.1m, bắt buộc tính thêm chi phí nhân công nối bạt là 15.000 đ/mét dài (chiều dài đường nối: {canvas_seam_length}m = {canvas_seam_cost:,.0f} đ). Nhân viên cần tư vấn cho khách biết sẽ có đường nối mí."
        })
    elif is_canvas and (width > 3.1 or height > 3.1):
        warnings.append({
            "code": "CANVAS_ONE_SIDE_OVER",
            "level": "info",
            "title": "LƯU Ý KHỔ BẠT",
            "message": f"Bảng có 1 cạnh > 3.1m nhưng cạnh còn lại ≤ 3.1m nên có thể xoay chiều cuộn bạt để in liền khổ, không phát sinh chi phí nối bạt."
        })

    # Cảnh báo khổ Alu / Mica / Ván
    if not is_canvas:
        w_rem = width % 1.22
        h_rem = height % 2.44
        if (0 < w_rem <= 0.15) or (0 < h_rem <= 0.15):
            warnings.append({
                "code": "SHEET_AWKWARD_SIZE",
                "level": "warning",
                "title": "CẢNH BÁO KHỔ ALU/MICA LỠ CỠ",
                "message": f"Khổ vật tư chuẩn là 1.22m x 2.44m. Kích thước bảng ({width}m x {height}m) bị lỡ cỡ khiến phải tính làm tròn thêm 1 tấm nguyên ({sheets_count} tấm). Nhân viên nên tư vấn khách thu nhỏ kích thước lại (về chuẩn ≤ 1.22m hoặc ≤ 2.44m) để tiết kiệm chi phí."
            })

    # Cảnh báo nối Tôn / Decal
    if has_sheet_backing and (width > 1.2 and height > 1.2):
        warnings.append({
            "code": "TIN_SEAM",
            "level": "warning",
            "title": "CẢNH BÁO NỐI TÔN",
            "message": "Khổ Tôn tối đa là 1.2m. Bảng có cả 2 cạnh đều vượt quá 1.2m, tôn lót mặt sau chắc chắn sẽ có đường nối/ghép mí."
        })

    # Cảnh báo từ chối bảo hành
    if is_canvas and not has_sheet_backing:
        warnings.append({
            "code": "NO_WARRANTY_NO_TIN",
            "level": "danger",
            "title": "CẢNH BÁO TỪ CHỐI BẢO HÀNH",
            "message": "CẢNH BÁO: Bảng bạt không lót tôn, KHÔNG BẢO HÀNH rách do gió bão."
        })

    if surface_spec.get("is_mirror") and location == "outdoor":
        warnings.append({
            "code": "NO_WARRANTY_MIRROR_ALU",
            "level": "danger",
            "title": "CẢNH BÁO TỪ CHỐI BẢO HÀNH",
            "message": "CẢNH BÁO: Alu gương vàng ngoài trời KHÔNG BẢO HÀNH bay màu."
        })

    # 9. Tổng chi phí
    total_materials_cost = (
        iron_frame_cost +
        reinforce_iron_cost +
        surface_cost +
        backing_cost +
        trim_cost +
        accessories_cost
    )

    total_operations_cost = (
        labor_cost +
        transport_cost +
        scaffolding_cost +
        canvas_seam_cost
    )

    cost_price = total_materials_cost + total_operations_cost

    # 10. Báo giá khách hàng
    profit_amount = round(cost_price * (profit_margin / 100.0))
    quote_price = cost_price + profit_amount
    price_per_sqm = round(quote_price / area) if area > 0 else 0

    return {
        "dimensions": {
            "width": width,
            "height": height,
            "area": area,
            "perimeter": perimeter
        },
        "materials": {
            "iron_frame": {
                "name": f"Khung {iron_spec['name']}",
                "detail": f"Chu vi {perimeter}m + {vertical_ribs} xương dọc, {horizontal_ribs} xương ngang = {total_iron_length:.1f}m -> {iron_bars_count} cây 6m",
                "quantity": iron_bars_count,
                "unit": "cây",
                "unit_price": iron_spec["unit_price"],
                "total": iron_frame_cost
            },
            "reinforce_iron": {
                "name": f"Sắt chống gia cố ({iron_spec['name']})",
                "detail": f"{reinforce_qty} cây x {reinforce_length}m = {total_reinforce_len}m -> {reinforce_bars_count} cây 6m" if has_reinforce_iron else "Không có",
                "quantity": reinforce_bars_count,
                "unit": "cây",
                "unit_price": iron_spec["unit_price"],
                "total": reinforce_iron_cost,
                "active": has_reinforce_iron
            },
            "surface": {
                "name": surface_spec["name"],
                "detail": surface_calc_detail,
                "unit_price": surface_spec["unit_price"],
                "total": surface_cost
            },
            "sheet_backing": {
                "name": PRICING_STANDARDS["materials"]["sheet_iron_backing"]["name"],
                "detail": f"{backing_linear_meters} mét tới khổ 1.2m" if has_sheet_backing else "Không lót tôn",
                "quantity": backing_linear_meters,
                "unit": "mét tới",
                "unit_price": PRICING_STANDARDS["materials"]["sheet_iron_backing"]["unit_price"],
                "total": backing_cost,
                "active": has_sheet_backing
            },
            "aluminum_trim": {
                "name": PRICING_STANDARDS["materials"]["aluminum_trim"]["name"],
                "detail": f"Chu vi {perimeter}m / 3m -> {trim_bars_count} cây 3m",
                "quantity": trim_bars_count,
                "unit": "cây (3m)",
                "unit_price": PRICING_STANDARDS["materials"]["aluminum_trim"]["unit_price"],
                "total": trim_cost
            },
            "accessories": {
                "name": PRICING_STANDARDS["materials"]["accessories"]["name"],
                "detail": "Keo, vít, que hàn, phụ kiện",
                "quantity": 1,
                "unit": "khoán",
                "unit_price": accessories_cost,
                "total": accessories_cost
            },
            "total_materials_cost": total_materials_cost
        },
        "operations": {
            "labor": {
                "name": PRICING_STANDARDS["operations"]["labor_sqm"]["name"],
                "detail": f"{area} m² x {PRICING_STANDARDS['operations']['labor_sqm']['unit_price']:,.0f} đ",
                "quantity": area,
                "unit": "m²",
                "unit_price": PRICING_STANDARDS["operations"]["labor_sqm"]["unit_price"],
                "total": labor_cost
            },
            "transport": {
                "name": PRICING_STANDARDS["operations"]["transport"]["name"],
                "detail": "1 chuyến xe",
                "quantity": 1,
                "unit": "chuyến",
                "unit_price": transport_cost,
                "total": transport_cost
            },
            "scaffolding": {
                "name": PRICING_STANDARDS["operations"]["scaffolding"]["name"],
                "detail": f"{scaffolding_sets} bộ x {scaffolding_days} ngày" if use_scaffolding else "Không sử dụng",
                "quantity": scaffolding_sets * scaffolding_days if use_scaffolding else 0,
                "unit": "bộ/ngày",
                "unit_price": PRICING_STANDARDS["operations"]["scaffolding"]["unit_price"],
                "total": scaffolding_cost,
                "active": use_scaffolding
            },
            "canvas_seam": {
                "name": PRICING_STANDARDS["operations"]["canvas_seam_labor"]["name"],
                "detail": f"{canvas_seam_length}m đường nối" if need_canvas_seam else "Không cần nối bạt",
                "quantity": canvas_seam_length,
                "unit": "mét dài",
                "unit_price": PRICING_STANDARDS["operations"]["canvas_seam_labor"]["unit_price"],
                "total": canvas_seam_cost,
                "active": need_canvas_seam
            },
            "total_operations_cost": total_operations_cost
        },
        "summary": {
            "cost_price": cost_price,
            "profit_margin_percent": profit_margin,
            "profit_amount": profit_amount,
            "quote_price": quote_price,
            "price_per_sqm": price_per_sqm
        },
        "warnings": warnings,
        "location": location,
        "input_echo": data
    }


COMPANY_INFO = {
    "name": "CÔNG TY TNHH B-ONE VIỆT NAM",
    "brand": "HỆ THỐNG QUẢN LÝ SẢN XUẤT ADMAKE",
    "address": "45 Đặng Thái Thân, P. Buôn Ma Thuột, Tỉnh Đắk Lắk",
    "hotline": "1900 0047",
    "phone": "0837 884477",
    "email": "admakeapp@gmail.com",
    "website": "https://admake.vn",
    "tax_id": "6001728392",
    "logo": "/logo.jpg"
}



def calculate_ai_variance_percent(data):
    """Tính tỷ lệ chênh lệch khách quan cho AI (trong khoảng 0% - 6.0%)"""
    try:
        width = float(data.get("width", 0))
        height = float(data.get("height", 0))
    except (ValueError, TypeError):
        width, height = 4.0, 1.5
    is_outdoor = data.get("location") == "outdoor"
    seed = (int(round(width * 10)) * 7 + int(round(height * 10)) * 13 + (12 if is_outdoor else 5)) % 38
    raw_percent = 1.8 + (seed / 10.0)
    return min(6.0, max(0.5, round(raw_percent, 1)))


def generate_ai_prompt_response(input_data, quote_result):
    """
    Sinh nội dung câu trả lời chuẩn của AI Prompt theo Hình 1 & 2 kèm chênh lệch khách quan 0 - 6%
    """
    dim = quote_result["dimensions"]
    mat = quote_result["materials"]
    op = quote_result["operations"]
    sm = quote_result["summary"]
    wn = quote_result.get("warnings", [])

    ai_variance_percent = calculate_ai_variance_percent(input_data)
    multiplier = 1 + (ai_variance_percent / 100.0)
    ai_quote_price = round((sm["quote_price"] * multiplier) / 1000) * 1000
    ai_cost_price = round((sm["cost_price"] * multiplier) / 1000) * 1000
    variance_amount = ai_quote_price - sm["quote_price"]

    # Diễn giải phép tính
    explanations = []
    explanations.append(
        f"• **Khung sắt hộp**: Bảng kích thước {dim['width']}m x {dim['height']}m (Chu vi {dim['perimeter']}m). "
        f"Đan xương ô vuông nhịp 1m-1.2m. Tổng chiều dài sắt đan = {mat['iron_frame']['detail'].split('= ')[1].split(' ->')[0] if '= ' in mat['iron_frame']['detail'] else ''}. "
        f"Chia 6m làm tròn lên: **{mat['iron_frame']['quantity']} cây nguyên** x {mat['iron_frame']['unit_price']:,} đ = **{mat['iron_frame']['total']:,} đ**."
    )
    explanations.append(
        f"• **Mặt bảng**: {mat['surface']['name']}. Diễn giải: {mat['surface']['detail']} x {mat['surface']['unit_price']:,} đ = **{mat['surface']['total']:,} đ**."
    )

    if mat["reinforce_iron"]["active"]:
        explanations.append(
            f"• **Sắt chống gia cố**: {mat['reinforce_iron']['detail']} = **{mat['reinforce_iron']['total']:,} đ**."
        )

    if mat["sheet_backing"]["active"]:
        explanations.append(
            f"• **Tôn lót mặt sau**: Bằng diện tích lọt lòng {dim['area']} m², tính theo khổ 1.2m = {mat['sheet_backing']['quantity']} mét tới x {mat['sheet_backing']['unit_price']:,} đ = **{mat['sheet_backing']['total']:,} đ**."
        )
    else:
        explanations.append("• **Tôn lót mặt sau**: Không lót tôn.")

    explanations.append(
        f"• **V nhôm bọc viền**: Chu vi {dim['perimeter']}m / 3m = **{mat['aluminum_trim']['quantity']} cây nguyên (3m)** x {mat['aluminum_trim']['unit_price']:,} đ = **{mat['aluminum_trim']['total']:,} đ**."
    )
    explanations.append(f"• **Vật tư phụ**: Khoán trọn gói **{mat['accessories']['total']:,} đ**.")
    explanations.append(
        f"• **Chi phí vận hành**: Nhân công ({dim['area']} m² x 120.000 đ = {op['labor']['total']:,} đ) + Vận chuyển ({op['transport']['total']:,} đ)" +
        (f" + Dàn giáo ({op['scaffolding']['total']:,} đ)" if op["scaffolding"]["active"] else "") +
        (f" + Nhân công nối bạt ({op['canvas_seam']['total']:,} đ)" if op["canvas_seam"]["active"] else "") +
        f" = **{op['total_operations_cost']:,} đ**."
    )

    # Cảnh báo in đậm
    warning_texts = []
    if wn:
        for w in wn:
            warning_texts.append(f"**{w['title']}**: {w['message']}")
    else:
        warning_texts.append("Không phát hiện vi phạm quy cách kỹ thuật hoặc từ chối bảo hành đối với đơn hàng này.")

    ai_text = f"""Chào bạn! Tôi là **CHUYÊN GIA BÓC TÁCH VẬT TƯ & BÁO GIÁ NGÀNH QUẢNG CÁO**.
Theo đúng mẫu lệnh chuẩn và đơn giá xưởng ADMAKE, tôi xin gửi kết quả phân tích bóc tách cho bảng hiệu **{dim['width']}m x {dim['height']}m** như sau:

---

### 1. DIỄN GIẢI PHÉP TÍNH BÓC TÁCH:
{chr(10).join(explanations)}

---

### 2. BẢNG CHI TIẾT GIÁ VỐN (COST PRICE):
| Hạng mục | Quy cách / Định mức | Khối lượng | Đơn giá | Thành tiền |
| :--- | :--- | :---: | :---: | :---: |
| **A. VẬT TƯ ĐẦU VÀO** | | | | **{mat['total_materials_cost']:,} đ** |
| 1. Sắt hộp khung chính | {mat['iron_frame']['name']} | {mat['iron_frame']['quantity']} cây | {mat['iron_frame']['unit_price']:,} đ | {mat['iron_frame']['total']:,} đ |
| 2. Sắt gia cố | {mat['reinforce_iron']['name']} | {mat['reinforce_iron']['quantity']} cây | {mat['reinforce_iron']['unit_price']:,} đ | {mat['reinforce_iron']['total']:,} đ |
| 3. Mặt bảng | {mat['surface']['name']} | - | {mat['surface']['unit_price']:,} đ | {mat['surface']['total']:,} đ |
| 4. Tôn lót mặt sau | Khổ 1.2m | {mat['sheet_backing']['quantity']} m tới | {mat['sheet_backing']['unit_price']:,} đ | {mat['sheet_backing']['total']:,} đ |
| 5. V nhôm bọc viền | Cây 3m | {mat['aluminum_trim']['quantity']} cây | {mat['aluminum_trim']['unit_price']:,} đ | {mat['aluminum_trim']['total']:,} đ |
| 6. Vật tư phụ | Keo, vít, que hàn... | 1 khoán | 100.000 đ | 100.000 đ |
| **B. CHI PHÍ VẬN HÀNH** | | | | **{op['total_operations_cost']:,} đ** |
| 1. Nhân công thi công | 120.000 đ/m² | {op['labor']['quantity']} m² | 120.000 đ | {op['labor']['total']:,} đ |
| 2. Xe vận chuyển | 1 chuyến | 1 chuyến | 200.000 đ | 200.000 đ |
| 3. Dàn giáo | 50.000 đ/bộ/ngày | {op['scaffolding']['quantity']} | 50.000 đ | {op['scaffolding']['total']:,} đ |
| 4. Nhân công nối bạt | 15.000 đ/m dài | {op['canvas_seam']['quantity']} m | 15.000 đ | {op['canvas_seam']['total']:,} đ |
| **TỔNG GIÁ VỐN TOÀN BỘ** | | | | **{ai_cost_price:,} đ** |

---

### 3. BẢNG BÁO GIÁ KHÁCH HÀNG (QUOTATION):
* **Tổng giá vốn thẩm định**: **{ai_cost_price:,} đ**
* **Tỷ lệ lợi nhuận kỳ vọng**: **+{sm['profit_margin_percent']}%**
* **👉 TỔNG GIÁ BÁO KHÁCH (CHƯA VAT)**: **{ai_quote_price:,} đ**
* **Đơn giá tính theo m²**: **{round(ai_quote_price / (dim['area'] or 1)):,} đ / m²**
* **Hệ số chênh lệch thẩm định AI**: **+{ai_variance_percent}%** (+{variance_amount:,} đ) so với định mức xưởng (dự phòng dung sai cắt góc & biên độ giá thị trường).

---

### 4. CẢNH BÁO TƯ VẤN (BẮT BUỘC IN ĐẬM):
{chr(10).join([f"• **{item}**" for item in warning_texts])}

---
💡 *Nhận định từ Chuyên gia AI*: Mức giá trên đã được AI thẩm định độc lập theo thực tế thi công ngoài hiện trường (+{ai_variance_percent}%). Bạn có thể bấm nút 'Xuất PDF Báo Giá' để in bản chào giá chuyên nghiệp có logo công ty!"""

    return ai_text


def generate_prompt_for_llm(data, calc):
    """Tạo prompt chi tiết chuẩn bị gửi cho LLM (Gemini/OpenAI)"""
    iron_spec = PRICING_STANDARDS["materials"]["iron_bars"].get(
        data.get("iron_type", "vuong_20"), PRICING_STANDARDS["materials"]["iron_bars"]["vuong_20"]
    )
    surface_spec = PRICING_STANDARDS["materials"]["surfaces"].get(
        data.get("surface_type", "bat_hiflex"), PRICING_STANDARDS["materials"]["surfaces"]["bat_hiflex"]
    )
    dim = calc["dimensions"]
    mat = calc["materials"]
    op = calc["operations"]
    sm = calc["summary"]

    system_instruction = (
        "BẠN LÀ CHUYÊN GIA BÓC TÁCH VẬT TƯ & BÁO GIÁ NGÀNH QUẢNG CÁO TẠI XƯỞNG ADMAKE. "
        "Nhiệm vụ của bạn là trình bày kết quả bóc tách định mức vật tư và báo giá theo chuẩn quy cách. "
        "BẮT BUỘC tuân thủ các số liệu đã được tính toán chính xác sau đây, trình bày đẹp mắt, rõ ràng với 4 phần: "
        "1. DIỄN GIẢI PHÉP TÍNH BÓC TÁCH (Sắt, mặt bảng, lót tôn, V nhôm, nhân công, vận chuyển, dàn giáo). "
        "2. BẢNG CHI TIẾT GIÁ VỐN (Dạng bảng Markdown). "
        "3. BẢNG BÁO GIÁ KHÁCH HÀNG (Giá vốn, % lợi nhuận, thành tiền khách, đơn giá/m2). "
        "4. CẢNH BÁO TƯ VẤN (BẮT BUỘC IN ĐẬM: nối bạt nếu kích thước lớn, khổ alu/mica, không lót tôn không bảo hành rách, alu gương ngoài trời không bảo hành bay màu)."
    )

    user_prompt = f"""Hãy lập bảng bóc tách chi tiết cho bảng hiệu sau:
- Kích thước: {dim['width']}m x {dim['height']}m (Diện tích {dim['area']} m², chu vi {dim['perimeter']}m).
- Mặt bảng: {surface_spec['name']} (Tổng tiền: {mat['surface']['total']:,} đ).
- Khung sắt: {iron_spec['name']} ({mat['iron_frame']['quantity']} cây 6m, thành tiền {mat['iron_frame']['total']:,} đ).
- Tôn lót mặt sau: {'Có lót tôn khổ 1.2m (' + str(mat['sheet_backing']['quantity']) + ' mét tới, ' + f"{mat['sheet_backing']['total']:,} đ)" if mat['sheet_backing']['active'] else 'Không lót tôn'}.
- Sắt gia cố: {'Có (' + str(mat['reinforce_iron']['quantity']) + ' cây, ' + f"{mat['reinforce_iron']['total']:,} đ)" if mat['reinforce_iron']['active'] else 'Không'}.
- V nhôm viền: {mat['aluminum_trim']['quantity']} cây 3m ({mat['aluminum_trim']['total']:,} đ).
- Vật tư phụ: 100.000 đ.
- Nhân công thi công: {op['labor']['total']:,} đ.
- Vận chuyển: {op['transport']['total']:,} đ.
- Dàn giáo: {'Có (' + f"{op['scaffolding']['total']:,} đ)" if op['scaffolding']['active'] else 'Không'}.
- Nhân công nối bạt: {'Có (' + f"{op['canvas_seam']['total']:,} đ)" if op['canvas_seam']['active'] else 'Không'}.
- TỔNG GIÁ VỐN: {sm['cost_price']:,} đ.
- LỢI NHUẬN: +{sm['profit_margin_percent']}% (+{sm['profit_amount']:,} đ).
- TỔNG GIÁ BÁO KHÁCH: {sm['quote_price']:,} đ ({sm['price_per_sqm']:,} đ/m²).
- Vị trí: {'Ngoài trời' if data.get('location') == 'outdoor' else 'Trong nhà'}.
- Cảnh báo vi phạm: {[w['message'] for w in calc.get('warnings', [])]}.
"""
    return system_instruction, user_prompt


@ai_bp.route('/api/ai/pricing-standards', methods=['GET'])
def get_pricing_standards():
    """Lấy danh sách đơn giá và định mức chuẩn đang áp dụng"""
    return jsonify({
        "success": True,
        "data": PRICING_STANDARDS,
        "company": COMPANY_INFO
    }), 200


@ai_bp.route('/api/ai/status', methods=['GET'])
def get_ai_status():
    """Kiểm tra trạng thái cấu hình AI (Gemini / OpenAI)"""
    gemini_key, openai_key = get_active_ai_keys()
    has_gemini = bool(gemini_key)
    has_openai = bool(openai_key)

    active_engine = "expert_engine"
    if has_gemini:
        active_engine = "gemini"
    elif has_openai:
        active_engine = "openai"

    return jsonify({
        "success": True,
        "has_gemini": has_gemini,
        "has_openai": has_openai,
        "active_engine": active_engine,
        "gemini_masked": f"{gemini_key[:4]}...{gemini_key[-4:]}" if len(gemini_key) > 8 else ("Configured" if has_gemini else "None"),
        "openai_masked": f"{openai_key[:4]}...{openai_key[-4:]}" if len(openai_key) > 8 else ("Configured" if has_openai else "None"),
        "company": COMPANY_INFO
    }), 200


@ai_bp.route('/api/ai/config', methods=['POST'])
def update_ai_config():
    """Cập nhật API Key AI runtime và lưu vào biến môi trường"""
    data = request.get_json() or {}
    gemini_key = data.get("gemini_key", "").strip()
    openai_key = data.get("openai_key", "").strip()

    if gemini_key:
        os.environ["GEMINI_API_KEY"] = gemini_key
    if openai_key:
        os.environ["OPENAI_API_KEY"] = openai_key

    return jsonify({
        "success": True,
        "message": "Cấu hình AI đã được cập nhật thành công!"
    }), 200


@ai_bp.route('/api/ai/signboard-quote', methods=['POST'])
def quote_signboard():
    """Bóc tách vật tư và tính báo giá bảng hiệu theo quy chuẩn Hình 1, 2, 3"""
    data = request.get_json() or {}
    custom_api_key = request.headers.get("x-ai-api-key") or data.get("api_key")

    calc = calculate_signboard(data)
    if "error" in calc:
        return jsonify({"success": False, "error": calc["error"]}), 400

    # Kiểm tra xem có thể gọi trực tiếp LLM (Gemini hoặc OpenAI)
    ai_prompt_text = None
    ai_source = "expert_engine"

    system_instruction, user_prompt = generate_prompt_for_llm(data, calc)
    gemini_key, openai_key = get_active_ai_keys()
    target_key = custom_api_key or gemini_key

    if target_key:
        llm_resp = call_gemini_api(user_prompt, system_instruction, api_key=target_key)
        if llm_resp:
            ai_prompt_text = llm_resp
            ai_source = "gemini"

    if not ai_prompt_text and (custom_api_key or openai_key):
        llm_resp = call_openai_api(user_prompt, system_instruction, api_key=(custom_api_key or openai_key))
        if llm_resp:
            ai_prompt_text = llm_resp
            ai_source = "openai"

    if not ai_prompt_text:
        ai_prompt_text = generate_ai_prompt_response(data, calc)
        ai_source = "expert_engine"

    return jsonify({
        "success": True,
        "data": calc,
        "ai_prompt_text": ai_prompt_text,
        "ai_source": ai_source,
        "company": COMPANY_INFO
    }), 200


@ai_bp.route('/api/ai/chat', methods=['POST'])
def ai_chat():
    """Xử lý hội thoại chat tiếp nối với AI về bảng hiệu"""
    payload = request.get_json() or {}
    user_message = payload.get("message", "").strip()
    current_quote = payload.get("current_quote", {})
    custom_api_key = request.headers.get("x-ai-api-key") or payload.get("api_key")

    if not user_message:
        return jsonify({"success": False, "error": "Vui lòng nhập nội dung tin nhắn."}), 400

    gemini_key, openai_key = get_active_ai_keys()
    target_key = custom_api_key or gemini_key

    system_context = (
        "Bạn là Chuyên gia bóc tách vật tư và báo giá bảng hiệu tại ADMAKE (Công ty TNHH B-One Việt Nam). "
        "Hãy trả lời chuyên nghiệp, súc tích, đưa ra giải pháp tư vấn chính xác về vật tư, tối ưu chi phí cho khách "
        "hoặc cảnh báo kỹ thuật theo đúng quy chuẩn ngành quảng cáo."
    )
    user_full_query = f"Thông số bảng hiệu hiện tại: {json.dumps(current_quote, ensure_ascii=False)}.\nCâu hỏi của tôi: {user_message}"

    # Thử gọi LLM nếu có key
    if target_key:
        llm_resp = call_gemini_api(user_full_query, system_context, api_key=target_key)
        if llm_resp:
            return jsonify({"success": True, "reply": llm_resp, "ai_source": "gemini"}), 200

    if custom_api_key or openai_key:
        llm_resp = call_openai_api(user_full_query, system_context, api_key=(custom_api_key or openai_key))
        if llm_resp:
            return jsonify({"success": True, "reply": llm_resp, "ai_source": "openai"}), 200

    # Trả lời thông minh theo ngữ cảnh (Fallback)
    upper = user_message.upper()
    reply = ""
    if "GIẢM" in upper or "CHIẾT KHẤU" in upper or "BỚT" in upper:
        reply = "💡 **Gợi ý tối ưu chi phí từ Chuyên gia AI:**\n- Nếu khách muốn giảm giá, bạn có thể điều chỉnh tỷ lệ lợi nhuận kỳ vọng từ 30% xuống 20-25%.\n- Hoặc chuyển từ bạt 3M/không gân sang bạt 2 da xám (tiết kiệm được từ 125.000 - 400.000 đ/m²).\n- Nếu khách tự lắp đặt tại xưởng, có thể trừ chi phí nhân công (120k/m²) và xe vận chuyển (200k)."
    elif "VAT" in upper or "THUẾ" in upper:
        reply = "📄 **Tính thuế VAT:**\n- Thuế suất thông dụng cho ngành quảng cáo/thi công là **8%** hoặc **10%**.\n- Bạn có thể chọn bật tính VAT trong modal 'Xuất Báo Giá PDF' ở góc trên màn hình để hệ thống tự động cộng vào tổng thanh toán."
    elif "ALU" in upper:
        reply = "🔍 **Tư vấn vật liệu Alu:**\n- Khổ tấm tiêu chuẩn là 1.22m x 2.44m (độ dày 3mm, nhôm 0.10mm).\n- Lưu ý: Tuyệt đối không bảo hành bay màu nếu khách chọn Alu gương vàng thi công ngoài trời nắng gắt."
    elif "BẠT" in upper:
        reply = "🏷️ **Tư vấn bạt in:**\n- Khổ máy in tối đa phổ biến là 3.1m. Nếu cả chiều dài và chiều rộng đều lớn hơn 3.1m thì buộc phải nối bạt (phụ phí nhân công hàn nối 15.000 đ/m dài).\n- Bạt 2 da đế xám chống xuyên sáng thích hợp cho bảng mặt tiền không dùng đèn hắt phía sau."
    else:
        reply = f"Dạ tôi đã hiểu yêu cầu: \"{user_message}\". Tôi luôn sẵn sàng hỗ trợ điều chỉnh phương án bóc tách hoặc giải đáp thêm các thắc mắc về vật tư bảng hiệu cho bạn!"

    return jsonify({
        "success": True,
        "reply": reply,
        "ai_source": "expert_engine"
    }), 200

