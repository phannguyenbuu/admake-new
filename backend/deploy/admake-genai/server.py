"""
Enterprise ChatGPT Image Generation Bridge & Worker Orchestrator
Backend trung tâm triển khai trên VPS: Quản lý hàng đợi (Queue), điều phối đa Worker/Chrome/Tài khoản,
cung cấp bộ API chuẩn hóa (Create / Edit-Full / Edit-Inpaint), và lưu trữ ảnh trực tiếp vào /var/lib/admake-genai/images.
"""

import io
import os
import sys
import json
import time
import base64
import threading
import math
from pathlib import Path
from datetime import datetime
from PIL import Image, ImageFile
Image.MAX_IMAGE_PIXELS = None
ImageFile.LOAD_TRUNCATED_IMAGES = True
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import uuid
import secrets
import queue
import requests
try:
    import fal_client
except ImportError:
    fal_client = None

try:
    import fitz
except ImportError:
    try:
        import pymupdf as fitz
    except ImportError:
        fitz = None

AVAILABLE_MODELS = [
    {
        "id": "upscayl-standard-4x",
        "name": "Chuẩn (Standard 4x)",
        "tag": "Khuyên dùng",
        "description": "Cân bằng độ nét và chi tiết, phù hợp ảnh chụp, sản phẩm, phong cảnh và đời thường.",
        "scale": 4,
        "recommended_for": ["photo", "product", "general"]
    },
    {
        "id": "ultrasharp-4x",
        "name": "Tăng nét cực đại (UltraSharp 4x)",
        "tag": "Phục hồi viền",
        "description": "Tăng độ sắc nét mạnh mẽ, khôi phục viền mờ, chữ mờ và chi tiết nhỏ bị vỡ nét.",
        "scale": 4,
        "recommended_for": ["blurry", "text", "architecture"]
    },
    {
        "id": "high-fidelity-4x",
        "name": "Chi tiết cao (High-Fidelity 4x)",
        "tag": "Độ chi tiết cao",
        "description": "Ưu tiên giữ lại cấu trúc hoa văn, vải sợi, vật liệu và bề mặt phức tạp.",
        "scale": 4,
        "recommended_for": ["texture", "fabric", "macro"]
    },
    {
        "id": "digital-art-4x",
        "name": "Đồ họa & Thiết kế (Digital Art 4x)",
        "tag": "In ấn / Poster",
        "description": "Chuyên trị poster, banner, logo, vector, tranh minh họa anime và bảng hiệu quảng cáo.",
        "scale": 4,
        "recommended_for": ["art", "banner", "logo", "anime"]
    },
    {
        "id": "ultramix-balanced-4x",
        "name": "Nét tự nhiên (Balanced 4x)",
        "tag": "Tự nhiên",
        "description": "Giảm độ gai gắt, cho cảm giác mịn màng tự nhiên, rất thích hợp cho ảnh chân dung người.",
        "scale": 4,
        "recommended_for": ["portrait", "skin", "smooth"]
    },
    {
        "id": "upscayl-lite-4x",
        "name": "KichNet Lite (Siêu tốc 4x)",
        "tag": "Nhẹ máy",
        "description": "Xử lý cực nhanh, tải nhẹ GPU, phù hợp cho máy cấu hình văn phòng hoặc xử lý hàng loạt.",
        "scale": 4,
        "recommended_for": ["fast", "low_vram"]
    },
    {
        "id": "remacri-4x",
        "name": "Remacri (Chân dung & Nghệ thuật)",
        "tag": "Nghệ thuật",
        "description": "Mô hình cổ điển cân bằng chi tiết chân dung và màu sắc trung thực.",
        "scale": 4,
        "recommended_for": ["portrait", "landscape"]
    }
]

PRINT_PRESETS = [
    {"id": "a0", "name": "A0 (84.1 x 118.9 cm - Báo tường / Poster lớn)", "width_cm": 84.1, "height_cm": 118.9, "dpi": 300},
    {"id": "a1", "name": "A1 (59.4 x 84.1 cm - Poster vừa)", "width_cm": 59.4, "height_cm": 84.1, "dpi": 300},
    {"id": "a2", "name": "A2 (42.0 x 59.4 cm - Báo tường nhỏ)", "width_cm": 42.0, "height_cm": 59.4, "dpi": 300},
    {"id": "a3", "name": "A3 (29.7 x 42 cm)", "width_cm": 29.7, "height_cm": 42.0, "dpi": 300},
    {"id": "a4", "name": "A4 (21 x 29.7 cm)", "width_cm": 21.0, "height_cm": 29.7, "dpi": 300},
    {"id": "40x60", "name": "Khổ 40 x 60 cm", "width_cm": 40.0, "height_cm": 60.0, "dpi": 300},
    {"id": "60x90", "name": "Khổ 60 x 90 cm", "width_cm": 60.0, "height_cm": 90.0, "dpi": 200},
    {"id": "80x120", "name": "Khổ 80 x 120 cm", "width_cm": 80.0, "height_cm": 120.0, "dpi": 150},
    {"id": "100x200", "name": "Khổ 100 x 200 cm (Backdrop)", "width_cm": 100.0, "height_cm": 200.0, "dpi": 100},
]


# Cấu hình đường dẫn
IMAGES_DIR = Path("/var/lib/admake-genai/images") if sys.platform != "win32" else Path("./output_images")
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

DATA_DIR = Path("/opt/admake-genai/bridge/data") if sys.platform != "win32" else Path("./backend_data")
DATA_DIR.mkdir(parents=True, exist_ok=True)

METADATA_FILE = DATA_DIR / "gallery_metadata.json"
HINTS_FILE = DATA_DIR / "prompt_hints.json"
WORKERS_CONFIG_FILE = DATA_DIR / "workers_config.json"
UPSCALE_HISTORY_FILE = DATA_DIR / "upscale_history.json"
PROMPT_LIB_FILE = DATA_DIR / "prompt_lib.json"

# Quản lý Hàng đợi GPU Worker cho Kích Nét AI
gpu_upscale_jobs = {}
gpu_upscale_queue = queue.Queue()
gpu_upscale_lock = threading.RLock()
gpu_worker_info = {
    "worker_name": "Chưa kết nối",
    "gpu": "N/A",
    "vram": "N/A",
    "status": "offline",
    "last_seen": 0,
    "jobs_completed": 0
}

def load_upscale_history():
    global gpu_upscale_jobs
    if UPSCALE_HISTORY_FILE.exists():
        try:
            with open(UPSCALE_HISTORY_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                for item in data:
                    gpu_upscale_jobs[item["id"]] = item
            print(f"[+] Đã tải {len(gpu_upscale_jobs)} tác vụ Kích Nét AI từ lịch sử.")
        except Exception as e:
            print(f"[!] Lỗi đọc lịch sử kích nét: {e}")

def save_upscale_history():
    with gpu_upscale_lock:
        try:
            items = list(gpu_upscale_jobs.values())[-100:]
            with open(UPSCALE_HISTORY_FILE, "w", encoding="utf-8") as f:
                json.dump(items, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[!] Lỗi ghi lịch sử kích nét: {e}")

load_upscale_history()

DEFAULT_NEW_CHAT_LIMIT = 0      # 0 = Tắt tự động New Chat. Chỉ New Chat khi người dùng bấm Reset Session hoặc yêu cầu cụ thể.
WORKER_OFFLINE_TIMEOUT = 85   # Giây không có heartbeat -> offline (tăng từ 25s lên 85s để tránh tab background bị ngắt)
JOB_TIMEOUT_SECONDS = 300      # Giây tối đa cho 1 job trước khi tự động giải phóng và re-queue (5 phút)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.after_request
def admake_public_urls(response):
    if response.is_json:
        data = response.get_json()
        def rewrite(value):
            if isinstance(value, dict): return {k: rewrite(v) for k,v in value.items()}
            if isinstance(value, list): return [rewrite(v) for v in value]
            if isinstance(value, str): return value.replace('http://127.0.0.1:6002', 'https://admake.vn/genai').replace('http://admake.vn/images/', 'https://admake.vn/genai/images/').replace('https://admake.vn/images/', 'https://admake.vn/genai/images/')
            return value
        response.set_data(json.dumps(rewrite(data), ensure_ascii=False))
    return response


# ==============================================================================
# QUẢN LÝ DỮ LIỆU CẤU HÌNH WORKERS & METADATA
# ==============================================================================

def load_workers_config():
    if WORKERS_CONFIG_FILE.exists():
        try:
            with open(WORKERS_CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_workers_config(cfg):
    try:
        with open(WORKERS_CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(cfg, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[!] Lỗi ghi workers_config: {e}")

def slugify_prompt(text, max_len=36):
    """Tạo tên gợi ý từ nội dung prompt, tuyệt đối không có chữ chatgpt hay dall-e"""
    import unicodedata, re
    if not text:
        return ""
    norm = unicodedata.normalize('NFKD', str(text)).encode('ascii', 'ignore').decode('utf-8')
    norm = re.sub(r'(?i)chatgpt|dall[-_ ]?e', '', norm)
    slug = re.sub(r'[^a-zA-Z0-9]+', '_', norm.lower()).strip('_')
    return slug[:max_len].rstrip('_')

def normalize_reference_image(ref, file_stem):
    """
    Chuẩn hóa ảnh tham chiếu: nếu là TIFF/BMP/định dạng lạ hoặc base64,
    convert sang RGB JPEG bằng Pillow, ghi vào IMAGES_DIR/{file_stem}.jpg
    và trả về dict chuẩn { data: 'data:image/jpeg;base64,...', name: '...jpg' } cùng public url.
    """
    if not ref:
        return ref, None

    public_url_prefix = "https://admake.vn/genai/images"
    
    if isinstance(ref, str):
        if ref.startswith("data:image/"):
            ref = {"data": ref, "name": f"{file_stem}.jpg"}
        else:
            return ref, ref

    if isinstance(ref, dict) and "data" in ref:
        data_str = ref.get("data", "")
        name = ref.get("name", f"{file_stem}.jpg")
        
        try:
            if "," in data_str:
                header, b64_part = data_str.split(",", 1)
            else:
                b64_part = data_str

            raw_bytes = base64.b64decode(b64_part)
            
            with Image.open(io.BytesIO(raw_bytes)) as pil_img:
                rgb_img = pil_img.convert("RGB")
                
                save_filename = f"{file_stem}.jpg"
                save_path = IMAGES_DIR / save_filename
                rgb_img.save(str(save_path), format="JPEG", quality=95)
                
                buf = io.BytesIO()
                rgb_img.save(buf, format="JPEG", quality=95)
                new_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
                
                base_name = os.path.splitext(name)[0]
                new_name = f"{base_name}.jpg"
                public_url = f"{public_url_prefix}/{save_filename}"
                
                return {
                    "data": f"data:image/jpeg;base64,{new_b64}",
                    "name": new_name,
                    "url": public_url
                }, public_url
        except Exception as e:
            print(f"[!] normalize_reference_image error ({name}): {e}")
            
    return ref, None
# QUẢN LÝ DỮ LIỆU METADATA & HINTS
# ==============================================================================

def load_metadata():
    if METADATA_FILE.exists():
        try:
            with open(METADATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_metadata_entry(entry):
    metadata = load_metadata()
    metadata[entry["filename"]] = entry
    try:
        with open(METADATA_FILE, "w", encoding="utf-8") as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[!] Lỗi ghi metadata: {e}")

def extract_caller_info(req, data=None):
    """
    Trích xuất danh tính hệ thống gọi API và Public IP thực tế của Client.
    Hỗ trợ Nginx reverse proxy, Cloudflare, custom headers, origin, referer, và body parameters.
    """
    data = data or {}

    # 1. Lấy địa chỉ Public IP thực tế của Client
    client_ip = "127.0.0.1"
    forwarded_for = req.headers.get("X-Forwarded-For", "").strip()
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    elif req.headers.get("X-Real-IP"):
        client_ip = req.headers.get("X-Real-IP").strip()
    elif req.headers.get("CF-Connecting-IP"):
        client_ip = req.headers.get("CF-Connecting-IP").strip()
    elif req.remote_addr:
        client_ip = req.remote_addr.strip()

    # 2. Nhận diện tên hệ thống / domain / ứng dụng bên ngoài gọi API
    explicit_caller = (data.get("caller") or data.get("source") or data.get("app_name") or data.get("client_name") or data.get("client") or "").strip()
    custom_header = (req.headers.get("X-Caller-App") or req.headers.get("X-Client-Name") or req.headers.get("X-App-Name") or req.headers.get("X-Source") or "").strip()
    origin = req.headers.get("Origin", "").strip()
    referer = req.headers.get("Referer", "").strip()
    user_agent = req.headers.get("User-Agent", "").strip()

    caller_type = "external_api"
    if explicit_caller:
        caller_system = explicit_caller
        caller_type = "external_api"
    elif custom_header:
        caller_system = custom_header
        caller_type = "external_api"
    elif origin:
        if any(dom in origin.lower() for dom in ["genai.toolxprint.com", "localhost", "127.0.0.1"]):
            caller_system = "Studio Web (Nội bộ)"
            caller_type = "internal"
        else:
            caller_system = origin
            caller_type = "external_web"
    elif referer:
        if any(dom in referer.lower() for dom in ["genai.toolxprint.com", "localhost", "127.0.0.1"]):
            caller_system = "Studio Web (Nội bộ)"
            caller_type = "internal"
        else:
            caller_system = referer.split("?")[0]
            caller_type = "external_web"
    elif user_agent:
        ua_lower = user_agent.lower()
        if "python" in ua_lower:
            caller_system = f"Python Client ({user_agent.split('/')[0]})"
        elif "curl" in ua_lower:
            caller_system = "cURL Terminal"
        elif "postman" in ua_lower:
            caller_system = "Postman API"
        elif any(k in ua_lower for k in ["axios", "node-fetch", "got", "undici"]):
            caller_system = f"Node.js ({user_agent.split('/')[0]})"
        elif "php" in ua_lower or "guzzle" in ua_lower:
            caller_system = "PHP / Guzzle"
        elif "java" in ua_lower or "okhttp" in ua_lower:
            caller_system = "Java / Android"
        else:
            caller_system = f"External API ({user_agent[:35]})"
    else:
        caller_system = "Hệ thống Web Bên Ngoài"

    return {
        "client_ip": client_ip,
        "caller_system": caller_system,
        "caller_type": caller_type,
        "origin": origin or None,
        "referer": referer or None,
        "user_agent": user_agent or None
    }

THUMBNAILS_DIR = IMAGES_DIR / "thumbnails"
THUMBNAILS_DIR.mkdir(parents=True, exist_ok=True)

def ensure_thumbnail(file_path: Path, max_width=420) -> str:
    """Tạo thumbnail WebP nén nhẹ (~30-50KB) từ ảnh gốc nếu chưa có."""
    try:
        thumb_name = f"thumb_{file_path.stem}.webp"
        thumb_file = THUMBNAILS_DIR / thumb_name
        if not thumb_file.exists() or thumb_file.stat().st_size == 0:
            from PIL import Image
            Image.MAX_IMAGE_PIXELS = None
            with Image.open(file_path) as img:
                w, h = img.size
                if w > max_width:
                    new_w = max_width
                    new_h = max(1, int(h * (max_width / w)))
                    resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                else:
                    resized = img
                if resized.mode not in ("RGB", "RGBA"):
                    resized = resized.convert("RGB")
                resized.save(thumb_file, "WEBP", quality=78, method=4)
        return thumb_name
    except Exception as e:
        print(f"[!] Lỗi tạo thumbnail cho {file_path}: {e}")
        return ""

def get_all_gallery_items(base_url="https://admake.vn/genai"):
    metadata = load_metadata()
    items = []
    if IMAGES_DIR.exists():
        for file in sorted(IMAGES_DIR.glob("*.*"), key=lambda f: f.stat().st_mtime, reverse=True):
            if file.suffix.lower() not in (".png", ".jpg", ".jpeg", ".webp"):
                continue
            filename = file.name

            # Bỏ qua các file trung gian: ảnh gốc đính kèm tham chiếu (ref_*) và ảnh xem trước tức thì (preview_*)
            if filename.startswith("ref_") or filename.startswith("preview_") or filename.startswith("thumb_"):
                continue

            stat = file.stat()
            # Bỏ qua file rác rỗng hoặc nhỏ hơn 1KB
            if stat.st_size < 1024:
                continue

            file_size_mb = f"{round(stat.st_size / (1024 * 1024), 2)} MB"
            mtime_str = datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S")

            meta = metadata.get(filename, {})
            prompt = meta.get("prompt") or "Ảnh tạo qua Extension"
            style = meta.get("style") or "None"
            aspect_ratio = meta.get("aspect_ratio") or "16:9"
            vps_url = f"{base_url}/images/{filename}"

            ref_url = meta.get("reference_image_url")
            job_id = meta.get("id")
            if not ref_url and job_id:
                ref_candidate = IMAGES_DIR / f"ref_{job_id}_0.jpg"
                if ref_candidate.exists():
                    ref_url = f"{base_url}/images/ref_{job_id}_0.jpg"

            thumb_name = ensure_thumbnail(file)
            thumbnail_url = f"{base_url}/images/thumbnails/{thumb_name}" if thumb_name else vps_url
            items.append({
                "id": meta.get("id") or filename.rsplit(".", 1)[0],
                "filename": filename,
                "prompt": prompt,
                "style": style,
                "aspectRatio": aspect_ratio,
                "timestamp": meta.get("timestamp") or mtime_str,
                "vpsUrl": vps_url,
                "thumbnail": thumbnail_url,
                "remotePath": f"/var/lib/admake-genai/images/{filename}",
                "fileSize": file_size_mb,
                "durationSeconds": meta.get("durationSeconds", 15),
                "engine": meta.get("engine", "chatgpt"),
                "worker_id": meta.get("worker_id", "unknown"),
                "client_ip": meta.get("client_ip") or "N/A",
                "caller_system": meta.get("caller_system") or "Chưa ghi nhận",
                "caller_type": meta.get("caller_type") or "internal",
                "caller_origin": meta.get("caller_origin"),
                "caller_referer": meta.get("caller_referer"),
                "caller_user_agent": meta.get("caller_user_agent"),
                "reference_image_url": ref_url,
                "pdf_url": meta.get("pdf_url"),
                "download_pdf_url": meta.get("download_pdf_url"),
                "physical_dimensions": meta.get("physical_dimensions")
            })
    return items

def recover_orphaned_preview_images(base_url="https://admake.vn/genai"):
    """
    Tự động quét các ảnh preview_job_*.png cũ chưa được hoàn tất
    và chuyển đổi chúng thành ảnh thư viện chính thức, khôi phục metadata
    để không bao giờ bị bỏ sót bất kỳ hình ảnh nào.
    """
    try:
        if not IMAGES_DIR.exists():
            return
        meta = load_metadata()
        all_files = set(os.listdir(str(IMAGES_DIR)))
        previews = sorted(IMAGES_DIR.glob("preview_job_*.png"), key=lambda f: f.stat().st_mtime)
        recovered_count = 0
        cleaned_count = 0

        for p in previews:
            base = p.name
            job_id = base.replace("preview_", "").replace(".png", "")
            ts = job_id.replace("job_", "")

            # Kiểm tra xem đã có ảnh hoàn tất tương ứng trên đĩa chưa
            has_final = any(
                (ts in f or job_id in f) and f != base and not f.startswith("ref_") and not f.startswith("thumb_") and not f.startswith("preview_")
                for f in all_files
            )

            if has_final:
                try:
                    p.unlink(missing_ok=True)
                    cleaned_count += 1
                except Exception:
                    pass
            else:
                new_name = f"chatgpt_img_{ts}.png"
                new_path = IMAGES_DIR / new_name
                try:
                    import shutil
                    shutil.copy2(str(p), str(new_path))
                    p.unlink(missing_ok=True)
                    all_files.add(new_name)

                    st = new_path.stat()
                    mtime_str = datetime.fromtimestamp(st.st_mtime).strftime("%Y-%m-%d %H:%M:%S")

                    ref_url = None
                    if (IMAGES_DIR / f"ref_{job_id}_0.jpg").exists():
                        ref_url = f"{base_url}/images/ref_{job_id}_0.jpg"

                    ensure_thumbnail(new_path)

                    meta[new_name] = {
                        "id": job_id,
                        "filename": new_name,
                        "prompt": "Ảnh thiết kế tạo qua ChatGPT Extension",
                        "style": "None",
                        "aspect_ratio": "16:9",
                        "timestamp": mtime_str,
                        "vps_url": f"{base_url}/images/{new_name}",
                        "worker_id": "extension_worker",
                        "durationSeconds": 25,
                        "reference_image_url": ref_url
                    }
                    recovered_count += 1
                except Exception as err:
                    print(f"[!] Lỗi khôi phục {base}: {err}")

        if recovered_count > 0:
            with open(METADATA_FILE, "w", encoding="utf-8") as f:
                json.dump(meta, f, ensure_ascii=False, indent=2)
            print(f"[✓] Đã tự động khôi phục {recovered_count} ảnh preview vào Thư viện. Dọn dẹp {cleaned_count} preview thừa.")
    except Exception as e:
        print(f"[!] Lỗi recover_orphaned_preview_images: {e}")

def get_prompt_hints():
    if HINTS_FILE.exists():
        try:
            with open(HINTS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    # Mẫu mặc định
    return [
        {
            "id": "arch_render_clear",
            "title": "Render kiến trúc đẹp trong sáng",
            "text": "giữ nguyên mọi chi tiết kiến trúc và hình khối, tạo bản render đẹp trong sáng"
        },
        {
            "id": "arch_material_modern",
            "title": "Vật liệu hiện đại & Ánh sáng tự nhiên",
            "text": "giữ nguyên toàn bộ hình khối kiến trúc gốc, hoàn thiện ốp lát vật liệu hiện đại cao cấp, bổ sung cây xanh cảnh quan và ánh sáng ban ngày tự nhiên trong trẻo"
        },
        {
            "id": "arch_night_scene",
            "title": "Phối cảnh hoàng hôn & Đèn đêm",
            "text": "giữ nguyên mọi chi tiết kiến trúc và hình khối, render phối cảnh hoàng hôn lung linh với hệ thống đèn chiếu sáng công trình ấm áp, sang trọng"
        }
    ]

# ==============================================================================
# WORKER POOL & JOB QUEUE MANAGER (Thread-Safe)
# ==============================================================================

class WorkerNode:
    def __init__(self, worker_id, name=None, account_label=None, is_enabled=True, ip_address=None, account_email=None, pc_name=None, bridge_type=None, bridge_version=None):
        self.tab_info = {}
        self.receive_mode = load_workers_config().get(worker_id, {}).get("receive_mode", "shared")
        self.worker_id = worker_id
        self.name = name or worker_id
        self.pc_name = (pc_name or name or worker_id).strip().upper()
        self.account_label = account_label or "Default Account"
        self.account_email = account_email
        self.ip_address = ip_address
        self.bridge_type = bridge_type or "legacy_bridge"
        self.bridge_version = bridge_version or "3.0"
        self.is_unified = (self.bridge_type == "chatgpt_unified_bridge" or (bridge_version and "4" in str(bridge_version)))
        self.status = "idle"  # idle, busy, offline, cooling_down
        self.last_heartbeat = time.time()
        self.current_job_id = None
        self.current_request_code = None
        self.consecutive_images_count = 0
        self.auto_new_chat_limit = DEFAULT_NEW_CHAT_LIMIT
        self.total_completed = 0
        self.pending_new_chat = False
        self.is_enabled = is_enabled if is_enabled is not None else True

    def is_online(self):
        return self.tab_info.get("executor_status") != "closed" and (time.time() - self.last_heartbeat) < WORKER_OFFLINE_TIMEOUT

    def to_dict(self):
        online = self.is_online()
        display_status = self.status if online else "offline"
        return {
            **self.tab_info,
            "worker_id": self.worker_id,
            "name": self.name,
            "pc_name": getattr(self, "pc_name", self.worker_id),
            "bridge_type": getattr(self, "bridge_type", "legacy_bridge"),
            "bridge_version": getattr(self, "bridge_version", "3.0"),
            "is_unified": getattr(self, "is_unified", False),
            "account_label": self.account_label,
            "account_email": getattr(self, "account_email", None),
            "ip_address": getattr(self, "ip_address", None),
            "status": display_status,
            "is_online": online,
            "is_enabled": getattr(self, "is_enabled", True),
            "receive_mode": getattr(self, "receive_mode", "shared"),
            "current_job_id": self.current_job_id,
            "current_request_code": getattr(self, "current_request_code", None),
            "consecutive_images_count": self.consecutive_images_count,
            "auto_new_chat_limit": self.auto_new_chat_limit,
            "total_completed": self.total_completed,
            "last_heartbeat": datetime.fromtimestamp(self.last_heartbeat).strftime("%H:%M:%S"),
            "seconds_since_ping": round(time.time() - self.last_heartbeat, 1)
        }

class Orchestrator:
    def __init__(self):
        self.lock = threading.RLock()
        self.jobs = []  # Danh sách tất cả jobs (lịch sử + active)
        self.workers = {}  # worker_id -> WorkerNode
        self.global_pending_new_chat = False

    # --- Worker Management ---
    def register_or_update_worker(self, worker_id, name=None, account_label=None, status=None, current_job_id=None, consecutive_images=None, ip_address=None, account_email=None, pc_name=None, bridge_type=None, bridge_version=None, tab_info=None):
        with self.lock:
            cfg = load_workers_config()
            saved_cfg = cfg.get(worker_id, {})
            saved_enabled = saved_cfg.get("is_enabled", True)
            saved_name = saved_cfg.get("name") or name
            saved_email = saved_cfg.get("account_email") or account_email

            is_unified = (str(bridge_type).strip().lower() == "chatgpt_unified_bridge") or (bridge_version and "4" in str(bridge_version))
            resolved_bridge = "chatgpt_unified_bridge" if is_unified else "legacy_bridge"
            resolved_ver = str(bridge_version) if bridge_version else ("4.0" if is_unified else "3.0")

            if worker_id not in self.workers:
                self.workers[worker_id] = WorkerNode(worker_id, saved_name, account_label, is_enabled=saved_enabled, ip_address=ip_address, account_email=saved_email, pc_name=pc_name, bridge_type=resolved_bridge, bridge_version=resolved_ver)
                print(f"[+] Worker mới đăng ký: {worker_id} ({saved_name} - {account_label} | {saved_email} | PC: {pc_name} | Bridge: {resolved_bridge} v{resolved_ver}) [IP: {ip_address}, Active: {saved_enabled}]")
            
            w = self.workers[worker_id]
            w.last_heartbeat = time.time()
            if tab_info:
                allowed = ("tab_id", "agent_id", "agent_name", "conversation_id", "conversation_url", "executor_status", "output_type", "capabilities")
                w.tab_info.update({k: tab_info[k] for k in allowed if k in tab_info})
            if bridge_type or bridge_version:
                w.bridge_type = resolved_bridge
                w.bridge_version = resolved_ver
                w.is_unified = is_unified
            if pc_name:
                w.pc_name = pc_name.strip().upper()
            if ip_address:
                w.ip_address = ip_address
            if account_email:
                w.account_email = account_email
                if worker_id in cfg and cfg[worker_id].get("account_email") != account_email:
                    cfg[worker_id]["account_email"] = account_email
                    save_workers_config(cfg)
            elif saved_email and not getattr(w, "account_email", None):
                w.account_email = saved_email
            
            # Ưu tiên tên người dùng đã lưu/đổi trên Web UI, nếu chưa có thì dùng name gửi lên
            if saved_cfg.get("name"):
                w.name = saved_cfg.get("name")
            elif name:
                w.name = name

            if account_label:
                w.account_label = account_label
            has_assignment = any(j.get("assigned_worker_id") == worker_id and j["status"] in ("assigned", "processing") for j in self.jobs)
            if status and status in ("idle", "busy"):
                w.status = "busy" if has_assignment else status
            if current_job_id is not None:
                w.current_job_id = current_job_id
            if consecutive_images is not None:
                w.consecutive_images_count = consecutive_images
            return w

    def set_worker_enabled(self, worker_id, is_enabled=None):
        with self.lock:
            if worker_id not in self.workers:
                cfg = load_workers_config()
                saved_enabled = cfg.get(worker_id, {}).get("is_enabled", True)
                self.workers[worker_id] = WorkerNode(worker_id, is_enabled=saved_enabled)
            w = self.workers[worker_id]
            if is_enabled is None:
                w.is_enabled = not getattr(w, "is_enabled", True)
            else:
                w.is_enabled = bool(is_enabled)
            
            # Lưu cấu hình vào file disk
            cfg = load_workers_config()
            if worker_id not in cfg:
                cfg[worker_id] = {}
            cfg[worker_id]["is_enabled"] = w.is_enabled
            cfg[worker_id]["name"] = w.name
            cfg[worker_id]["account_label"] = w.account_label
            if getattr(w, "account_email", None):
                cfg[worker_id]["account_email"] = w.account_email
            save_workers_config(cfg)
            print(f"[*] Cập nhật Worker {worker_id}: is_enabled = {w.is_enabled}")
            return w.is_enabled

    def set_worker_receive_mode(self, worker_id, mode):
        with self.lock:
            cfg = load_workers_config()
            cfg.setdefault(worker_id, {})["receive_mode"] = mode
            save_workers_config(cfg)
            if worker_id in self.workers:
                self.workers[worker_id].receive_mode = mode

    def remove_worker(self, worker_id):
        with self.lock:
            removed = self.workers.pop(worker_id, None) is not None
            cfg = load_workers_config()
            if worker_id in cfg:
                del cfg[worker_id]
                save_workers_config(cfg)
            if removed:
                print(f"[-] Đã xóa Worker: {worker_id}")
            return removed

    def cleanup_offline_workers(self):
        with self.lock:
            offline_ids = [w.worker_id for w in self.workers.values() if not w.is_online()]
            for wid in offline_ids:
                self.workers.pop(wid, None)
            cfg = load_workers_config()
            changed = False
            for wid in offline_ids:
                if wid in cfg:
                    del cfg[wid]
                    changed = True
            if changed:
                save_workers_config(cfg)
            print(f"[-] Đã dọn dẹp {len(offline_ids)} workers offline: {offline_ids}")
            return len(offline_ids)

    def get_all_workers(self):
        with self.lock:
            return [w.to_dict() for w in self.workers.values()]

    def request_new_chat(self, worker_id=None):
        with self.lock:
            if worker_id and worker_id in self.workers:
                self.workers[worker_id].pending_new_chat = True
                print(f"[*] Yêu cầu New Chat cho Worker: {worker_id}")
            else:
                self.global_pending_new_chat = True
                for w in self.workers.values():
                    w.pending_new_chat = True
                print("[*] Yêu cầu New Chat cho TOÀN BỘ Workers.")

    def create_job(self, job_type, prompt, style="None", aspect_ratio="16:9", 
                   reference_images=None, pins=None, preserve_surroundings=True, 
                   target_worker_id=None, target_pc=None, new_chat=False, caller_info=None,
                   bridge_type="chatgpt_unified_bridge", request_code=None, only_unified=False,
                   engine="chatgpt", model=None, api_key=None):
        timestamp_ms = int(time.time() * 1000)
        job_id = f"job_{timestamp_ms}_{secrets.token_hex(3)}"
        
        # Sinh mã Request độc quyền riêng UB4-REQ nếu chưa có
        if not request_code:
            rand_hex = secrets.token_hex(2).upper()
            req_code = f"UB4-REQ-{int(time.time())}-{rand_hex}"
        else:
            req_code = request_code.strip()

        # Xây dựng prompt chuẩn hóa nếu là inpaint có pins
        formatted_prompt = prompt
        if job_type == "edit_inpaint" and pins and len(pins) > 0:
            prefix = "Chỉnh sửa cục bộ các vị trí đã đánh dấu theo thứ tự:"
            if preserve_surroundings:
                prefix = "Chỉnh sửa cục bộ nghiêm ngặt (Strict Inpainting): GIỮ NGUYÊN 100% toàn bộ khung cảnh, màu sắc, chi tiết xung quanh, CHỈ THAY ĐỔI DUY NHẤT các chi tiết được đánh dấu dưới đây:"
            pin_lines = [f"{p.get('order', i+1)}. (x: {p.get('xFormatted', '')}, y: {p.get('yFormatted', '')}) {p.get('text', '')}".strip() for i, p in enumerate(pins)]
            formatted_prompt = f"{prefix} {', '.join(pin_lines)}"
            if prompt and prompt.strip():
                formatted_prompt += f". Ghi chú bổ sung: {prompt.strip()}"

        # Chuẩn hóa reference_images sang chuẩn RGB JPEG và lưu file gốc cho Before / After
        normalized_refs = []
        ref_image_url = None
        if reference_images:
            for idx, r in enumerate(reference_images):
                norm_r, public_ref_url = normalize_reference_image(r, f"ref_{job_id}_{idx}")
                normalized_refs.append(norm_r)
                if not ref_image_url and public_ref_url:
                    ref_image_url = public_ref_url

        caller_info = caller_info or {}

        def sanitize_target(val):
            if not val:
                return None
            s = str(val).strip()
            if s.lower() in ("", "none", "null", "undefined", "all", "auto", "any", "tất cả", "toàn bộ", "false"):
                return None
            return s

        clean_worker_id = sanitize_target(target_worker_id)
        clean_target_pc = sanitize_target(target_pc)
        if not clean_target_pc and clean_worker_id:
            clean_target_pc = clean_worker_id.upper()

        engine_clean = (engine or "chatgpt").strip().lower()
        if engine_clean not in ("gemini", "chatgpt"):
            engine_clean = "chatgpt"

        job = {
            "id": job_id,
            "engine": engine_clean,
            "model": model,
            "api_key": api_key,
            "request_code": req_code,
            "bridge_type": bridge_type or "chatgpt_unified_bridge",
            "only_unified": False,
            "expected_output": "image" if job_type in ("create", "edit_full", "edit_inpaint", "image_gen") else ("code" if job_type == "ruby_3d" else "text"),
            "type": job_type,  # create, edit_full, edit_inpaint, chat_code
            "prompt": formatted_prompt,
            "raw_prompt": prompt,
            "style": style or "None",
            "aspect_ratio": aspect_ratio or "16:9",
            "reference_images": normalized_refs,
            "reference_image_url": ref_image_url,
            "pins": pins or [],
            "preserve_surroundings": preserve_surroundings,
            "target_worker_id": clean_worker_id,
            "target_pc": clean_target_pc,
            "assigned_worker_id": "gemini_cloud" if engine_clean == "gemini" else None,
            "status": "queued",  # queued, assigned, processing, completed, failed
            "progress": 5,
            "current_step": f"Đang khởi tạo tác vụ Cloud AI Gemini [Mã: {req_code}]..." if engine_clean == "gemini" else f"Đang xếp hàng đợi Worker khả dụng [Mã: {req_code}]...",
            "logs": [f"[{time.strftime('%H:%M:%S')}] Tác vụ ({job_type}) [Mã: {req_code}] [Engine: {engine_clean.upper()}] đã được đưa vào hệ thống."],
            "result_image_url": None,
            "filename": None,
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "started_at": None,
            "completed_at": None,
            "duration_seconds": None,
            "new_chat": bool(new_chat),
            # Ghi nhận danh tính hệ thống gọi và Public IP thực tế
            "client_ip": caller_info.get("client_ip") or "127.0.0.1",
            "caller_system": caller_info.get("caller_system") or "Hệ thống Web Bên Ngoài",
            "caller_type": caller_info.get("caller_type") or "external_api",
            "caller_origin": caller_info.get("origin"),
            "caller_referer": caller_info.get("referer"),
            "caller_user_agent": caller_info.get("user_agent")
        }

        with self.lock:
            self.jobs.insert(0, job)

        print(f"\n[+] Tác vụ mới vào Hàng đợi: [{job_type}] [Mã: {req_code}] \"{formatted_prompt[:60]}...\" (ID: {job_id})")
        return job

    def get_job(self, job_id):
        with self.lock:
            for j in self.jobs:
                if j["id"] == job_id or j.get("request_code") == job_id:
                    return dict(j)
        return None

    def cancel_job(self, job_id):
        with self.lock:
            for j in self.jobs:
                if j["id"] == job_id or j.get("request_code") == job_id:
                    if j["status"] in ("queued", "assigned"):
                        j["status"] = "failed"
                        j["current_step"] = "Đã hủy bởi người dùng"
                        j["logs"].append(f"[{time.strftime('%H:%M:%S')}] Tác vụ đã bị hủy.")
                        return True
        return False

    def clear_completed_jobs(self):
        with self.lock:
            self.jobs = [j for j in self.jobs if j["status"] in ("queued", "assigned", "processing")]
            return True

    # --- Dispatcher Algorithm (Chọn Worker thông minh & Cân bằng tải) ---
    def dispatch_next_job_for_worker(self, worker_id):
        """
        Được gọi khi một Worker gửi poll lên server.
        Hệ thống kiểm tra:
        1. Worker có cần New Chat không? (Nếu số ảnh vượt hạn mức -> gửi lệnh new_chat)
        2. Nếu Worker rảnh -> Chọn 1 job phù hợp trong hàng đợi:
           - Chống lẫn lộn: Nếu job yêu cầu Unified Bridge (Mã UB4-), loại bỏ các worker cũ!
           - Ưu tiên job chỉ định đích danh worker_id này hoặc target_pc.
           - Sau đó chọn job đang 'queued' lâu nhất (FIFO).
        """
        with self.lock:
            if worker_id not in self.workers:
                self.workers[worker_id] = WorkerNode(worker_id)
            w = self.workers[worker_id]
            w.last_heartbeat = time.time()

            # 0. Nếu Worker bị Admin tạm dừng (is_enabled == False), tuyệt đối không giao việc
            if not getattr(w, "is_enabled", True):
                return None

            active = [j for j in self.jobs if j["status"] in ("assigned", "processing")]
            if any(j.get("assigned_worker_id") == worker_id for j in active):
                return None
            account = (w.account_email or "").strip().lower()
            agent = w.tab_info.get("agent_id")
            for running in active:
                other = self.workers.get(running.get("assigned_worker_id"))
                if not other:
                    continue
                if account and account == (other.account_email or "").strip().lower():
                    return None
                if not account and agent and agent == other.tab_info.get("agent_id"):
                    return None

            # 1. Kiểm tra lệnh tạo hội thoại mới (New Chat Lifecycle)
            if w.pending_new_chat or (w.auto_new_chat_limit > 0 and w.consecutive_images_count >= w.auto_new_chat_limit):
                w.pending_new_chat = False
                w.consecutive_images_count = 0
                print(f"[*] Dispatching NEW_CHAT cho Worker {worker_id} (Đã đạt mốc {w.auto_new_chat_limit} ảnh hoặc có yêu cầu).")
                return {
                    "action": "new_chat",
                    "id": f"action_newchat_{int(time.time()*1000)}",
                    "reason": "Reaching conversation image limit or manual request"
                }

            # 2. Nếu worker đang bận một job chưa xong, không giao thêm
            if w.status == "busy" and w.current_job_id:
                # Kiểm tra job đó còn sống không
                active_job = next((j for j in self.jobs if j["id"] == w.current_job_id and j["status"] in ("assigned", "processing")), None)
                if active_job:
                    return None

            # 3. Tìm job đang chờ trong hàng đợi
            candidate_job = None
            w_pc = (getattr(w, "pc_name", "") or "").strip().lower()
            w_name = (getattr(w, "name", "") or "").strip().lower()
            wid = (worker_id or "").strip().lower()

            def is_real_target(val):
                if not val:
                    return False
                s = str(val).strip().lower()
                return s not in ("", "none", "null", "undefined", "all", "auto", "any", "tất cả", "toàn bộ", "false")

            # 3a. Tìm job chỉ định riêng cho worker này hoặc target_pc
            for j in reversed(self.jobs):  # FIFO: job vào trước ở cuối mảng nếu insert(0)
                if j["status"] == "queued" and j.get("engine", "chatgpt") == "chatgpt":
                    t_w = (j.get("target_worker_id") or "").strip().lower() if is_real_target(j.get("target_worker_id")) else None
                    t_pc = (j.get("target_pc") or "").strip().lower() if is_real_target(j.get("target_pc")) else None

                    if t_w or t_pc:
                        targets = [t for t in (t_w, t_pc) if t]
                        if getattr(w, "receive_mode", "shared") == "targeted":
                            # Private routing requires an exact tab/worker target; PC aliases do not qualify.
                            matches = bool(t_w) and t_w in (wid, str(w.tab_info.get("tab_id") or "").strip().lower())
                        else:
                            matches = any(t in (wid, w_pc, w_name) for t in targets)
                        if matches:
                            candidate_job = j
                            break

            # 3b. Nếu không có job chỉ định riêng, tìm job chung (không chỉ định worker nào)
            # Khôi phục hoàn toàn 100% logic code cũ:
            # Bất kỳ worker nào đang rảnh (cũ hay mới, unified hay legacy) đều nhận việc ngay lập tức theo thứ tự FIFO,
            # tuyệt đối không kiểm tra cờ only_unified, is_unified hay bridge_type.
            if not candidate_job and getattr(w, "receive_mode", "shared") != "targeted":
                for j in reversed(self.jobs):
                    if j["status"] == "queued" and j.get("engine", "chatgpt") == "chatgpt":
                        has_tw = is_real_target(j.get("target_worker_id"))
                        has_tpc = is_real_target(j.get("target_pc"))

                        # Không chỉ định worker -> Giao việc ngay như code cũ, không bất kỳ ràng buộc nào
                        if not has_tw and not has_tpc:
                            candidate_job = j
                            break

            if candidate_job:
                capabilities = w.tab_info.get("capabilities", {})
                required = "image" if candidate_job.get("expected_output") == "image" else ("ruby" if candidate_job.get("type") == "ruby_3d" else "vision")
                if capabilities.get(required) is False:
                    return None
                if w.tab_info.get("tab_id"):
                    candidate_job["attempt_id"] = secrets.token_hex(12)
                    candidate_job["lease_token"] = secrets.token_urlsafe(24)
                candidate_job["assigned_tab_id"] = w.tab_info.get("tab_id")
                candidate_job["assigned_agent_id"] = w.tab_info.get("agent_id")
                candidate_job["status"] = "assigned"
                candidate_job["assigned_worker_id"] = worker_id
                candidate_job["started_at"] = time.time()
                candidate_job["progress"] = 25
                candidate_job["current_step"] = f"Đã phân bổ cho Worker {w.name} ({w.account_label}) [Mã: {candidate_job.get('request_code', candidate_job['id'])}]. Đang nạp vào ChatGPT..."
                candidate_job["logs"].append(f"[{time.strftime('%H:%M:%S')}] Phân bổ cho Worker: {worker_id} [Mã: {candidate_job.get('request_code', candidate_job['id'])}]")

                w.status = "busy"
                w.current_job_id = candidate_job["id"]
                w.current_request_code = candidate_job.get("request_code")
                print(f"[>] Đã gán job {candidate_job['id']} [Mã: {candidate_job.get('request_code')}] cho worker {worker_id}")
                return candidate_job

            return None

    # --- Heartbeat & Cập nhật tiến độ của Job (Hỗ trợ Preview ảnh tức thì) ---
    def update_job_progress(self, worker_id, task_id, step=None, progress=None, log_entry=None, preview_url=None, preview_base64=None):
        with self.lock:
            if worker_id in self.workers:
                self.workers[worker_id].last_heartbeat = time.time()

            target_job = next((j for j in self.jobs if j["id"] == task_id), None)
            if target_job:
                if target_job["status"] == "assigned":
                    target_job["status"] = "processing"
                if step:
                    target_job["current_step"] = step
                if progress is not None:
                    target_job["progress"] = progress
                if preview_base64 or preview_url:
                    target_job["preview_image_url"] = preview_base64 or preview_url
                    target_job["has_preview"] = True
                if log_entry:
                    if target_job["logs"] and any(kw in log_entry for kw in ("đang vẽ ảnh", "đợi ảnh", "ChatGPT đang xử lý")):
                        if any(kw in target_job["logs"][-1] for kw in ("đang vẽ ảnh", "đợi ảnh", "ChatGPT đang xử lý")):
                            target_job["logs"][-1] = log_entry
                        else:
                            target_job["logs"].append(log_entry)
                    elif not target_job["logs"] or target_job["logs"][-1] != log_entry:
                        target_job["logs"].append(log_entry)
                        print(f"[{task_id} @ {worker_id}] {log_entry}")
                return True
        return False

    def set_job_preview(self, worker_id, task_id, preview_url=None, preview_base64=None, base_url="https://admake.vn/genai"):
        with self.lock:
            if worker_id in self.workers:
                self.workers[worker_id].last_heartbeat = time.time()

            target_job = next((j for j in self.jobs if j["id"] == task_id), None)
            if not target_job:
                return False

            if preview_base64:
                try:
                    preview_filename = f"preview_{task_id}.png"
                    dest_path = IMAGES_DIR / preview_filename
                    data = preview_base64.split(",", 1)[1] if "," in preview_base64 else preview_base64
                    with open(dest_path, "wb") as f:
                        f.write(base64.b64decode(data))
                    target_job["preview_image_url"] = f"{base_url}/images/{preview_filename}"
                    target_job["has_preview"] = True
                    print(f"[⚡ PREVIEW] Đã lưu file preview trực tiếp vào đĩa VPS: {dest_path}")
                except Exception as e:
                    print(f"[!] Lỗi ghi preview Base64: {e}")
            elif preview_url and preview_url.startswith("http"):
                target_job["preview_image_url"] = preview_url
                target_job["has_preview"] = True

            target_job["current_step"] = "⚡ Đã có ảnh xem trước (Preview)! Đang lưu bản gốc HD lên VPS..."
            target_job["progress"] = max(target_job.get("progress", 0), 92)
            msg = f"[{time.strftime('%H:%M:%S')}] Đã nhận ảnh Preview xem trước tức thì từ Worker {worker_id}!"
            target_job["logs"].append(msg)
            print(f"[⚡ PREVIEW] {task_id} @ {worker_id}: ĐÃ NHẬN ẢNH XEM TRƯỚC TỨC THÌ!")
            return True

    # --- Hoàn tất Job và Lưu ảnh trực tiếp lên VPS ---
    def complete_job(self, worker_id, task_id, image_url=None, image_base64=None, error=None, base_url="https://admake.vn/genai", text=None, code_blocks=None, response_type=None, ruby_code=None, html=None, char_count=None):
        with self.lock:
            w = self.workers.get(worker_id)
            if w:
                w.last_heartbeat = time.time()
                w.status = "idle"
                w.current_job_id = None

            target_job = next((j for j in self.jobs if j["id"] == task_id), None)
            if not target_job:
                return False

            if error:
                target_job["status"] = "failed"
                target_job["progress"] = 100
                target_job["current_step"] = f"Lỗi: {error}"
                target_job["logs"].append(f"[{time.strftime('%H:%M:%S')}] LỖI TẠI WORKER {worker_id}: {error}")
                print(f"[!] {task_id} THẤT BẠI: {error}")
                return True

            # Phân biệt chính xác giữa Tác vụ Text/Code (Vision Chat / Ruby 3D) và Tác vụ Sinh Ảnh (create, edit_full, edit_inpaint)
            job_type = target_job.get("type") or target_job.get("job_type") or "create"
            is_text_job = (
                response_type == "text_code"
                or (job_type in ("chat_code", "ruby_3d") and not image_url and not image_base64)
                or (bool(text) and not image_url and not image_base64 and job_type not in ("create", "edit_full", "edit_inpaint"))
                or (bool(ruby_code) and not image_url and not image_base64 and job_type not in ("create", "edit_full", "edit_inpaint"))
            )

            if is_text_job:
                started_at = target_job.get("started_at") or time.time()
                duration = round(time.time() - started_at, 1)
                in_tok = out_tok = tot_tok = 0
                cost_usd = cost_vnd = 0

                target_job["status"] = "completed"
                target_job["progress"] = 100
                target_job["response_type"] = "text_code"
                target_job["result_text"] = text or ""
                target_job["text"] = text or ""
                target_job["result_code_blocks"] = code_blocks or []
                target_job["ruby_code"] = ruby_code or ""
                if html:
                    target_job["html"] = html
                if char_count:
                    target_job["char_count"] = char_count
                target_job["completed_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
                target_job["duration_seconds"] = duration
                target_job["usage"] = {
                    "prompt_tokens": in_tok,
                    "completion_tokens": out_tok,
                    "total_tokens": tot_tok,
                    "cost_usd": cost_usd,
                    "cost_vnd": cost_vnd
                }
                target_job["total_tokens"] = tot_tok
                target_job["cost_usd"] = cost_usd
                target_job["cost_vnd"] = cost_vnd
                target_job["current_step"] = f"Hoàn tất! ({duration}s • 0 tokens)"
                target_job["logs"].append(f"[{time.strftime('%H:%M:%S')}] Đã nhận kết quả text/code từ Worker {worker_id} ({duration}s).")

                if w:
                    w.total_completed += 1
                print(f"[✓] Worker {worker_id} hoàn tất tác vụ text & code {task_id} ({len(code_blocks or [])} code blocks)")
                return True

            timestamp = int(time.time())
            prompt_slug = slugify_prompt(target_job.get("prompt", ""))
            filename = f"{prompt_slug}_{timestamp}.png" if prompt_slug else f"render_{timestamp}.png"
            dest_path = IMAGES_DIR / filename

            saved = False
            # 1. Lưu từ Base64 do Extension trích xuất từ Canvas/Fetch (Siêu nhanh 2ms!)
            if image_base64:
                try:
                    data = image_base64.split(",", 1)[1] if "," in image_base64 else image_base64
                    with open(dest_path, "wb") as f:
                        f.write(base64.b64decode(data))
                    if dest_path.exists() and dest_path.stat().st_size > 0:
                        saved = True
                        print(f"[+] Đã lưu trực tiếp file vào đĩa VPS: {dest_path} (Từ Base64, size: {dest_path.stat().st_size} bytes)")
                except Exception as e:
                    print(f"[!] Lỗi ghi file Base64 trên VPS: {e}")

            # 2. Hoặc tải từ URL nếu có
            if not saved and image_url and image_url.startswith("http"):
                try:
                    import urllib.request
                    req = urllib.request.Request(
                        image_url,
                        headers={
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
                            "Referer": "https://chatgpt.com/"
                        }
                    )
                    with urllib.request.urlopen(req, timeout=30) as resp, open(dest_path, "wb") as f:
                        f.write(resp.read())
                    if dest_path.exists() and dest_path.stat().st_size > 0:
                        saved = True
                        print(f"[+] Đã tải URL và lưu trực tiếp vào VPS: {dest_path}")
                except Exception as e:
                    print(f"[!] Lỗi tải ảnh từ URL: {e}")

            # 3. Cứu hộ tự động (Fallback): Nếu chưa có file nhưng trên đĩa VPS đã có file preview tức thì
            if not saved:
                preview_candidate = IMAGES_DIR / f"preview_{task_id}.png"
                if preview_candidate.exists() and preview_candidate.stat().st_size > 0:
                    try:
                        import shutil
                        shutil.copy2(preview_candidate, dest_path)
                        if dest_path.exists() and dest_path.stat().st_size > 0:
                            saved = True
                            print(f"[+] Cứu hộ thành công: Đã chuyển file preview tức thì thành ảnh hoàn tất: {dest_path}")
                    except Exception as e:
                        print(f"[!] Lỗi sao chép cứu hộ preview: {e}")

            started_at = target_job.get("started_at") or time.time()
            duration = round(time.time() - started_at, 1)

            in_tok = out_tok = tot_tok = 0
            cost_usd = cost_vnd = 0

            target_job["status"] = "completed"
            target_job["progress"] = 100
            target_job["filename"] = filename if saved else None
            if saved:
                target_job["result_image_url"] = f"{base_url}/images/{filename}"
            elif target_job.get("preview_image_url") and target_job["preview_image_url"].startswith("http"):
                target_job["result_image_url"] = target_job["preview_image_url"]
            elif image_url and image_url.startswith("http"):
                target_job["result_image_url"] = image_url
            else:
                target_job["result_image_url"] = None
            target_job["completed_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
            target_job["duration_seconds"] = duration
            target_job["usage"] = {
                "prompt_tokens": in_tok,
                "completion_tokens": out_tok,
                "total_tokens": tot_tok,
                "cost_usd": cost_usd,
                "cost_vnd": cost_vnd
            }
            target_job["total_tokens"] = tot_tok
            target_job["cost_usd"] = cost_usd
            target_job["cost_vnd"] = cost_vnd
            target_job["current_step"] = f"Hoàn tất tạo ảnh trong {duration}s • 0 tokens"
            target_job["logs"].append(f"[{time.strftime('%H:%M:%S')}] Ảnh đã lưu trực tiếp vào VPS ({duration}s).")


            if w:
                w.total_completed += 1
                w.consecutive_images_count += 1
                print(f"[✓] Worker {worker_id} đã hoàn thành ảnh thứ {w.consecutive_images_count}/{w.auto_new_chat_limit} trong phiên.")

            # Lưu vào Metadata Gallery
            if saved:
                try:
                    ensure_thumbnail(dest_path)
                except Exception:
                    pass

                save_metadata_entry({
                    "id": target_job["id"],
                    "filename": filename,
                    "prompt": target_job.get("prompt", ""),
                    "style": target_job.get("style", "None"),
                    "aspect_ratio": target_job.get("aspect_ratio", "16:9"),
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "vps_url": f"{base_url}/images/{filename}",
                    "worker_id": worker_id,
                    "engine": target_job.get("engine", "chatgpt"),
                    "durationSeconds": duration,
                    "total_tokens": tot_tok,
                    "cost_usd": cost_usd,
                    "cost_vnd": cost_vnd,
                    "client_ip": target_job.get("client_ip") or "127.0.0.1",
                    "caller_system": target_job.get("caller_system") or "Hệ thống Web Bên Ngoài",
                    "caller_type": target_job.get("caller_type") or "external_api",
                    "caller_origin": target_job.get("caller_origin"),
                    "caller_referer": target_job.get("caller_referer"),
                    "caller_user_agent": target_job.get("caller_user_agent"),
                    "reference_image_url": target_job.get("reference_image_url")
                })
                # Dọn dẹp file preview tạm thời sau khi đã có bản gốc HD lưu vào VPS
                try:
                    p_file = IMAGES_DIR / f"preview_{task_id}.png"
                    if p_file.exists():
                        p_file.unlink()
                except Exception:
                    pass

            print(f"[✓] Tác vụ {task_id} HOÀN TẤT: {base_url}/images/{filename}")
            return True

    # --- Chống sập & Tự phục hồi: Health Check Loop ---
    def auto_recover_stalled_jobs(self):
        """
        Chạy ngầm mỗi 10 giây:
        - Kiểm tra các Worker offline: nếu worker offline mà đang giữ job -> thu hồi job và re-queue.
        - Kiểm tra các Job đang processing quá JOB_TIMEOUT_SECONDS -> thu hồi và re-queue.
        """
        with self.lock:
            now = time.time()
            # 1. Đánh dấu worker offline
            for w in self.workers.values():
                if not w.is_online() and w.status != "offline":
                    w.status = "offline"
                    print(f"[!] Worker {w.worker_id} đã offline (Quá {WORKER_OFFLINE_TIMEOUT}s không có heartbeat).")

            # 2. Quét các job bị treo
            for j in self.jobs:
                if j["status"] in ("assigned", "processing") and j.get("engine", "chatgpt") == "chatgpt":
                    assigned_worker = self.workers.get(j.get("assigned_worker_id"))
                    worker_dead = not assigned_worker or not assigned_worker.is_online()
                    
                    started_at = j.get("started_at") or now
                    job_timeout = (now - started_at) > JOB_TIMEOUT_SECONDS

                    if worker_dead or job_timeout:
                        reason = "Worker mất kết nối" if worker_dead else f"Xử lý quá {JOB_TIMEOUT_SECONDS}s"
                        print(f"[!] CẢNH BÁO: Tác vụ {j['id']} bị kẹt do {reason}. Đang tự động giải phóng và xếp lại vào đầu hàng đợi!")
                        
                        j["status"] = "queued"
                        j["assigned_worker_id"] = None
                        j["progress"] = 10
                        j["current_step"] = f"Tác vụ được xếp hàng lại do {reason}..."
                        j["logs"].append(f"[{time.strftime('%H:%M:%S')}] Tự động phục hồi: giải phóng khỏi worker cũ và re-queued.")

                        if assigned_worker:
                            assigned_worker.status = "idle"
                            assigned_worker.current_job_id = None

orchestrator = Orchestrator()
# One-time deployment handoff preserves queued work and history across this restart.
_deploy_restore = DATA_DIR / "deploy_jobs_restore.json"
if _deploy_restore.exists():
    with _deploy_restore.open("r", encoding="utf-8") as _f:
        _saved_jobs = json.load(_f)
    if not isinstance(_saved_jobs, list) or any(j.get("status") in ("assigned", "processing") for j in _saved_jobs):
        raise RuntimeError("Unsafe deployment job snapshot")
    orchestrator.jobs = _saved_jobs
    os.replace(_deploy_restore, DATA_DIR / "deploy_jobs_restored.json")

def background_health_checker():
    while True:
        try:
            time.sleep(10)
            orchestrator.auto_recover_stalled_jobs()
        except Exception as e:
            print(f"[!] Lỗi trong health checker: {e}")

threading.Thread(target=background_health_checker, daemon=True).start()

# ==============================================================================
# REST API ENDPOINTS
# ==============================================================================

@app.route("/api/status", methods=["GET"])
def get_system_status():
    workers = orchestrator.get_all_workers()
    online_count = sum(1 for w in workers if w["is_online"])
    return jsonify({
        "status": "online",
        "service": "ChatGPT Distributed Image Generation Bridge",
        "version": "5.0.0",
        "storage_path": str(IMAGES_DIR.resolve()),
        "total_workers": len(workers),
        "online_workers": online_count,
        "queue_length": sum(1 for j in orchestrator.jobs if j["status"] == "queued"),
        "active_jobs": sum(1 for j in orchestrator.jobs if j["status"] in ("assigned", "processing"))
    })


# ==============================================================================
# BỘ XỬ LÝ GOOGLE GEMINI CLOUD API (KEY AI STUDIO)
# ==============================================================================

def get_gemini_key():
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    if gemini_key:
        return gemini_key
    vps_paths = [
        Path("/opt/admake-genai/bridge/vps_go.md"),
        Path("D:/vps_go.md"),
        Path("./vps_go.md"),
        Path("/root/vps_go.md")
    ]
    for p in vps_paths:
        if p.exists():
            try:
                with open(p, "r", encoding="utf-8") as f:
                    lines = [l.strip() for l in f.readlines()]
                    for i, l in enumerate(lines):
                        if l == "[GeminiKey]" and i + 1 < len(lines):
                            k = lines[i + 1].strip()
                            if k and not k.startswith("["):
                                return k
            except Exception:
                pass
    return ""

def process_gemini_job(job_id: str):
    """Xử lý tác vụ tạo ảnh / chỉnh sửa ảnh trực tiếp qua Google Gemini Cloud API"""
    target_job = None
    with orchestrator.lock:
        for j in orchestrator.jobs:
            if j["id"] == job_id or j.get("request_code") == job_id:
                target_job = j
                break
    if not target_job:
        return

    start_t = time.time()
    with orchestrator.lock:
        target_job["status"] = "processing"
        target_job["progress"] = 15
        target_job["started_at"] = start_t
        target_job["current_step"] = "Đang kết nối Google Gemini API (Key AI Studio)..."
        target_job["logs"].append(f"[{time.strftime('%H:%M:%S')}] Khởi chạy tạo ảnh Cloud với Google Gemini API...")

    gemini_key = target_job.get("api_key") or get_gemini_key()
    prompt = target_job.get("prompt", "").strip()
    style = target_job.get("style", "None")
    aspect_ratio = target_job.get("aspect_ratio", "16:9")
    job_type = target_job.get("type", "create")
    reference_images = target_job.get("reference_images", [])
    model_override = target_job.get("model")

    # Xây dựng các parts cho Gemini
    parts = []

    # 1. Nếu có ảnh tham chiếu (edit_full, edit_inpaint)
    if reference_images:
        for r in reference_images:
            b64_str = None
            if isinstance(r, dict) and "data" in r:
                data_val = r["data"]
                b64_str = data_val.split(",", 1)[1] if "," in data_val else data_val
            elif isinstance(r, str):
                if r.startswith("data:image/"):
                    b64_str = r.split(",", 1)[1]
                elif r.startswith("http://") or r.startswith("https://"):
                    try:
                        resp_img = requests.get(r, timeout=15)
                        if resp_img.status_code == 200:
                            b64_str = base64.b64encode(resp_img.content).decode("utf-8")
                    except Exception as e:
                        print(f"[!] Lỗi tải ảnh tham chiếu từ URL cho Gemini: {e}")
                else:
                    local_p = IMAGES_DIR / r.lstrip("/").replace("images/", "")
                    if local_p.exists():
                        try:
                            with open(local_p, "rb") as lf:
                                b64_str = base64.b64encode(lf.read()).decode("utf-8")
                        except Exception:
                            pass
            if b64_str:
                parts.append({
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": b64_str
                    }
                })

    # 2. Xây dựng prompt kèm thông số style và tỉ lệ khung hình
    full_prompt_text = prompt
    if style and style not in ("None", "none", ""):
        full_prompt_text += f", style: {style}"
    if aspect_ratio and aspect_ratio not in ("None", "none", ""):
        full_prompt_text += f" -- Aspect ratio: {aspect_ratio}"

    parts.append({"text": full_prompt_text})

    # Danh sách models tạo ảnh ưu tiên của Gemini
    gemini_models = [
        "gemini-2.5-flash-image",
        "gemini-3.1-flash-image",
        "gemini-3-pro-image",
        "gemini-3.1-flash-lite-image"
    ]
    if model_override and model_override in gemini_models:
        gemini_models.remove(model_override)
        gemini_models.insert(0, model_override)

    last_error = None
    image_saved = False
    filename = None
    used_model = None
    gemini_usage_meta = {}

    for model_name in gemini_models:
        with orchestrator.lock:
            target_job["progress"] = 35
            target_job["current_step"] = f"Đang gửi yêu cầu tới mô hình Google {model_name}..."
            target_job["logs"].append(f"[{time.strftime('%H:%M:%S')}] Gọi Google Gemini API model: {model_name}")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_key}"
        payload = {
            "contents": [{"parts": parts}],
            "generationConfig": {
                "responseModalities": ["IMAGE"]
            }
        }

        try:
            resp = requests.post(url, json=payload, timeout=60)
            if resp.status_code == 200:
                data = resp.json()
                gemini_usage_meta = data.get("usageMetadata", {})
                candidates = data.get("candidates", [])
                if candidates:
                    resp_parts = candidates[0].get("content", {}).get("parts", [])
                    img_data_b64 = None
                    text_resp = None
                    for p in resp_parts:
                        if "inlineData" in p:
                            img_data_b64 = p["inlineData"].get("data")
                        elif "text" in p:
                            text_resp = p.get("text")

                    if img_data_b64:
                        raw_bytes = base64.b64decode(img_data_b64)
                        timestamp = int(time.time())
                        prompt_slug = slugify_prompt(prompt)
                        filename = f"{prompt_slug}_{timestamp}.png" if prompt_slug else f"gemini_{timestamp}.png"
                        dest_path = IMAGES_DIR / filename
                        with open(dest_path, "wb") as f:
                            f.write(raw_bytes)

                        if dest_path.exists() and dest_path.stat().st_size > 0:
                            image_saved = True
                            used_model = model_name
                            break
                    elif text_resp and job_type in ("chat_code", "ruby_3d"):
                        with orchestrator.lock:
                            duration = round(time.time() - start_t, 1)
                            USD_TO_VND = 25450
                            in_tok = gemini_usage_meta.get("promptTokenCount", max(1, len(prompt) // 4))
                            out_tok = gemini_usage_meta.get("candidatesTokenCount", max(1, len(text_resp) // 4))
                            tot_tok = gemini_usage_meta.get("totalTokenCount", in_tok + out_tok)
                            if tot_tok == 0:
                                tot_tok = in_tok + out_tok
                            cost_usd = round((in_tok * 0.075 + out_tok * 0.30) / 1_000_000, 6)
                            cost_vnd = max(1, round(cost_usd * USD_TO_VND))

                            target_job["status"] = "completed"
                            target_job["progress"] = 100
                            target_job["response_type"] = "text_code"
                            target_job["result_text"] = text_resp
                            target_job["text"] = text_resp
                            target_job["completed_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
                            target_job["duration_seconds"] = duration
                            target_job["usage"] = {
                                "prompt_tokens": in_tok,
                                "completion_tokens": out_tok,
                                "total_tokens": tot_tok,
                                "cost_usd": cost_usd,
                                "cost_vnd": cost_vnd
                            }
                            target_job["total_tokens"] = tot_tok
                            target_job["cost_usd"] = cost_usd
                            target_job["cost_vnd"] = cost_vnd
                            target_job["current_step"] = f"Hoàn tất phản hồi từ Gemini ({duration}s • {tot_tok:,} tokens • ${cost_usd:.4f} USD • ~{cost_vnd:,.0f} VNĐ)!"
                            target_job["logs"].append(f"[{time.strftime('%H:%M:%S')}] Gemini ({model_name}) đã hoàn tất.")
                            target_job["logs"].append(f"[{time.strftime('%H:%M:%S')}] 💰 Thống kê chi phí: {tot_tok:,} tokens • ${cost_usd:.4f} USD (~{cost_vnd:,.0f} VNĐ)")
                        return
            else:
                err_text = resp.text[:250]
                last_error = f"[Gemini {resp.status_code}] {err_text}"
                print(f"[!] Gemini {model_name} trả về lỗi HTTP {resp.status_code}: {err_text}")
        except Exception as ex:
            last_error = str(ex)
            print(f"[!] Ngoại lệ khi gọi Gemini {model_name}: {ex}")

    duration = round(time.time() - start_t, 1)
    base_url = "https://admake.vn/genai" if sys.platform != "win32" else "http://localhost:5000"

    with orchestrator.lock:
        if image_saved and filename:
            USD_TO_VND = 25450
            in_tok = gemini_usage_meta.get("promptTokenCount", max(1, len(prompt) // 4))
            out_tok = gemini_usage_meta.get("candidatesTokenCount", 1200)
            tot_tok = gemini_usage_meta.get("totalTokenCount", in_tok + out_tok)
            if tot_tok == 0:
                tot_tok = in_tok + 1200
            cost_usd = 0.030 # Google AI Studio Imagen 3 / Gemini Image tiêu chuẩn ($0.030/ảnh)
            cost_vnd = round(cost_usd * USD_TO_VND) # ~764 VNĐ

            target_job["status"] = "completed"
            target_job["progress"] = 100
            target_job["filename"] = filename
            target_job["result_image_url"] = f"{base_url}/images/{filename}"
            target_job["completed_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
            target_job["duration_seconds"] = duration
            target_job["usage"] = {
                "prompt_tokens": in_tok,
                "completion_tokens": out_tok,
                "total_tokens": tot_tok,
                "cost_usd": cost_usd,
                "cost_vnd": cost_vnd
            }
            target_job["total_tokens"] = tot_tok
            target_job["cost_usd"] = cost_usd
            target_job["cost_vnd"] = cost_vnd
            target_job["current_step"] = f"Hoàn tất tạo ảnh với Gemini ({used_model}) trong {duration}s • {tot_tok:,} tokens (${cost_usd:.3f} USD • ~{cost_vnd:,.0f} VNĐ)!"
            target_job["logs"].append(f"[{time.strftime('%H:%M:%S')}] Ảnh đã tạo thành công bằng Gemini ({used_model}) và lưu vào VPS ({duration}s).")
            target_job["logs"].append(f"[{time.strftime('%H:%M:%S')}] 💰 Thống kê chi phí: {tot_tok:,} tokens • ${cost_usd:.3f} USD (~{cost_vnd:,.0f} VNĐ)")

            try:
                ensure_thumbnail(IMAGES_DIR / filename)
            except Exception:
                pass

            save_metadata_entry({
                "id": target_job["id"],
                "filename": filename,
                "prompt": target_job.get("prompt", ""),
                "style": target_job.get("style", "None"),
                "aspect_ratio": target_job.get("aspect_ratio", "16:9"),
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "vps_url": f"{base_url}/images/{filename}",
                "worker_id": f"gemini_cloud_{used_model}",
                "engine": "gemini",
                "durationSeconds": duration,
                "total_tokens": tot_tok,
                "cost_usd": cost_usd,
                "cost_vnd": cost_vnd,
                "client_ip": target_job.get("client_ip") or "127.0.0.1",
                "caller_system": target_job.get("caller_system") or "Hệ thống Web Bên Ngoài",
                "caller_type": target_job.get("caller_type") or "external_api",
                "caller_origin": target_job.get("caller_origin"),
                "caller_referer": target_job.get("caller_referer"),
                "caller_user_agent": target_job.get("caller_user_agent"),
                "reference_image_url": target_job.get("reference_image_url")
            })
            print(f"[✓] Tác vụ Gemini {job_id} HOÀN TẤT trong {duration}s: {base_url}/images/{filename}")
        else:
            target_job["status"] = "failed"
            target_job["error"] = last_error or "Không thể tạo ảnh từ Google Gemini API."
            target_job["current_step"] = f"Lỗi tạo ảnh Gemini: {target_job['error']}"
            target_job["logs"].append(f"[{time.strftime('%H:%M:%S')}] Thất bại: {target_job['error']}")
            print(f"[!] Tác vụ Gemini {job_id} THẤT BẠI: {target_job['error']}")


# 1.0 API Tạo tác vụ Chat & Bóc Tách Code chuyên biệt
@app.route("/api/chat/create", methods=["POST"])
def api_chat_create():
    data = request.get_json(force=True) or {}
    prompt = data.get("prompt", "").strip()
    reference_images = data.get("reference_images") or data.get("images") or []
    target_worker_id = data.get("target_tab_id") or data.get("worker_id")
    target_pc = data.get("target_pc") or data.get("pc_name") or target_worker_id
    new_chat = data.get("new_chat", False)
    job_type = data.get("job_type", "chat_code")
    style = data.get("style", "None")
    engine = str(data.get("engine") or "chatgpt").strip().lower()
    if engine not in ("gemini", "chatgpt"):
        engine = "chatgpt"
    model = data.get("model") or data.get("model_id")
    api_key = data.get("api_key") or request.headers.get("X-Gemini-Key")

    caller_info = extract_caller_info(request, data)

    job = orchestrator.create_job(
        job_type=job_type,
        prompt=prompt,
        style=style,
        aspect_ratio="None",
        reference_images=reference_images,
        target_worker_id=target_worker_id,
        target_pc=target_pc,
        new_chat=new_chat,
        caller_info=caller_info,
        engine=engine,
        model=model,
        api_key=api_key
    )
    if engine == "gemini":
        threading.Thread(target=process_gemini_job, args=(job["id"],), daemon=True).start()

    return jsonify(job), 201

# 1. API Tạo ảnh mới hoặc Sửa ảnh (Tự động nhận diện reference_images)
@app.route("/api/jobs/create", methods=["POST"])
def api_job_create():
    data = request.get_json(force=True) or {}
    prompt = data.get("prompt", "").strip()
    # Hỗ trợ đính kèm chỉ dẫn từ PromptLib trung tâm nếu client yêu cầu
    prompt_lib_ids = data.get("prompt_lib_ids") or []
    if prompt_lib_ids and isinstance(prompt_lib_ids, list):
        try:
            lib_items = load_prompt_lib()
            matching_descs = [it["description"] for it in lib_items if it.get("id") in prompt_lib_ids and it.get("description")]
            if matching_descs:
                joined_lib = " | ".join(matching_descs)
                prompt = f"{prompt} | {joined_lib}" if prompt else joined_lib
        except Exception as _e:
            print(f"[!] Lỗi gắn PromptLib vào prompt: {_e}")

    reference_images = data.get("reference_images", [])
    if not prompt and not reference_images:
        return jsonify({"error": "Prompt or reference_images is required"}), 400

    engine = str(data.get("engine") or "chatgpt").strip().lower()
    if engine not in ("gemini", "chatgpt"):
        engine = "chatgpt"
    model = data.get("model") or data.get("model_id")
    api_key = data.get("api_key") or request.headers.get("X-Gemini-Key")

    style = data.get("style", "None")
    aspect_ratio = data.get("aspect_ratio", "16:9")
    target_worker_id = data.get("target_tab_id") or data.get("worker_id")
    target_pc = data.get("target_pc") or data.get("pc_name") or target_worker_id
    new_chat = data.get("new_chat", False)
    job_type = data.get("job_type")
    if not job_type:
        job_type = "edit_full" if reference_images and len(reference_images) > 0 else "create" 

    caller_info = extract_caller_info(request, data)

    job = orchestrator.create_job(
        job_type=job_type,
        prompt=prompt,
        style=style,
        aspect_ratio=aspect_ratio,
        reference_images=reference_images,
        target_worker_id=target_worker_id,
        target_pc=target_pc,
        new_chat=new_chat,
        caller_info=caller_info,
        engine=engine,
        model=model,
        api_key=api_key
    )

    if engine == "gemini":
        threading.Thread(target=process_gemini_job, args=(job["id"],), daemon=True).start()

    return jsonify(job), 201

# 1.1 API Tạo hàng loạt tác vụ (Batch Job Creation)
@app.route("/api/jobs/batch_create", methods=["POST"])
def api_jobs_batch_create():
    data = request.get_json(force=True) or {}
    items = data.get("jobs", [])
    if not items or not isinstance(items, list):
        return jsonify({"error": "List of jobs required in 'jobs' field"}), 400

    caller_info = extract_caller_info(request, data)
    created = []
    for item in items:
        p = item.get("prompt", "").strip()
        refs = item.get("reference_images", [])
        if not p and not refs:
            continue
        s = item.get("style", "None")
        ar = item.get("aspect_ratio", "16:9")
        tw = item.get("worker_id")
        nc = item.get("new_chat", False)
        eng = str(item.get("engine") or data.get("engine") or "chatgpt").strip().lower()
        if eng not in ("gemini", "chatgpt"):
            eng = "chatgpt"
        mod = item.get("model") or item.get("model_id") or data.get("model")
        jt = "edit_full" if refs and len(refs) > 0 else "create"

        job = orchestrator.create_job(
            job_type=jt,
            prompt=p,
            style=s,
            aspect_ratio=ar,
            reference_images=refs,
            target_worker_id=tw,
            new_chat=nc,
            caller_info=caller_info,
            engine=eng,
            model=mod
        )
        if eng == "gemini":
            threading.Thread(target=process_gemini_job, args=(job["id"],), daemon=True).start()
        created.append(job)

    print(f"[+] Đã tạo hàng loạt {len(created)} tác vụ mới vào hàng đợi (Từ {caller_info['caller_system']} - IP {caller_info['client_ip']}).")
    return jsonify({"count": len(created), "jobs": created}), 201

# 1.2 API Hủy toàn bộ tác vụ đang chờ trong hàng đợi (Clear Queue)
@app.route("/api/jobs/clear_queue", methods=["POST"])
def api_clear_queue():
    with orchestrator.lock:
        cleared = 0
        for j in orchestrator.jobs:
            if j["status"] == "queued":
                j["status"] = "failed"
                j["current_step"] = "Đã hủy bởi người dùng"
                cleared += 1
        print(f"[-] Đã hủy {cleared} tác vụ đang chờ trong hàng đợi.")
        return jsonify({"status": "ok", "cleared_count": cleared})

# 2. API Sửa toàn bộ ảnh
@app.route("/api/jobs/edit-full", methods=["POST"])
def api_job_edit_full():
    data = request.get_json(force=True) or {}
    prompt = data.get("prompt", "").strip()
    reference_images = data.get("reference_images", [])
    if not reference_images or len(reference_images) == 0:
        return jsonify({"error": "reference_images is required for editing"}), 400

    style = data.get("style", "None")
    aspect_ratio = data.get("aspect_ratio", "16:9")
    target_worker_id = data.get("target_tab_id") or data.get("worker_id")
    new_chat = data.get("new_chat", False)
    engine = str(data.get("engine") or "chatgpt").strip().lower()
    if engine not in ("gemini", "chatgpt"):
        engine = "chatgpt"
    model = data.get("model") or data.get("model_id")
    api_key = data.get("api_key") or request.headers.get("X-Gemini-Key")

    caller_info = extract_caller_info(request, data)

    job = orchestrator.create_job(
        job_type="edit_full",
        prompt=prompt,
        style=style,
        aspect_ratio=aspect_ratio,
        reference_images=reference_images,
        target_worker_id=target_worker_id,
        new_chat=new_chat,
        caller_info=caller_info,
        engine=engine,
        model=model,
        api_key=api_key
    )
    if engine == "gemini":
        threading.Thread(target=process_gemini_job, args=(job["id"],), daemon=True).start()

    return jsonify(job), 201

# 3. API Sửa 1 phần ảnh (Inpaint / Bình luận tọa độ)
@app.route("/api/jobs/edit-inpaint", methods=["POST"])
def api_job_edit_inpaint():
    data = request.get_json(force=True) or {}
    reference_images = data.get("reference_images", [])
    pins = data.get("pins", [])
    prompt = data.get("prompt", "").strip()
    preserve_surroundings = data.get("preserve_surroundings", True)

    if not reference_images or len(reference_images) == 0:
        return jsonify({"error": "reference_images is required for inpainting"}), 400
    if not pins and not prompt:
        return jsonify({"error": "Either pins or prompt must be provided"}), 400

    style = data.get("style", "None")
    aspect_ratio = data.get("aspect_ratio", "16:9")
    target_worker_id = data.get("target_tab_id") or data.get("worker_id")
    new_chat = data.get("new_chat", False)
    engine = str(data.get("engine") or "chatgpt").strip().lower()
    if engine not in ("gemini", "chatgpt"):
        engine = "chatgpt"
    model = data.get("model") or data.get("model_id")
    api_key = data.get("api_key") or request.headers.get("X-Gemini-Key")

    caller_info = extract_caller_info(request, data)

    job = orchestrator.create_job(
        job_type="edit_inpaint",
        prompt=prompt,
        style=style,
        aspect_ratio=aspect_ratio,
        reference_images=reference_images,
        pins=pins,
        preserve_surroundings=preserve_surroundings,
        target_worker_id=target_worker_id,
        new_chat=new_chat,
        caller_info=caller_info,
        engine=engine,
        model=model,
        api_key=api_key
    )
    if engine == "gemini":
        threading.Thread(target=process_gemini_job, args=(job["id"],), daemon=True).start()

    return jsonify(job), 201

# Tương thích ngược với endpoint cũ /api/jobs
@app.route("/api/jobs", methods=["GET", "POST"])
def api_jobs_legacy():
    if request.method == "POST":
        data = request.get_json(force=True) or {}
        prompt = data.get("prompt", "").strip()
        style = data.get("style", "None")
        aspect_ratio = data.get("aspect_ratio", "16:9")
        reference_images = data.get("reference_images", [])
        pins = data.get("pins", [])
        preserve_surroundings = data.get("preserve_surroundings", True)
        new_chat = data.get("new_chat", False)
        engine = str(data.get("engine") or "chatgpt").strip().lower()
        if engine not in ("gemini", "chatgpt"):
            engine = "chatgpt"
        model = data.get("model") or data.get("model_id")

        job_type = "create"
        if reference_images and len(reference_images) > 0:
            job_type = "edit_inpaint" if pins and len(pins) > 0 else "edit_full"

        caller_info = extract_caller_info(request, data)

        job = orchestrator.create_job(
            job_type=job_type,
            prompt=prompt,
            style=style,
            aspect_ratio=aspect_ratio,
            reference_images=reference_images,
            pins=pins,
            preserve_surroundings=preserve_surroundings,
            new_chat=new_chat,
            caller_info=caller_info,
            engine=engine,
            model=model
        )
        if engine == "gemini":
            threading.Thread(target=process_gemini_job, args=(job["id"],), daemon=True).start()

        return jsonify(job), 201
    else:
        with orchestrator.lock:
            return jsonify(orchestrator.jobs)

@app.route("/api/jobs/queue", methods=["GET"])
def api_get_queue():
    with orchestrator.lock:
        queue_jobs = []
        pos = 1
        for j in reversed(orchestrator.jobs):
            if j["status"] == "queued":
                item = dict(j)
                item["queue_position"] = pos
                queue_jobs.append(item)
                pos += 1
            elif j["status"] in ("assigned", "processing"):
                item = dict(j)
                item["queue_position"] = 0  # Đang chạy
                queue_jobs.insert(0, item)
        return jsonify(queue_jobs)

@app.route("/api/jobs/<job_id>", methods=["GET"])
def api_get_job(job_id):
    job = orchestrator.get_job(job_id)
    if job:
        return jsonify(job)
    return jsonify({"error": "Job not found"}), 404

@app.route("/api/jobs/<job_id>/cancel", methods=["POST"])
def api_cancel_job(job_id):
    success = orchestrator.cancel_job(job_id)
    return jsonify({"success": success})

@app.route("/api/jobs/clear", methods=["POST"])
def api_clear_jobs():
    orchestrator.clear_completed_jobs()
    return jsonify({"status": "cleared"})

# Quản lý Worker Nodes
@app.route("/api/workers", methods=["GET"])
def api_get_workers():
    return jsonify(orchestrator.get_all_workers())

@app.route("/api/workers/receive-mode", methods=["POST"])
def api_worker_receive_mode():
    data = request.get_json(silent=True) or {}
    worker_id = data.get("worker_id")
    mode = data.get("receive_mode")
    if not isinstance(worker_id, str) or not worker_id.strip() or mode not in ("shared", "targeted"):
        return jsonify({"error": "worker_id and receive_mode (shared|targeted) are required"}), 400
    worker_id = worker_id.strip()
    orchestrator.set_worker_receive_mode(worker_id, mode)
    return jsonify({"status": "ok", "worker_id": worker_id, "receive_mode": mode})

@app.route("/api/workers/toggle_active", methods=["POST"])
@app.route("/api/workers/<worker_id>/toggle_active", methods=["POST"])
def api_toggle_worker_active(worker_id=None):
    data = request.get_json(silent=True) or {}
    target_id = worker_id or data.get("worker_id")
    is_enabled = data.get("is_enabled")
    if not target_id:
        return jsonify({"error": "Missing worker_id"}), 400
    
    new_state = orchestrator.set_worker_enabled(target_id, is_enabled)
    return jsonify({"status": "ok", "worker_id": target_id, "is_enabled": new_state})

@app.route("/api/workers/<worker_id>", methods=["DELETE"])
@app.route("/api/workers/<worker_id>/delete", methods=["POST"])
def api_delete_worker(worker_id):
    success = orchestrator.remove_worker(worker_id)
    return jsonify({"status": "ok", "worker_id": worker_id, "deleted": success})

@app.route("/api/workers/cleanup_offline", methods=["POST"])
def api_cleanup_offline_workers():
    count = orchestrator.cleanup_offline_workers()
    return jsonify({"status": "ok", "cleaned_count": count})

def get_client_ip():
    xff = request.headers.get("X-Forwarded-For")
    if xff:
        return xff.split(",")[0].strip()
    x_real = request.headers.get("X-Real-IP")
    if x_real:
        return x_real.strip()
    return request.remote_addr

@app.route("/api/workers/<worker_id>/rename", methods=["POST"])
def api_rename_worker(worker_id):
    data = request.get_json(force=True, silent=True) or request.form or {}
    new_name = data.get("name", "").strip()
    if not new_name:
        return jsonify({"error": "Missing name"}), 400
    with orchestrator.lock:
        if worker_id in orchestrator.workers:
            orchestrator.workers[worker_id].name = new_name
        cfg = load_workers_config()
        if worker_id not in cfg:
            cfg[worker_id] = {}
        cfg[worker_id]["name"] = new_name
        save_workers_config(cfg)
        print(f"[*] Đổi tên Worker {worker_id} thành: '{new_name}'")
    return jsonify({"status": "ok", "worker_id": worker_id, "name": new_name})

@app.route("/api/worker/heartbeat", methods=["POST"])
def api_worker_heartbeat():
    data = request.get_json(force=True) or {}
    worker_id = data.get("worker_id", "default_worker")
    name = data.get("name")
    pc_name = data.get("pc_name")
    account_label = data.get("account_label")
    account_email = data.get("account_email")
    bridge_type = data.get("bridge_type")
    bridge_version = data.get("bridge_version")
    status = data.get("status")
    current_job_id = data.get("current_job_id")
    consecutive_images = data.get("consecutive_images")
    ip_address = get_client_ip()

    orchestrator.register_or_update_worker(
        worker_id=worker_id,
        name=name,
        pc_name=pc_name,
        account_label=account_label,
        status=status,
        current_job_id=current_job_id,
        consecutive_images=consecutive_images,
        ip_address=ip_address,
        account_email=account_email,
        bridge_type=bridge_type,
        bridge_version=bridge_version,
        tab_info=data if data.get("tab_id") else None
    )
    return jsonify({"status": "ok"})

# Extension Worker Polling
@app.route("/api/worker/poll", methods=["GET"])
@app.route("/api/extension/v2/poll", methods=["GET"])
def api_worker_poll():
    worker_id = request.args.get("worker_id") or request.headers.get("X-Worker-ID") or "default_worker"
    name = request.args.get("name")
    pc_name = request.args.get("pc_name")
    account_label = request.args.get("account_label")
    account_email = request.args.get("account_email")
    bridge_type = request.args.get("bridge_type")
    bridge_version = request.args.get("bridge_version")
    ip_address = get_client_ip()

    orchestrator.register_or_update_worker(
        worker_id, 
        name=name, 
        pc_name=pc_name,
        account_label=account_label, 
        ip_address=ip_address,
        account_email=account_email,
        bridge_type=bridge_type,
        bridge_version=bridge_version,
        tab_info=dict(request.args) if request.args.get("tab_id") else None
    )

    task = orchestrator.dispatch_next_job_for_worker(worker_id)
    w = orchestrator.workers.get(worker_id)
    is_enabled = getattr(w, "is_enabled", True) if w else True

    if task:
        return jsonify({"has_task": True, "task": task, "is_enabled": is_enabled})
    return jsonify({"has_task": False, "is_enabled": is_enabled})

def validate_tab_assignment(data, allow_committed=False):
    job = next((j for j in orchestrator.jobs if j["id"] == data.get("task_id")), None)
    if not job:
        return None, (jsonify({"success": False, "error": "unknown_job"}), 404)
    if job.get("attempt_id"):
        if (data.get("worker_id") != job.get("assigned_worker_id")
                or data.get("attempt_id") != job.get("attempt_id")
                or not secrets.compare_digest(str(data.get("lease_token", "")), str(job.get("lease_token", "")))):
            return None, (jsonify({"success": False, "error": "stale_assignment"}), 409)
        if job["status"] in ("completed", "failed"):
            if allow_committed and job.get("result_committed"):
                return job, None
            return None, (jsonify({"success": False, "error": "terminal_job"}), 409)
        if job["status"] not in ("assigned", "processing"):
            return None, (jsonify({"success": False, "error": "expired_assignment"}), 409)
    return job, None


@app.route("/api/extension/tabs", methods=["GET"])
def api_extension_tabs():
    return jsonify([w for w in orchestrator.get_all_workers() if w.get("tab_id")])


@app.route("/api/extension/tab-results", methods=["GET"])
def api_extension_tab_results():
    fields = ("id", "assigned_worker_id", "assigned_tab_id", "assigned_agent_id", "type", "status", "current_step", "output_type", "result_image_url", "result_text", "ruby_code", "outputs", "created_at")
    with orchestrator.lock:
        return jsonify([{key: job.get(key) for key in fields} for job in orchestrator.jobs if job.get("assigned_tab_id")][:100])


@app.route("/api/extension/assignment/<worker_id>", methods=["GET"])
def api_extension_assignment(worker_id):
    with orchestrator.lock:
        job = next((j for j in orchestrator.jobs if j.get("assigned_worker_id") == worker_id and j["status"] in ("assigned", "processing")), None)
        return jsonify({"job_id": job["id"] if job else None, "attempt_id": job.get("attempt_id") if job else None})


@app.route("/api/worker/preview", methods=["POST"])
@app.route("/api/extension/preview", methods=["POST"])
def api_worker_preview():
    with orchestrator.lock:
        data = request.get_json(force=True) or {}
        job, invalid = validate_tab_assignment(data, allow_committed=False)
        if invalid:
            return invalid

        worker_id = data.get("worker_id", "default_worker")
        task_id = data.get("task_id")
        preview_url = data.get("preview_url")
        preview_base64 = data.get("preview_base64")

        success = orchestrator.set_job_preview(worker_id, task_id, preview_url, preview_base64)
        return jsonify({"success": success})


@app.route("/api/worker/progress", methods=["POST"])
@app.route("/api/extension/heartbeat", methods=["POST"])
@app.route("/api/extension/v2/heartbeat", methods=["POST"])
def api_worker_progress():
    with orchestrator.lock:
        data = request.get_json(force=True) or {}
        job, invalid = validate_tab_assignment(data, allow_committed=False)
        if invalid:
            return invalid

        worker_id = data.get("worker_id", "default_worker")
        task_id = data.get("task_id")
        step = data.get("step")
        progress = data.get("progress")
        log_entry = data.get("log")
        preview_url = data.get("preview_url")
        preview_base64 = data.get("preview_base64")

        orchestrator.update_job_progress(worker_id, task_id, step, progress, log_entry, preview_url=preview_url, preview_base64=preview_base64)
        w = orchestrator.workers.get(worker_id)
        if w:
            w.ip_address = get_client_ip()
        return jsonify({"status": "ok"})


@app.route("/api/worker/complete", methods=["POST"])
@app.route("/api/extension/result", methods=["POST"])
@app.route("/api/extension/v2/result", methods=["POST"])
def api_worker_complete():
    with orchestrator.lock:
        data = request.get_json(force=True) or {}
        job, invalid = validate_tab_assignment(data, allow_committed=True)
        if invalid:
            return invalid
        if job.get("result_committed"):
            return jsonify({"success": True, "already_committed": True})
        if not data.get("error"):
            if job.get("expected_output") == "image" and not (data.get("image_base64") or data.get("image_url")):
                data["error"] = "output_mismatch: yêu cầu ảnh nhưng không nhận được ảnh"

        worker_id = data.get("worker_id", "default_worker")
        task_id = data.get("task_id")
        image_url = data.get("image_url")
        image_base64 = data.get("image_base64")
        error = data.get("error")
        text = data.get("text") or data.get("result_text") or None
        code_blocks = data.get("code_blocks") or data.get("result_code_blocks") or None
        ruby_code = data.get("ruby_code") or None
        html = data.get("html") or None
        char_count = data.get("char_count")
        response_type = data.get("response_type")

        success = orchestrator.complete_job(
            worker_id, task_id, image_url, image_base64, error,
            text=text, code_blocks=code_blocks, response_type=response_type,
            ruby_code=ruby_code, html=html, char_count=char_count
        )
        w = orchestrator.workers.get(worker_id)
        if w:
            w.ip_address = get_client_ip()
        if success:
            job["result_committed"] = True
            job["output_type"] = "error" if error else (data.get("output_type") or ("image" if image_base64 or image_url else "text"))
            job["outputs"] = data.get("outputs") or []
            if text:
                job["result_text"] = text
            if job.get("result_image_url"):
                for output in job["outputs"]:
                    if output.get("type") == "image":
                        output["url"] = job["result_image_url"]
            w = orchestrator.workers.get(worker_id)
            if w:
                w.tab_info["output_type"] = job["output_type"]
        return jsonify({"success": success})


@app.route("/api/chatgpt/new_chat", methods=["POST"])
def api_request_new_chat():
    data = request.get_json(silent=True) or {}
    worker_id = data.get("worker_id")
    orchestrator.request_new_chat(worker_id)
    return jsonify({"status": "ok", "message": "New chat action queued"})

# Gallery & Hints
@app.route("/api/gallery", methods=["GET"])
def api_gallery():
    items = get_all_gallery_items()
    return jsonify(items)

@app.route("/api/gallery/<path:filename>", methods=["DELETE"])
@app.route("/api/gallery/delete", methods=["POST"])
def api_gallery_delete(filename=None):
    if request.method == "POST":
        data = request.get_json(force=True, silent=True) or {}
        filename = data.get("filename") or filename
    if not filename:
        return jsonify({"error": "Thiếu filename cần xóa"}), 400

    safe_name = os.path.basename(str(filename).strip())
    if not safe_name or safe_name in (".", ".."):
        return jsonify({"error": "Filename không hợp lệ"}), 400

    deleted_files = []
    target_file = IMAGES_DIR / safe_name
    if target_file.exists():
        try:
            target_file.unlink()
            deleted_files.append(safe_name)
        except Exception as e:
            print(f"[!] Lỗi xóa file ảnh {target_file}: {e}")

    # Xóa thumbnail nếu có
    thumb_name = f"thumb_{Path(safe_name).stem}.webp"
    thumb_file = THUMBNAILS_DIR / thumb_name
    if thumb_file.exists():
        try:
            thumb_file.unlink()
            deleted_files.append(thumb_name)
        except Exception:
            pass

    # Xóa PDF đi kèm nếu có trong metadata
    metadata = load_metadata()
    meta = metadata.get(safe_name, {})
    pdf_url = meta.get("pdf_url")
    if pdf_url:
        pdf_name = os.path.basename(pdf_url)
        pdf_file = IMAGES_DIR / pdf_name
        if pdf_file.exists():
            try:
                pdf_file.unlink()
                deleted_files.append(pdf_name)
            except Exception:
                pass

    # Xóa khỏi metadata
    if safe_name in metadata:
        del metadata[safe_name]
        try:
            with open(METADATA_FILE, "w", encoding="utf-8") as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[!] Lỗi cập nhật metadata sau khi xóa: {e}")

    print(f"[-] Đã xóa ảnh thư viện: {safe_name} ({len(deleted_files)} files)")
    return jsonify({
        "success": True,
        "message": f"Đã xóa ảnh {safe_name} thành công",
        "filename": safe_name,
        "deleted_files": deleted_files
    })

@app.route("/api/gallery/batch_delete", methods=["POST"])
def api_gallery_batch_delete():
    data = request.get_json(force=True, silent=True) or {}
    filenames = data.get("filenames") or []
    if not filenames or not isinstance(filenames, list):
        return jsonify({"error": "Danh sách filenames không hợp lệ"}), 400

    metadata = load_metadata()
    meta_changed = False
    deleted_count = 0

    for fn in filenames:
        safe_name = os.path.basename(str(fn).strip())
        if not safe_name or safe_name in (".", ".."):
            continue

        target_file = IMAGES_DIR / safe_name
        if target_file.exists():
            try:
                target_file.unlink()
                deleted_count += 1
            except Exception as e:
                print(f"[!] Lỗi xóa file ảnh {target_file}: {e}")

        thumb_file = THUMBNAILS_DIR / f"thumb_{Path(safe_name).stem}.webp"
        if thumb_file.exists():
            try:
                thumb_file.unlink()
            except Exception:
                pass

        meta = metadata.get(safe_name, {})
        pdf_url = meta.get("pdf_url")
        if pdf_url:
            pdf_name = os.path.basename(pdf_url)
            pdf_file = IMAGES_DIR / pdf_name
            if pdf_file.exists():
                try:
                    pdf_file.unlink()
                except Exception:
                    pass

        if safe_name in metadata:
            del metadata[safe_name]
            meta_changed = True

    if meta_changed:
        try:
            with open(METADATA_FILE, "w", encoding="utf-8") as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[!] Lỗi cập nhật metadata sau batch delete: {e}")

    print(f"[-] Đã xóa hàng loạt {deleted_count} ảnh thư viện")
    return jsonify({
        "success": True,
        "message": f"Đã xóa {deleted_count} ảnh thành công",
        "deleted_count": deleted_count
    })

@app.route("/api/prompt_hints", methods=["GET", "POST"])
def api_prompt_hints():
    if request.method == "POST":
        try:
            data = request.get_json(force=True)
            if not isinstance(data, list):
                return jsonify({"error": "Dữ liệu phải là danh sách (list)."}), 400
            with open(HINTS_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            dist_hints = "/opt/admake-genai/dist/prompt_hints.json"
            if os.path.exists(os.path.dirname(dist_hints)):
                try:
                    with open(dist_hints, "w", encoding="utf-8") as f2:
                        json.dump(data, f2, ensure_ascii=False, indent=2)
                except Exception:
                    pass
            return jsonify({"success": True, "count": len(data)}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    response = jsonify(get_prompt_hints())
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# Phục vụ ảnh trực tiếp
@app.route("/images/<path:filename>", methods=["GET"])
@app.route("/output_images/<path:filename>", methods=["GET"])
def serve_image(filename):
    return send_from_directory(IMAGES_DIR, filename)

# Tải ảnh trực tiếp ép buộc trình duyệt Download (Content-Disposition: attachment)
@app.route("/api/images/download/<path:filename>", methods=["GET"])
def api_download_image(filename):
    download_name = request.args.get("download_name") or filename
    # Tuyệt đối không chứa chữ chatgpt trong tên file tải về
    download_name = download_name.replace("chatgpt_img_", "render_").replace("chatgpt", "ai")
    return send_from_directory(IMAGES_DIR, filename, as_attachment=True, download_name=download_name)

# Tải gói Extension Worker trực tiếp
@app.route("/api/unified_bridge/download", methods=["GET"])
@app.route("/api/extension/download", methods=["GET"])
def api_download_extension():
    possible_paths = [
        Path("/opt/admake-genai/dist/chatgpt_unified_bridge.zip"),
        Path("/opt/admake-genai/bridge/chatgpt_unified_bridge.zip"),
        Path("./public/chatgpt_unified_bridge.zip"),
        Path("./chatgpt_unified_bridge.zip"),
        Path("/opt/admake-genai/dist/chrome_extension.zip"),
        Path("/opt/admake-genai/bridge/chrome_extension.zip"),
        Path("./public/chrome_extension.zip"),
        Path("./chrome_extension.zip")
    ]
    for p in possible_paths:
        if p.exists():
            return send_from_directory(p.parent, p.name, as_attachment=True, download_name="chatgpt_unified_bridge_v5.zip")
    return jsonify({"error": "Extension package file not found"}), 404

# Tải gói GenAI GPU Upscaler (.ZIP)
@app.route("/api/agent/gpu-upscaler/download", methods=["GET"])
def api_download_gpu_upscaler_zip():
    possible_paths = [
        Path("/opt/admake-genai/dist/genai_gpu_upscaler.zip"),
        Path("/opt/admake-genai/bridge/genai_gpu_upscaler.zip"),
        Path("./public/genai_gpu_upscaler.zip"),
        Path("./genai_gpu_upscaler.zip")
    ]
    for p in possible_paths:
        if p.exists():
            return send_from_directory(p.parent, p.name, as_attachment=True, download_name="genai_gpu_upscaler.zip")
    return jsonify({"error": "GPU Upscaler zip package not found"}), 404

# Tải launcher GenAI-GPU-Upscaler.exe
@app.route("/api/agent/gpu-upscaler/exe", methods=["GET"])
def api_download_gpu_upscaler_exe():
    possible_paths = [
        Path("/opt/admake-genai/dist/GenAI-GPU-Upscaler.exe"),
        Path("/opt/admake-genai/bridge/GenAI-GPU-Upscaler.exe"),
        Path("./public/GenAI-GPU-Upscaler.exe"),
        Path("./GenAI-GPU-Upscaler.exe")
    ]
    for p in possible_paths:
        if p.exists():
            return send_from_directory(p.parent, p.name, as_attachment=True, download_name="GenAI-GPU-Upscaler.exe")
    return jsonify({"error": "GPU Upscaler exe launcher not found"}), 404


# ==============================================================================
# BỘ ĐIỀU PHỐI KÍCH NÉT AI (FAL.AI CLOUD CHÍNH + GPU WORKER DỰ PHÒNG)
# ==============================================================================

def get_fal_key():
    fal_key = os.getenv("FAL_KEY", "").strip()
    if fal_key:
        return fal_key
    vps_paths = [
        Path("/opt/admake-genai/bridge/vps_go.md"),
        Path("D:/vps_go.md"),
        Path("./vps_go.md"),
        Path("/root/vps_go.md")
    ]
    for p in vps_paths:
        if p.exists():
            try:
                with open(p, "r", encoding="utf-8") as f:
                    lines = [l.strip() for l in f.readlines()]
                    for i, l in enumerate(lines):
                        if l == "[FalKey]" and i + 1 < len(lines):
                            k = lines[i + 1].strip()
                            if k and not k.startswith("["):
                                return k
            except Exception:
                pass
    return "fal_sk_980ae01c34e44133ba53db50d332113a:63c4bfeadfafb3e2884f7b01d212014f"


def process_fal_ai_job(job_id: str):
    """Xử lý Kích Nét AI siêu tốc trực tiếp qua Cloud fal.ai GPU.
    Nếu fal.ai gặp sự cố, tự động chuyển tiếp sang GPU Worker phần cứng cục bộ làm dự phòng."""
    with gpu_upscale_lock:
        job = gpu_upscale_jobs.get(job_id)
        if not job or job.get("status") == "cancelled":
            return
        job["status"] = "processing"
        job["progress"] = 10
        job["current_step"] = "Đang kết nối Cloud AI GPU (fal.ai)..."
        job["logs"].append(f"[{time.strftime('%H:%M:%S')}] Khởi chạy luồng kích nét chính: Cloud AI (fal.ai)")
        save_upscale_history()

    fal_key = get_fal_key()
    os.environ["FAL_KEY"] = fal_key
    start_t = time.time()

    try:
        image_url = job.get("image_url")
        filename = job.get("filename")
        scale = int(job.get("scale", 4))
        custom_width = job.get("custom_width")
        export_format = (job.get("export_format") or "png").lower()
        print_dpi = int(job.get("print_dpi", 300))
        src_w = job.get("source_dimensions_w")
        src_h = job.get("source_dimensions_h")

        local_src_file = IMAGES_DIR / filename
        fal_input_url = image_url

        # Kiểm tra giới hạn diện tích (Max Area: 4,194,304 px²) và dung lượng (5MB) của fal.ai Crisp
        MAX_FAL_AREA = 4194304
        upload_target = local_src_file
        temp_fal_input = None
        if local_src_file.exists():
            try:
                with Image.open(local_src_file) as im_in:
                    iw, ih = im_in.size
                    file_bytes = local_src_file.stat().st_size
                    needs_resize = (iw * ih > MAX_FAL_AREA) or (file_bytes > 4500000) or (iw > 4096 or ih > 4096)
                    if needs_resize:
                        scale_fac = min(1.0, math.sqrt(MAX_FAL_AREA / float(iw * ih)) * 0.98)
                        if max(iw * scale_fac, ih * scale_fac) > 4096:
                            scale_fac = min(scale_fac, 4096.0 / max(iw, ih))
                        new_w = max(1, int(round(iw * scale_fac)))
                        new_h = max(1, int(round(ih * scale_fac)))
                        with gpu_upscale_lock:
                            job["logs"].append(f"[{time.strftime('%H:%M:%S')}] Kích thước ảnh nguồn ({iw}x{ih} px) vượt giới hạn đầu vào của fal.ai Crisp. Tự động tối ưu về chuẩn {new_w}x{new_h} px...")
                        temp_fal_input = IMAGES_DIR / f"fal_in_{job_id}.png"
                        resized_im = im_in.resize((new_w, new_h), Image.Resampling.LANCZOS)
                        if resized_im.mode not in ("RGB", "RGBA"):
                            resized_im = resized_im.convert("RGB")
                        resized_im.save(temp_fal_input, "PNG", optimize=True)
                        upload_target = temp_fal_input
            except Exception as auto_res_err:
                print(f"[!] Warning auto-resizing input for fal.ai: {auto_res_err}")

        # Tải ảnh trực tiếp lên fal CDN storage nếu file cục bộ tồn tại
        if upload_target.exists() and fal_client:
            with gpu_upscale_lock:
                job["progress"] = 25
                job["current_step"] = "Đang đồng bộ ảnh nguồn lên Cloud GPU fal.ai..."
                save_upscale_history()
            try:
                fal_input_url = fal_client.upload_file(str(upload_target))
                with gpu_upscale_lock:
                    job["logs"].append(f"[{time.strftime('%H:%M:%S')}] Đã đồng bộ ảnh lên fal CDN thành công.")
            except Exception as up_err:
                print(f"[!] Upload file to fal CDN failed ({up_err}), fallback to image_url or base64")
                if sys.platform == "win32" or "localhost" in image_url or "127.0.0.1" in image_url:
                    with open(upload_target, "rb") as bf:
                        b64_enc = base64.b64encode(bf.read()).decode("utf-8")
                        fal_input_url = f"data:image/png;base64,{b64_enc}"

        with gpu_upscale_lock:
            job["progress"] = 40
            job["current_step"] = "Cloud AI (fal.ai Recraft Crisp) đang làm sắc nét chi tiết và khử vỡ hình..."
            save_upscale_history()

        def on_queue_update(update):
            try:
                status_name = getattr(update, "status", "") or type(update).__name__
                with gpu_upscale_lock:
                    if "InProgress" in str(status_name):
                        job["progress"] = 65
                        job["current_step"] = "fal.ai Crisp AI đang làm sắc nét viền, chữ và tái tạo chi tiết..."
            except Exception:
                pass

        if fal_client:
            res = fal_client.subscribe(
                "fal-ai/recraft/upscale/crisp",
                arguments={"image_url": fal_input_url},
                on_queue_update=on_queue_update
            )
            cloud_img_url = (res.get("image") or {}).get("url")
        else:
            headers = {"Authorization": f"Key {fal_key}", "Content-Type": "application/json"}
            resp = requests.post("https://fal.run/fal-ai/recraft/upscale/crisp", headers=headers, json={"image_url": fal_input_url}, timeout=120)
            if resp.status_code != 200:
                raise RuntimeError(f"fal.ai API HTTP {resp.status_code}: {resp.text[:200]}")
            cloud_img_url = (resp.json().get("image") or {}).get("url")

        if not cloud_img_url:
            raise RuntimeError("fal.ai không trả về URL ảnh kết quả hợp lệ.")

        with gpu_upscale_lock:
            job["progress"] = 75
            job["current_step"] = f"Đã nhận ảnh nét từ fal.ai Crisp, đang tăng DPI & kết xuất Prepress {scale}X ({print_dpi} DPI) qua toolxprint.com/render-pdf..."
            job["logs"].append(f"[{time.strftime('%H:%M:%S')}] Hoàn tất Giai đoạn 1 (fal.ai Recraft Crisp). Khởi chạy Giai đoạn 2: Tăng DPI & Phóng đại {scale}X Prepress Render (PyMuPDF)...")
            save_upscale_history()

        dl_resp = requests.get(cloud_img_url, timeout=60)
        if dl_resp.status_code != 200:
            raise RuntimeError(f"Không thể tải ảnh kết quả từ fal.ai: HTTP {dl_resp.status_code}")

        clean_stem = Path(filename).stem.replace(" ", "_")
        size_label = f"{custom_width}px" if custom_width else f"{scale}x"
        out_filename = f"{job_id}_{clean_stem}_{size_label}.{export_format}"
        out_path = IMAGES_DIR / out_filename
        pdf_filename = f"{job_id}_{clean_stem}_{size_label}_prepress.pdf"
        pdf_path = IMAGES_DIR / pdf_filename
        preview_filename = f"preview_{job_id}.webp"
        preview_path = IMAGES_DIR / preview_filename

        with Image.open(io.BytesIO(dl_resp.content)) as pil_img:
            pil_img.load()
            fal_w, fal_h = pil_img.size

            if not src_w or not src_h:
                src_w = fal_w // 4
                src_h = fal_h // 4

            if custom_width and custom_width > 0:
                tgt_w = int(custom_width)
                tgt_h = int(round(tgt_w * (src_h / src_w)))
            else:
                tgt_w = src_w * scale
                tgt_h = src_h * scale

            # Giới hạn kích thước xuất ảnh an toàn tối đa 16,384 px (chuẩn Prepress Ultra 16K, tránh tràn RAM/OOM trên server)
            MAX_PREPRESS_DIM = 16384
            if max(tgt_w, tgt_h) > MAX_PREPRESS_DIM:
                down_factor = MAX_PREPRESS_DIM / float(max(tgt_w, tgt_h))
                tgt_w = int(round(tgt_w * down_factor))
                tgt_h = int(round(tgt_h * down_factor))
                with gpu_upscale_lock:
                    job["logs"].append(f"[{time.strftime('%H:%M:%S')}] Kích thước Prepress mục tiêu được chuẩn hóa về mức an toàn tối đa {tgt_w}x{tgt_h} px (16K Prepress).")

            # ------------------------------------------------------------------
            # LUỒNG PREPRESS RENDER CỦA TOOLXPRINT.COM/RENDER-PDF (PYMUPDF FITZ)
            # Tạo tài liệu Prepress PDF vật lý chuẩn in ấn (A0/A1/A2/A3/Khổ lớn)
            # ------------------------------------------------------------------
            if (tgt_w, tgt_h) != (fal_w, fal_h):
                final_img = pil_img.resize((tgt_w, tgt_h), Image.Resampling.LANCZOS)
            else:
                final_img = pil_img

            has_pdf = False
            if fitz:
                try:
                    page_w_pt = (tgt_w * 72.0) / float(print_dpi)
                    page_h_pt = (tgt_h * 72.0) / float(print_dpi)
                    prepress_doc = fitz.open()
                    rect = fitz.Rect(0, 0, page_w_pt, page_h_pt)
                    page = prepress_doc.new_page(width=page_w_pt, height=page_h_pt)
                    
                    pdf_buf = io.BytesIO()
                    if final_img.mode in ("RGBA", "LA") or (final_img.mode == "P" and "transparency" in final_img.info):
                        final_img.save(pdf_buf, format="PNG")
                    else:
                        final_img.convert("RGB").save(pdf_buf, format="JPEG", quality=98)
                    page.insert_image(rect, stream=pdf_buf.getvalue())
                    prepress_doc.save(str(pdf_path), deflate=True, garbage=4)
                    prepress_doc.close()
                    has_pdf = pdf_path.exists()
                except Exception as pdf_err:
                    print(f"[!] Warning generating prepress PDF: {pdf_err}")

            # ------------------------------------------------------------------
            # KẾT XUẤT ẢNH THÀNH PHẨM THEO TỶ LỆ 4X, 8X, 16X, 32X VÀ DPI MỤC TIÊU
            # ------------------------------------------------------------------
            if export_format == "pdf" and has_pdf:
                out_path = pdf_path
                out_filename = pdf_filename
            else:
                if export_format in ("jpg", "jpeg"):
                    final_img.convert("RGB").save(out_path, "JPEG", quality=96, dpi=(print_dpi, print_dpi))
                elif export_format == "webp":
                    final_img.save(out_path, "WEBP", quality=92)
                elif export_format == "tiff":
                    final_img.save(out_path, "TIFF", compression="tiff_lzw", dpi=(print_dpi, print_dpi))
                else:
                    final_img.save(out_path, "PNG", dpi=(print_dpi, print_dpi))

            # Preview WebP nhẹ nhàng hiển thị ngay trên browser
            try:
                max_d = 1600
                if max(tgt_w, tgt_h) > max_d:
                    sc = max_d / max(tgt_w, tgt_h)
                    thumb_w, thumb_h = int(tgt_w * sc), int(tgt_h * sc)
                    thumb_img = pil_img.resize((thumb_w, thumb_h), Image.Resampling.BILINEAR)
                else:
                    thumb_img = pil_img
                thumb_img.convert("RGB").save(preview_path, "WEBP", quality=85)
            except Exception as thumb_err:
                print(f"[!] Lỗi tạo preview: {thumb_err}")

        duration = round(time.time() - start_t, 1)
        file_mb = round(out_path.stat().st_size / (1024 * 1024), 2)
        phys_w_cm = round((tgt_w * 2.54) / float(print_dpi), 1)
        phys_h_cm = round((tgt_h * 2.54) / float(print_dpi), 1)
        phys_dim = f"{phys_w_cm} x {phys_h_cm} cm ({print_dpi} DPI)"

        with gpu_upscale_lock:
            job["status"] = "completed"
            job["progress"] = 100
            job["output_file"] = f"/images/{out_filename}"
            job["pdf_url"] = f"/images/{pdf_filename}" if has_pdf else None
            job["download_url"] = f"/api/images/download/{out_filename}"
            job["download_pdf_url"] = f"/api/images/download/{pdf_filename}" if has_pdf else None
            job["file_size_mb"] = f"{file_mb} MB"
            job["duration_seconds"] = duration
            job["source_dimensions"] = f"{src_w} x {src_h}"
            job["target_dimensions"] = f"{tgt_w} x {tgt_h}"
            job["physical_dimensions"] = phys_dim
            job["current_step"] = f"Kích nét & Render Prepress {scale}X ({print_dpi} DPI) hoàn tất trong {duration}s!"
            job["logs"].append(f"[{time.strftime('%H:%M:%S')}] Hoàn thành 100%! Đã lưu {out_filename} ({file_mb} MB) [Khổ: {phys_dim}]{' và Prepress PDF ' + pdf_filename if has_pdf else ''}")
            save_upscale_history()

            # Lưu metadata vào Thư Viện ảnh chung (gallery_metadata.json)
            try:
                save_metadata_entry({
                    "id": job_id,
                    "filename": out_filename,
                    "prompt": f"[Kích Nét {scale}X Prepress] {clean_stem} ({phys_dim})",
                    "style": f"fal.ai Recraft Crisp ({print_dpi} DPI)",
                    "aspect_ratio": f"{src_w}:{src_h}",
                    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "durationSeconds": duration,
                    "worker_id": f"fal.ai Crisp + PyMuPDF {scale}X",
                    "client_ip": job.get("client_ip", "127.0.0.1"),
                    "caller_system": job.get("caller_system") or "Kích Nét Prepress Studio",
                    "caller_type": "upscale",
                    "reference_image_url": job.get("image_url") or job.get("input_path"),
                    "pdf_url": f"/images/{pdf_filename}" if has_pdf else None,
                    "download_pdf_url": f"/api/images/download/{pdf_filename}" if has_pdf else None,
                    "physical_dimensions": phys_dim,
                    "target_dimensions": f"{tgt_w} x {tgt_h}",
                    "source_dimensions": f"{src_w} x {src_h}"
                })
            except Exception as meta_err:
                print(f"[!] Lỗi lưu gallery metadata cho upscale: {meta_err}")

        print(f"[✓] [fal.ai Upscale] Đã hoàn thành {job_id} trong {duration}s! Kích thước: {tgt_w}x{tgt_h} px ({phys_dim})")

    except Exception as fal_err:
        print(f"[!] [fal.ai Upscale] Lỗi: {fal_err}. Đang kích hoạt dự phòng Local GPU...")
        with gpu_upscale_lock:
            job["logs"].append(f"[{time.strftime('%H:%M:%S')}] [!] Cloud AI (fal.ai) gặp lỗi: {fal_err}")
            
            # KIỂM TRA GPU WORKER PHẦN CỨNG LÀM DỰ PHÒNG
            is_worker_online = (time.time() - gpu_worker_info.get("last_seen", 0)) < 25
            if is_worker_online:
                job["status"] = "queued"
                job["progress"] = 5
                job["current_step"] = "Đang chuyển sang GPU Worker máy trạm (Dự phòng)..."
                job["logs"].append(f"[{time.strftime('%H:%M:%S')}] Đã chuyển tác vụ sang hàng đợi GPU phần cứng cục bộ.")
                gpu_upscale_queue.put(job)
                save_upscale_history()
            else:
                job["status"] = "failed"
                job["error"] = f"fal.ai lỗi ({fal_err}) và hiện không có GPU Worker phần cứng nào trực tuyến để dự phòng."
                job["current_step"] = "Kích nét thất bại"
                save_upscale_history()
    finally:
        if temp_fal_input and temp_fal_input.exists():
            try:
                temp_fal_input.unlink()
            except Exception:
                pass


@app.route('/api/upscale/models', methods=['GET'])
def api_get_upscale_models():
    is_online = (time.time() - gpu_worker_info.get("last_seen", 0)) < 15
    return jsonify({
        'models': AVAILABLE_MODELS,
        'presets': PRINT_PRESETS,
        'primary_engine': 'fal_ai_crisp',
        'default_engine': 'fal',
        'default_model': 'fal-ai/recraft/upscale/crisp',
        'engines': [
            {'id': 'fal', 'name': '⚡ Cloud AI fal.ai Crisp (Mặc định chính, 1-3s) + Dự phòng GPU Máy Trạm', 'recommended': True, 'default': True, 'module': 'fal-ai/recraft/upscale/crisp'},
            {'id': 'local', 'name': '🎮 GPU Phần cứng Cục bộ (NVIDIA Worker Dự phòng)'}
        ],
        'worker': {
            'online': is_online,
            'name': gpu_worker_info.get("worker_name"),
            'gpu': gpu_worker_info.get("gpu"),
            'vram': gpu_worker_info.get("vram"),
            'status': gpu_worker_info.get("status") if is_online else "offline",
            'jobs_completed': gpu_worker_info.get("jobs_completed", 0),
            'role': 'Dự phòng phần cứng (Hardware Fallback)'
        }
    })

@app.route('/api/upscale/status/<job_id>', methods=['GET'])
def api_get_upscale_status(job_id):
    with gpu_upscale_lock:
        job = gpu_upscale_jobs.get(job_id)
        if job:
            return jsonify(job)
    return jsonify({'error': 'Không tìm thấy tác vụ kích nét.'}), 404

@app.route('/api/upscale/history', methods=['GET'])
def api_get_upscale_history():
    with gpu_upscale_lock:
        jobs = list(reversed(list(gpu_upscale_jobs.values())))
        return jsonify(jobs)

@app.route('/api/upscale/job', methods=['POST'])
def api_create_upscale_job():
    try:
        data = request.get_json(force=True) or {}
        input_path = data.get('input_path')
        image_base64 = data.get('image_base64')
        gallery_id = data.get('gallery_id')
        model_id = data.get('model_id', 'upscayl-standard-4x')
        scale = int(data.get('scale', 4))
        custom_width = data.get('custom_width')
        if custom_width:
            custom_width = int(custom_width)
        export_format = data.get('export_format', 'png')
        tile_size = int(data.get('tile_size', 0))
        tta = bool(data.get('tta', False))
        print_dpi = int(data.get('print_dpi', 300))
        engine = str(data.get('engine', 'fal')).lower()
        if engine not in ('fal', 'local', 'auto'):
            engine = 'fal'

        final_input_path = None
        if image_base64:
            ext = 'png'
            if ',' in image_base64:
                prefix, b64_data = image_base64.split(',', 1)
                if 'jpeg' in prefix or 'jpg' in prefix:
                    ext = 'jpg'
                elif 'webp' in prefix:
                    ext = 'webp'
            else:
                b64_data = image_base64

            temp_upload = IMAGES_DIR / f'upload_{int(time.time()*1000)}.{ext}'
            with open(temp_upload, 'wb') as f:
                f.write(base64.b64decode(b64_data))
            final_input_path = str(temp_upload.resolve())

        elif input_path:
            if input_path.startswith('http://') or input_path.startswith('https://'):
                raw_fname = input_path.split('/')[-1].split('?')[0] or 'source_image.jpg'
                if '.' not in raw_fname:
                    raw_fname = f'{raw_fname}.jpg'
                if (IMAGES_DIR / raw_fname).exists():
                    final_input_path = str((IMAGES_DIR / raw_fname).resolve())
                else:
                    try:
                        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
                        dl_resp = requests.get(input_path, headers=headers, timeout=30)
                        if dl_resp.status_code == 200:
                            content_type = dl_resp.headers.get('Content-Type', '').lower()
                            ext = 'jpg'
                            if 'png' in content_type:
                                ext = 'png'
                            elif 'webp' in content_type:
                                ext = 'webp'
                            stem = Path(raw_fname).stem
                            dl_temp = IMAGES_DIR / f'dl_{int(time.time()*1000)}_{stem}.{ext}'
                            with open(dl_temp, 'wb') as f:
                                f.write(dl_resp.content)
                            final_input_path = str(dl_temp.resolve())
                        else:
                            print(f'[!] Failed downloading {input_path}: HTTP {dl_resp.status_code}')
                    except Exception as dl_err:
                        print(f'[!] Error downloading image: {dl_err}')
            else:
                clean_path = input_path.lstrip('/').replace('output_images/', '').replace('images/', '')
                cand = Path(input_path)
                cand_clean = IMAGES_DIR / clean_path
                if cand.exists() and cand.is_file():
                    final_input_path = str(cand.resolve())
                elif cand_clean.exists() and cand_clean.is_file():
                    final_input_path = str(cand_clean.resolve())
                elif (IMAGES_DIR / input_path).exists():
                    final_input_path = str((IMAGES_DIR / input_path).resolve())

        elif gallery_id:
            for f in IMAGES_DIR.glob(f'{gallery_id}*'):
                if f.is_file():
                    final_input_path = str(f.resolve())
                    break

        if not final_input_path:
            return jsonify({'error': 'Không tìm thấy hoặc không xác định được ảnh nguồn.'}), 400

        # Lấy kích thước ảnh nguồn bằng PIL (nhẹ và nhanh)
        src_w, src_h = None, None
        try:
            with Image.open(final_input_path) as im:
                src_w, src_h = im.size
        except Exception:
            pass

        if src_w and src_h:
            if custom_width:
                aspect = src_h / src_w
                tgt_w = custom_width
                tgt_h = int(round(custom_width * aspect))
            else:
                tgt_w = src_w * scale
                tgt_h = src_h * scale

            MAX_PREPRESS_DIM = 16384
            if max(tgt_w, tgt_h) > MAX_PREPRESS_DIM:
                down_factor = MAX_PREPRESS_DIM / float(max(tgt_w, tgt_h))
                tgt_w = int(round(tgt_w * down_factor))
                tgt_h = int(round(tgt_h * down_factor))
        else:
            tgt_w, tgt_h = None, None

        is_worker_online = (time.time() - gpu_worker_info.get("last_seen", 0)) < 25

        # Nếu người dùng chỉ định rõ engine='local' mà GPU Worker offline thì mới báo 503
        if engine == 'local' and not is_worker_online:
            return jsonify({
                'error': 'Hiện không có GPU Worker phần cứng nào trực tuyến (Offline). Vui lòng chọn chế độ Cloud AI (fal.ai) hoặc khởi động ứng dụng GenAI GPU Upscaler trên máy trạm.'
            }), 503

        job_id = f"up_{int(time.time())}_{uuid.uuid4().hex[:6]}"
        filename = Path(final_input_path).name
        caller_info = extract_caller_info(request, data)
        
        job_data = {
            "id": job_id,
            "engine": engine,
            "input_path": f"/images/{filename}",
            "image_url": f"https://admake.vn/genai/images/{filename}",
            "filename": filename,
            "caller_system": caller_info.get("caller_system"),
            "client_ip": caller_info.get("client_ip"),
            "model_id": model_id,
            "scale": scale,
            "custom_width": custom_width,
            "export_format": export_format,
            "tile_size": tile_size,
            "tta": tta,
            "print_dpi": print_dpi,
            "status": "queued",
            "progress": 0,
            "current_step": "Khởi tạo tác vụ Kích Nét AI...",
            "logs": [f"[{time.strftime('%H:%M:%S')}] Khởi tạo tác vụ Kích Nét AI: {job_id} (Engine: {engine.upper()})"],
            "error": None,
            "source_dimensions": f"{src_w} x {src_h}" if src_w else None,
            "source_dimensions_w": src_w,
            "source_dimensions_h": src_h,
            "target_dimensions": f"{tgt_w} x {tgt_h}" if tgt_w else None,
            "output_file": None,
            "preview_url": None,
            "download_url": None,
            "file_size_mb": None,
            "duration_seconds": 0,
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
        }

        with gpu_upscale_lock:
            gpu_upscale_jobs[job_id] = job_data
            save_upscale_history()

        # LOGIC CHÍNH: FAL.AI CLOUD (Tự động fallback sang GPU Worker nếu lỗi)
        if engine in ('auto', 'fal'):
            job_data["current_step"] = "Đang kết nối Cloud AI GPU (fal.ai)..."
            threading.Thread(target=process_fal_ai_job, args=(job_id,), daemon=True).start()
            print(f"[+] [Kích Nét AI] Tác vụ {job_id} đang xử lý qua Cloud AI fal.ai (Dự phòng GPU: {'Sẵn sàng' if is_worker_online else 'Offline'})")
        else:
            # ÉP BUỘC DÙNG GPU PHẦN CỨNG MÁY TRẠM
            job_data["current_step"] = "Chờ GPU Worker máy trạm tiếp nhận..."
            with gpu_upscale_lock:
                gpu_upscale_queue.put(job_data)
            print(f"[+] [Kích Nét AI] Tác vụ {job_id} đã đưa vào hàng đợi GPU máy trạm (Đang chờ: {gpu_upscale_queue.qsize()})")

        return jsonify(job_data), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/upscale/cancel/<job_id>', methods=['POST'])
def api_cancel_upscale_job(job_id):
    with gpu_upscale_lock:
        if job_id in gpu_upscale_jobs:
            gpu_upscale_jobs[job_id]["status"] = "cancelled"
            gpu_upscale_jobs[job_id]["current_step"] = "Đã hủy bởi người dùng"
            save_upscale_history()
            return jsonify({'success': True})
    return jsonify({'error': 'Không tìm thấy tác vụ'}), 404

# --- Worker API giao tiếp với PC GPU ---

@app.route('/api/upscale/worker/heartbeat', methods=['POST'])
def api_upscale_worker_heartbeat():
    global gpu_worker_info
    try:
        data = request.get_json(force=True) or {}
        gpu_worker_info = {
            "worker_name": data.get("worker_name", "PC Local Worker"),
            "gpu": data.get("gpu", "NVIDIA GPU"),
            "vram": data.get("vram", "11GB"),
            "status": data.get("status", "idle"),
            "last_seen": time.time(),
            "jobs_completed": data.get("jobs_completed", 0)
        }
        return jsonify({"status": "ok", "time": time.time()})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/upscale/worker/status', methods=['GET'])
def api_upscale_worker_status():
    is_online = (time.time() - gpu_worker_info.get("last_seen", 0)) < 15
    return jsonify({
        "online": is_online,
        "worker": gpu_worker_info,
        "queue_length": gpu_upscale_queue.qsize()
    })

@app.route('/api/upscale/worker/poll', methods=['GET'])
def api_upscale_worker_poll():
    with gpu_upscale_lock:
        while not gpu_upscale_queue.empty():
            job = gpu_upscale_queue.get()
            if job.get("status") == "cancelled":
                continue
            job["status"] = "processing"
            job["current_step"] = "GPU Worker đang nhận và giải nén ảnh..."
            job["logs"].append(f"[{time.strftime('%H:%M:%S')}] GPU Worker đã tiếp nhận tác vụ.")
            save_upscale_history()
            return jsonify({"has_job": True, "job": job})
    return jsonify({"has_job": False})

@app.route('/api/upscale/worker/progress', methods=['POST'])
def api_upscale_worker_progress():
    try:
        data = request.get_json(force=True) or {}
        job_id = data.get("job_id")
        progress = data.get("progress", 0)
        step = data.get("current_step", "")
        with gpu_upscale_lock:
            if job_id and job_id in gpu_upscale_jobs:
                job = gpu_upscale_jobs[job_id]
                job["progress"] = progress
                job["current_step"] = step
                job["logs"].append(f"[{time.strftime('%H:%M:%S')}] {step}")
        return jsonify({"status": "ok"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/upscale/worker/upload', methods=['POST'])
def api_upscale_worker_upload():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part in request'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        filename = request.form.get('filename') or file.filename
        target_path = IMAGES_DIR / filename
        file.save(str(target_path))
        return jsonify({'status': 'ok', 'filename': filename, 'size': target_path.stat().st_size})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/upscale/worker/complete', methods=['POST'])
def api_upscale_worker_complete():
    try:
        data = request.get_json(force=True) or {}
        job_id = data.get("job_id")
        status = data.get("status", "completed")
        with gpu_upscale_lock:
            if job_id and job_id in gpu_upscale_jobs:
                job = gpu_upscale_jobs[job_id]
                if status == "completed":
                    out_name = data.get("output_filename")
                    prev_name = data.get("preview_filename")
                    dur = data.get("duration_seconds", 0)
                    gpu_name = data.get("gpu_used", "NVIDIA GPU")
                    job["status"] = "completed"
                    job["progress"] = 100
                    job["output_file"] = f"/images/{out_name}"
                    job["preview_url"] = f"/images/{prev_name}"
                    job["download_url"] = f"/api/images/download/{out_name}"
                    job["file_size_mb"] = data.get("file_size_mb")
                    job["duration_seconds"] = dur
                    if data.get("source_dimensions"):
                        job["source_dimensions"] = data.get("source_dimensions")
                    if data.get("target_dimensions"):
                        job["target_dimensions"] = data.get("target_dimensions")
                    job["current_step"] = f"Kích nét hoàn tất bằng {gpu_name} trong {dur}s!"
                    job["logs"].append(f"[{time.strftime('%H:%M:%S')}] Hoàn thành 100%! Đã lưu {out_name}")
                    try:
                        clean_stem = Path(job.get("filename", out_name)).stem.replace(" ", "_")
                        scale = job.get("scale", 4)
                        save_metadata_entry({
                            "id": job_id,
                            "filename": out_name,
                            "prompt": f"[Kích Nét {scale}X GPU] {clean_stem}",
                            "style": f"Local Hardware GPU ({gpu_name})",
                            "aspect_ratio": "Tự động",
                            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                            "durationSeconds": dur,
                            "worker_id": gpu_name,
                            "client_ip": job.get("client_ip", "127.0.0.1"),
                            "caller_system": job.get("caller_system") or "Kích Nét Prepress Studio",
                            "caller_type": "upscale",
                            "reference_image_url": job.get("image_url") or job.get("input_path"),
                            "target_dimensions": job.get("target_dimensions"),
                            "source_dimensions": job.get("source_dimensions")
                        })
                    except Exception as meta_err:
                        print(f"[!] Lỗi lưu gallery metadata cho GPU upscale: {meta_err}")
                else:
                    err = data.get("error", "Lỗi xử lý GPU")
                    job["status"] = "failed"
                    job["error"] = err
                    job["current_step"] = f"Lỗi kích nét: {err}"
                    job["logs"].append(f"[{time.strftime('%H:%M:%S')}] [X] Thất bại: {err}")
                save_upscale_history()
        return jsonify({"status": "ok"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# ==============================================================================
# SKETCHUP RUBY 3D GEOMETRY PARSER (SERVER-SIDE PYTHON RUNTIME - NO FALLBACK)
# ==============================================================================
try:
    from sketchup_parser import parse_ruby_to_geometry
except ImportError:
    parse_ruby_to_geometry = None

@app.route('/api/3d/parse_ruby', methods=['POST'])
def api_parse_ruby_3d():
    try:
        data = request.get_json(force=True, silent=True) or {}
        ruby_code = data.get("ruby_code") or data.get("code") or ""
        if not ruby_code.strip():
            return jsonify({"success": False, "error": "Mã Ruby trống hoặc không có nội dung."}), 400

        if not parse_ruby_to_geometry:
            return jsonify({"success": False, "error": "Mô-đun sketchup_parser chưa sẵn sàng trên máy chủ."}), 500

        result = parse_ruby_to_geometry(ruby_code)
        if not result.get("success"):
            # TUYỆT ĐỐI KHÔNG FALLBACK, VĂNG LỖI CỤ THỂ
            return jsonify(result), 400

        return jsonify(result), 200
    except Exception as e:
        return jsonify({"success": False, "error": f"Lỗi máy chủ khi phân tích mã 3D: {str(e)}"}), 500


# ==============================================================================
# PROMPTLIB: THƯ VIỆN PROMPT CHUẨN HÓA TRUNG TÂM DÙNG CHUNG ĐA ỨNG DỤNG
# (genai.toolxprint, toolx, mzpic, paper.toolx, 3druby)
# ==============================================================================

PROMPT_LIB_DEFAULT_APPS = [
    "genai.toolxprint",
    "toolx",
    "mzpic",
    "paper.toolx",
    "3druby"
]

PROMPT_LIB_CATEGORIES = [
    "images",
    "3d",
    "context",
    "vision",
    "materials"
]

SEED_PROMPT_LIB = [
    {
        "id": "prompt_lib_img_facade",
        "category": "images",
        "title": "Phối Cảnh 3D Bảng Hiệu Ngoại Thất Đẳng Cấp (Outdoor Facade)",
        "apps": ["genai.toolxprint", "toolx", "mzpic", "paper.toolx", "3druby"],
        "description": "Thiết kế phối cảnh 3D mặt tiền bảng hiệu quảng cáo alu chữ nổi mica hắt sáng chân đèn LED ấm áp, tỷ lệ 1:1 chuẩn xác với kích thước công trình thực tế, hiệu ứng vật liệu chân thực (bề mặt alu mờ sang trọng, mica bóng tán sáng mịn màng), bối cảnh phố xá ban chiều lúc hoàng hôn lên đèn rực rỡ, góc chụp mắt người 50mm, ánh sáng tự nhiên mềm mại.",
        "is_active": True,
        "created_at": "2026-10-20 00:00:00",
        "updated_at": "2026-10-20 00:00:00",
        "tags": ["bảng hiệu", "alu", "chữ nổi", "ngoại thất", "facade"]
    },
    {
        "id": "prompt_lib_img_inpaint",
        "category": "images",
        "title": "Inpainting: Thay Thế Logo & Tên Thương Hiệu Giữ Bối Cảnh",
        "apps": ["genai.toolxprint", "toolx", "mzpic", "paper.toolx", "3druby"],
        "description": "Chỉnh sửa và thay thế chi tiết tại vùng đã chọn: Thay bằng bộ chữ nổi Inox mạ vàng gương 3D hoặc mica cao cấp với font chữ hiện đại, viền chân đèn LED hắt sáng mềm mại, hòa trộn ánh sáng và đổ bóng hoàn hảo vào nền tường alu xung quanh, giữ nguyên toàn bộ kiến trúc ngoại cảnh không bị biến dạng.",
        "is_active": True,
        "created_at": "2026-10-20 00:00:00",
        "updated_at": "2026-10-20 00:00:00",
        "tags": ["inpainting", "sửa logo", "chữ nổi", "thay thế"]
    },
    {
        "id": "prompt_lib_3d_ruby_sign",
        "category": "3d",
        "title": "Mã SketchUp Ruby: Bảng Alu Khung Sắt Chữ Nổi & BOM Vật Tư",
        "apps": ["genai.toolxprint", "toolx", "mzpic", "paper.toolx", "3druby"],
        "description": "Viết mã nguồn SketchUp Ruby (.rb) hoàn chỉnh tự động dựng mô hình 3D kết cấu bảng hiệu quảng cáo: Khung sắt hộp mạ kẽm 25x25x1.4mm đan nan khoảng cách 400mm, tấm ốp aluminium ngoài trời 3mm viền nhôm V20, bộ chữ nổi mica 3D hắt sáng đèn LED module 3 bóng tỏa ấm. Kèm bảng bóc tách khối lượng vật tư (BOM) chi tiết từng cấu kiện.",
        "is_active": True,
        "created_at": "2026-10-20 00:00:00",
        "updated_at": "2026-10-20 00:00:00",
        "tags": ["sketchup", "ruby", "3d", "bom", "bảng hiệu"]
    },
    {
        "id": "prompt_lib_3d_round_box",
        "category": "3d",
        "title": "Mã SketchUp Ruby: Biển Vẫy Hút Nổi Tròn (D600) & Tay Treo",
        "apps": ["genai.toolxprint", "toolx", "mzpic", "paper.toolx", "3druby"],
        "description": "Viết mã nguồn SketchUp Ruby (.rb) hoàn chỉnh dựng mô hình 3D Biển vẫy hút nổi 2 mặt đường kính 600mm, độ dày 140mm, viền nhôm định hình uốn cong sơn tĩnh điện, chân tay sắt uốn mỹ thuật gắn tường, bên trong bố trí dải LED thanh siêu sáng. Kèm bảng thống kê vật tư (BOM) chi tiết.",
        "is_active": True,
        "created_at": "2026-10-20 00:00:00",
        "updated_at": "2026-10-20 00:00:00",
        "tags": ["biển vẫy", "hút nổi", "ruby 3d", "bom"]
    },
    {
        "id": "prompt_lib_ctx_vietnam_street",
        "category": "context",
        "title": "Bối Cảnh Nhà Phố Thương Mại Đô Thị Việt Nam (Street Level View)",
        "apps": ["genai.toolxprint", "toolx", "mzpic", "paper.toolx", "3druby"],
        "description": "Bối cảnh không gian mặt tiền nhà phố thương mại hiện đại tại Việt Nam, vỉa hè rộng rãi lót gạch sạch sẽ, cây xanh tự nhiên hai bên đường, bóng nắng nghiêng nhẹ nhàng tạo chiều sâu không gian, tỷ lệ phối cảnh chuẩn xác thực tế, không méo mó.",
        "is_active": True,
        "created_at": "2026-10-20 00:00:00",
        "updated_at": "2026-10-20 00:00:00",
        "tags": ["nhà phố", "việt nam", "vỉa hè", "bối cảnh"]
    },
    {
        "id": "prompt_lib_ctx_studio_light",
        "category": "context",
        "title": "Ánh Sáng Studio Thương Mại Chuyên Nghiệp (Commercial Softbox 3-Point)",
        "apps": ["genai.toolxprint", "toolx", "mzpic", "paper.toolx", "3druby"],
        "description": "Hệ thống ánh sáng studio thương mại cao cấp với 3 điểm sáng (Key light softbox 45 độ, Fill light làm dịu bóng gắt, Rim light viền tạo khối tách biệt khỏi nền), nhiệt độ màu 5500K trung tính, độ tương phản vừa phải, chi tiết sắc nét đến từng đường viền và vân vật liệu.",
        "is_active": True,
        "created_at": "2026-10-20 00:00:00",
        "updated_at": "2026-10-20 00:00:00",
        "tags": ["studio", "softbox", "ánh sáng", "chiếu sáng"]
    },
    {
        "id": "prompt_lib_vis_measure",
        "category": "vision",
        "title": "Vision: Đo Đạc Kích Thước Hiện Trạng & Đề Xuất Thi Công",
        "apps": ["genai.toolxprint", "toolx", "mzpic", "paper.toolx", "3druby"],
        "description": "Hãy phân tích kỹ lưỡng hình ảnh hiện trạng đính kèm: 1. Đo đạc và ước tính kích thước dài x rộng x cao của bảng hiệu và mặt tiền dựa trên các vật thể tham chiếu (cửa ra vào ~2.1m, tầng lầu ~3.6m). 2. Nhận diện các vật liệu đang sử dụng và đánh giá mức độ xuống cấp. 3. Đưa ra phương án thiết kế cải tạo tối ưu kèm bảng dự toán chủng loại vật tư đề xuất.",
        "is_active": True,
        "created_at": "2026-10-20 00:00:00",
        "updated_at": "2026-10-20 00:00:00",
        "tags": ["vision", "đo đạc", "hiện trạng", "báo giá"]
    },
    {
        "id": "prompt_lib_mat_slim_light",
        "category": "materials",
        "title": "Quy Chuẩn Vật Tư: Hộp Đèn Siêu Mỏng Nắp Bật & Đèn LED Module",
        "apps": ["genai.toolxprint", "toolx", "mzpic", "paper.toolx", "3druby"],
        "description": "Vật tư kỹ thuật: Khung nhôm định hình nắp bật siêu mỏng độ dày 28mm mạ anodized chống trầy xước, mặt tán sáng mica dẫn sáng khắc laser chuyên dụng 4mm, tranh in backlit film chống nước độ phân giải cao 2400 DPI, dải LED thanh siêu sáng 12V 2835 bố trí viền 2 cạnh dài kèm nguồn adapter 12V 5A.",
        "is_active": True,
        "created_at": "2026-10-20 00:00:00",
        "updated_at": "2026-10-20 00:00:00",
        "tags": ["vật tư", "hộp đèn", "led", "nhôm định hình"]
    }
]

prompt_lib_lock = threading.RLock()

def load_prompt_lib():
    with prompt_lib_lock:
        if PROMPT_LIB_FILE.exists():
            try:
                with open(PROMPT_LIB_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list) and len(data) > 0:
                        return data
            except Exception as e:
                print(f"[!] Lỗi đọc {PROMPT_LIB_FILE}: {e}")
        # Khởi tạo mặc định nếu chưa có file
        save_prompt_lib(SEED_PROMPT_LIB)
        return list(SEED_PROMPT_LIB)

def save_prompt_lib(items):
    with prompt_lib_lock:
        try:
            with open(PROMPT_LIB_FILE, "w", encoding="utf-8") as f:
                json.dump(items, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"[!] Lỗi ghi {PROMPT_LIB_FILE}: {e}")
            return False

@app.route('/api/promptlib', methods=['GET'])
def api_get_prompt_lib():
    """Lấy danh sách các mẫu prompt trong PromptLib với bộ lọc category, app, search"""
    items = load_prompt_lib()
    cat_filter = request.args.get("category", "").strip().lower()
    app_filter = request.args.get("app", "").strip().lower()
    search = request.args.get("search", "").strip().lower()
    active_only = request.args.get("active_only", "false").lower() in ("1", "true")

    filtered = []
    for item in items:
        if active_only and not item.get("is_active", True):
            continue
        if cat_filter and cat_filter != "all" and item.get("category", "").lower() != cat_filter:
            continue
        if app_filter and app_filter != "all":
            item_apps = [a.lower() for a in item.get("apps", [])]
            if app_filter not in item_apps:
                continue
        if search:
            title = item.get("title", "").lower()
            desc = item.get("description", "").lower()
            tags = " ".join(item.get("tags", [])).lower()
            if search not in title and search not in desc and search not in tags:
                continue
        filtered.append(item)

    return jsonify({
        "success": True,
        "total": len(filtered),
        "data": filtered,
        "categories": PROMPT_LIB_CATEGORIES,
        "known_apps": PROMPT_LIB_DEFAULT_APPS
    }), 200

@app.route('/api/promptlib', methods=['POST'])
def api_create_prompt_lib():
    """Thêm mới 1 bản ghi vào PromptLib"""
    try:
        data = request.get_json(force=True, silent=True) or {}
        title = (data.get("title") or "").strip()
        description = (data.get("description") or "").strip()
        category = (data.get("category") or "images").strip().lower()
        apps = data.get("apps")
        if apps is None or not isinstance(apps, list) or len(apps) == 0:
            apps = list(PROMPT_LIB_DEFAULT_APPS) # Mặc định check hết

        if not title:
            return jsonify({"success": False, "error": "Vui lòng nhập tiêu đề mẫu prompt (Title)"}), 400
        if not description:
            return jsonify({"success": False, "error": "Vui lòng nhập nội dung mô tả prompt (Description)"}), 400

        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        new_item = {
            "id": f"prompt_{int(time.time())}_{secrets.token_hex(2)}",
            "category": category,
            "title": title,
            "apps": apps,
            "description": description,
            "is_active": bool(data.get("is_active", True)),
            "created_at": now_str,
            "updated_at": now_str,
            "tags": data.get("tags") or []
        }

        with prompt_lib_lock:
            items = load_prompt_lib()
            items.insert(0, new_item)
            save_prompt_lib(items)

        return jsonify({"success": True, "item": new_item}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/promptlib/<prompt_id>', methods=['PUT'])
def api_update_prompt_lib(prompt_id):
    """Cập nhật một bản ghi trong PromptLib"""
    try:
        data = request.get_json(force=True, silent=True) or {}
        with prompt_lib_lock:
            items = load_prompt_lib()
            target = next((it for it in items if it.get("id") == prompt_id), None)
            if not target:
                return jsonify({"success": False, "error": f"Không tìm thấy prompt với ID {prompt_id}"}), 404

            if "title" in data:
                target["title"] = str(data["title"]).strip()
            if "description" in data:
                target["description"] = str(data["description"]).strip()
            if "category" in data:
                target["category"] = str(data["category"]).strip().lower()
            if "apps" in data and isinstance(data["apps"], list):
                target["apps"] = data["apps"]
            if "is_active" in data:
                target["is_active"] = bool(data["is_active"])
            if "tags" in data and isinstance(data["tags"], list):
                target["tags"] = data["tags"]

            target["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            save_prompt_lib(items)

        return jsonify({"success": True, "item": target}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/promptlib/<prompt_id>', methods=['DELETE'])
def api_delete_prompt_lib(prompt_id):
    """Xóa một bản ghi khỏi PromptLib"""
    try:
        with prompt_lib_lock:
            items = load_prompt_lib()
            new_items = [it for it in items if it.get("id") != prompt_id]
            if len(new_items) == len(items):
                return jsonify({"success": False, "error": f"Không tìm thấy prompt với ID {prompt_id}"}), 404
            save_prompt_lib(new_items)
        return jsonify({"success": True, "deleted_id": prompt_id}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/promptlib/resolve', methods=['GET'])
def api_resolve_prompt_lib():
    """Endpoint dùng cho tất cả app (toolx, mzpic, paper.toolx, 3druby, genai) tham chiếu khi gọi AI xử lý.
    Trả về danh sách prompt tương ứng và chuỗi tổng hợp composite_instruction để đính kèm vào prompt."""
    app_name = request.args.get("app", "").strip().lower()
    cat_filter = request.args.get("category", "").strip().lower()
    ids_param = request.args.get("ids", "").strip()

    items = load_prompt_lib()
    matched = []
    id_list = [i.strip() for i in ids_param.split(",") if i.strip()] if ids_param else []

    for item in items:
        if not item.get("is_active", True):
            continue
        if id_list and item.get("id") in id_list:
            matched.append(item)
            continue
        if id_list:
            continue
        # Lọc theo app
        if app_name and app_name != "all":
            item_apps = [a.lower() for a in item.get("apps", [])]
            if app_name not in item_apps:
                continue
        # Lọc theo category
        if cat_filter and cat_filter != "all" and item.get("category", "").lower() != cat_filter:
            continue
        matched.append(item)

    instructions = [m.get("description", "") for m in matched if m.get("description")]
    composite_instruction = " | ".join(instructions)

    return jsonify({
        "success": True,
        "app": app_name or "all",
        "category": cat_filter or "all",
        "matched_count": len(matched),
        "prompts": matched,
        "composite_instruction": composite_instruction
    }), 200




# ==============================================================================
# AI SIGNAGE STANDARDIZATION & CLASSIFICATION (ADMAKE LIBRARY SYNC)
# ==============================================================================

ADMAKE_LIBRARY_FILE = Path("/opt/admake-genai/bridge/admake_library.json")

DEFAULT_SIGNAGE_CATEGORIES = {
    "BANG_ALU_CHU_NOI": {
        "ten": "Bảng Alu chữ nổi",
        "mo_ta": "Mặt dựng tấm nhôm Aluminium kết hợp chữ nổi mica, inox hoặc formex"
    },
    "BANG_BAT_HIFLEX": {
        "ten": "Bảng bạt Hiflex",
        "mo_ta": "Bạt hiflex căng khung sắt hộp kẽm, nẹp V nhôm hoặc viền sơn"
    },
    "HOP_DEN_HIFLEX": {
        "ten": "Hộp đèn bạt Hiflex",
        "mo_ta": "Hộp đèn căng bạt hiflex 1 mặt hoặc 2 mặt khung sắt, đèn neon/led bên trong"
    },
    "HOP_DEN_MICA_HUT_NOI": {
        "ten": "Hộp đèn Mica hút nổi",
        "mo_ta": "Biển vẫy mica hút nổi hình tròn, vuông, elip gắn đèn led hắt sáng, khung nhôm định hình"
    },
    "HOP_DEN_SIEU_MONG": {
        "ten": "Hộp đèn siêu mỏng",
        "mo_ta": "Tranh điện led, hộp đèn nắp bật, nắp hít nam châm dùng cho menu quán, ảnh trang trí"
    },
    "BANG_DEN_LED_MA_TRAN": {
        "ten": "Bảng LED ma trận / Màn hình LED",
        "mo_ta": "Module LED P10, P5 chạy chữ quảng cáo đổi nội dung hoặc màn hình led full color"
    },
    "BANG_LED_NEON": {
        "ten": "Bảng LED Neon Sign",
        "mo_ta": "Dây led neon dẻo uốn chữ, uốn hình trang trí theo yêu cầu trên nền mica trong/alu"
    },
    "BANG_TOLE_DAN_DECAL": {
        "ten": "Bảng Tôn / Tole sóng dán Decal",
        "mo_ta": "Bảng tôn sóng hoặc tôn phẳng dán decal in ấn hoặc dán chữ nổi"
    },
    "BANG_INOX_AN_MON": {
        "ten": "Bảng Inox / Đồng ăn mòn",
        "mo_ta": "Biển tên công ty, biển phòng ban, số nhà chất liệu inox/đồng ăn mòn acid sơn màu"
    },
    "CHU_NOI_DOC_LAP": {
        "ten": "Chữ nổi độc lập",
        "mo_ta": "Chữ mica, inox, tôn gắn trực tiếp lên kính, tường, vách đá hoa cương, không có nền alu"
    },
    "DECAL_DAN_KINH_ALU": {
        "ten": "Decal dán kính / PP bồi Formex",
        "mo_ta": "Decal mờ dán kính văn phòng, decal in KTS cán bóng/mờ, tranh PP bồi formex"
    },
    "KHAC": {
        "ten": "Loại bảng hiệu khác",
        "mo_ta": "Yêu cầu đặc thù chưa rõ phân loại trong thư viện chuẩn"
    }
}

DEFAULT_MATERIALS = {
    "ALU": "Aluminium (Alcorest, Triều Chen...)",
    "MICA": "Tấm nhựa Mica / Acrylic (Đài Loan, Fusheng, Chochen)",
    "INOX": "Inox 304/201 (vàng gương, vàng xước, trắng gương, trắng xước)",
    "BAT_HIFLEX": "Bạt Hiflex (bạt thường, bạt đế xám 2 da, bạt không gân, bạt 3M)",
    "DEN_LED": "Đèn LED (LED hắt, module 3 bóng, led neon dẻo, nguồn 12V/5V)",
    "FORMEX": "Tấm xốp Formex / PVC Foam (chân chữ, bồi hình)",
    "KHUNG_SAT": "Khung sắt hộp mạ kẽm (20x20, 25x25, 30x30...)",
    "TOLE": "Tôn phẳng, tôn sóng",
    "DECAL": "Decal in KTS, decal mờ, decal cắt vi tính, decal phản quang",
    "GO": "Gỗ thông ghép thanh, MDF chống ẩm, MFC",
    "KINH": "Kính cường lực, kính màu"
}

OLLAMA_API_URL = "http://127.0.0.1:11434/api/chat"

def get_loaded_admake_library():
    if ADMAKE_LIBRARY_FILE.exists():
        try:
            with open(ADMAKE_LIBRARY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return None

SIGNAGE_TESTER_HTML = """<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Chuẩn Hóa Bảng Hiệu & Vật Liệu</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
  <style>
    body { font-family: 'Inter', sans-serif; }
    .glass { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen py-8 px-4 flex flex-col items-center">
  <div class="max-w-4xl w-full space-y-6">
    <!-- Header -->
    <div class="glass border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Hệ Thống Trí Tuệ Nhân Tạo Bảng Hiệu
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
          AI Chuẩn Hóa Bảng Hiệu & Vật Liệu
        </h1>
        <p class="text-slate-400 text-sm mt-1">
          Tự động phân tích yêu cầu thô, tiếng lóng, sai chính tả &rarr; Bóc tách Loại Bảng Hiệu & Vật Liệu Thư Viện.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <a href="/api/ai/signage/library" target="_blank" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg border border-slate-700 transition">
          📚 Xem Thư Viện Chuẩn
        </a>
      </div>
    </div>

    <!-- Main Card -->
    <div class="glass border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2">
          Nhập yêu cầu khách hàng (thoải mái viết tắt, sai chính tả, không dấu):
        </label>
        <textarea id="rawText" rows="3" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition" placeholder="Ví dụ: lam cai bang alu vang guong chu noi mica sang chan 4x1m2 gò vấp"></textarea>
      </div>

      <!-- Quick chips -->
      <div>
        <span class="text-xs text-slate-400 font-medium">Gợi ý mẫu để test nhanh (click để điền):</span>
        <div class="flex flex-wrap gap-2 mt-2">
          <button onclick="setPrompt(this.innerText)" class="text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700/60 transition">
            lam cai bang alu vang guong chu noi mica sang chan 4x1m2 gò vấp
          </button>
          <button onclick="setPrompt(this.innerText)" class="text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700/60 transition">
            e muon lam bat hiflex co khung sat 2m 80cm gia nhiu shop
          </button>
          <button onclick="setPrompt(this.innerText)" class="text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700/60 transition">
            hop den hut noi tron phi 60cm led 12v sang dep
          </button>
          <button onclick="setPrompt(this.innerText)" class="text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700/60 transition">
            bãng tôn sóng dán chữ nỗi alcorest màu đen 5x2m cho quán cafe
          </button>
          <button onclick="setPrompt(this.innerText)" class="text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700/60 transition">
            chữ nổi inox vàng gương gắn tường kính văn phòng 2m4
          </button>
        </div>
      </div>

      <!-- Settings & Action -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 border-t border-slate-800">
        <div class="flex items-center gap-3">
          <span class="text-xs text-slate-400">Chế độ phân tích:</span>
          <label class="inline-flex items-center text-xs text-slate-300 gap-1.5 cursor-pointer">
            <input type="radio" name="modeChoice" value="standard" checked class="text-emerald-500 focus:ring-0">
            <span><strong>Tiêu chuẩn</strong> (Chính xác cao)</span>
          </label>
          <label class="inline-flex items-center text-xs text-slate-300 gap-1.5 cursor-pointer">
            <input type="radio" name="modeChoice" value="fast" class="text-emerald-500 focus:ring-0">
            <span><strong>Siêu tốc</strong></span>
          </label>
        </div>

        <button id="btnSubmit" onclick="runClassify()" class="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold px-6 py-2.5 rounded-xl transition shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50">
          <span>⚡ Phân Tích & Chuẩn Hóa</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div id="loading" class="hidden glass border border-slate-800 rounded-2xl p-8 text-center space-y-3">
      <div class="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-sm text-slate-300 font-medium">Hệ thống AI đang phân tích yêu cầu...</p>
      <p class="text-xs text-slate-500">Ánh xạ từ vựng sang mã thư viện bảng hiệu & vật liệu</p>
    </div>

    <!-- Result Area -->
    <div id="resultCard" class="hidden space-y-6">
      <div class="glass border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <div class="flex items-center gap-2">
            <span class="text-lg">🎯</span>
            <h2 class="text-lg font-bold text-slate-100">Kết Quả Phân Tích & Chuẩn Hóa</h2>
          </div>
          <div class="flex items-center gap-2">
            <span id="latencyBadge" class="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              0 ms
            </span>
            <span id="modeBadge" class="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Tiêu chuẩn
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Card 1: Loại bảng hiệu -->
          <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <div class="text-xs text-slate-400 uppercase tracking-wider font-semibold">1. Loại bảng hiệu (Thư viện)</div>
            <div class="flex items-center gap-2">
              <span id="resLoaiCode" class="text-sm font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                -
              </span>
            </div>
            <div id="resLoaiTen" class="text-base font-bold text-slate-100">-</div>
            <p id="resLoaiMoTa" class="text-xs text-slate-400">-</p>
            <div id="resAdmakeSignBox" class="hidden pt-1 border-t border-slate-800">
              <span class="text-[11px] text-slate-400">Mẫu khớp trong thư viện Admake:</span>
              <div id="resAdmakeSignName" class="text-xs font-semibold text-emerald-300 mt-0.5"></div>
            </div>
          </div>

          <!-- Card 2: Kích thước & Vật liệu -->
          <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
            <div class="text-xs text-slate-400 uppercase tracking-wider font-semibold">2. Kích thước phát hiện</div>
            <div id="resKichThuoc" class="text-base font-bold text-cyan-400 font-mono">
              Không xác định
            </div>
            <div class="text-xs text-slate-400 uppercase tracking-wider font-semibold pt-2">3. Vật liệu chủ đạo cần lấy</div>
            <div id="resVatLieuList" class="flex flex-wrap gap-1.5 pt-1">
            </div>
          </div>
        </div>

        <!-- Raw JSON Viewer -->
        <div class="pt-2">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-slate-400">Dữ liệu JSON gốc trả về (cho hệ thống & API):</span>
            <button onclick="copyJson()" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded border border-slate-700 transition">
              📋 Sao chép JSON
            </button>
          </div>
          <pre id="rawJsonViewer" class="bg-slate-900 p-4 rounded-xl text-xs text-emerald-400 font-mono overflow-x-auto border border-slate-800 max-h-60"></pre>
        </div>
      </div>
    </div>
  </div>

  <script>
    let currentResponseData = null;

    function setPrompt(text) {
      document.getElementById('rawText').value = text;
    }

    async function runClassify() {
      const text = document.getElementById('rawText').value.trim();
      if (!text) {
        alert('Vui lòng nhập nội dung yêu cầu!');
        return;
      }

      const mode = document.querySelector('input[name="modeChoice"]:checked').value;
      const btn = document.getElementById('btnSubmit');
      const loading = document.getElementById('loading');
      const resultCard = document.getElementById('resultCard');

      btn.disabled = true;
      loading.classList.remove('hidden');
      resultCard.classList.add('hidden');

      try {
        const res = await fetch('/api/ai/signage/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, mode })
        });
        const data = await res.json();
        currentResponseData = data;

        if (!data.success) {
          alert('Lỗi: ' + (data.error || 'Không thể xử lý'));
          return;
        }

        // Render UI
        document.getElementById('latencyBadge').innerText = data.latency_ms + ' ms';
        document.getElementById('modeBadge').innerText = data.mode === 'fast' ? 'Siêu tốc' : 'Tiêu chuẩn';
        document.getElementById('resLoaiCode').innerText = data.loai_bang_hieu || 'KHAC';
        document.getElementById('resLoaiTen').innerText = data.ten_loai_bang_hieu || '-';
        document.getElementById('resLoaiMoTa').innerText = data.mo_ta_loai || '-';
        document.getElementById('resKichThuoc').innerText = data.kich_thuoc || 'Không đề cập trong yêu cầu';

        const admakeSignBox = document.getElementById('resAdmakeSignBox');
        const admakeSignName = document.getElementById('resAdmakeSignName');
        if (data.mau_admake_tuong_ung) {
          admakeSignBox.classList.remove('hidden');
          admakeSignName.innerText = '🏷️ ' + data.mau_admake_tuong_ung;
        } else {
          admakeSignBox.classList.add('hidden');
        }

        const vlContainer = document.getElementById('resVatLieuList');
        vlContainer.innerHTML = '';
        if (data.vat_lieu_chu_dao && data.vat_lieu_chu_dao.length > 0) {
          data.vat_lieu_chu_dao.forEach(m => {
            const tag = document.createElement('div');
            tag.className = 'text-xs bg-slate-800 border border-slate-700 text-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5';
            tag.innerHTML = `<span class="font-mono font-bold text-emerald-400">${m.code}</span> <span class="text-slate-400">(${m.ten})</span>`;
            vlContainer.appendChild(tag);
          });
        } else {
          vlContainer.innerHTML = '<span class="text-xs text-slate-500">Không phát hiện vật liệu cụ thể</span>';
        }

        document.getElementById('rawJsonViewer').innerText = JSON.stringify(data, null, 2);
        resultCard.classList.remove('hidden');
      } catch (err) {
        alert('Lỗi kết nối tới máy chủ: ' + err.message);
      } finally {
        btn.disabled = false;
        loading.classList.add('hidden');
      }
    }

    function copyJson() {
      if (!currentResponseData) return;
      navigator.clipboard.writeText(JSON.stringify(currentResponseData, null, 2));
      alert('Đã sao chép JSON vào clipboard!');
    }
  </script>
</body>
</html>"""

@app.route("/api/ai/signage/sync-library", methods=["POST"])
def api_ai_signage_sync_library():
    """Nhận và lưu trữ thư viện mẫu bảng hiệu và vật liệu từ Admake."""
    try:
        data = request.get_json(force=True, silent=True) or {}
        signs = data.get("signs", [])
        materials = data.get("materials", [])
        
        library_data = {
            "updated_at": datetime.now().isoformat(),
            "signs_count": len(signs),
            "materials_count": len(materials),
            "signs": signs,
            "materials": materials
        }
        
        with open(ADMAKE_LIBRARY_FILE, "w", encoding="utf-8") as f:
            json.dump(library_data, f, ensure_ascii=False, indent=2)
            
        return jsonify({
            "success": True,
            "message": f"Đã nạp thành công {len(signs)} mẫu bảng hiệu và {len(materials)} loại vật liệu vào hệ thống AI!",
            "signs_count": len(signs),
            "materials_count": len(materials)
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/ai/signage/library", methods=["GET"])
def api_ai_signage_library():
    """Trả về danh mục bảng hiệu và vật liệu chuẩn để client hiển thị hoặc đồng bộ thư viện."""
    admake_lib = get_loaded_admake_library()
    return jsonify({
        "success": True,
        "categories": DEFAULT_SIGNAGE_CATEGORIES,
        "materials": DEFAULT_MATERIALS,
        "admake_synced": bool(admake_lib),
        "admake_signs_count": admake_lib.get("signs_count", 0) if admake_lib else 0,
        "admake_materials_count": admake_lib.get("materials_count", 0) if admake_lib else 0
    }), 200


@app.route("/api/ai/signage/classify", methods=["GET", "POST"])
def api_ai_signage_classify():
    """
    Tiếp nhận yêu cầu bảng hiệu thô của khách hàng (sai chính tả, viết tắt, không dấu, tiếng lóng)
    Chuẩn hóa và ánh xạ sang 2 tiêu chí cốt lõi:
    1. loai_bang_hieu (loại bảng hiệu tương ứng trong thư viện)
    2. vat_lieu_chu_dao (danh sách vật liệu chủ đạo tương ứng trong thư viện)
    Kèm kích thước và mẫu khớp trong thư viện Admake (nếu có).
    """
    try:
        if request.method == "GET":
            raw_text = (request.args.get("text") or request.args.get("q") or "").strip()
            if not raw_text and ("text/html" in request.headers.get("Accept", "") or "*/*" in request.headers.get("Accept", "")):
                return SIGNAGE_TESTER_HTML, 200, {"Content-Type": "text/html; charset=utf-8"}

            mode = request.args.get("mode", "standard").strip().lower()
            custom_categories = None
            custom_materials = None
        else:
            data = request.get_json(force=True, silent=True) or {}
            raw_text = (data.get("text") or data.get("prompt") or data.get("input") or "").strip()
            mode = (data.get("mode") or data.get("speed") or "standard").strip().lower()
            custom_categories = data.get("categories")
            custom_materials = data.get("materials")

        if not raw_text:
            return jsonify({"success": False, "error": "Thiếu nội dung yêu cầu (tham số 'text')"}), 400

        internal_model = "qwen2.5:3b" if mode in ["fast", "quick", "speed"] else "qwen2.5:7b"

        # Tải thư viện Admake đã đồng bộ
        admake_lib = get_loaded_admake_library()
        admake_signs_str = ""
        if admake_lib and admake_lib.get("signs"):
            sample_signs = admake_lib["signs"][:60]
            lines = [f"- {s}" for s in sample_signs]
            admake_signs_str = "\nCác mẫu bảng hiệu trong thư viện Admake:\n" + "\n".join(lines)

        # Xây dựng danh sách danh mục & vật liệu tra cứu
        if isinstance(custom_categories, dict):
            categories_dict = custom_categories
        else:
            categories_dict = DEFAULT_SIGNAGE_CATEGORIES

        if isinstance(custom_materials, dict):
            materials_dict = custom_materials
        else:
            materials_dict = DEFAULT_MATERIALS

        cat_lines = [f"- {k}: {v['ten'] if isinstance(v, dict) else v}" for k, v in categories_dict.items()]
        cat_list_str = "\n".join(cat_lines)
        mat_list_str = ", ".join(list(materials_dict.keys()))

        system_prompt = f"""Ban la tro ly chuyen gia nganh quang cao, bang hieu bien hieu Admake.
Nhiem vu: Doc yeu cau cua khach hang (co the viet tat, sai chinh ta, khong dau hoac tieng long), phan tich va trich xuat thanh JSON de tra cuu thu vien san pham.

Cac loai bang hieu trong thu vien:
{cat_list_str}
{admake_signs_str}

Cac vat lieu chu dao trong thu vien:
{mat_list_str}

Quy tac trich xuat:
- loai_bang_hieu: Chon 1 ma loai bang hieu phu hop nhat tu danh sach tren.
- mau_admake: Ten mau bang hieu gan giong nhat trong thu vien Admake neu co, hoac null.
- vat_lieu_chu_dao: Danh sach cac ma vat lieu xuat hien hoac can thiet cho san pham (mang cac chuoi tu danh sach vat lieu tren).
- kich_thuoc: Chuoi kich thuoc neu tim thay trong yeu cau (vd: '4x1.2m', 'phi 60cm', 'ngang 3m cao 1m'), neu khong co tra ve null.

Dinh dang ket qua: Tra ve DUY NHAT JSON hop le:
{{"loai_bang_hieu": "<MA_LOAI>", "mau_admake": "<TEN_MAU_HOAC_NULL>", "vat_lieu_chu_dao": ["<MA_VAT_LIEU_1>", "<MA_VAT_LIEU_2>"], "kich_thuoc": "<kich thuoc hoac null>"}}
Khong tra ve bat ky loi giai thich nao ngoai JSON."""

        t0 = time.time()
        ollama_payload = {
            "model": internal_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": raw_text}
            ],
            "format": "json",
            "stream": False,
            "keep_alive": "24h",
            "options": {
                "temperature": 0.0,
                "num_predict": 80
            }
        }

        resp = requests.post(OLLAMA_API_URL, json=ollama_payload, timeout=60)
        if resp.status_code != 200:
            return jsonify({
                "success": False,
                "error": f"Lỗi từ dịch vụ xử lý AI: HTTP {resp.status_code}",
                "detail": resp.text
            }), 502

        res_json = resp.json()
        raw_content = res_json.get("message", {}).get("content", "").strip()
        latency_ms = int((time.time() - t0) * 1000)

        try:
            parsed = json.loads(raw_content)
        except Exception as pe:
            return jsonify({
                "success": False,
                "error": "Mô hình trả về định dạng JSON không hợp lệ",
                "raw_response": raw_content,
                "latency_ms": latency_ms
            }), 500

        loai_code = parsed.get("loai_bang_hieu", "KHAC")
        loai_info = categories_dict.get(loai_code, {"ten": loai_code, "mo_ta": ""})
        ten_loai = loai_info["ten"] if isinstance(loai_info, dict) else str(loai_info)
        mo_ta_loai = loai_info.get("mo_ta", "") if isinstance(loai_info, dict) else ""

        mat_codes = parsed.get("vat_lieu_chu_dao", [])
        if not isinstance(mat_codes, list):
            mat_codes = [str(mat_codes)] if mat_codes else []

        enriched_materials = []
        for m in mat_codes:
            m_upper = str(m).strip().upper()
            m_name = materials_dict.get(m_upper, m_upper)
            enriched_materials.append({
                "code": m_upper,
                "ten": m_name
            })

        return jsonify({
            "success": True,
            "input_text": raw_text,
            "loai_bang_hieu": loai_code,
            "ten_loai_bang_hieu": ten_loai,
            "mo_ta_loai": mo_ta_loai,
            "mau_admake_tuong_ung": parsed.get("mau_admake"),
            "vat_lieu_chu_dao": enriched_materials,
            "kich_thuoc": parsed.get("kich_thuoc"),
            "mode": mode,
            "latency_ms": latency_ms
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


from ai_materials_bridge import register as register_materials_normalizer
register_materials_normalizer(app)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print("=" * 70)
    print(f"🚀 ENTERPRISE CHATGPT IMAGE BRIDGE V3.0 ĐANG CHẠY TẠI PORT {port}")
    print(f"📁 Thư mục lưu ảnh: {IMAGES_DIR.resolve()}")
    print(f"⚙️  Hỗ trợ Scale đa Workers, đa Chrome profile, Auto-recover & Job Queue")
    print("=" * 70)
    try:
        recover_orphaned_preview_images()
    except Exception as _e:
        print(f"[!] Startup recovery error: {_e}")
    app.run(host="127.0.0.1", port=port, threaded=True)
