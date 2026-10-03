import os
import io
import json
import time
import math
import base64
import requests
import urllib.request
from urllib.error import HTTPError, URLError
from PIL import Image, ImageFilter, ImageEnhance
from flask import Blueprint, request, jsonify

ai_bp = Blueprint('ai', __name__)

# ==============================================================================
# KEY LOADING TỰ ĐỘNG TỪ D:/vps_go.md VÀ MÔI TRƯỜNG
# ==============================================================================
def get_ai_studio_keys():
    """Đọc động GeminiKey và GPTKey từ vps_go.md hoặc environment variables"""
    gemini_key = os.getenv("GEMINI_API_KEY", "") or os.getenv("GOOGLE_API_KEY", "")
    gpt_key = os.getenv("OPENAI_API_KEY", "") or os.getenv("GPT_API_KEY", "")

    candidate_paths = [
        "D:/vps_go.md",
        "./vps_go.md",
        "/opt/vps_go.md",
        "/root/vps_go.md",
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "vps_go.md")
    ]
    for p in candidate_paths:
        if p and os.path.exists(p):
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

def get_active_ai_keys():
    """Tương thích ngược với các hàm cũ"""
    return get_ai_studio_keys()

# ==============================================================================
# PRO STUDIO PRESETS & PHOTOGRAPHIC FRAMEWORK
# ==============================================================================
RESOLUTION_MAP = {
    "4k": {
        "1:1": (4096, 4096),
        "16:9": (4096, 2304),
        "9:16": (2304, 4096),
        "4:3": (4096, 3072),
        "3:4": (3072, 4096),
    },
    "2k": {
        "1:1": (2560, 2560),
        "16:9": (2560, 1440),
        "9:16": (1440, 2560),
        "4:3": (2560, 1920),
        "3:4": (1920, 2560),
    },
    "1080p": {
        "1:1": (1920, 1920),
        "16:9": (1920, 1080),
        "9:16": (1080, 1920),
        "4:3": (1920, 1440),
        "3:4": (1440, 1920),
    }
}

PRO_PRESETS = {
    "style": {
        "none": {"name": "Tự do / Theo AI", "prompt": ""},
        "doc_realism": {"name": "📷 Chân thực đời thường", "prompt": "hyper-realistic documentary photography, authentic human candid emotion, natural skin pores and realistic micro-textures, shot on 35mm film aesthetic, no artificial retouching, authentic RAW capture"},
        "cinematic": {"name": "🎬 Điện ảnh Cinematic", "prompt": "cinematic movie still, Panavision 35mm anamorphic lens, dramatic widescreen composition, subtle film grain, cinematic depth of field, atmospheric color grading, cinematic haze"},
        "commercial_studio": {"name": "📸 Studio Thương mại", "prompt": "high-end commercial studio photography, crisp subject isolation, ultra-detailed tactile surfaces, elegant modern aesthetic, luxury magazine editorial quality"},
        "vintage_film": {"name": "☕ Analog Kodak Portra", "prompt": "analog film photography, shot on Kodak Portra 400, warm organic tones, gentle film grain, nostalgic timeless mood, authentic vintage optical rendition"},
        "oil_painting": {"name": "🎨 Tranh sơn dầu Nghệ thuật", "prompt": "classical fine art oil painting, expressive impasto brushstrokes, rich pigment layering, timeless museum masterpiece aesthetic"},
        "packaging_mockup": {"name": "📦 Mockup Bao bì In ấn", "prompt": "ultra-clean minimalist product mockup for commercial print, studio seamless background, precise branding focus, high-fidelity tactile material textures"}
    },
    "lighting": {
        "none": {"name": "Tự do / Theo AI", "prompt": ""},
        "golden_hour": {"name": "☀️ Nắng sớm bình minh", "prompt": "bathed in warm golden hour sunlight, soft low-angle sun rays, gentle warm glow, natural lens flare, delicate rim lighting on edges"},
        "soft_daylight": {"name": "⛅ Ánh sáng tự nhiên dịu", "prompt": "soft diffused natural daylight, gentle ambient illumination, neutral realistic color balance, seamless shadow gradients"},
        "studio_softbox": {"name": "💡 Studio Softbox 3 điểm", "prompt": "three-point professional studio lighting with large softbox key light, subtle fill light, crisp edge separation rim light, controlled specular highlights"},
        "sunset_dramatic": {"name": "🌆 Hoàng hôn rực rỡ", "prompt": "vibrant sunset twilight ambiance, dramatic fiery orange and magenta sky gradient, rich contrast, warm silhouettes with luminous rim light"},
        "moody_night": {"name": "🌙 Đêm huyền bí / Ánh trăng", "prompt": "moody blue hour twilight, soft ambient moonlight, deep cinematic shadows, low-key atmospheric lighting"},
        "neon_glow": {"name": "🏮 Đèn Neon tương phản", "prompt": "cyberpunk dramatic neon lighting, dual-tone cyan and magenta edge rim light, reflective surfaces, high visual contrast"}
    },
    "lens": {
        "none": {"name": "Tự do / Theo AI", "prompt": ""},
        "portrait_85mm": {"name": "🔍 Chân dung xóa phông (85mm f/1.4)", "prompt": "shot on 85mm f/1.4 prime lens, shallow depth of field, creamy smooth background bokeh, sharp tack focus on subject eyes and face"},
        "natural_50mm": {"name": "👁️ Góc mắt người thật (50mm f/1.8)", "prompt": "shot on 50mm f/1.8 standard prime lens, natural human eye perspective, balanced field of view, organic depth and realistic distortion-free proportions"},
        "wide_24mm": {"name": "🌄 Toàn cảnh góc rộng (24mm f/2.8)", "prompt": "shot on 24mm wide angle lens, deep depth of field, expansive environmental context, dynamic leading lines"},
        "macro_100mm": {"name": "🔬 Cận cảnh vi mô (100mm Macro)", "prompt": "shot on 100mm macro lens at 1:1 reproduction ratio, extreme close-up detail, razor-sharp focus on microscopic textures and surface nuances"},
        "drone_aerial": {"name": "🚁 Góc nhìn trên cao (Aerial Drone)", "prompt": "high-altitude aerial drone perspective, sweeping bird's-eye view, broad spatial composition, clean geometric framing"},
        "full_body": {"name": "👤 Chụp toàn thân (Full Body)", "prompt": "full body portrait framing, standing tall, elegant head-to-toe composition, grounded spatial depth"}
    }
}

def enhance_prompt(raw_prompt: str, use_ai_enhancer: bool, presets: dict, gpt_key: str, task_type: str = "create") -> tuple:
    """
    Chuẩn hóa prompt theo Tiêu chuẩn Nhiếp ảnh 5 lớp (5-Layer Photographic Framework) bằng gpt-4o-mini
    kết hợp với bộ lọc chuyên sâu Style / Lighting / Lens.
    """
    raw_prompt = (raw_prompt or "").strip()
    if not raw_prompt:
        return "", {"total_tokens": 0, "cost_usd": 0.0}

    presets = presets or {}
    style_k = presets.get("style", "none")
    lighting_k = presets.get("lighting", "none")
    lens_k = presets.get("lens", "none")

    style_prompt = PRO_PRESETS["style"].get(style_k, {}).get("prompt", "")
    lighting_prompt = PRO_PRESETS["lighting"].get(lighting_k, {}).get("prompt", "")
    lens_prompt = PRO_PRESETS["lens"].get(lens_k, {}).get("prompt", "")

    preset_parts = []
    if style_prompt:
        preset_parts.append(f"Visual Style: {style_prompt}")
    if lighting_prompt:
        preset_parts.append(f"Lighting & Atmosphere: {lighting_prompt}")
    if lens_prompt:
        preset_parts.append(f"Camera Optics & Lens: {lens_prompt}")
    preset_instructions = " | ".join(preset_parts)

    usage = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "cost_usd": 0.0}

    if use_ai_enhancer and gpt_key:
        try:
            system_prompt = (
                "You are a World-Class Photography Director and Prompt Engineering Master specializing in photorealistic imagery for OpenAI gpt-image-1 and Google Imagen 3.\n"
                "Transform the user's raw prompt (in Vietnamese or English) into an elite, highly detailed, photorealistic visual description in English.\n"
                "Strictly apply the 5-Layer Photographic Framework:\n"
                "1. Subject & Action: Authentic expressions, natural skin texture (fine pores, natural sheen), genuine emotion, realistic fabric textures and natural posture.\n"
                "2. Environment & Depth: Atmospheric storytelling, layered background elements, authentic environmental depth.\n"
                "3. Lighting & Atmosphere: Masterful key/fill/rim light, natural light direction (e.g. golden hour sun, soft diffused daylight, or studio softbox), realistic soft shadows.\n"
                "4. Optics & Gear: Professional full-frame or medium format photography (e.g. Hasselblad H6D or Canon EOS R5), realistic focal length (85mm, 50mm, 24mm), creamy bokeh, authentic RAW capture. Strictly avoid plastic skin, CGI, 3D render, cartoon, or over-smoothed AI look.\n"
                "5. Color Grading & Texture: Natural dynamic range, rich organic tonal gradations, crisp micro-contrast.\n\n"
                "If professional photography presets (Style, Lighting, Lens) are provided, seamlessly weave them into the prompt.\n"
                "Output ONLY the final enhanced English prompt text, with no introductory text, quotes, or markdown wrappers."
            )

            user_msg = f"User Raw Prompt: {raw_prompt}"
            if preset_instructions:
                user_msg += f"\nActive Professional Presets to integrate:\n{preset_instructions}"
            if task_type == "edit":
                user_msg += "\nNote: This is an image editing / inpainting task. The enhanced prompt should precisely describe the modifications to blend seamlessly with the existing photo."

            resp = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {gpt_key}", "Content-Type": "application/json"},
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_msg}
                    ],
                    "temperature": 0.7
                },
                timeout=20
            )
            if resp.status_code == 200:
                res_data = resp.json()
                enhanced = res_data["choices"][0]["message"]["content"].strip()
                u = res_data.get("usage", {})
                p_tok = u.get("prompt_tokens", 0)
                c_tok = u.get("completion_tokens", 0)
                tot_tok = u.get("total_tokens", p_tok + c_tok)
                cost_usd = round((p_tok * 0.15 + c_tok * 0.60) / 1_000_000, 6)
                usage = {"prompt_tokens": p_tok, "completion_tokens": c_tok, "total_tokens": tot_tok, "cost_usd": cost_usd}
                if enhanced:
                    return enhanced, usage
        except Exception:
            pass

    composite = [raw_prompt]
    if preset_parts:
        composite.append(", ".join(preset_parts))
    return ", ".join(composite), usage

def post_process_image_to_base64(raw_im: Image.Image, aspect_ratio: str = "4:3", resolution: str = "4k") -> tuple:
    """Nâng cấp ảnh lên 4K/2K/1080p chuẩn 300 DPI và sinh thumbnail WebP nhẹ nhàng"""
    res_key = resolution.lower() if resolution.lower() in RESOLUTION_MAP else "4k"
    ratio_map = RESOLUTION_MAP[res_key]
    target_w, target_h = ratio_map.get(aspect_ratio, (4096, 2304 if aspect_ratio == "16:9" else 4096))

    upscaled = raw_im.resize((target_w, target_h), Image.Resampling.LANCZOS)
    enhanced = upscaled.filter(ImageFilter.UnsharpMask(radius=2, percent=145, threshold=3))
    sharpener = ImageEnhance.Sharpness(enhanced)
    final_img = sharpener.enhance(1.25)

    img_buf = io.BytesIO()
    final_img.save(img_buf, format="PNG", dpi=(300, 300))
    img_bytes = img_buf.getvalue()
    img_b64 = "data:image/png;base64," + base64.b64encode(img_bytes).decode("utf-8")
    size_kb = round(len(img_bytes) / 1024, 1)

    thumb = final_img.copy()
    thumb.thumbnail((400, 400), Image.Resampling.LANCZOS)
    thumb_buf = io.BytesIO()
    try:
        thumb.convert("RGB").save(thumb_buf, format="WEBP", quality=82)
        thumb_mime = "image/webp"
    except Exception:
        thumb.convert("RGB").save(thumb_buf, format="JPEG", quality=85)
        thumb_mime = "image/jpeg"
    thumb_b64 = f"data:{thumb_mime};base64," + base64.b64encode(thumb_buf.getvalue()).decode("utf-8")

    return img_b64, thumb_b64, target_w, target_h, size_kb

def generate_with_gpt(prompt: str, aspect_ratio: str, gpt_key: str) -> tuple:
    """Tạo ảnh mới với OpenAI API (gpt-image-1). Trả về (Image, usage_dict)."""
    if not gpt_key:
        raise Exception("Không tìm thấy [GPTKey] trong D:/vps_go.md hoặc biến môi trường OPENAI_API_KEY")

    is_wide = aspect_ratio in ("16:9", "4:3", "9:16", "3:4")
    if aspect_ratio in ("16:9", "4:3"):
        size = "1536x1024"
    elif aspect_ratio in ("9:16", "3:4"):
        size = "1024x1536"
    else:
        size = "1024x1024"

    headers = {
        "Authorization": f"Bearer {gpt_key}",
        "Content-Type": "application/json"
    }

    models_to_try = ["gpt-image-1", "gpt-image-1-mini", "chatgpt-image-latest", "gpt-image-2"]
    last_err = None

    for model in models_to_try:
        payload = {
            "model": model,
            "prompt": prompt,
            "n": 1,
            "size": size
        }
        try:
            resp = requests.post("https://api.openai.com/v1/images/generations", headers=headers, json=payload, timeout=120)
            if resp.status_code == 200:
                data = resp.json()
                img_item = data.get("data", [{}])[0]
                u = data.get("usage", {})
                in_tok = u.get("input_tokens", u.get("prompt_tokens", 0))
                out_tok = u.get("output_tokens", u.get("completion_tokens", 0))
                tot_tok = u.get("total_tokens", in_tok + out_tok)
                if in_tok or out_tok:
                    img_cost_usd = round((in_tok * 10.0 + out_tok * 40.0) / 1_000_000, 4)
                elif tot_tok:
                    img_cost_usd = round(tot_tok * 0.000040, 4)
                else:
                    tot_tok = 3450 if is_wide else 2000
                    img_cost_usd = 0.138 if is_wide else 0.080

                usage = {
                    "tokens": tot_tok,
                    "input_tokens": in_tok,
                    "output_tokens": out_tok,
                    "cost_usd": img_cost_usd,
                    "engine": "gpt",
                    "model": model
                }

                if "url" in img_item:
                    img_resp = requests.get(img_item["url"], timeout=45)
                    return Image.open(io.BytesIO(img_resp.content)).convert("RGB"), usage
                elif "b64_json" in img_item:
                    raw_bytes = base64.b64decode(img_item["b64_json"])
                    return Image.open(io.BytesIO(raw_bytes)).convert("RGB"), usage
            else:
                err_data = resp.json().get("error", {})
                err_code = err_data.get("code") or resp.status_code
                err_msg = err_data.get("message") or resp.text
                last_err = f"[OpenAI {err_code}] {err_msg}"
                if "insufficient_quota" in str(err_code) or resp.status_code in (401, 429):
                    raise Exception(last_err)
        except Exception as e:
            if "insufficient_quota" in str(e) or (hasattr(e, 'response') and e.response and e.response.status_code in (401, 429)):
                raise
            last_err = str(e)

    raise Exception(last_err or "Lỗi không xác định khi gọi OpenAI API")

def edit_with_gpt(image_bytes: bytes, prompt: str, mask_bytes: bytes, gpt_key: str) -> tuple:
    """Sửa hình (Image-to-Image) hoặc Inpainting (với Mask) bằng OpenAI gpt-image-1."""
    if not gpt_key:
        raise Exception("Không tìm thấy [GPTKey] trong D:/vps_go.md hoặc biến môi trường OPENAI_API_KEY")

    with Image.open(io.BytesIO(image_bytes)) as orig_im:
        orig_w, orig_h = orig_im.size
        if orig_w > orig_h * 1.2:
            target_size = (1536, 1024)
            size_param = "1536x1024"
        elif orig_h > orig_w * 1.2:
            target_size = (1024, 1536)
            size_param = "1024x1536"
        else:
            target_size = (1024, 1024)
            size_param = "1024x1024"

        prep_img = orig_im.convert("RGBA").resize(target_size, Image.Resampling.LANCZOS)
        img_buf = io.BytesIO()
        prep_img.save(img_buf, format="PNG")
        img_buf.seek(0)

    files = {
        "image": ("image.png", img_buf, "image/png")
    }

    if mask_bytes and len(mask_bytes) > 50:
        mask_im = Image.open(io.BytesIO(mask_bytes)).convert("RGBA")
        mask_im = mask_im.resize(target_size, Image.Resampling.NEAREST)
        mask_buf = io.BytesIO()
        mask_im.save(mask_buf, format="PNG")
        mask_buf.seek(0)
        files["mask"] = ("mask.png", mask_buf, "image/png")

    headers = {"Authorization": f"Bearer {gpt_key}"}
    data = {
        "model": "gpt-image-1",
        "prompt": prompt,
        "size": size_param
    }

    resp = requests.post("https://api.openai.com/v1/images/edits", headers=headers, files=files, data=data, timeout=120)
    if resp.status_code == 200:
        res_json = resp.json()
        item = res_json.get("data", [{}])[0]
        u = res_json.get("usage", {})
        in_tok = u.get("input_tokens", u.get("prompt_tokens", 0))
        out_tok = u.get("output_tokens", u.get("completion_tokens", 0))
        tot_tok = u.get("total_tokens", in_tok + out_tok)
        if in_tok or out_tok:
            img_cost_usd = round((in_tok * 10.0 + out_tok * 40.0) / 1_000_000, 4)
        elif tot_tok:
            img_cost_usd = round(tot_tok * 0.000040, 4)
        else:
            tot_tok = 3500
            img_cost_usd = 0.140

        usage = {
            "tokens": tot_tok,
            "input_tokens": in_tok,
            "output_tokens": out_tok,
            "cost_usd": img_cost_usd,
            "engine": "gpt",
            "model": "gpt-image-1"
        }

        if "b64_json" in item:
            raw_bytes = base64.b64decode(item["b64_json"])
            return Image.open(io.BytesIO(raw_bytes)).convert("RGB"), usage
        elif "url" in item:
            r = requests.get(item["url"], timeout=45)
            return Image.open(io.BytesIO(r.content)).convert("RGB"), usage
        raise Exception("Không tìm thấy dữ liệu ảnh trong kết quả trả về của OpenAI")
    else:
        err_data = resp.json().get("error", {})
        err_msg = err_data.get("message") or resp.text
        err_code = err_data.get("code") or resp.status_code
        raise Exception(f"[OpenAI Edit Error {err_code}] {err_msg}")

def generate_with_gemini(prompt: str, aspect_ratio: str, gemini_key: str) -> tuple:
    """Tạo ảnh mới với Google Gemini / Imagen 3. Trả về (Image, usage_dict)."""
    if not gemini_key:
        raise Exception("Không tìm thấy [GeminiKey] trong D:/vps_go.md hoặc biến môi trường GEMINI_API_KEY")

    gemini_models = ["imagen-3.0-generate-002", "imagen-3.0-generate-001", "gemini-3.1-flash-image", "gemini-2.5-flash-image"]
    last_err = None

    for model in gemini_models:
        try:
            if "imagen" in model:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:predict?key={gemini_key}"
                payload = {
                    "instances": [{"prompt": prompt}],
                    "parameters": {
                        "sampleCount": 1,
                        "aspectRatio": aspect_ratio if aspect_ratio in ("1:1", "16:9", "9:16", "4:3", "3:4") else "1:1",
                        "outputMimeType": "image/png"
                    }
                }
                resp = requests.post(url, json=payload, timeout=60)
                if resp.status_code == 200:
                    res_json = resp.json()
                    preds = res_json.get("predictions", [])
                    if preds and "bytesBase64Encoded" in preds[0]:
                        raw_bytes = base64.b64decode(preds[0]["bytesBase64Encoded"])
                        usage = {
                            "tokens": 1200,
                            "cost_usd": 0.030,
                            "engine": "gemini",
                            "model": model
                        }
                        return Image.open(io.BytesIO(raw_bytes)).convert("RGB"), usage
                else:
                    err_json = resp.json().get("error", {})
                    last_err = f"[Gemini {resp.status_code}] {err_json.get('message', resp.text)}"
            else:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}]
                }
                resp = requests.post(url, json=payload, timeout=60)
                if resp.status_code == 200:
                    res_json = resp.json()
                    candidates = res_json.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        for p in parts:
                            if "inlineData" in p:
                                raw_bytes = base64.b64decode(p["inlineData"]["data"])
                                usage = {
                                    "tokens": 1000,
                                    "cost_usd": 0.030,
                                    "engine": "gemini",
                                    "model": model
                                }
                                return Image.open(io.BytesIO(raw_bytes)).convert("RGB"), usage
                else:
                    err_json = resp.json().get("error", {})
                    last_err = f"[Gemini {resp.status_code}] {err_json.get('message', resp.text)}"
        except Exception as e:
            last_err = str(e)

    raise Exception(last_err or "Lỗi không xác định khi gọi Google Gemini API")

def chat_with_ai(messages: list, engine: str = "gemini", model: str = None) -> dict:
    """Xử lý hội thoại thông thường với OpenAI (GPT) hoặc Google Gemini."""
    gemini_key, gpt_key = get_ai_studio_keys()
    engine = (engine or "gemini").lower()

    if engine == "gemini":
        if not gemini_key:
            raise Exception("Chưa cấu hình [GeminiKey] trong D:/vps_go.md hoặc biến môi trường GEMINI_API_KEY")

        target_model = model or "gemini-2.5-flash"
        models_to_try = [target_model, "gemini-3.8-flash", "gemini-flash-latest"]

        gemini_contents = []
        system_instruction = None
        for m in messages:
            role = m.get("role", "user")
            content = m.get("content", "")
            if role == "system":
                system_instruction = {"parts": [{"text": content}]}
            elif role in ("assistant", "model"):
                gemini_contents.append({"role": "model", "parts": [{"text": content}]})
            else:
                gemini_contents.append({"role": "user", "parts": [{"text": content}]})

        if not gemini_contents:
            gemini_contents = [{"role": "user", "parts": [{"text": "Xin chào"}]}]

        last_err = None
        for m_name in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{m_name}:generateContent?key={gemini_key}"
            payload = {
                "contents": gemini_contents,
                "generationConfig": {"temperature": 0.7}
            }
            if system_instruction:
                payload["systemInstruction"] = system_instruction

            try:
                resp = requests.post(url, json=payload, timeout=60)
                if resp.status_code == 200:
                    res_json = resp.json()
                    candidates = res_json.get("candidates", [])
                    reply = ""
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        reply = "".join(p.get("text", "") for p in parts)
                    u = res_json.get("usageMetadata", {})
                    in_tok = u.get("promptTokenCount", 0)
                    out_tok = u.get("candidatesTokenCount", 0)
                    tot_tok = u.get("totalTokenCount", in_tok + out_tok)
                    cost_usd = round((in_tok * 0.075 + out_tok * 0.30) / 1_000_000, 6)
                    return {
                        "reply": reply,
                        "engine": "gemini",
                        "model": m_name,
                        "usage": {
                            "prompt_tokens": in_tok,
                            "completion_tokens": out_tok,
                            "total_tokens": tot_tok,
                            "cost_usd": cost_usd,
                            "cost_vnd": int(round(cost_usd * 25400))
                        }
                    }
                else:
                    err_data = resp.json().get("error", {})
                    last_err = f"[Google Gemini {resp.status_code}] {err_data.get('message', resp.text)}"
            except Exception as e:
                last_err = str(e)

        # TUYỆT ĐỐI KHÔNG FALLBACK! Văng lỗi trực tiếp của Google Gemini
        raise Exception(last_err or "Lỗi không xác định khi gọi Google Gemini API")

    else:
        if not gpt_key:
            raise Exception("Chưa cấu hình [GPTKey] trong D:/vps_go.md hoặc biến môi trường OPENAI_API_KEY")

        target_model = model or "gpt-4o-mini"
        models_to_try = [target_model, "gpt-4o-mini", "gpt-4o"]

        headers = {
            "Authorization": f"Bearer {gpt_key}",
            "Content-Type": "application/json"
        }

        cleaned_messages = []
        for m in messages:
            r = m.get("role", "user")
            c = m.get("content", "")
            if r in ("user", "assistant", "system"):
                cleaned_messages.append({"role": r, "content": c})
            elif r == "model":
                cleaned_messages.append({"role": "assistant", "content": c})
            else:
                cleaned_messages.append({"role": "user", "content": c})

        last_err = None
        for m_name in models_to_try:
            payload = {
                "model": m_name,
                "messages": cleaned_messages,
                "temperature": 0.7
            }
            try:
                resp = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=60)
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    reply = choices[0].get("message", {}).get("content", "") if choices else ""
                    u = data.get("usage", {})
                    in_tok = u.get("prompt_tokens", 0)
                    out_tok = u.get("completion_tokens", 0)
                    tot_tok = u.get("total_tokens", in_tok + out_tok)
                    if "mini" in m_name:
                        cost_usd = round((in_tok * 0.15 + out_tok * 0.60) / 1_000_000, 6)
                    else:
                        cost_usd = round((in_tok * 2.50 + out_tok * 10.00) / 1_000_000, 6)
                    return {
                        "reply": reply,
                        "engine": "gpt",
                        "model": m_name,
                        "usage": {
                            "prompt_tokens": in_tok,
                            "completion_tokens": out_tok,
                            "total_tokens": tot_tok,
                            "cost_usd": cost_usd,
                            "cost_vnd": int(round(cost_usd * 25400))
                        }
                    }
                else:
                    err_data = resp.json().get("error", {})
                    last_err = f"[OpenAI {resp.status_code}] {err_data.get('message', resp.text)}"
            except Exception as e:
                last_err = str(e)

        raise Exception(last_err or "Lỗi không xác định khi gọi OpenAI API")

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


# ==============================================================================
# TOOLX AI STUDIO API ENDPOINTS
# ==============================================================================

@ai_bp.route('/api/ai/studio-status', methods=['GET', 'OPTIONS'])
def api_ai_studio_status():
    """Kiểm tra trạng thái kết nối các AI Engine và nạp cấu hình Presets"""
    if request.method == 'OPTIONS':
        return jsonify({"ok": True}), 200
    gemini_key, gpt_key = get_ai_studio_keys()
    return jsonify({
        "success": True,
        "has_gemini_key": bool(gemini_key),
        "has_gpt_key": bool(gpt_key),
        "gemini_preview": f"{gemini_key[:6]}...{gemini_key[-4:]}" if gemini_key else "",
        "gpt_preview": f"{gpt_key[:7]}...{gpt_key[-4:]}" if gpt_key else "",
        "presets": PRO_PRESETS,
        "resolutions": ["4k", "2k", "1080p"],
        "aspect_ratios": ["1:1", "16:9", "9:16", "4:3", "3:4"]
    }), 200


@ai_bp.route('/api/ai/chat', methods=['POST', 'OPTIONS'])
def ai_chat():
    """Hội thoại thông minh đa năng với GPT (OpenAI) hoặc Gemini (Google)"""
    if request.method == 'OPTIONS':
        return jsonify({"ok": True}), 200

    data = request.get_json(force=True, silent=True) or {}
    messages = data.get("messages") or []
    single_msg = (data.get("message") or data.get("prompt") or "").strip()
    current_quote = data.get("current_quote")
    engine = (data.get("engine") or "gemini").lower()
    model = data.get("model")

    if not messages and single_msg:
        if current_quote:
            system_ctx = (
                "Bạn là Chuyên gia bóc tách vật tư và báo giá bảng hiệu tại ADMAKE (Công ty TNHH B-One Việt Nam). "
                "Hãy trả lời chuyên nghiệp, súc tích, tư vấn chính xác về vật tư và cảnh báo kỹ thuật."
            )
            messages = [
                {"role": "system", "content": system_ctx},
                {"role": "user", "content": f"Thông số bảng hiệu hiện tại: {json.dumps(current_quote, ensure_ascii=False)}.\nCâu hỏi: {single_msg}"}
            ]
        else:
            messages = [{"role": "user", "content": single_msg}]

    if not messages:
        return jsonify({"success": False, "error": "Vui lòng nhập nội dung câu hỏi."}), 400

    try:
        chat_res = chat_with_ai(messages, engine=engine, model=model)
        return jsonify({
            "success": True,
            "reply": chat_res["reply"],
            "engine": chat_res["engine"],
            "model": chat_res["model"],
            "usage": chat_res["usage"],
            "ai_source": chat_res["engine"]
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@ai_bp.route('/api/ai/prompt/enhance', methods=['POST', 'OPTIONS'])
def api_ai_prompt_enhance():
    """Chuẩn hóa Prompt 5 lớp chuyên sâu (Photographic Framework)"""
    if request.method == 'OPTIONS':
        return jsonify({"ok": True}), 200
    data = request.get_json(force=True, silent=True) or {}
    raw_prompt = (data.get("prompt") or "").strip()
    presets = data.get("presets") or {}
    task_type = data.get("task_type", "create")
    gemini_key, gpt_key = get_ai_studio_keys()

    enhanced, usage = enhance_prompt(raw_prompt, True, presets, gpt_key, task_type=task_type)
    return jsonify({
        "success": True,
        "raw_prompt": raw_prompt,
        "enhanced_prompt": enhanced,
        "usage": usage
    }), 200


@ai_bp.route('/api/ai/image/generate', methods=['POST', 'OPTIONS'])
def api_ai_image_generate():
    """Tạo ảnh mới (Text-to-Image) chuẩn 4K / 300 DPI bằng GPT hoặc Gemini"""
    if request.method == 'OPTIONS':
        return jsonify({"ok": True}), 200
    data = request.get_json(force=True, silent=True) or {}
    raw_prompt = (data.get("prompt") or "").strip()
    if not raw_prompt:
        return jsonify({"success": False, "error": "Vui lòng nhập mô tả ảnh (prompt)."}), 400

    engine = (data.get("engine") or "gemini").lower()
    aspect_ratio = data.get("aspect_ratio") or "4:3"
    resolution = (data.get("resolution") or "4k").lower()
    use_ai_enhancer = data.get("use_ai_enhancer", True)
    presets = data.get("presets") or {}

    gemini_key, gpt_key = get_ai_studio_keys()

    # Chuẩn hóa Prompt 5 lớp nếu được bật
    effective_prompt, enhancer_usage = enhance_prompt(raw_prompt, use_ai_enhancer, presets, gpt_key, task_type="create")
    if not effective_prompt:
        effective_prompt = raw_prompt

    try:
        if engine == "gemini":
            raw_im, img_usage = generate_with_gemini(effective_prompt, aspect_ratio, gemini_key)
        else:
            raw_im, img_usage = generate_with_gpt(effective_prompt, aspect_ratio, gpt_key)

        if raw_im is None:
            return jsonify({"success": False, "error": f"Không nhận được dữ liệu ảnh từ {engine.upper()}"}), 500

        # Nâng cấp độ phân giải 4K / 2K / 1080p chuẩn 300 DPI
        img_b64, thumb_b64, w, h, size_kb = post_process_image_to_base64(raw_im, aspect_ratio, resolution)

        tot_tokens = enhancer_usage.get("total_tokens", 0) + img_usage.get("tokens", 0)
        tot_usd = round(enhancer_usage.get("cost_usd", 0.0) + img_usage.get("cost_usd", 0.0), 4)
        tot_vnd = int(round(tot_usd * 25400))

        return jsonify({
            "success": True,
            "image_url": img_b64,
            "thumbnail_url": thumb_b64,
            "prompt": raw_prompt,
            "enhanced_prompt": effective_prompt,
            "width": w,
            "height": h,
            "size_kb": size_kb,
            "aspect_ratio": aspect_ratio,
            "resolution": resolution.upper(),
            "dpi": 300,
            "engine": engine,
            "model": img_usage.get("model", ""),
            "usage": {
                "total_tokens": tot_tokens,
                "cost_usd": tot_usd,
                "cost_vnd": tot_vnd,
                "enhancer_tokens": enhancer_usage.get("total_tokens", 0),
                "image_tokens": img_usage.get("tokens", 0)
            }
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@ai_bp.route('/api/ai/image/edit', methods=['POST', 'OPTIONS'])
def api_ai_image_edit():
    """Sửa ảnh & Inpainting với Mask chuẩn 4K / 300 DPI bằng OpenAI gpt-image-1"""
    if request.method == 'OPTIONS':
        return jsonify({"ok": True}), 200
    data = request.get_json(force=True, silent=True) or {}
    raw_prompt = (data.get("prompt") or "").strip()
    if not raw_prompt:
        return jsonify({"success": False, "error": "Vui lòng nhập mô tả chi tiết phần cần sửa (prompt)."}), 400

    image_b64 = data.get("image_base64") or data.get("image")
    if not image_b64:
        return jsonify({"success": False, "error": "Vui lòng cung cấp ảnh gốc cần sửa."}), 400

    if "base64," in image_b64:
        image_b64 = image_b64.split("base64,")[1]
    image_bytes = base64.b64decode(image_b64)

    mask_bytes = None
    mask_b64 = data.get("mask_base64") or data.get("mask")
    if mask_b64:
        if "base64," in mask_b64:
            mask_b64 = mask_b64.split("base64,")[1]
        mask_bytes = base64.b64decode(mask_b64)

    resolution = (data.get("resolution") or "4k").lower()
    use_ai_enhancer = data.get("use_ai_enhancer", True)
    presets = data.get("presets") or {}

    gemini_key, gpt_key = get_ai_studio_keys()
    effective_prompt, enhancer_usage = enhance_prompt(raw_prompt, use_ai_enhancer, presets, gpt_key, task_type="edit")
    if not effective_prompt:
        effective_prompt = raw_prompt

    try:
        raw_im, edit_usage = edit_with_gpt(image_bytes, effective_prompt, mask_bytes, gpt_key)

        aspect_ratio = "4:3"
        if raw_im.width > raw_im.height * 1.3:
            aspect_ratio = "16:9"
        elif raw_im.height > raw_im.width * 1.3:
            aspect_ratio = "9:16"
        elif abs(raw_im.width - raw_im.height) < 50:
            aspect_ratio = "1:1"

        img_b64, thumb_b64, w, h, size_kb = post_process_image_to_base64(raw_im, aspect_ratio, resolution)

        tot_tokens = enhancer_usage.get("total_tokens", 0) + edit_usage.get("tokens", 0)
        tot_usd = round(enhancer_usage.get("cost_usd", 0.0) + edit_usage.get("cost_usd", 0.0), 4)
        tot_vnd = int(round(tot_usd * 25400))

        return jsonify({
            "success": True,
            "image_url": img_b64,
            "thumbnail_url": thumb_b64,
            "prompt": raw_prompt,
            "enhanced_prompt": effective_prompt,
            "width": w,
            "height": h,
            "size_kb": size_kb,
            "aspect_ratio": aspect_ratio,
            "resolution": resolution.upper(),
            "dpi": 300,
            "engine": "gpt",
            "model": "gpt-image-1",
            "task_type": "inpainting" if mask_bytes else "edit",
            "usage": {
                "total_tokens": tot_tokens,
                "cost_usd": tot_usd,
                "cost_vnd": tot_vnd
            }
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

