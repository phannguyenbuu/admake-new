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
        "D:/vps.md",
        "D:/vps_go.md",
        "./vps.md",
        "./vps_go.md",
        "/opt/vps.md",
        "/opt/vps_go.md",
        "/root/vps.md",
        "/root/vps_go.md",
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "vps.md"),
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

        target_model = model or "gemini-3.6-flash"
        models_to_try = [target_model, "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash", "gemini-3.8-flash", "gemini-flash-latest"]

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
# ADMAKE AI STUDIO API ENDPOINTS
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


# ==============================================================================
# GENAI TOOLXPRINT API INTEGRATION & 3D SIGNBOARD WORKFLOW
# ==============================================================================
GENAI_BASE_URL = "https://genai.toolxprint.com"

SIGNBOARD_HINTS = [
    # --- 6 MẪU BẢNG HIỆU 3D CHUẨN TỪ THƯ VIỆN HÌNH ẢNH THỰC TẾ ---
    {
        "id": "sample_blade_yellow",
        "category": "mini",
        "title": "Biển vẫy hộp đèn gắn tường 2 mặt (1.2m x 0.5m)",
        "badge": "Biển vẫy",
        "image_url": "/signs/sign_blade_yellow.jpg",
        "dimensions": {"width": 1.2, "height": 0.5, "depth": 0.16},
        "description": "Biển vẫy chữ nhật 2 mặt nhô ra ngoài tường, khung nhôm định hình sơn đen nhám, mặt mica vàng nghệ xuyên sáng rực rỡ, chữ nổi đen bóng, chân bát sắt chữ L chịu lực gắn tường.",
        "materials": {
            "iron_type": "vuong_20",
            "surface_type": "mica_2_3mm",
            "has_led": True,
            "has_sheet_backing": False
        },
        "prompt": "Biển vẫy hộp đèn chữ nhật gắn tường 2 mặt phát sáng màu vàng rực rỡ kích thước 1.2m x 0.5m, khung nhôm đen sang trọng, chữ đen BEAUTIFUL SIGNBOARD gắn mặt tiền shop.",
        "elements": [
            {"name": "Chân bát sắt chữ L gắn tường", "type": "box", "position": [-0.62, 0, 0], "scale": [0.05, 0.4, 0.2], "color": "#18181b"},
            {"name": "Thanh giằng chịu lực", "type": "box", "position": [-0.56, 0, 0], "scale": [0.12, 0.08, 0.08], "color": "#27272a"},
            {"name": "Khung viền nhôm đen bao quanh", "type": "box", "position": [0.05, 0, 0], "scale": [1.22, 0.52, 0.16], "color": "#18181b"},
            {"name": "Mặt mica vàng phát sáng (Mặt trước)", "type": "box", "position": [0.05, 0, 0.082], "scale": [1.18, 0.48, 0.01], "color": "#facc15"},
            {"name": "Mặt mica vàng phát sáng (Mặt sau)", "type": "box", "position": [0.05, 0, -0.082], "scale": [1.18, 0.48, 0.01], "color": "#facc15"},
            {"name": "Bộ chữ nổi SIGNBOARD (Mặt trước)", "type": "box", "position": [0.05, 0.04, 0.09], "scale": [0.85, 0.18, 0.015], "color": "#09090b"},
            {"name": "Bộ chữ nổi SIGNBOARD (Mặt sau)", "type": "box", "position": [0.05, 0.04, -0.09], "scale": [0.85, 0.18, 0.015], "color": "#09090b"},
            {"name": "Dòng chữ phụ EASY EDIT MOCKUP", "type": "box", "position": [0.05, -0.12, 0.09], "scale": [0.65, 0.07, 0.01], "color": "#18181b"}
        ]
    },
    {
        "id": "sample_facade_wood",
        "category": "storefront",
        "title": "Hộp đèn mặt tiền nằm ngang gắn dựng lam gỗ (3.2m x 1.1m)",
        "badge": "Mặt tiền",
        "image_url": "/signs/sign_facade_wood.jpg",
        "dimensions": {"width": 3.2, "height": 1.1, "depth": 0.22},
        "description": "Hộp đèn mặt tiền nằm ngang bố trí trên nền lam gỗ ngoài trời sang trọng, khung viền nhôm định hình mạ đồng tối, mặt bạt 3M hoặc mica vàng chanh chiếu sáng LED đều mặt, chữ nổi đen & đỏ.",
        "materials": {
            "iron_type": "vuong_25",
            "surface_type": "bat_3m_uv",
            "has_led": True,
            "has_sheet_backing": True
        },
        "prompt": "Bảng hiệu hộp đèn mặt tiền nằm ngang 3.2m x 1.1m phát sáng vàng chanh chữ nổi SIGNBOARD gắn trên nền lam gỗ tự nhiên sang trọng phía trên cửa showroom.",
        "elements": [
            {"name": "Vách ốp lam gỗ nền tường", "type": "box", "position": [0, 0, -0.15], "scale": [4.0, 1.8, 0.04], "color": "#92400e"},
            {"name": "Khung viền nhôm nẹp hộp đèn", "type": "box", "position": [0, 0, 0], "scale": [3.24, 1.14, 0.22], "color": "#292524"},
            {"name": "Mặt hộp đèn vàng chanh phát sáng", "type": "box", "position": [0, 0, 0.112], "scale": [3.18, 1.08, 0.01], "color": "#eab308"},
            {"name": "Chữ SIGN màu đen nổi bật", "type": "box", "position": [-0.7, 0.05, 0.125], "scale": [1.1, 0.42, 0.02], "color": "#0f172a"},
            {"name": "Chữ O màu đỏ thương hiệu", "type": "cylinder", "position": [0.0, 0.05, 0.125], "scale": [0.45, 0.02, 0.45], "color": "#dc2626"},
            {"name": "Chữ BOARD màu đen tiếp nối", "type": "box", "position": [0.75, 0.05, 0.125], "scale": [1.15, 0.42, 0.02], "color": "#0f172a"},
            {"name": "Tiêu đề nhỏ PSD MOCKUP phía trên", "type": "box", "position": [0, 0.35, 0.12], "scale": [0.8, 0.08, 0.01], "color": "#334155"}
        ]
    },
    {
        "id": "sample_starbucks_awning",
        "category": "storefront",
        "title": "Mặt tiền chuỗi ốp alu đen + Chữ 3D LED + Mái che (8.5m x 2.0m)",
        "badge": "Mặt tiền chuỗi",
        "image_url": "/signs/sign_starbucks_awning.jpg",
        "dimensions": {"width": 8.5, "height": 2.0, "depth": 0.35},
        "description": "Mặt dựng alu Alcorest màu xám đen ngoài trời, bộ chữ nổi 3D lớn màu trắng sữa uốn nổi phát sáng mặt, kết hợp mái che vòm bạt xanh lá đậm in thương hiệu cho quán cafe / nhà hàng.",
        "materials": {
            "iron_type": "vuong_30",
            "surface_type": "alu_3mm",
            "has_led": True,
            "has_sheet_backing": True
        },
        "prompt": "Mặt tiền thương hiệu cafe chuỗi 8.5m x 2.0m ốp alu đen nhám cao cấp, chữ nổi 3D màu trắng sữa phát sáng LED rực rỡ, kèm mái che vòm di động xanh lục phong cách châu Âu.",
        "elements": [
            {"name": "Khung xương sắt hộp 30x30", "type": "box", "position": [0, 0, -0.05], "scale": [8.5, 2.0, 0.06], "color": "#334155"},
            {"name": "Tấm ốp Alu Alcorest đen nhám ngoài trời", "type": "box", "position": [0, 0, 0], "scale": [8.5, 2.0, 0.02], "color": "#1e293b"},
            {"name": "Bộ chữ nổi STARBUCKS COFFEE 3D phát sáng", "type": "box", "position": [0, 0.25, 0.12], "scale": [6.8, 0.75, 0.18], "color": "#f8fafc"},
            {"name": "Mái che vòm di động màu xanh (Trái)", "type": "box", "position": [-2.3, -1.0, 0.55], "scale": [3.6, 0.6, 1.1], "color": "#14532d"},
            {"name": "Mái che vòm di động màu xanh (Phải)", "type": "box", "position": [2.3, -1.0, 0.55], "scale": [3.6, 0.6, 1.1], "color": "#14532d"},
            {"name": "Dải chữ thương hiệu STARBUCKS viền mái", "type": "box", "position": [-2.3, -1.2, 1.05], "scale": [2.8, 0.18, 0.02], "color": "#ffffff"}
        ]
    },
    {
        "id": "sample_spa_gold_plaque",
        "category": "mini",
        "title": "Biển công ty / Spa Dental cao cấp 4 ốc chân kính Inox (0.8m x 0.6m)",
        "badge": "Biển nhỏ",
        "image_url": "/signs/sign_spa_gold_plaque.jpg",
        "dimensions": {"width": 0.8, "height": 0.6, "depth": 0.05},
        "description": "Biển công ty / nha khoa spa sang trọng tấm nền mica đen mờ, 4 ốc chân kính inox 304 giữ cách tường 2cm, logo hoa sen và bộ chữ nổi Inox mạ vàng gương 3D sắc nét.",
        "materials": {
            "iron_type": "vuong_20",
            "surface_type": "alu_guong_vang",
            "has_led": False,
            "has_sheet_backing": False
        },
        "prompt": "Biển tên công ty Dental Spa 0.8m x 0.6m tấm nền mica đen mờ, 4 ốc chân kính inox sáng loáng, logo hoa sen và chữ nổi inox vàng gương 3D cao cấp gắn sảnh tiếp tân.",
        "elements": [
            {"name": "Tấm nền mica đen mờ vát góc", "type": "box", "position": [0, 0, 0.02], "scale": [0.8, 0.6, 0.012], "color": "#18181b"},
            {"name": "Ốc chân kính Inox góc trên trái", "type": "cylinder", "position": [-0.35, 0.25, 0.015], "scale": [0.03, 0.03, 0.03], "color": "#e2e8f0"},
            {"name": "Ốc chân kính Inox góc trên phải", "type": "cylinder", "position": [0.35, 0.25, 0.015], "scale": [0.03, 0.03, 0.03], "color": "#e2e8f0"},
            {"name": "Ốc chân kính Inox góc dưới trái", "type": "cylinder", "position": [-0.35, -0.25, 0.015], "scale": [0.03, 0.03, 0.03], "color": "#e2e8f0"},
            {"name": "Ốc chân kính Inox góc dưới phải", "type": "cylinder", "position": [0.35, -0.25, 0.015], "scale": [0.03, 0.03, 0.03], "color": "#e2e8f0"},
            {"name": "Logo hoa sen 3D Inox vàng gương", "type": "box", "position": [0, 0.12, 0.035], "scale": [0.26, 0.24, 0.02], "color": "#fbbf24"},
            {"name": "Bộ chữ nổi AHIMSA 3D Inox vàng gương", "type": "box", "position": [0, -0.07, 0.035], "scale": [0.55, 0.14, 0.02], "color": "#f59e0b"},
            {"name": "Dòng chữ phụ DENTAL SPA", "type": "box", "position": [0, -0.18, 0.03], "scale": [0.32, 0.05, 0.01], "color": "#d97706"}
        ]
    },
    {
        "id": "sample_3d_led_dual_glow",
        "category": "storefront",
        "title": "Bảng hiệu 3D LED sáng mặt & hắt hào quang chân chữ (4.5m x 1.2m)",
        "badge": "Mặt tiền LED",
        "image_url": "/signs/sign_3d_led_dual_glow.jpg",
        "dimensions": {"width": 4.5, "height": 1.2, "depth": 0.22},
        "description": "Bảng hiệu shop thời trang boutique ngoài trời ban đêm, nền alu đen tuyền, bộ chữ 3D SIGNAGE ánh sáng kép siêu nổi bật (mặt mica sáng trắng lạnh + hắt hào quang chân chữ halo-lit viền alu).",
        "materials": {
            "iron_type": "vuong_25",
            "surface_type": "alu_3mm",
            "has_led": True,
            "has_sheet_backing": True
        },
        "prompt": "Bảng hiệu mặt tiền shop thời trang cao cấp ban đêm 4.5m x 1.2m ốp alu đen tuyền, chữ nổi 3D SIGNAGE ánh sáng trắng kép LED sáng mặt và tỏa hào quang chân chữ cực kỳ nổi bật.",
        "elements": [
            {"name": "Khung sắt chịu lực 25x25", "type": "box", "position": [0, 0, -0.04], "scale": [4.5, 1.2, 0.05], "color": "#27272a"},
            {"name": "Mặt ốp Alu ngoài trời đen tuyền", "type": "box", "position": [0, 0, 0], "scale": [4.5, 1.2, 0.02], "color": "#09090b"},
            {"name": "Lớp hào quang LED hắt chân (Halo backlight)", "type": "box", "position": [0, 0.05, 0.025], "scale": [3.7, 0.65, 0.015], "color": "#38bdf8"},
            {"name": "Bộ chữ nổi 3D SIGNAGE phát sáng mặt trắng", "type": "box", "position": [0, 0.05, 0.08], "scale": [3.5, 0.55, 0.09], "color": "#ffffff"},
            {"name": "Mép nẹp viền bảo vệ mặt bảng", "type": "box", "position": [0, 0.59, 0.02], "scale": [4.52, 0.04, 0.05], "color": "#18181b"}
        ]
    },
    {
        "id": "sample_office_backdrop",
        "category": "storefront",
        "title": "Bộ chữ nổi 3D dán trực tiếp vách lễ tân văn phòng (3.0m x 1.2m)",
        "badge": "Nội thất văn phòng",
        "image_url": "/signs/sign_office_backdrop.jpg",
        "dimensions": {"width": 3.0, "height": 1.2, "depth": 0.08},
        "description": "Logo biểu tượng chữ X và bộ chữ nổi 3D gắn trực tiếp lên tường vách lễ tân văn phòng công nghệ, phối hai tông màu xám than sang trọng và xanh cyan công nghệ hiện đại.",
        "materials": {
            "iron_type": "vuong_20",
            "surface_type": "alu_3mm",
            "has_led": False,
            "has_sheet_backing": False
        },
        "prompt": "Bộ chữ nổi 3D gắn trực tiếp lên vách tường lễ tân văn phòng công nghệ 3.0m x 1.2m, logo và chữ mica dày 15mm phối hai màu xám than sang trọng và xanh cyan hiện đại.",
        "elements": [
            {"name": "Vách tường văn phòng lễ tân màu sáng", "type": "box", "position": [0, 0, -0.02], "scale": [3.8, 1.8, 0.04], "color": "#f1f5f9"},
            {"name": "Biểu tượng Logo chữ X màu xanh cyan", "type": "box", "position": [-1.0, 0.15, 0.035], "scale": [0.35, 0.35, 0.04], "color": "#0284c7"},
            {"name": "Cụm chữ 3D big switch màu xám than", "type": "box", "position": [0.15, 0.15, 0.035], "scale": [1.8, 0.38, 0.04], "color": "#334155"},
            {"name": "Cụm chữ 3D networks màu xanh cyan", "type": "box", "position": [0.15, -0.22, 0.03], "scale": [1.6, 0.26, 0.035], "color": "#0ea5e9"},
            {"name": "Chân đệm nổi 15mm tạo bóng đổ", "type": "box", "position": [0.15, 0, 0.005], "scale": [2.2, 0.7, 0.015], "color": "#cbd5e1"}
        ]
    },
    {
        "id": "sample_acrylic_transparent",
        "category": "mini",
        "title": "Biển công ty mica trong suốt 4 ốc chân kính Inox (1.0m x 0.8m)",
        "badge": "Biển công ty",
        "image_url": "/signs/sign_acrylic_transparent.jpg",
        "dimensions": {"width": 1.0, "height": 0.8, "depth": 0.05},
        "description": "Tấm acrylic / mica trong suốt cao cấp dày 8mm mài bóng cạnh kim cương, bắt 4 ốc chân kính Inox 304 giữ cách tường 25mm, in UV mặt sau logo HealthWave sắc nét.",
        "materials": {
            "iron_type": "vuong_20",
            "surface_type": "mica_2_3mm",
            "has_led": False,
            "has_sheet_backing": False
        },
        "prompt": "Biển tên công ty chăm sóc sức khỏe HealthWave 1.0m x 0.8m tấm nền mica trong suốt bắt 4 ốc chân kính inox sáng loáng gắn tường sảnh hiện đại.",
        "elements": [
            {"name": "Tấm nền mica trong suốt dày 8mm", "type": "box", "position": [0, 0, 0.02], "scale": [1.0, 0.8, 0.012], "color": "#e2e8f0"},
            {"name": "Ốc chân kính Inox góc trên trái", "type": "cylinder", "position": [-0.44, 0.34, 0.015], "scale": [0.035, 0.035, 0.035], "color": "#cbd5e1"},
            {"name": "Ốc chân kính Inox góc trên phải", "type": "cylinder", "position": [0.44, 0.34, 0.015], "scale": [0.035, 0.035, 0.035], "color": "#cbd5e1"},
            {"name": "Ốc chân kính Inox góc dưới trái", "type": "cylinder", "position": [-0.44, -0.34, 0.015], "scale": [0.035, 0.035, 0.035], "color": "#cbd5e1"},
            {"name": "Ốc chân kính Inox góc dưới phải", "type": "cylinder", "position": [0.44, -0.34, 0.015], "scale": [0.035, 0.035, 0.035], "color": "#cbd5e1"},
            {"name": "Logo mầm cây cam & xanh", "type": "box", "position": [0, 0.12, 0.03], "scale": [0.32, 0.32, 0.01], "color": "#ea580c"},
            {"name": "Chữ thương hiệu HealthWave", "type": "box", "position": [0, -0.16, 0.03], "scale": [0.65, 0.14, 0.01], "color": "#0f172a"},
            {"name": "Dòng slogan YOUR BUSINESS TAGLINE", "type": "box", "position": [0, -0.26, 0.03], "scale": [0.55, 0.05, 0.008], "color": "#475569"}
        ]
    },
    {
        "id": "sample_mixue_red_facade",
        "category": "storefront",
        "title": "Hộp đèn mặt tiền chuỗi kem trà sữa Mixue (6.5m x 1.4m)",
        "badge": "Mặt tiền chuỗi",
        "image_url": "/signs/sign_mixue_red_facade.jpg",
        "dimensions": {"width": 6.5, "height": 1.4, "depth": 0.25},
        "description": "Hộp đèn mặt tiền chuỗi kem trà sữa Mixue, mặt bạt 3M hoặc bạt không gân in UV màu đỏ tươi rực rỡ, chiếu sáng xuyên đèn LED mô đun siêu sáng bên trong, logo Người tuyết và chữ MIXUE phát sáng trắng.",
        "materials": {
            "iron_type": "vuong_25",
            "surface_type": "bat_3m_uv",
            "has_led": True,
            "has_sheet_backing": True
        },
        "prompt": "Bảng hiệu hộp đèn mặt tiền chuỗi kem trà sữa Mixue 6.5m x 1.4m màu đỏ rực rỡ ban đêm, logo Người tuyết đội vương miện cầm kem và chữ MIXUE sáng rực.",
        "elements": [
            {"name": "Khung xương sắt hộp 25x25", "type": "box", "position": [0, 0, -0.05], "scale": [6.5, 1.4, 0.06], "color": "#334155"},
            {"name": "Hộp đèn mặt bạt đỏ rực phát sáng", "type": "box", "position": [0, 0, 0], "scale": [6.5, 1.4, 0.22], "color": "#dc2626"},
            {"name": "Logo Người tuyết Mixue (Trái)", "type": "box", "position": [-2.0, 0, 0.12], "scale": [0.9, 1.1, 0.02], "color": "#ffffff"},
            {"name": "Vương miện & Cây kem", "type": "box", "position": [-2.3, 0.2, 0.13], "scale": [0.2, 0.5, 0.02], "color": "#facc15"},
            {"name": "Cụm chữ MIXUE nổi bật màu trắng", "type": "box", "position": [0.8, 0.18, 0.12], "scale": [3.6, 0.65, 0.02], "color": "#ffffff"},
            {"name": "Dòng chữ SINCE 1997 ICE CREAM & TEA", "type": "box", "position": [0.8, -0.28, 0.12], "scale": [3.4, 0.2, 0.015], "color": "#ffffff"},
            {"name": "Biển vẫy phụ bên hông", "type": "box", "position": [3.45, 0.1, 0.4], "scale": [0.5, 0.9, 0.12], "color": "#b91c1c"}
        ]
    },
    {
        "id": "sample_lightbox_spotlights",
        "category": "storefront",
        "title": "Hộp đèn đỏ mặt tiền kèm dàn 5 đèn rọi Gooseneck (4.2m x 1.2m)",
        "badge": "Hộp đèn + Đèn rọi",
        "image_url": "/signs/sign_lightbox_spotlights.jpg",
        "dimensions": {"width": 4.2, "height": 1.2, "depth": 0.25},
        "description": "Hộp đèn mặt tiền ốp alu đỏ tươi kết hợp đèn LED bên trong, phía trên gắn dàn 5 cần đèn rọi spotlight kim loại uốn cong rọi thẳng vào bề mặt bảng hiệu tạo hiệu ứng kiến trúc cao cấp.",
        "materials": {
            "iron_type": "vuong_25",
            "surface_type": "alu_3mm",
            "has_led": True,
            "has_sheet_backing": True
        },
        "prompt": "Bảng hiệu hộp đèn màu đỏ tươi 4.2m x 1.2m gắn trên tường tôn xám đen sang trọng, phía trên có dàn 5 đèn rọi spotlight vươn ra chiếu sáng rực rỡ chữ Sign Board Mockup.",
        "elements": [
            {"name": "Nền tường ốp tôn xám than", "type": "box", "position": [0, 0, -0.1], "scale": [5.2, 2.0, 0.05], "color": "#1e293b"},
            {"name": "Hộp đèn alu đỏ", "type": "box", "position": [0, 0, 0], "scale": [4.2, 1.2, 0.22], "color": "#dc2626"},
            {"name": "Chữ Sign Board (Dòng 1)", "type": "box", "position": [-0.6, 0.22, 0.12], "scale": [2.2, 0.35, 0.02], "color": "#ffffff"},
            {"name": "Chữ Mockup (Dòng 2)", "type": "box", "position": [-0.7, -0.15, 0.12], "scale": [1.9, 0.32, 0.02], "color": "#ffffff"},
            {"name": "Đèn rọi 1", "type": "box", "position": [-1.6, 0.72, 0.15], "scale": [0.08, 0.18, 0.3], "color": "#0f172a"},
            {"name": "Đèn rọi 2", "type": "box", "position": [-0.8, 0.72, 0.15], "scale": [0.08, 0.18, 0.3], "color": "#0f172a"},
            {"name": "Đèn rọi 3", "type": "box", "position": [0.0, 0.72, 0.15], "scale": [0.08, 0.18, 0.3], "color": "#0f172a"},
            {"name": "Đèn rọi 4", "type": "box", "position": [0.8, 0.72, 0.15], "scale": [0.08, 0.18, 0.3], "color": "#0f172a"},
            {"name": "Đèn rọi 5", "type": "box", "position": [1.6, 0.72, 0.15], "scale": [0.08, 0.18, 0.3], "color": "#0f172a"}
        ]
    },
    {
        "id": "sample_blade_hanging_vintage",
        "category": "mini",
        "title": "Biển vẫy treo thanh giằng sắt nghệ thuật Châu Âu (0.7m x 0.9m)",
        "badge": "Biển vẫy Vintage",
        "image_url": "/signs/sign_blade_hanging_vintage.jpg",
        "dimensions": {"width": 0.7, "height": 0.9, "depth": 0.08},
        "description": "Biển vẫy phong cách cổ điển Châu Âu thả treo từ thanh sắt hộp ngang gắn vuông góc tường đá, mặt biển tấm kim loại/alu màu đen nhám hình chữ nhật đứng, chữ trắng tinh tế sang trọng.",
        "materials": {
            "iron_type": "vuong_20",
            "surface_type": "alu_3mm",
            "has_led": False,
            "has_sheet_backing": False
        },
        "prompt": "Biển vẫy treo tường thanh sắt ngang phong cách Châu Âu cổ điển 0.7m x 0.9m màu đen nhám mờ, chữ trắng Storefront SIGNS gắn trên mặt tiền phố cổ Paris.",
        "elements": [
            {"name": "Bát sắt gắn tường", "type": "box", "position": [-0.42, 0.48, 0], "scale": [0.06, 0.25, 0.12], "color": "#18181b"},
            {"name": "Thanh treo sắt ngang chịu lực", "type": "box", "position": [0, 0.5, 0], "scale": [0.85, 0.05, 0.05], "color": "#18181b"},
            {"name": "Móc treo thả biển (Trái)", "type": "box", "position": [-0.22, 0.42, 0], "scale": [0.03, 0.12, 0.03], "color": "#27272a"},
            {"name": "Móc treo thả biển (Phải)", "type": "box", "position": [0.22, 0.42, 0], "scale": [0.03, 0.12, 0.03], "color": "#27272a"},
            {"name": "Tấm biển đen nhám đứng", "type": "box", "position": [0, -0.08, 0], "scale": [0.7, 0.9, 0.04], "color": "#18181b"},
            {"name": "Chữ Storefront SIGNS", "type": "box", "position": [0, -0.05, 0.025], "scale": [0.55, 0.3, 0.01], "color": "#f8fafc"},
            {"name": "Logo tagline nhỏ phía dưới", "type": "box", "position": [0, -0.38, 0.025], "scale": [0.3, 0.05, 0.008], "color": "#94a3b8"}
        ]
    },
    {
        "id": "sample_halo_gold_green",
        "category": "storefront",
        "title": "Bảng hiệu chữ Inox vàng gương hắt chân hào quang LED nền xanh ngọc (2.8m x 1.4m)",
        "badge": "LED Hào quang",
        "image_url": "/signs/sign_halo_gold_green.jpg",
        "dimensions": {"width": 2.8, "height": 1.4, "depth": 0.15},
        "description": "Mặt bảng hiệu ốp tấm màu xanh ngọc / ngọc lục bảo mờ cao cấp, bộ chữ nổi nghệ thuật uốn inox vàng gương chân mica cháo hắt hào quang ánh sáng vàng ấm 3000K tỏa xung quanh chân chữ.",
        "materials": {
            "iron_type": "vuong_25",
            "surface_type": "alu_guong_vang",
            "has_led": True,
            "has_sheet_backing": True
        },
        "prompt": "Bảng hiệu chữ nổi inox mạ vàng gương 3D uốn cong mềm mại phát sáng hào quang LED vàng ấm tỏa quanh chân chữ trên nền xanh ngọc lục bảo sang trọng tuyệt đẹp.",
        "elements": [
            {"name": "Nền tấm bảng màu xanh ngọc", "type": "box", "position": [0, 0, 0], "scale": [2.8, 1.4, 0.04], "color": "#34d399"},
            {"name": "Lớp hào quang LED vàng ấm hắt chân", "type": "box", "position": [0, 0.02, 0.025], "scale": [2.3, 0.95, 0.015], "color": "#fef08a"},
            {"name": "Bộ chữ Inox vàng gương Skywow", "type": "box", "position": [0, 0.02, 0.06], "scale": [2.15, 0.85, 0.05], "color": "#eab308"},
            {"name": "Biểu tượng ống kính vàng gương", "type": "cylinder", "position": [-0.1, 0.22, 0.08], "scale": [0.15, 0.45, 0.15], "color": "#ca8a04"}
        ]
    },
    {
        "id": "sample_cnc_cutout_industrial",
        "category": "mini",
        "title": "Hộp đèn Alu phay xước khoét CNC lộng âm mica phát sáng (0.7m x 0.55m)",
        "badge": "Alu CNC lộng âm",
        "image_url": "/signs/sign_cnc_cutout_industrial.jpg",
        "dimensions": {"width": 0.7, "height": 0.55, "depth": 0.12},
        "description": "Hộp đèn kim loại phong cách công nghiệp (Industrial Vintage), vỏ alu xám đen phay xước khoét CNC chính xác logo THEGARA và thông tin giờ mở cửa, lót mica sữa trắng xuyên sáng từ dàn LED bên trong.",
        "materials": {
            "iron_type": "vuong_20",
            "surface_type": "alu_3mm",
            "has_led": True,
            "has_sheet_backing": True
        },
        "prompt": "Hộp đèn phong cách công nghiệp alu đen mờ phay xước khoét CNC lộng âm chữ THEGARA phát sáng trắng xuyên đèn LED trong đêm.",
        "elements": [
            {"name": "Thùng hộp đèn alu đen phay xước", "type": "box", "position": [0, 0, 0], "scale": [0.7, 0.55, 0.12], "color": "#27272a"},
            {"name": "Cụm chữ THEGARA CNC lộng âm phát sáng", "type": "box", "position": [0, 0.1, 0.062], "scale": [0.55, 0.15, 0.005], "color": "#ffffff"},
            {"name": "Dòng chữ CURATED GARMENTS & COLLECTIBLES", "type": "box", "position": [0, 0.02, 0.062], "scale": [0.48, 0.04, 0.005], "color": "#f1f5f9"},
            {"name": "Thông tin giờ mở cửa TUES - SUN 11AM - 9PM", "type": "box", "position": [0, -0.14, 0.062], "scale": [0.28, 0.08, 0.005], "color": "#e2e8f0"}
        ]
    },
    {
        "id": "sample_blade_coral_white",
        "category": "mini",
        "title": "Biển vẫy chữ nhật viền nhôm trắng mặt đỏ san hô (1.1m x 0.55m)",
        "badge": "Biển vẫy hiện đại",
        "image_url": "/signs/sign_blade_coral_white.jpg",
        "dimensions": {"width": 1.1, "height": 0.55, "depth": 0.15},
        "description": "Biển vẫy 2 mặt hộp đèn chữ nhật nằm ngang phong cách hiện đại, khung viền nhôm định hình sơn trắng sứ bo viền sang trọng, mặt mica màu đỏ san hô phát sáng 2 mặt, chân bát bát giữ hông tường/kính.",
        "materials": {
            "iron_type": "vuong_20",
            "surface_type": "mica_2_3mm",
            "has_led": True,
            "has_sheet_backing": False
        },
        "prompt": "Biển vẫy hộp đèn chữ nhật nằm ngang 1.1m x 0.55m viền nhôm trắng sữa tinh tế, mặt mica đỏ san hô sáng rực chữ SignBoard Storefront Mockup gắn mặt tiền phố hiện đại.",
        "elements": [
            {"name": "Bát gắn tường/kính chịu lực", "type": "box", "position": [-0.58, 0, 0], "scale": [0.06, 0.35, 0.18], "color": "#e2e8f0"},
            {"name": "Khung viền nhôm định hình sơn trắng", "type": "box", "position": [0, 0, 0], "scale": [1.12, 0.57, 0.15], "color": "#ffffff"},
            {"name": "Mặt mica đỏ san hô (Mặt trước)", "type": "box", "position": [0, 0, 0.076], "scale": [1.08, 0.53, 0.01], "color": "#f43f5e"},
            {"name": "Mặt mica đỏ san hô (Mặt sau)", "type": "box", "position": [0, 0, -0.076], "scale": [1.08, 0.53, 0.01], "color": "#f43f5e"},
            {"name": "Chữ SignBoard Storefront Mockup (Mặt trước)", "type": "box", "position": [0, 0.02, 0.082], "scale": [0.75, 0.28, 0.01], "color": "#ffffff"},
            {"name": "Chữ SignBoard Storefront Mockup (Mặt sau)", "type": "box", "position": [0, 0.02, -0.082], "scale": [0.75, 0.28, 0.01], "color": "#ffffff"}
        ]
    },
    {
        "id": "sample_facade_orange_brick",
        "category": "storefront",
        "title": "Hộp đèn mặt tiền màu cam đỏ gắn tường gạch hiện đại (2.6m x 0.95m)",
        "badge": "Mặt tiền hộp đèn",
        "image_url": "/signs/sign_facade_orange_brick.jpg",
        "dimensions": {"width": 2.6, "height": 0.95, "depth": 0.2},
        "description": "Hộp đèn mặt tiền chữ nhật nằm ngang trên nền tường gạch xám hiện đại, khung kim loại màu xám than sang trọng, bề mặt mica/bạt 3M màu cam đỏ phát sáng ấm áp, chữ trắng SignBoard Mockup nổi bật.",
        "materials": {
            "iron_type": "vuong_25",
            "surface_type": "bat_3m_uv",
            "has_led": True,
            "has_sheet_backing": True
        },
        "prompt": "Bảng hiệu hộp đèn mặt tiền nằm ngang màu cam đỏ rực rỡ 2.6m x 0.95m chữ trắng SignBoard Mockup gắn trên tường gạch xám hiện đại lúc hoàng hôn.",
        "elements": [
            {"name": "Nền tường gạch xám", "type": "box", "position": [0, 0, -0.12], "scale": [3.4, 1.6, 0.05], "color": "#78716c"},
            {"name": "Khung hộp đèn xám than", "type": "box", "position": [0, 0, 0], "scale": [2.64, 0.99, 0.2], "color": "#292524"},
            {"name": "Mặt hộp đèn màu cam đỏ phát sáng", "type": "box", "position": [0, 0, 0.102], "scale": [2.58, 0.93, 0.01], "color": "#f97316"},
            {"name": "Bộ chữ SignBoard Mockup trắng nổi bật", "type": "box", "position": [0, 0, 0.115], "scale": [1.8, 0.35, 0.02], "color": "#ffffff"}
        ]
    },
    # 15. Billboard cao tốc 1 cột thép tròn giàn không gian (Ảnh 1.webp)
    {
        "id": "sample_billboard_highway_green",
        "category": "billboard",
        "title": "Billboard cao tốc 1 cột thép tròn giàn không gian (14m x 7m cao 16m)",
        "badge": "Billboard cao tốc",
        "image_url": "/signs/sign_billboard_highway_green.jpg",
        "dimensions": {"width": 14.0, "height": 7.0, "depth": 1.2},
        "description": "Biển quảng cáo tấm lớn một cột trụ thép tròn D1200 sơn trắng chịu bão cấp 12, giàn không gian thép đan chéo đỡ sàn catwalk kỹ thuật, mặt bạt 3M hoặc màn hình LED xanh lá cây chroma key, có dàn 6 đèn pha LED 200W chiếu sáng đỉnh.",
        "materials": {
            "iron_type": "vuong_30",
            "surface_type": "bat_3m_uv",
            "has_led": True,
            "has_sheet_backing": False
        },
        "prompt": "Billboard tấm lớn một cột trụ thép trắng tròn cao 16m kích thước 14m x 7m bên cạnh đường cao tốc trên cao, giàn không gian kim loại vững chắc.",
        "elements": [
            {"name": "Cột trụ thép tròn D1200", "type": "cylinder", "position": [0, -4.5, -0.3], "scale": [1.2, 9.0, 1.2], "color": "#f1f5f9"},
            {"name": "Giàn không gian thép đỡ sàn", "type": "box", "position": [0, -0.2, -0.2], "scale": [14.2, 0.8, 1.2], "color": "#94a3b8"},
            {"name": "Mặt bảng pano bạt 3M", "type": "box", "position": [0, 3.8, 0], "scale": [14.0, 7.0, 0.05], "color": "#22c55e"},
            {"name": "Viền nẹp khung kim loại", "type": "box", "position": [0, 3.8, -0.05], "scale": [14.3, 7.3, 0.2], "color": "#e2e8f0"},
            {"name": "Đèn pha 1", "type": "box", "position": [-5.0, 7.6, 0.4], "scale": [0.2, 0.2, 0.4], "color": "#334155"},
            {"name": "Đèn pha 2", "type": "box", "position": [-3.0, 7.6, 0.4], "scale": [0.2, 0.2, 0.4], "color": "#334155"},
            {"name": "Đèn pha 3", "type": "box", "position": [-1.0, 7.6, 0.4], "scale": [0.2, 0.2, 0.4], "color": "#334155"},
            {"name": "Đèn pha 4", "type": "box", "position": [1.0, 7.6, 0.4], "scale": [0.2, 0.2, 0.4], "color": "#334155"},
            {"name": "Đèn pha 5", "type": "box", "position": [3.0, 7.6, 0.4], "scale": [0.2, 0.2, 0.4], "color": "#334155"},
            {"name": "Đèn pha 6", "type": "box", "position": [5.0, 7.6, 0.4], "scale": [0.2, 0.2, 0.4], "color": "#334155"}
        ]
    },
    # 16. Billboard cao tốc 2 cột trụ tròn giàn giằng thép (Ảnh blank-billboards-advertising-highway-blue-sky-85391792.webp)
    {
        "id": "sample_billboard_double_pole_sky",
        "category": "billboard",
        "title": "Billboard cao tốc 2 cột trụ tròn giàn giằng thép (16m x 7.5m cao 15m)",
        "badge": "Billboard 2 cột",
        "image_url": "/signs/sign_billboard_double_pole_sky.jpg",
        "dimensions": {"width": 16.0, "height": 7.5, "depth": 1.4},
        "description": "Billboard tấm lớn 2 cột trụ thép tròn D1000 sơn trắng xanh chân đế bê tông, kết cấu giàn giằng thép hộp 2 đầu hồi và sàn thao tác đan chéo chịu gió lốc, mặt bạt trắng phẳng tuyệt đối.",
        "materials": {
            "iron_type": "vuong_30",
            "surface_type": "bat_3m_uv",
            "has_led": True,
            "has_sheet_backing": False
        },
        "prompt": "Billboard tấm lớn hai cột trụ thép tròn đứng cạnh đường quốc lộ cao tốc trên nền trời xanh mây trắng trong lành.",
        "elements": [
            {"name": "Cột trụ trái D1000", "type": "cylinder", "position": [-4.5, -4.0, -0.2], "scale": [1.0, 8.0, 1.0], "color": "#0284c7"},
            {"name": "Cột trụ phải D1000", "type": "cylinder", "position": [4.5, -4.0, -0.2], "scale": [1.0, 8.0, 1.0], "color": "#0284c7"},
            {"name": "Giàn dầm thép ngang liên kết", "type": "box", "position": [0, -0.1, -0.2], "scale": [16.2, 0.8, 1.4], "color": "#1e293b"},
            {"name": "Giàn giằng đầu hồi trái", "type": "box", "position": [-8.1, 4.0, -0.2], "scale": [0.2, 7.5, 1.4], "color": "#334155"},
            {"name": "Mặt bảng pano trắng phẳng", "type": "box", "position": [0, 4.0, 0], "scale": [16.0, 7.5, 0.05], "color": "#ffffff"}
        ]
    },
    # 17. Billboard cổng vòm 2 cột trụ bắc qua cao tốc (Ảnh blank-highway-billboard-sign-in-an-outdoor-display-showing-a-road-CWWCJA.jpg)
    {
        "id": "sample_billboard_highway_gantry",
        "category": "billboard",
        "title": "Billboard cổng vòm 2 cột trụ bắc qua cao tốc (15m x 5.5m cao 12m)",
        "badge": "Cổng vòm cao tốc",
        "image_url": "/signs/sign_billboard_highway_gantry.jpg",
        "dimensions": {"width": 15.0, "height": 5.5, "depth": 1.2},
        "description": "Kết cấu cổng vòm biển quảng cáo Pano bắc ngang qua toàn bộ mặt đường cao tốc (Overhead Highway Gantry), 2 cột trụ thép tròn 2 bên lề đường, dầm giàn không gian chịu lực vượt nhịp 15m, sàn thao tác bảo dưỡng.",
        "materials": {
            "iron_type": "vuong_30",
            "surface_type": "bat_3m_uv",
            "has_led": True,
            "has_sheet_backing": False
        },
        "prompt": "Cổng pano quảng cáo kết cấu thép bắc ngang qua đường cao tốc xuyên đồng cỏ xanh, mặt bảng trắng tinh dưới bầu trời xanh ngắt.",
        "elements": [
            {"name": "Cột trụ biên trái", "type": "cylinder", "position": [-7.0, -3.0, 0], "scale": [0.9, 6.5, 0.9], "color": "#64748b"},
            {"name": "Cột trụ biên phải", "type": "cylinder", "position": [7.0, -3.0, 0], "scale": [0.9, 6.5, 0.9], "color": "#64748b"},
            {"name": "Dầm giàn thép ngang vượt nhịp", "type": "box", "position": [0, 0.2, 0], "scale": [15.5, 0.6, 1.2], "color": "#475569"},
            {"name": "Mặt bảng pano ở giữa", "type": "box", "position": [0, 3.2, 0.1], "scale": [15.0, 5.5, 0.05], "color": "#ffffff"},
            {"name": "Khung đỡ đỉnh", "type": "box", "position": [0, 6.1, 0], "scale": [15.2, 0.3, 0.3], "color": "#334155"}
        ]
    },
    # 18. Billboard Unipole 1 trụ thép mạ kẽm sàn thao tác (Ảnh highway-hoarding-board-500x500.webp)
    {
        "id": "sample_billboard_hoarding_printer",
        "category": "billboard",
        "title": "Billboard Unipole 1 trụ thép mạ kẽm sàn thao tác (12m x 6m cao 14m)",
        "badge": "Billboard Unipole",
        "image_url": "/signs/sign_billboard_hoarding_printer.jpg",
        "dimensions": {"width": 12.0, "height": 6.0, "depth": 1.0},
        "description": "Billboard quảng cáo ngoài trời tấm lớn Unipole 1 trụ thép tròn D800 mạ kẽm nhúng nóng, sàn catwalk lan can an toàn bên dưới, mặt bạt in Hiflex/2 da khổ lớn in ấn thương hiệu Concept Design & Printer.",
        "materials": {
            "iron_type": "vuong_30",
            "surface_type": "bat_2da",
            "has_led": True,
            "has_sheet_backing": False
        },
        "prompt": "Billboard ngoài trời một trụ thép mạ kẽm tròn cao 14m kích thước 12m x 6m in nội dung quảng cáo in ấn rực rỡ dưới bầu trời xanh.",
        "elements": [
            {"name": "Trụ thép tròn mạ kẽm D800", "type": "cylinder", "position": [0, -4.0, -0.15], "scale": [0.8, 8.0, 0.8], "color": "#94a3b8"},
            {"name": "Sàn catwalk lan can an toàn", "type": "box", "position": [0, -0.15, -0.15], "scale": [12.4, 0.45, 1.0], "color": "#475569"},
            {"name": "Mặt bảng bạt in rực rỡ", "type": "box", "position": [0, 3.0, 0], "scale": [12.0, 6.0, 0.05], "color": "#ffffff"},
            {"name": "Dải màu gradient quảng cáo", "type": "box", "position": [0, 1.2, 0.03], "scale": [11.8, 2.2, 0.01], "color": "#f97316"}
        ]
    },
    # 19. Billboard cao tốc ven sông kiến trúc hiện đại (Ảnh travel-advertising-billboard-on-highway-3d-rendering-mockup-T1MA74.jpg)
    {
        "id": "sample_billboard_travel_modern",
        "category": "billboard",
        "title": "Billboard cao tốc ven sông kiến trúc hiện đại (14m x 6.5m cao 15m)",
        "badge": "Kiến trúc hiện đại",
        "image_url": "/signs/sign_billboard_travel_modern.jpg",
        "dimensions": {"width": 14.0, "height": 6.5, "depth": 1.2},
        "description": "Biển quảng cáo pano phong cách kiến trúc hiện đại bên tuyến đường cao tốc đô thị ven sông, một trụ thép tròn, giàn dầm vát chéo, mặt bạt 3M in hình ảnh du lịch Travel & Inspire Your Life sang trọng.",
        "materials": {
            "iron_type": "vuong_30",
            "surface_type": "bat_3m_uv",
            "has_led": True,
            "has_sheet_backing": False
        },
        "prompt": "Photorealistic 3D architectural rendering of a high-end billboard on an urban waterfront highway, modern steel structure, crisp lighting.",
        "elements": [
            {"name": "Trụ thép tròn D1000", "type": "cylinder", "position": [-1.5, -4.5, -0.2], "scale": [1.0, 9.0, 1.0], "color": "#64748b"},
            {"name": "Cụm giàn dầm vát chéo đỡ sàn", "type": "box", "position": [0, 0, -0.2], "scale": [14.2, 0.8, 1.2], "color": "#334155"},
            {"name": "Mặt bảng pano du lịch", "type": "box", "position": [0, 3.5, 0], "scale": [14.0, 6.5, 0.05], "color": "#f8fafc"},
            {"name": "Mảng hình ảnh du lịch biển xanh", "type": "box", "position": [2.5, 3.5, 0.03], "scale": [8.5, 6.3, 0.01], "color": "#0284c7"},
            {"name": "Cột đèn chiếu sáng đô thị chân cầu", "type": "box", "position": [3.5, -1.5, 0.8], "scale": [0.15, 3.0, 0.15], "color": "#18181b"}
        ]
    },
    # 20. Billboard Unipole sườn đồi cao tốc (Ảnh images (14).jfif)
    {
        "id": "sample_billboard_hillside_orange",
        "category": "billboard",
        "title": "Billboard Unipole sườn đồi cao tốc (12m x 5m cao 12m)",
        "badge": "Sườn đồi cao tốc",
        "image_url": "/signs/sign_billboard_hillside_orange.jpg",
        "dimensions": {"width": 12.0, "height": 5.0, "depth": 1.0},
        "description": "Biển quảng cáo tấm lớn một trụ thép sơn xanh dương lắp đặt tại sườn đồi đường cao tốc quanh co, kết cấu thép giàn đáy chịu gió núi, mặt pano bạt màu cam nổi bật từ xa.",
        "materials": {
            "iron_type": "vuong_30",
            "surface_type": "bat_2da",
            "has_led": True,
            "has_sheet_backing": False
        },
        "prompt": "Billboard Unipole tấm lớn một trụ thép tròn đứng bên sườn đồi cao tốc có xe chạy, mặt bảng màu cam rực rỡ.",
        "elements": [
            {"name": "Trụ thép tròn sơn xanh", "type": "cylinder", "position": [0, -3.5, -0.2], "scale": [0.9, 7.0, 0.9], "color": "#0369a1"},
            {"name": "Giàn thép đáy chịu lực", "type": "box", "position": [0, 0, -0.2], "scale": [12.2, 0.5, 1.0], "color": "#475569"},
            {"name": "Mặt bảng màu cam rực rỡ", "type": "box", "position": [0, 2.6, 0], "scale": [12.0, 5.0, 0.05], "color": "#ea580c"}
        ]
    },
    # 21. Billboard vuông dãy liên hoàn dải phân cách quốc lộ (Ảnh images (15).jfif)
    {
        "id": "sample_billboard_square_series",
        "category": "billboard",
        "title": "Billboard vuông dãy liên hoàn dải phân cách quốc lộ (6m x 6m cao 10m)",
        "badge": "Billboard vuông",
        "image_url": "/signs/sign_billboard_square_series.jpg",
        "dimensions": {"width": 6.0, "height": 6.0, "depth": 0.8},
        "description": "Billboard quảng cáo ngoài trời khổ vuông 6m x 6m bố trí theo dãy liên hoàn dọc tuyến đường quốc lộ / đại lộ, trụ thép tròn đơn vững chắc, mặt ốp alu hoặc bạt căng khung vuông, 3 đèn pha rọi đỉnh.",
        "materials": {
            "iron_type": "vuong_25",
            "surface_type": "alu_3mm",
            "has_led": True,
            "has_sheet_backing": True
        },
        "prompt": "Dãy biển quảng cáo ngoài trời khổ vuông 6m x 6m một cột trụ tròn bố trí dọc dải phân cách đường cao tốc đại lộ dưới trời xanh.",
        "elements": [
            {"name": "Cột trụ tròn thép D600", "type": "cylinder", "position": [0, -3.0, -0.1], "scale": [0.6, 6.0, 0.6], "color": "#475569"},
            {"name": "Khung viền bảng vuông", "type": "box", "position": [0, 1.8, 0], "scale": [6.2, 6.2, 0.15], "color": "#334155"},
            {"name": "Mặt bảng quảng cáo trắng", "type": "box", "position": [0, 1.8, 0.08], "scale": [5.8, 5.8, 0.02], "color": "#ffffff"},
            {"name": "Đèn pha 1", "type": "box", "position": [-1.8, 4.95, 0.3], "scale": [0.15, 0.15, 0.35], "color": "#18181b"},
            {"name": "Đèn pha 2", "type": "box", "position": [0.0, 4.95, 0.3], "scale": [0.15, 0.15, 0.35], "color": "#18181b"},
            {"name": "Đèn pha 3", "type": "box", "position": [1.8, 4.95, 0.3], "scale": [0.15, 0.15, 0.35], "color": "#18181b"}
        ]
    },
    # 22. Billboard siêu rộng 2 cột trụ tròn qua sông (Ảnh images (16).jfif)
    {
        "id": "sample_billboard_superwide_double_pole",
        "category": "billboard",
        "title": "Billboard siêu rộng 2 cột trụ tròn qua sông (18m x 6m cao 18m)",
        "badge": "Billboard siêu rộng",
        "image_url": "/signs/sign_billboard_superwide_double_pole.jpg",
        "dimensions": {"width": 18.0, "height": 6.0, "depth": 1.5},
        "description": "Billboard quảng cáo tấm lớn siêu rộng 18m cao 18m hai cột trụ thép tròn D1200 bắc qua khúc sông ven đường cao tốc đô thị, kết cấu giàn thép không gian đan chéo dày dặn, mặt bạt đỏ rực JAYALAKSHMI, dàn 8 đèn pha rọi.",
        "materials": {
            "iron_type": "vuong_30",
            "surface_type": "bat_3m_uv",
            "has_led": True,
            "has_sheet_backing": False
        },
        "prompt": "Billboard khổng lồ siêu rộng 18m hai cột trụ thép cao 18m màu đỏ rực rỡ đứng cạnh dòng sông và đường cao tốc trên cao.",
        "elements": [
            {"name": "Cột trụ tròn trái D1200", "type": "cylinder", "position": [-5.5, -6.0, -0.3], "scale": [1.2, 12.0, 1.2], "color": "#475569"},
            {"name": "Cột trụ tròn phải D1200", "type": "cylinder", "position": [5.5, -6.0, -0.3], "scale": [1.2, 12.0, 1.2], "color": "#475569"},
            {"name": "Giàn giằng không gian đan chéo", "type": "box", "position": [0, -0.3, -0.3], "scale": [18.4, 0.9, 1.5], "color": "#1e293b"},
            {"name": "Mặt bảng pano đỏ rực 18m", "type": "box", "position": [0, 3.2, 0], "scale": [18.0, 6.0, 0.05], "color": "#dc2626"},
            {"name": "Dòng chữ lớn JAYALAKSHMI trắng", "type": "box", "position": [0, 3.0, 0.03], "scale": [14.0, 2.8, 0.02], "color": "#ffffff"}
        ]
    },
    # 23. Cổng Pano giàn thép hộp vắt ngang cầu cao tốc (Ảnh images (17).jfif)
    {
        "id": "sample_gantry_overhead_bridge",
        "category": "billboard",
        "title": "Cổng Pano giàn thép hộp vắt ngang cầu cao tốc (16m x 4.5m cao 10m)",
        "badge": "Cổng vòm cầu cao tốc",
        "image_url": "/signs/sign_gantry_overhead_bridge.jpg",
        "dimensions": {"width": 16.0, "height": 4.5, "depth": 0.8},
        "description": "Cổng bảng hiệu Pano quảng cáo khung giàn thép hộp chữ nhật vượt khẩu độ 16m vắt ngang qua cầu cạn cao tốc, 2 cột trụ thép tròn 2 bên lề cầu, mặt bạt in UV xuyên sáng 3M phẳng căng.",
        "materials": {
            "iron_type": "vuong_30",
            "surface_type": "bat_3m_uv",
            "has_led": True,
            "has_sheet_backing": False
        },
        "prompt": "Cổng chào pano quảng cáo khung thép vắt ngang qua cây cầu đường cao tốc thông thoáng hướng nhìn từ cabin xe ô tô.",
        "elements": [
            {"name": "Cột trụ thép tròn lề trái", "type": "cylinder", "position": [-7.8, -2.5, 0], "scale": [0.7, 5.0, 0.7], "color": "#94a3b8"},
            {"name": "Cột trụ thép tròn lề phải", "type": "cylinder", "position": [7.8, -2.5, 0], "scale": [0.7, 5.0, 0.7], "color": "#94a3b8"},
            {"name": "Khung dầm hộp chịu lực", "type": "box", "position": [0, 0.1, 0], "scale": [16.2, 4.8, 0.4], "color": "#cbd5e1"},
            {"name": "Mặt bảng pano bạt 3M", "type": "box", "position": [0, 0.1, 0.05], "scale": [15.6, 4.2, 0.02], "color": "#38bdf8"}
        ]
    },
    # 24. Billboard Unipole 4 đèn pha rọi chân trời xanh (Ảnh images (7).jfif)
    {
        "id": "sample_billboard_unipole_spotlights",
        "category": "billboard",
        "title": "Billboard Unipole 4 đèn pha rọi chân trời xanh (10m x 5m cao 12m)",
        "badge": "Unipole 4 đèn pha",
        "image_url": "/signs/sign_billboard_unipole_spotlights.jpg",
        "dimensions": {"width": 10.0, "height": 5.0, "depth": 1.0},
        "description": "Biển quảng cáo tấm lớn một cột trụ thép tròn Unipole truyền thống, giá đỡ kim loại vát chữ Y, dàn 4 cần đèn pha LED chiếu rọi từ trên cao, mặt bạt in quảng cáo trung tâm thương mại ABAD Food Court.",
        "materials": {
            "iron_type": "vuong_30",
            "surface_type": "bat_2da",
            "has_led": True,
            "has_sheet_backing": False
        },
        "prompt": "Billboard Unipole ngoài trời một cột trụ thép tròn cao 12m kích thước 10m x 5m có 4 cần đèn rọi vươn ra trên nền trời xanh mây trắng trong veo.",
        "elements": [
            {"name": "Cột trụ thép tròn D800", "type": "cylinder", "position": [0, -3.5, -0.2], "scale": [0.8, 7.0, 0.8], "color": "#64748b"},
            {"name": "Chân đế dầm vát chữ Y", "type": "box", "position": [0, 0, -0.2], "scale": [10.2, 0.6, 1.0], "color": "#334155"},
            {"name": "Mặt bảng pano", "type": "box", "position": [0, 2.7, 0], "scale": [10.0, 5.0, 0.05], "color": "#ffffff"},
            {"name": "Mảng xanh lá cây thương hiệu", "type": "box", "position": [0, 2.3, 0.03], "scale": [9.6, 2.4, 0.01], "color": "#84cc16"},
            {"name": "Đèn pha 1", "type": "box", "position": [-3.6, 5.4, 0.4], "scale": [0.15, 0.2, 0.4], "color": "#18181b"},
            {"name": "Đèn pha 2", "type": "box", "position": [-1.2, 5.4, 0.4], "scale": [0.15, 0.2, 0.4], "color": "#18181b"},
            {"name": "Đèn pha 3", "type": "box", "position": [1.2, 5.4, 0.4], "scale": [0.15, 0.2, 0.4], "color": "#18181b"},
            {"name": "Đèn pha 4", "type": "box", "position": [3.6, 5.4, 0.4], "scale": [0.15, 0.2, 0.4], "color": "#18181b"}
        ]
    }
]

@ai_bp.route('/api/ai/genai/status', methods=['GET', 'OPTIONS'])
def api_genai_status():
    """Proxy kiểm tra trạng thái từ GenAI Toolxprint Bridge"""
    if request.method == 'OPTIONS':
        return jsonify({"ok": True}), 200
    try:
        r = requests.get(f"{GENAI_BASE_URL}/api/status", timeout=10)
        return jsonify(r.json()), r.status_code
    except Exception as e:
        return jsonify({"status": "offline", "error": str(e), "service": "GenAI Bridge"}), 502

@ai_bp.route('/api/ai/genai/prompt-hints', methods=['GET', 'OPTIONS'])
def api_genai_prompt_hints():
    """Lấy danh sách Prompt Hints kết hợp giữa GenAI và bộ Hint quảng cáo Admake"""
    if request.method == 'OPTIONS':
        return jsonify({"ok": True}), 200
    try:
        remote_hints = []
        try:
            r = requests.get(f"{GENAI_BASE_URL}/api/prompt_hints", timeout=6)
            if r.status_code == 200:
                remote_hints = r.json()
        except Exception:
            pass

        return jsonify({
            "success": True,
            "signboard_hints": SIGNBOARD_HINTS,
            "remote_hints": remote_hints
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@ai_bp.route('/api/ai/genai/jobs/create', methods=['POST', 'OPTIONS'])
def api_genai_job_create():
    """Tạo tác vụ sinh ảnh phối cảnh thực tế từ GenAI Toolxprint"""
    if request.method == 'OPTIONS':
        return jsonify({"ok": True}), 200
    data = request.get_json(force=True, silent=True) or {}
    try:
        r = requests.post(f"{GENAI_BASE_URL}/api/jobs/create", json=data, timeout=30)
        return jsonify(r.json()), r.status_code
    except Exception as e:
        return jsonify({"error": f"Lỗi kết nối GenAI Bridge: {str(e)}"}), 502

@ai_bp.route('/api/ai/genai/jobs/edit-full', methods=['POST', 'OPTIONS'])
def api_genai_job_edit_full():
    """Chỉnh sửa toàn bộ ảnh phối cảnh theo yêu cầu mới qua GenAI"""
    if request.method == 'OPTIONS':
        return jsonify({"ok": True}), 200
    data = request.get_json(force=True, silent=True) or {}
    try:
        r = requests.post(f"{GENAI_BASE_URL}/api/jobs/edit-full", json=data, timeout=30)
        return jsonify(r.json()), r.status_code
    except Exception as e:
        return jsonify({"error": f"Lỗi kết nối GenAI Bridge: {str(e)}"}), 502

@ai_bp.route('/api/ai/genai/jobs/edit-inpaint', methods=['POST', 'OPTIONS'])
def api_genai_job_edit_inpaint():
    """Chỉnh sửa cục bộ (Inpaint với tọa độ pins) qua GenAI"""
    if request.method == 'OPTIONS':
        return jsonify({"ok": True}), 200
    data = request.get_json(force=True, silent=True) or {}
    try:
        r = requests.post(f"{GENAI_BASE_URL}/api/jobs/edit-inpaint", json=data, timeout=30)
        return jsonify(r.json()), r.status_code
    except Exception as e:
        return jsonify({"error": f"Lỗi kết nối GenAI Bridge: {str(e)}"}), 502

@ai_bp.route('/api/ai/genai/jobs/<job_id>', methods=['GET', 'OPTIONS'])
def api_genai_job_get(job_id):
    """Polling lấy trạng thái và URL kết quả ảnh của job"""
    if request.method == 'OPTIONS':
        return jsonify({"ok": True}), 200
    try:
        r = requests.get(f"{GENAI_BASE_URL}/api/jobs/{job_id}", timeout=10)
        return jsonify(r.json()), r.status_code
    except Exception as e:
        return jsonify({"error": f"Lỗi lấy trạng thái job: {str(e)}"}), 502

@ai_bp.route('/api/ai/genai/gallery', methods=['GET', 'OPTIONS'])
def api_genai_gallery():
    """Lấy danh sách ảnh đã tạo từ GenAI Gallery"""
    if request.method == 'OPTIONS':
        return jsonify({"ok": True}), 200
    try:
        r = requests.get(f"{GENAI_BASE_URL}/api/gallery", timeout=15)
        return jsonify(r.json()), r.status_code
    except Exception as e:
        return jsonify({"error": f"Lỗi lấy gallery: {str(e)}"}), 502

@ai_bp.route('/api/ai/3d/hints', methods=['GET', 'OPTIONS'])
def api_ai_3d_hints():
    """Lấy danh sách Hint chuyên dụng về quảng cáo từ bảng nhỏ đến bảng khổng lồ"""
    if request.method == 'OPTIONS':
        return jsonify({"ok": True}), 200
    return jsonify({
        "success": True,
        "hints": SIGNBOARD_HINTS
    }), 200

@ai_bp.route('/api/ai/3d/generate', methods=['POST', 'OPTIONS'])
def api_ai_3d_generate():
    """Phân tích yêu cầu khách hàng và sinh mô hình 3D + bóc tách vật tư bằng Google Gemini"""
    if request.method == 'OPTIONS':
        return jsonify({"ok": True}), 200

    data = request.get_json(force=True, silent=True) or {}
    user_prompt = (data.get("prompt") or "").strip()
    hint_id = data.get("hint_id")
    custom_dim = data.get("dimensions") or {}
    custom_mat = data.get("materials") or {}

    selected_hint = next((h for h in SIGNBOARD_HINTS if h["id"] == hint_id), None)
    if not user_prompt and selected_hint:
        user_prompt = selected_hint["prompt"]

    if not user_prompt:
        return jsonify({"success": False, "error": "Vui lòng nhập mô tả yêu cầu hoặc chọn một mẫu Hint quảng cáo."}), 400

    gemini_key, _ = get_ai_studio_keys()
    if not gemini_key:
        return jsonify({"success": False, "error": "Không tìm thấy [GeminiKey] trong D:/vps.md hoặc D:/vps_go.md"}), 500

    system_instruction = (
        "Bạn là Kỹ Sư Trưởng Thiết Kế Kết Cấu 3D & Bóc Tách Dự Toán Biển Bảng Quảng Cáo tại ADMAKE.\n"
        "Nhiệm vụ của bạn là nhận yêu cầu của khách hàng (từ bảng nhỏ, hộp đèn, biển vẫy, mặt tiền, đến pano tấm lớn và billboard khổng lồ), "
        "sau đó tính toán quy chuẩn kết cấu và trả về DUY NHẤT một chuỗi JSON hợp lệ (không chứa markdown, không có ```json).\n\n"
        "Định dạng JSON bắt buộc:\n"
        "{\n"
        "  \"name\": \"Tên công trình bảng hiệu\",\n"
        "  \"category\": \"mini\" | \"storefront\" | \"billboard\",\n"
        "  \"category_label\": \"Bảng hiệu mặt tiền\" (hoặc Biển vẫy/Hộp đèn, Pano tấm lớn Billboard, Màn hình LED),\n"
        "  \"description\": \"Mô tả kỹ thuật kết cấu và quy cách hoàn thiện\",\n"
        "  \"dimensions\": {\"width\": 6.0, \"height\": 2.5, \"depth\": 0.25},\n"
        "  \"elements\": [\n"
        "    {\"name\": \"Khung sắt hộp 25x25\", \"type\": \"box\", \"position\": [0, 0, 0], \"scale\": [6.0, 2.5, 0.05], \"color\": \"#475569\"},\n"
        "    {\"name\": \"Mặt bảng Alu 3mm\", \"type\": \"box\", \"position\": [0, 0, 0.03], \"scale\": [6.0, 2.5, 0.01], \"color\": \"#1e293b\"},\n"
        "    {\"name\": \"Chữ nổi Mica LED sáng mặt\", \"type\": \"box\", \"position\": [0, 0.2, 0.08], \"scale\": [4.2, 0.7, 0.08], \"color\": \"#f59e0b\"},\n"
        "    {\"name\": \"Slogan phụ\", \"type\": \"box\", \"position\": [0, -0.4, 0.06], \"scale\": [3.0, 0.3, 0.04], \"color\": \"#ffffff\"}\n"
        "  ],\n"
        "  \"materials_spec\": {\n"
        "    \"iron_type\": \"vuong_25\",\n"
        "    \"surface_type\": \"alu_3mm\",\n"
        "    \"has_led\": true,\n"
        "    \"has_sheet_backing\": true\n"
        "  },\n"
        "  \"render_prompt\": \"Photorealistic commercial photography of a modern storefront signboard...\"\n"
        "}\n\n"
        "Lưu ý quan trọng cho 3D Elements:\n"
        "- Nếu là Billboard khổng lồ một cột trụ: Thêm 1 element type 'cylinder' cho cột trụ lớn ở vị trí [0, -height/2, 0], scale [1.0, 10.0, 1.0], color '#334155'.\n"
        "- Nếu là bảng mặt tiền: Khung xương sắt đan ô, mặt bảng phẳng và chữ 3D nổi ra phía trước trục Z dương (+Z).\n"
        "- Kích thước (dimensions.width, height, depth) tính bằng mét.\n"
        "- Tọa độ position và scale tính bằng mét."
    )

    models_to_try = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.6-flash", "gemini-2.5-flash"]
    parsed_result = None
    last_err = None

    for m_name in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m_name}:generateContent?key={gemini_key}"
        payload = {
            "contents": [{"parts": [{"text": f"Yêu cầu khách hàng: {user_prompt}\nThông tin bổ sung nếu có: Kích thước: {json.dumps(custom_dim)}, Vật tư: {json.dumps(custom_mat)}"}]}],
            "generationConfig": {
                "temperature": 0.3,
                "responseMimeType": "application/json"
            },
            "systemInstruction": {"parts": [{"text": system_instruction}]}
        }
        try:
            resp = requests.post(url, json=payload, timeout=40)
            if resp.status_code == 200:
                raw_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                if raw_text.startswith("```"):
                    raw_text = raw_text.strip("`")
                    if raw_text.startswith("json"):
                        raw_text = raw_text[4:].strip()
                parsed_result = json.loads(raw_text)
                break
            else:
                last_err = f"Gemini {m_name} status {resp.status_code}: {resp.text[:200]}"
        except Exception as e:
            last_err = str(e)

    # Nếu AI chưa trả về được thì dùng cấu hình mặc định từ Hint hoặc tạo cấu trúc fallback chuẩn xác
    if not parsed_result:
        w = float(custom_dim.get("width") or (selected_hint["dimensions"]["width"] if selected_hint else 6.0))
        h = float(custom_dim.get("height") or (selected_hint["dimensions"]["height"] if selected_hint else 2.5))
        d = float(custom_dim.get("depth") or (selected_hint["dimensions"]["depth"] if selected_hint else 0.25))
        cat = selected_hint["category"] if selected_hint else ("billboard" if w >= 10 else "storefront")
        
        if selected_hint and selected_hint.get("elements"):
            elements = selected_hint["elements"]
        else:
            elements = [
                {"name": "Khung xương sắt hộp", "type": "box", "position": [0, 0, 0], "scale": [w, h, 0.05], "color": "#475569"},
                {"name": "Mặt bảng ốp dựng", "type": "box", "position": [0, 0, 0.03], "scale": [w, h, 0.01], "color": "#1e293b"},
                {"name": "Bộ chữ nổi thương hiệu", "type": "box", "position": [0, 0.2, 0.08], "scale": [round(w * 0.7, 2), round(h * 0.35, 2), 0.08], "color": "#f59e0b"},
                {"name": "Slogan phụ phát sáng", "type": "box", "position": [0, -round(h * 0.25, 2), 0.06], "scale": [round(w * 0.5, 2), round(h * 0.15, 2), 0.04], "color": "#ffffff"}
            ]
            if cat == "billboard":
                elements.insert(0, {
                    "name": "Cột trụ thép tròn chịu lực",
                    "type": "cylinder",
                    "position": [0, -round(h * 1.2, 2), -0.2],
                    "scale": [1.0, round(h * 2.4, 2), 1.0],
                    "color": "#334155"
                })

        hint_mat = selected_hint.get("materials") if selected_hint else {}
        parsed_result = {
            "name": selected_hint["title"] if selected_hint else "Bảng hiệu thiết kế 3D ADMAKE",
            "category": cat,
            "category_label": selected_hint["badge"] if selected_hint else "Bảng hiệu mặt tiền",
            "description": selected_hint["description"] if selected_hint else f"Bảng hiệu kết cấu chuẩn kỹ thuật kích thước {w}m x {h}m.",
            "dimensions": {"width": w, "height": h, "depth": d},
            "elements": elements,
            "materials_spec": {
                "iron_type": hint_mat.get("iron_type") or ("vuong_25" if w < 10 else "vuong_30"),
                "surface_type": hint_mat.get("surface_type") or ("alu_3mm" if w < 10 else "bat_3m_uv"),
                "has_led": hint_mat.get("has_led", True),
                "has_sheet_backing": hint_mat.get("has_sheet_backing", True)
            },
            "render_prompt": selected_hint.get("prompt") if (selected_hint and selected_hint.get("prompt")) else f"Professional realistic architectural photograph of {user_prompt}, photorealistic signboard render, 4k ultra high resolution, perfectly detailed."
        }

    # Tính toán bảng bóc tách vật tư & nhân công thực tế bằng calculate_signboard
    dim_w = float(parsed_result.get("dimensions", {}).get("width") or 6.0)
    dim_h = float(parsed_result.get("dimensions", {}).get("height") or 2.5)
    mat_spec = parsed_result.get("materials_spec") or {}

    calc_input = {
        "width": dim_w,
        "height": dim_h,
        "iron_type": mat_spec.get("iron_type") or "vuong_25",
        "surface_type": mat_spec.get("surface_type") or "alu_3mm",
        "has_sheet_backing": mat_spec.get("has_sheet_backing", True),
        "profit_margin": 30
    }
    calc_quote = calculate_signboard(calc_input)
    parsed_result["quotation"] = calc_quote

    return jsonify({
        "success": True,
        "data": parsed_result
    }), 200


