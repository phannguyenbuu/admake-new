@RTK.md

# AGENTS.md

## Scope
- This repo has both frontend and backend used in production.
- Production backend source is `backend/` (not `main-be/`).

## Runtime architecture
- Frontend: `frontend/` (React + Vite, multi-entry: `dashboard.html`, `chat.html`, `point.html`, `login.html`).
- Backend: `backend/` (Flask + Flask-SocketIO).
- Database: PostgreSQL database name `admake_chat`.
- Reverse proxy: Nginx (`admake.vn` config at repo root).

## Key backend paths
- `backend/app.py`: app bootstrap and blueprint registration.
- `backend/models.py`: SQLAlchemy models and shared helpers.
- `backend/api/*.py`: API modules (auth, users, workpoints, tasks, customers, supplier, leave, etc.).
- `backend/requirements.txt`: backend dependencies.

## Local run commands
- Frontend:
- `cd frontend`
- `npm install`
- `npm run dev`
- Backend:
- `cd backend`
- `python -m venv .venv`
- `.venv\\Scripts\\activate`
- `pip install -r requirements.txt`
- `python app.py`

## Deployment notes
- Build frontend:
- `cd frontend && npm run build`
- Deploy static build:
- `scp -r frontend/dist/* root@103.163.219.87:/var/www/admake`
- Backend production hiện được restart qua `pm2 restart admake-api` trên `103.163.219.87`
- Backend runs on port `6000`, proxied by Nginx for:
- `/api/`
- `/static/`
- `/lead-manage/`
- `/socket.io/`

## Current product notes
- AR payment types are intentionally split:
- `phat_sinh` only increases receivable value and must not create/link `daily_cash` or `journal`.
- `tam_ung` is the real money collection flow and can link `daily_cash` plus `journal`.
- Payroll adjustments are persisted in backend table `payroll_adjustments`; do not reintroduce browser-only `localStorage` as the source of truth.
- User payroll profile currently includes `salary`, `allowance`, `bhyt`, `bhxh`.
- `frontend/src/common/app/dashboard/materials/page.tsx` currently uses paging at `50` items per page.
- Inventory item `code` is editable via `PUT /api/inventory/items/:id`.
- Inventory item delete is allowed only when the item has no `stock transaction`; otherwise backend returns `Item already has stock transactions`.
- Materials item spec rows are edited in the expanded sub-row under each item.
- In `FormTask`, `Tài liệu & Bình luận` now lives inside the `Thông tin` tab as a collapsible section.
- Material images (`JobAsset`) have been removed from the main `/materials` UI and moved entirely into the Material Create/Update modals. Draft images during creation are managed via `tmpTaskCreatedAssets`/`tmpTaskCreatedMessages` and flushed after the backend responds.
- The `fetch` calls in the frontend components (like `frontend/src/common/app/dashboard/statistic/page.tsx` for `/api/statistics/dashboard`) must explicitly pass the `Authorization: Bearer ${token}` header, as `require_can_view` decorators on the backend will block requests returning a `401 Unauthorized` without it.

## Recent migrations to know
- `backend/migrations/20260407_user_payroll_fields.sql`
- `backend/migrations/20260407_ar_phat_sinh_cleanup.sql`
- `backend/migrations/20260407_payroll_adjustments.sql`

## Debugging rules
- If UI shows a 404 page after an in-app action, inspect frontend console first for render errors; router error boundary can mask runtime issues.
- For attendance/workpoint bugs, verify month handling in both:
- frontend `WorkDays.tsx` date indexing logic,
- backend `backend/api/workpoints.py` `/api/workpoint/page` month filtering.
- When data correctness is in doubt, validate directly against PostgreSQL `admake_chat` before changing logic.

## Codex runtime rules
- At the start of a Codex session, run `rtk --version` to check whether RTK is available.
- If RTK is installed, prefer `rtk`-wrapped commands for verbose shell work such as `git`, `rg`, `find`, `tree`, `pytest`, `npm test`, `pnpm test`, `vitest`, `cargo test`, `docker ps`, `kubectl get pods`, and large `ls`.
- If raw command output is required for debugging, state why before running the non-RTK command.
- This machine is configured to launch `codex` with `--sandbox danger-full-access --ask-for-approval never` by default. If a higher-priority runtime policy overrides that, state it explicitly.

---

# HƯỚNG DẪN KÉO CODE TOOLX AI STUDIO THÀNH 1 MODAL THAY THẾ KHUNG AI CỦA ADMAKE

## 1. Mục tiêu và phạm vi chuyển giao
- **Mục tiêu**: Kéo toàn bộ tính năng và giao diện của **Toolx AI Studio** (đang chạy tại `D:\Dropbox\_Documents\Toolx\scripts\printagent_render_bridge.py`) vào dự án **Admake**, đóng gói thành **1 Modal React Ant Design** duy nhất để thay thế hoàn toàn khung AI cũ (`AIAssistantModal` / `AiAssistantModal`).
- **Nguồn code gốc tham chiếu**:
  - File chính: `D:\Dropbox\_Documents\Toolx\scripts\printagent_render_bridge.py`
  - Các hàm xử lý AI lõi:
    - Tạo ảnh OpenAI: `generate_with_gpt` (dòng 323)
    - Sửa ảnh/Inpainting OpenAI: `edit_with_gpt` (dòng 401)
    - Tạo ảnh Gemini: `generate_with_gemini` (dòng 488)
    - Hội thoại Chat thông thường: `chat_with_ai` (dòng 556)
    - Chuẩn hóa Prompt 5 lớp: `enhance_prompt` & `PRO_PRESETS` (dòng 190 - 318)
    - Cấu hình Key: `get_api_keys` đọc từ `D:/vps_go.md` (`[GPTKey]`, `[GeminiKey]`)

---

## 2. Thiết kế 3 Tab chức năng chính trong Modal mới (`AiStudioModal.tsx`)

### Tab 1: ✨ Tạo Ảnh Mới (Text-to-Image)
- **Bộ chọn AI Engine**:
  - `🟣 GPT (OpenAI)`: Model `gpt-image-1`, `gpt-image-1-mini`, `chatgpt-image-latest` (kích thước wide 1536x1024 hoặc 1024x1024).
  - `🟢 Gemini (Google)`: Model `imagen-3.0-generate-002`, `gemini-2.5-flash-image`.
- **Tỷ lệ khung hình**: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`.
- **Độ phân giải xuất file**: `4K Ultra HD` (4096px, 300 DPI in ấn), `2K QHD` (2560px), `1080p FHD` (1920px).
- **AI Prompt Enhancer (5-Layer Framework)**:
  - Tự động chuẩn hóa prompt bằng `gpt-4o-mini`.
  - Bộ Preset Chuyên Nghiệp:
    - **Visual Style**: Chân thực đời thường, Điện ảnh Cinematic, Studio Thương mại, Kodak Portra, v.v.
    - **Lighting**: Nắng sớm bình minh, Studio Softbox 3 điểm, Hoàng hôn, Neon.
    - **Lens**: Chân dung xóa phông (85mm f/1.4), Góc mắt người (50mm), Góc rộng (24mm), Macro (100mm).

### Tab 2: 🎨 Sửa Ảnh & Inpainting (Image-to-Image & Mask Refiner)
- **Tải ảnh lên hoặc chọn ảnh từ thư viện**: Kéo thả ảnh hoặc chọn từ các ảnh đã tạo trước đó.
- **Canvas cọ vẽ Mask tương tác trực tiếp (`AiMaskCanvas.tsx`)**:
  - Cho phép người dùng tô cọ trực tiếp lên vùng ảnh muốn sửa.
  - Tùy chỉnh kích thước cọ vẽ (Brush Size: 10px - 80px), nút Tẩy (Eraser), nút Xóa toàn bộ mask (Clear Mask).
  - Tự động xuất ảnh Mask định dạng PNG chuẩn RGBA cho OpenAI (`alpha = 0` cho vùng vẽ sửa, `alpha = 255` cho vùng giữ nguyên).
- **Gọi API**: Đưa `source_image`, `mask` và `prompt` tới endpoint `/api/ai/image/edit` (OpenAI `/v1/images/edits`).

### Tab 3: 💬 Hội Thoại AI (Conversational Chat)
- **Trò chuyện trực tiếp**: Hỗ trợ trao đổi nghiệp vụ in ấn, vật tư, báo giá bảng hiệu, làm thơ/viết quảng cáo, giải đáp thắc mắc.
- **Lựa chọn AI Model**:
  - `🟣 GPT (OpenAI)`: `gpt-4o-mini` (nhanh, thông minh).
  - `🟢 Gemini (Google)`: `gemini-2.5-flash` (siêu tốc).
- **Tính năng nâng cao**:
  - Lưu lịch sử ngữ cảnh nhiều vòng hỏi đáp (multi-turn context).
  - Chip gợi ý câu hỏi mẫu nhanh.
  - Nút **📋 Sao chép tin nhắn**.
  - Nút **✨ Làm Prompt tạo ảnh**: Tự động lấy ý tưởng/mô tả từ câu trả lời AI, nhảy sang Tab 1 và điền sẵn vào ô prompt.
  - Thống kê Tokens & Chi phí ước tính theo thời gian thực.

### Cột Phải: Thư Viện Kết Quả & Trình Xem Ảnh 4K
- Danh sách thumbnail ảnh đã tạo/sửa với tag phân biệt `Tạo mới (4K)` hoặc `Inpainting`.
- Click vào ảnh để mở **Modal Xem Phóng To 4K** (pan, zoom, hiển thị DPI và kích thước pixel thực, nút tải PNG gốc 300 DPI).

---

## 3. Kiến trúc Backend cần tích hợp vào Admake (`backend/api/ai.py`)

Thêm các route xử lý trực tiếp vào `backend/api/ai.py` (đã đăng ký Blueprint `ai_bp` trong `backend/app.py`):

```python
# 1. Hàm đọc Key từ D:/vps_go.md kết hợp biến môi trường
def get_ai_studio_keys():
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    gpt_key = os.getenv("OPENAI_API_KEY", "") or os.getenv("GPT_API_KEY", "")
    vps_paths = ["D:/vps_go.md", "./vps_go.md", "/opt/vps_go.md"]
    for p in vps_paths:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    lines = [l.strip() for l in f.readlines()]
                    for i, l in enumerate(lines):
                        if l == "[GeminiKey]" and i + 1 < len(lines):
                            gemini_key = lines[i + 1].strip()
                        elif l == "[GPTKey]" and i + 1 < len(lines):
                            gpt_key = lines[i + 1].strip()
            except Exception:
                pass
    return gemini_key, gpt_key

# 2. Endpoint Hội Thoại Chat
@ai_bp.route("/api/ai/chat", methods=["POST"])
def api_ai_chat():
    data = request.get_json(force=True, silent=True) or {}
    messages = data.get("messages") or []
    engine = data.get("engine", "gpt").lower()
    # Logic gọi OpenAI chat/completions hoặc Gemini generateContent như trong Toolx
    # ...

# 3. Endpoint Tạo Ảnh Mới
@ai_bp.route("/api/ai/image/generate", methods=["POST"])
def api_ai_image_generate():
    data = request.get_json(force=True, silent=True) or {}
    prompt = data.get("prompt")
    engine = data.get("engine", "gpt")
    aspect_ratio = data.get("aspect_ratio", "4:3")
    resolution = data.get("resolution", "4k")
    # Gọi gpt-image-1 hoặc Imagen 3, phóng to ảnh bằng Lanczos 300 DPI và lưu kết quả
    # ...

# 4. Endpoint Sửa Ảnh & Inpainting
@ai_bp.route("/api/ai/image/edit", methods=["POST"])
def api_ai_image_edit():
    data = request.get_json(force=True, silent=True) or {}
    prompt = data.get("prompt")
    image_b64 = data.get("image_base64")
    mask_b64 = data.get("mask_base64")
    # Gọi OpenAI v1/images/edits với image và mask
    # ...
```

---

## 4. Cấu trúc Component Frontend cần xây dựng trong Admake

Tạo thư mục `frontend/src/common/components/ai-studio/`:
- `AiStudioModal.tsx`: Component Modal chính (bọc Ant Design `Modal`, rộng `95vw`, chiều cao `88vh`, styled Dark Theme Tailwind CSS sang trọng).
- `tabs/AiCreateTab.tsx`: Giao diện Tạo ảnh với đầy đủ nút chọn Engine, Prompt, Presets 5 lớp, Aspect Ratio, Resolution.
- `tabs/AiEditTab.tsx`: Giao diện Sửa ảnh tích hợp `AiMaskCanvas.tsx`.
- `tabs/AiChatTab.tsx`: Giao diện Hội thoại Chat đa năng.
- `components/AiMaskCanvas.tsx`: Canvas vẽ cọ tô mask vùng sửa (hỗ trợ điều chỉnh kích thước cọ, hoàn tác, xóa).
- `components/AiGallery.tsx`: Cột hiển thị danh sách ảnh đã tạo, bộ lọc và các nút tải/sao chép.
- `components/AiViewerModal.tsx`: Modal xem trước ảnh siêu nét 4K với công cụ Pan & Zoom.

---

## 5. Quy trình thay thế trong Admake
1. **Bước 1**: Mở file `frontend/src/common/app/dashboard/statistic/page.tsx`, đổi import từ `AIAssistantModal` cũ sang `AiStudioModal` mới.
2. **Bước 2**: Đặt nút kích hoạt (Icon `Sparkles` / `Bot`) trên thanh Header Navbar chung của Admake (`Header.tsx` hoặc `Sidebar.tsx`) để người dùng có thể bật Studio AI từ bất kỳ trang nào.
3. **Bước 3**: Kiểm tra biến môi trường và file `D:/vps_go.md` đảm bảo backend nhận diện được `[GPTKey]` và `[GeminiKey]`.
4. **Bước 4**: Kiểm tra hoạt động cả 3 tab: Tạo ảnh 4K -> Tô cọ sửa ảnh -> Đặt câu hỏi hội thoại và bấm "Làm Prompt tạo ảnh".

