# RUN.md - Kế hoạch triển khai kéo Toolx AI Studio thành Modal thay thế khung AI Admake

> **Mục tiêu**: Thay thế toàn bộ khung AI cũ (`AIAssistantModal` / `AiAssistantModal`) trong Admake bằng **1 Modal React Ant Design duy nhất** (`AiStudioModal`), tích hợp toàn bộ tính năng Tạo ảnh AI (Text-to-Image), Sửa ảnh & Inpainting (Mask Canvas), và Hội thoại AI đa năng từ mã nguồn Toolx.

---

## 📌 Nguồn mã tham chiếu gốc tại Toolx
- **File gốc**: `D:\Dropbox\_Documents\Toolx\scripts\printagent_render_bridge.py`
- **Các hàm xử lý AI cốt lõi cần chuyển giao**:
  1. `generate_with_gpt`: Tạo ảnh OpenAI (`gpt-image-1`, `gpt-image-1-mini`, `chatgpt-image-latest`) (dòng 323).
  2. `edit_with_gpt`: Sửa ảnh & Inpainting OpenAI qua endpoint `/v1/images/edits` (dòng 401).
  3. `generate_with_gemini`: Tạo ảnh Google Gemini (`imagen-3.0-generate-002`, `gemini-2.5-flash-image`) (dòng 488).
  4. `chat_with_ai`: Hội thoại AI thông thường với GPT-4o-mini hoặc Gemini-2.5-flash (dòng 556).
  5. `enhance_prompt` & `PRO_PRESETS`: Bộ chuẩn hóa prompt 5 lớp (Style, Lighting, Lens) (dòng 190 - 318).
  6. `get_api_keys`: Đọc key từ `D:/vps_go.md` (`[GPTKey]`, `[GeminiKey]`) kết hợp biến môi trường `OPENAI_API_KEY`, `GEMINI_API_KEY`.

---

## 🛠️ BƯỚC 1: Bổ sung Backend Endpoints vào Admake (`backend/api/ai.py`)

File `backend/api/ai.py` (đã đăng ký Blueprint `ai_bp` trong `backend/app.py`) cần bổ sung 4 endpoints và hàm đọc key:

```python
import os
import io
import json
import base64
import requests
from PIL import Image, ImageFilter
from flask import Blueprint, request, jsonify

# 1. Hàm nạp Key tự động từ D:/vps_go.md và ENV
def get_ai_studio_keys():
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    gpt_key = os.getenv("OPENAI_API_KEY", "") or os.getenv("GPT_API_KEY", "")
    candidate_paths = ["D:/vps_go.md", "./vps_go.md", "/opt/vps_go.md"]
    for p in candidate_paths:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    lines = [l.strip() for l in f.readlines()]
                    for i, l in enumerate(lines):
                        if l == "[GeminiKey]" and i + 1 < len(lines):
                            gemini_key = lines[i + 1].strip()
                        elif l == "[GPTKey]" and i + 1 < len(lines):
                            gpt_key = lines[i + 1].strip()
                if gemini_key or gpt_key:
                    break
            except Exception:
                pass
    return gemini_key, gpt_key

# 2. Endpoint Hội Thoại Chat (GPT & Gemini)
@ai_bp.route("/api/ai/chat", methods=["POST", "OPTIONS"])
def api_ai_chat():
    if request.method == "OPTIONS":
        return jsonify({"ok": True}), 200

    data = request.get_json(force=True, silent=True) or {}
    messages = data.get("messages") or []
    prompt = (data.get("prompt") or "").strip()
    if not messages and prompt:
        messages = [{"role": "user", "content": prompt}]
    if not messages:
        return jsonify({"error": "Thiếu nội dung câu hỏi"}), 400

    engine = (data.get("engine") or "gpt").lower()
    model = data.get("model")
    gemini_key, gpt_key = get_ai_studio_keys()

    if engine == "gemini":
        if not gemini_key:
            return jsonify({"error": "Chưa cấu hình [GeminiKey] trong D:/vps_go.md"}), 400
        target_model = model or "gemini-3.8-flash"
        gemini_contents = []
        for m in messages:
            role = "model" if m.get("role") in ("assistant", "model") else "user"
            gemini_contents.append({"role": role, "parts": [{"text": m.get("content", "")}]})
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:generateContent?key={gemini_key}"
        try:
            resp = requests.post(url, json={"contents": gemini_contents, "generationConfig": {"temperature": 0.7}}, timeout=60)
            if resp.status_code == 200:
                res_data = resp.json()
                reply = res_data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                u = res_data.get("usageMetadata", {})
                tot_tok = u.get("totalTokenCount", 0)
                return jsonify({"success": True, "reply": reply, "engine": "gemini", "model": target_model, "usage": {"total_tokens": tot_tok, "cost_usd": round(tot_tok * 0.0000003, 5)}})
            return jsonify({"error": f"[Gemini {resp.status_code}] {resp.text}"}), resp.status_code
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        if not gpt_key:
            return jsonify({"error": "Chưa cấu hình [GPTKey] trong D:/vps_go.md"}), 400
        target_model = model or "gpt-4o-mini"
        cleaned_msgs = [{"role": m.get("role", "user"), "content": m.get("content", "")} for m in messages]
        headers = {"Authorization": f"Bearer {gpt_key}", "Content-Type": "application/json"}
        try:
            resp = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json={"model": target_model, "messages": cleaned_msgs, "temperature": 0.7}, timeout=60)
            if resp.status_code == 200:
                data_json = resp.json()
                reply = data_json.get("choices", [{}])[0].get("message", {}).get("content", "")
                u = data_json.get("usage", {})
                tot_tok = u.get("total_tokens", 0)
                cost_usd = round(tot_tok * 0.0000006, 5) if "mini" in target_model else round(tot_tok * 0.00001, 5)
                return jsonify({"success": True, "reply": reply, "engine": "gpt", "model": target_model, "usage": {"total_tokens": tot_tok, "cost_usd": cost_usd}})
            return jsonify({"error": f"[OpenAI {resp.status_code}] {resp.text}"}), resp.status_code
        except Exception as e:
            return jsonify({"error": str(e)}), 500

# 3. Endpoint Tạo Ảnh Mới (Text-to-Image)
@ai_bp.route("/api/ai/image/generate", methods=["POST", "OPTIONS"])
def api_ai_image_generate():
    if request.method == "OPTIONS":
        return jsonify({"ok": True}), 200
    data = request.get_json(force=True, silent=True) or {}
    prompt = (data.get("prompt") or "").strip()
    if not prompt:
        return jsonify({"error": "Thiếu mô tả ảnh (prompt)"}), 400

    engine = data.get("engine", "gpt").lower()
    aspect_ratio = data.get("aspect_ratio", "4:3")
    resolution = data.get("resolution", "4k").lower()
    gemini_key, gpt_key = get_ai_studio_keys()

    # Xử lý tạo ảnh trả về base64 PNG chất lượng cao
    # (Xem code chi tiết trong printagent_render_bridge.py dòng 323 - 400)
    # ...

# 4. Endpoint Sửa Ảnh & Inpainting (Image-to-Image & Mask)
@ai_bp.route("/api/ai/image/edit", methods=["POST", "OPTIONS"])
def api_ai_image_edit():
    if request.method == "OPTIONS":
        return jsonify({"ok": True}), 200
    data = request.get_json(force=True, silent=True) or {}
    prompt = (data.get("prompt") or "").strip()
    image_b64 = data.get("image_base64")
    mask_b64 = data.get("mask_base64")
    # (Xem code chi tiết trong printagent_render_bridge.py dòng 401 - 487)
    # ...
```

---

## 🎨 BƯỚC 2: Xây dựng Component Frontend trong Admake

Tạo thư mục mới: `frontend/src/common/components/ai-studio/`:

### 1. `AiStudioModal.tsx` (Component Modal chính)
- Bọc thẻ `Modal` Ant Design với `width="96vw"` và `height="90vh"`.
- Giao diện Dark Theme hiện đại (nền `slate-950`, viền `slate-800`, điểm nhấn tím `violet-600` và ngọc bích `emerald-500`).
- Header gồm: Logo Studio 💎, Tên Modal, Trạng thái API Keys (Gemini/GPT), Nút đóng.
- Thanh chuyển 3 Tab (Segmented hoặc Button Tabs):
  - `✨ Tạo Ảnh Mới`
  - `🎨 Sửa Ảnh & Inpainting`
  - `💬 Hội Thoại AI`
- Bố cục 2 cột:
  - **Cột Trái (5/12)**: Chứa tab nội dung đang kích hoạt (`AiCreateTab`, `AiEditTab`, hoặc `AiChatTab`).
  - **Cột Phải (7/12)**: Thư viện ảnh kết quả (`AiGallery`) và trình xem trước.

### 2. `tabs/AiCreateTab.tsx` (Tab Tạo Ảnh)
- Nút chọn AI Engine: `🟣 GPT (OpenAI)` vs `🟢 Gemini (Google)`.
- Textarea nhập Prompt kèm các gợi ý prompt nhanh.
- Công tắc bật/tắt **AI Tự động Chuẩn hóa Prompt** (5-Layer Photographic Framework).
- Bộ chọn Presets chuyên nghiệp:
  - **Visual Style**: Chân thực đời thường, Điện ảnh Cinematic, Studio Thương mại, Kodak Portra...
  - **Lighting**: Nắng sớm bình minh, Studio Softbox 3 điểm, Hoàng hôn rực rỡ, Đèn Neon...
  - **Lens**: Chân dung xóa phông 85mm, Góc mắt người 50mm, Toàn cảnh 24mm, Macro 100mm...
- Tỷ lệ khung hình: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`.
- Độ phân giải xuất: `4K Ultra HD` (4096px 300 DPI), `2K QHD` (2560px), `1080p FHD` (1920px).
- Nút "✨ Tiến Hành Tạo Ảnh 4K".

### 3. `tabs/AiEditTab.tsx` & `components/AiMaskCanvas.tsx` (Tab Sửa Ảnh & Tô Mask)
- Kéo thả hoặc chọn ảnh gốc cần sửa.
- Canvas vẽ cọ Mask tương tác:
  - Kéo thanh trượt đổi kích thước cọ (10px - 80px).
  - Nút chuyển giữa Cọ vẽ (Vùng sửa) và Tẩy (Khôi phục).
  - Nút Xóa toàn bộ mask.
  - Tự động xuất base64 chuẩn RGBA (vùng vẽ có alpha=0, vùng giữ có alpha=255).
- Ô nhập Prompt mô tả phần cần sửa/thay thế.
- Nút "🎨 Thực Hiện Sửa Ảnh (Generate Edit)".

### 4. `tabs/AiChatTab.tsx` (Tab Hội Thoại AI)
- Chọn Engine: GPT (`gpt-4o-mini`, `gpt-4o`) hoặc Gemini (`gemini-2.5-flash`).
- Cửa sổ tin nhắn hỗ trợ multi-turn conversation.
- Gợi ý câu hỏi nhanh: bóc tách bảng hiệu, kỹ thuật in ấn, phân biệt CMYK/RGB, viết nội dung quảng cáo.
- Nút **📋 Sao chép tin nhắn**.
- Nút **✨ Làm Prompt tạo ảnh**: Tự động chuyển nội dung câu trả lời sang Tab 1 và điền vào ô prompt.
- Thống kê tokens và chi phí thực tế ($).

### 5. `components/AiGallery.tsx` & `components/AiViewerModal.tsx`
- Danh sách thẻ ảnh thumbnail nhẹ, hiển thị badge engine, kích thước, số token, giá tiền.
- Modal xem ảnh phóng to 4K với tính năng Pan (kéo rê chuột) và Zoom (phóng to/thu nhỏ 100% - 800%).
- Nút tải ảnh PNG gốc 300 DPI về máy.

---

## 🔄 BƯỚC 3: Thay thế Khung AI cũ trong Admake

1. Mở file `frontend/src/common/app/dashboard/statistic/page.tsx`:
   - Thay thế import cũ:
     ```tsx
     // Cũ:
     import { AIAssistantModal } from "../../../components/ai-pricing/AIAssistantModal";
     // Đổi thành:
     import { AiStudioModal } from "../../../components/ai-studio/AiStudioModal";
     ```
   - Thay thế thẻ component:
     ```tsx
     <AiStudioModal open={aiModalOpen} onCancel={() => setAiModalOpen(false)} />
     ```

2. Đặt nút mở Modal toàn cục trên Header Navbar hoặc Sidebar để có thể mở Studio AI từ bất kỳ trang nào trong Admake.

---

## ✅ BƯỚC 4: Kiểm tra và Nghiệm thu
- [ ] Chạy backend Admake: `cd backend && python app.py` (cổng 6000).
- [ ] Chạy frontend Admake: `cd frontend && npm run dev` (cổng 5173 / Vite).
- [ ] Mở modal, test Tab 3 (Chat): Hỏi thử câu hỏi về in ấn -> kiểm tra phản hồi GPT/Gemini.
- [ ] Bấm nút "✨ Làm Prompt tạo ảnh" -> kiểm tra Tab 1 có nhận prompt không.
- [ ] Test Tab 1 (Tạo ảnh): Tạo ảnh 4K với preset Cinematic.
- [ ] Test Tab 2 (Sửa ảnh): Chọn ảnh vừa tạo, tô cọ mask lên một chi tiết, nhập prompt sửa và xác nhận kết quả.
