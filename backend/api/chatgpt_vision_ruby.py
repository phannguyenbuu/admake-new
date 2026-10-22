# -*- coding: utf-8 -*-
"""
Module kết nối trực tiếp OpenAI ChatGPT (GPT-4o / GPT-4o-mini Vision) & Google Gemini Vision
để phân tích hình ảnh biển hiệu và lập trình mã nguồn SketchUp Ruby (.rb) chi tiết 3D.
"""

import os
import re
import time
import json
import base64
import requests
import threading

SYSTEM_RUBY_VISION_PROMPT = """Bạn là Chuyên gia Kỹ thuật Kết cấu Biển hiệu Quảng cáo & Kỹ sư Lập trình SketchUp Ruby API hàng đầu của ADMAKE.
Nhiệm vụ: Dựa vào hình ảnh thực tế đính kèm (hoặc mô tả kết cấu), hãy phân tích toàn bộ kết cấu và lập trình toàn bộ mã nguồn Ruby (.rb) hoàn chỉnh 100% để dựng mô hình 3D trong SketchUp.

Quy chuẩn thiết kế kết cấu chi tiết bắt buộc:
1. Đơn vị: mét (quy đổi sang inch chuẩn SketchUp: 1m = 39.37007874 inch).
2. Hằng số tham số ở đầu file BẮT BUỘC VIẾT HOA (UPPERCASE): W, H, D, Z, FOOTING_DEPTH, TRUSS_SPACING, NUM_LIGHTS, PILLAR_DIAMETER để có phạm vi toàn cục trong mọi hàm def.
3. Khối móng bê tông (Concrete Footing): Khối móng chịu lực, bản mã và bu lông neo.
4. Cột trụ chịu lực chính (Main Pillars): Cột thép tròn lớn (hoặc cột hộp) chịu tải trọng gió bão.
5. Khung giàn không gian (Truss Frame): Hệ thanh giằng hộp đan nan caro xéo (chords & diagonals) chạy dọc và ngang bằng vòng lặp .times hoặc .step.
6. Sàn thao tác Catwalk & Thang leo an toàn (Catwalk & Safety Ladder): Khung sàn lưới thép, tay vịn lan can và thang leo kỹ thuật có các bậc thang.
7. Mặt bảng pano / Chữ nổi 3D: Tấm ốp nền (Alu/Bạt), viền bo kim loại, logo và bộ chữ nổi 3D (extruded letters) phát sáng.
8. Hệ thống cần đèn pha LED chiếu rọi (Floodlights): Các cần vươn bằng thép hộp và chóa đèn pha LED.
9. Tổ chức Group: Tạo Group riêng cho từng hệ thống (móng, trụ, giàn truss, catwalk, thang, mặt bảng, chữ nổi, đèn).
10. Lưu ý cú pháp SketchUp API:
   - ents.add_circle trả về mảng Edge. Để tạo mặt tròn, dùng: f = ents.add_face(ents.add_circle(center, [0, 0, 1], radius)); f.pushpull(dist)
   - Mã nguồn phải tự động thực thi sinh hình ngay lập tức (nếu bọc trong module/def thì PHẢI gọi hàm ở cuối file).
11. BẮT BUỘC ĐÓNG ĐỦ TẤT CẢ CÁC CẶP def...end, module...end, do...end, if...end. TUYỆT ĐỐI KHÔNG ĐƯỢC THIẾU TỪ KHÓA end HOẶC ĐỂ MÃ NGUỒN BỊ DỞ DANG Ở CUỐI FILE.

BẮT BUỘC TRẢ VỀ ĐẦY ĐỦ 3 PHẦN TRONG KẾT QUẢ:
PHẦN 1: BẢNG ĐÁNH GIÁ CẤU KIỆN & BÓC TÁCH VẬT TƯ THI CÔNG (BOM)
Đánh giá chính xác bảng hiệu gồm bao nhiêu cấu kiện, tên gọi, kích thước chi tiết (Dài x Rộng x Cao/Dày hoặc Tiết diện) và quy cách vật tư để tính dự toán báo giá chính xác, không hời hợt.
Trình bày bảng Markdown rõ ràng với các cột:
| STT | Tên Cấu Kiện | Kích Thước (Quy Cách Kỹ Thuật) | Số Lượng | Đơn Vị | Quy Cách Vật Tư / Ghi Chú |

PHẦN 2: DỰ TRÙ VẬN HÀNH & LOGISTICS (AI ESTIMATE)
Dự trù rõ ràng 6 thông số thực tế:
- Nhân công sản xuất & lắp đặt: [số công thợ] công (ví dụ: 6 công, đơn giá 400.000 đ/công)
- Cự ly vận chuyển công trình: [số km] km (ví dụ: 15 km, đơn giá 15.000 đ/km)
- % Hao hụt vật tư: [tỷ lệ %] (ví dụ: 7%)
- Trọng lượng vận chuyển ước tính: [số kg hoặc tấn] (ví dụ: 1.450 kg)
- Kích thước đóng gói kiện hàng: [kích thước dài x rộng x cao, module nếu có]
- Đề xuất loại xe sử dụng: [loại xe tải/xe cẩu phù hợp nhất]

PHẦN 3: MÃ NGUỒN RUBY (.RB) CHO SKETCHUP
- BẮT BUỘC chèn lại BẢNG THỐNG KÊ CẤU KIỆN VÀ THÔNG SỐ LOGISTICS Ở TRÊN vào KHỐI COMMENT NGAY ĐẦU TIÊN của file Ruby (.rb) để người dùng mở file Ruby là đọc và lấy được ngay.
- Toàn bộ mã nguồn Ruby SketchUp hoàn chỉnh đặt trong khối:
```ruby
... mã Ruby SketchUp ...
```
Ưu tiên mã nguồn chất lượng cao, đầy đủ chi tiết kết cấu theo đúng hình ảnh."""


def _format_image_payload(img: str) -> dict:
    """Chuẩn hóa ảnh base64 hoặc URL thành OpenAI image_url object"""
    raw = img.strip()
    if raw.startswith("http://") or raw.startswith("https://"):
        return {"url": raw}
    if raw.startswith("data:image"):
        return {"url": raw}
    # Raw base64 -> bọc mime
    return {"url": f"data:image/jpeg;base64,{raw}"}


def call_chatgpt_vision_ruby(prompt: str, images: list = None, gpt_key: str = "") -> dict:
    """
    Gọi trực tiếp OpenAI GPT-4o / GPT-4o-mini Vision với ảnh để phân tích kết cấu và viết Ruby script.
    Tuyệt đối không giả lập, không fallback. Nếu không kết nối được hoặc không có key thì báo lỗi.
    """
    images = images or []
    t0 = time.time()
    last_error = ""

    if not gpt_key:
        return {
            "success": False,
            "error": "Thiếu OpenAI API Key [GPTKey]. Không thể kết nối ChatGPT Vision & Text Bridge.",
            "reply": "",
            "text": "",
            "ruby_code": "",
            "model3d": None,
            "code_blocks": []
        }

    models = ["gpt-4o-mini", "gpt-4o"]
    for model_name in models:
        try:
            user_content = []
            final_text = f"{SYSTEM_RUBY_VISION_PROMPT}\n\nYêu cầu bổ sung của người dùng: {prompt}" if prompt else SYSTEM_RUBY_VISION_PROMPT
            user_content.append({"type": "text", "text": final_text})

            for img in images[:3]:
                if img and isinstance(img, str) and len(img) > 10:
                    user_content.append({"type": "image_url", "image_url": _format_image_payload(img)})

            headers = {
                "Authorization": f"Bearer {gpt_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": model_name,
                "messages": [{"role": "user", "content": user_content}],
                "max_tokens": 6000,
                "temperature": 0.2
            }

            resp = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=60)
            if resp.status_code == 200:
                data = resp.json()
                raw_reply = data["choices"][0]["message"]["content"]
                return _process_ruby_response(raw_reply, t0, engine="chatgpt", model=model_name)
            else:
                last_error = f"AI Engine HTTP {resp.status_code}: {resp.text[:200]}"
        except Exception as e:
            last_error = f"AI Engine lỗi kết nối: {str(e)}"

    return {
        "success": False,
        "error": f"Không thể kết nối với AI 3D Vision Bridge: {last_error}",
        "reply": "",
        "text": "",
        "ruby_code": "",
        "model3d": None,
        "code_blocks": []
    }


def _process_ruby_response(raw_text: str, t0: float, engine: str = "chatgpt", model: str = "") -> dict:
    """Trích xuất mã nguồn Ruby, chuyển đổi sang 3D Mesh qua ruby3d và đóng gói kết quả"""
    ruby_code = ""
    code_blocks = []

    # Bóc tách tất cả code blocks
    code_block_regex = re.compile(r'```([a-zA-Z0-9_\-#+]*)\s*\n(.*?)```', re.DOTALL)
    for m in code_block_regex.finditer(raw_text):
        lang = m.group(1).strip().lower() or "code"
        code = m.group(2).strip()
        code_blocks.append({"language": lang, "code": code})
        if lang in ("ruby", "rb") or "sketchup" in code.lower() or "entities.add_" in code:
            if not ruby_code:
                ruby_code = code

    if not ruby_code and raw_text:
        # Thử tìm không có tên ngôn ngữ
        m = re.search(r'```\s*\n(.*?Sketchup.*?)```', raw_text, re.DOTALL | re.IGNORECASE)
        if m:
            ruby_code = m.group(1).strip()

    # Dựng mô hình 3D Mesh từ mã Ruby bằng ruby3d sandbox
    model3d = None
    ruby_warning = ""
    if ruby_code:
        try:
            from .ruby3d import ruby_to_model3d
            model3d = ruby_to_model3d(ruby_code)
        except Exception as e:
            ruby_warning = str(e)
            print(f"[chatgpt_vision_ruby] Warning parsing ruby with ruby3d: {e}")

    if not ruby_code:
        return {
            "success": False,
            "error": "Hệ thống AI đã phản hồi nhưng không chứa khối mã nguồn 3D (```ruby ... ```) để dựng hình.",
            "reply": raw_text,
            "text": raw_text,
            "ruby_code": "",
            "model3d": None,
            "code_blocks": code_blocks
        }

    # Đảm bảo khối comment bảng thống kê cấu kiện luôn có ở đầu file Ruby và trong câu trả lời text
    try:
        from .ruby_components import generate_bom_comment_header, generate_bom_markdown_table, estimate_structural_components, parse_logistics_from_ruby
    except ImportError:
        try:
            from ruby_components import generate_bom_comment_header, generate_bom_markdown_table, estimate_structural_components, parse_logistics_from_ruby
        except Exception:
            generate_bom_comment_header = None
            generate_bom_markdown_table = None
            estimate_structural_components = None
            parse_logistics_from_ruby = None

    if model3d:
        dims = model3d.get("dimensions", {})
        w = float(dims.get("width") or 6.0)
        h = float(dims.get("height") or 2.5)
        d = float(dims.get("depth") or 0.25)
        name = model3d.get("name") or "Biển Hiệu Quảng Cáo"
        cat = model3d.get("category") or "storefront"
        comps = model3d.get("components") or []
        if (not comps or len(comps) < 3) and estimate_structural_components:
            comps = estimate_structural_components(w, h, d, cat, ruby_code, model3d.get("materials_spec", {}))
            model3d["components"] = comps

        if parse_logistics_from_ruby and not model3d.get("logistics"):
            model3d["logistics"] = parse_logistics_from_ruby(ruby_code, dims, comps)

        if comps and generate_bom_comment_header and "bảng thống kê cấu kiện" not in ruby_code.lower():
            bom_hdr = generate_bom_comment_header(comps, w, h, d, name, cat)
            ruby_code = f"{bom_hdr}\n{ruby_code}"

        if comps and generate_bom_markdown_table and "|" not in raw_text:
            md_tbl = generate_bom_markdown_table(comps, w, h, d, name)
            raw_text = f"{md_tbl}\n\n{raw_text}"

    elapsed = round(time.time() - t0, 1)

    return {
        "success": True,
        "reply": raw_text,
        "text": raw_text,
        "ruby_code": ruby_code,
        "model3d": model3d,
        "code_blocks": code_blocks,
        "engine": engine,
        "model": model,
        "duration_seconds": elapsed,
        "ruby_warning": ruby_warning,
        "stats": model3d.get("stats") if model3d else None
    }


def start_async_vision_job(job_id: str, prompt: str, images: list, jobs_dict: dict, gpt_key: str):
    """Xử lý tác vụ phân tích ảnh bất đồng bộ trong background thread và lưu kết quả vào jobs_dict"""
    jobs_dict[job_id] = {
        "id": job_id,
        "type": "chat_code",
        "status": "processing",
        "progress": 20,
        "current_step": "Hệ thống AI đang phân tích hình ảnh và lập trình mã 3D...",
        "prompt": prompt,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    def _worker():
        res = call_chatgpt_vision_ruby(prompt, images, gpt_key=gpt_key)
        if res.get("success") and res.get("ruby_code"):
            has_mesh = bool(res.get("model3d") and len(res["model3d"].get("elements", [])) > 0)
            step_msg = "Hoàn tất phân tích hình ảnh và lập trình mã Ruby 3D!" if has_mesh else "Đã phân tích ảnh và tạo mã Ruby (.rb) thành công!"
            jobs_dict[job_id].update({
                "status": "completed",
                "progress": 100,
                "current_step": step_msg,
                "result_text": res.get("text") or res.get("reply"),
                "reply": res.get("reply"),
                "text": res.get("text"),
                "ruby_code": res.get("ruby_code"),
                "model3d": res.get("model3d"),
                "result_code_blocks": res.get("code_blocks"),
                "code_blocks": res.get("code_blocks"),
                "duration_seconds": res.get("duration_seconds", 0)
            })
        else:
            err_msg = res.get("error") or "Không thể phân tích hình ảnh hoặc kết nối AI Vision thất bại."
            jobs_dict[job_id].update({
                "status": "failed",
                "progress": 100,
                "current_step": err_msg,
                "error": err_msg
            })

    t = threading.Thread(target=_worker, daemon=True)
    t.start()

