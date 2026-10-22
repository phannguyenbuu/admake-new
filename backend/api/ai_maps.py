# -*- coding: utf-8 -*-
"""
api/ai_maps.py - Quản lý và phục vụ kho texture maps 3D (3DLib maps) cho vật liệu Admake
Mặc định đọc: D:\\Dropbox\\3DLib\\maps
Hỗ trợ cấu hình đường dẫn qua dashboard backend, quét danh mục, và stream ảnh texture
"""

import os
import json
import mimetypes
from flask import Blueprint, request, jsonify, send_file

ai_maps_bp = Blueprint("ai_maps", __name__)

CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "3d_maps_config.json")
DEFAULT_MAPS_PATH = r"D:\Dropbox\3DLib\maps"
FALLBACK_VPS_PATH = r"/var/www/admake/maps"


def get_maps_path() -> str:
    """Trả về đường dẫn kho map hợp lệ."""
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                custom_path = data.get("maps_path")
                if custom_path and os.path.exists(custom_path):
                    return os.path.normpath(custom_path)
        except Exception:
            pass

    if os.path.exists(DEFAULT_MAPS_PATH):
        return os.path.normpath(DEFAULT_MAPS_PATH)
    if os.path.exists(FALLBACK_VPS_PATH):
        return os.path.normpath(FALLBACK_VPS_PATH)
    return os.path.normpath(DEFAULT_MAPS_PATH)


def save_maps_path(new_path: str):
    """Lưu đường dẫn kho map vào config file."""
    os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump({"maps_path": new_path}, f, ensure_ascii=False, indent=2)


@ai_maps_bp.route("/api/ai/maps/status", methods=["GET"])
def get_maps_status():
    """Kiểm tra trạng thái kết nối và thống kê kho map."""
    p = get_maps_path()
    exists = os.path.exists(p)
    categories = []
    total_files = 0

    if exists and os.path.isdir(p):
        try:
            entries = os.scandir(p)
            for e in entries:
                if e.is_dir():
                    count = 0
                    try:
                        for sub in os.scandir(e.path):
                            if sub.is_file() and sub.name.lower().endswith(
                                (".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif")
                            ):
                                count += 1
                    except Exception:
                        pass
                    categories.append({"name": e.name, "file_count": count})
                    total_files += count
            categories.sort(key=lambda x: (not x["name"].startswith("#"), x["name"].lower()))
        except Exception:
            pass

    return jsonify({
        "success": True,
        "path": p,
        "exists": exists,
        "categories_count": len(categories),
        "total_files": total_files,
        "top_categories": categories[:25],
    })


@ai_maps_bp.route("/api/ai/maps/config", methods=["POST"])
def set_maps_config():
    """Lưu cấu hình thư mục kho map."""
    data = request.get_json(force=True, silent=True) or {}
    new_path = (data.get("path") or "").strip()
    if not new_path:
        return jsonify({"success": False, "error": "Đường dẫn không được để trống"}), 400

    save_maps_path(new_path)
    return get_maps_status()


@ai_maps_bp.route("/api/ai/maps/categories", methods=["GET"])
def get_categories():
    """Danh sách danh mục / thư mục maps."""
    p = get_maps_path()
    if not os.path.exists(p):
        return jsonify({"success": False, "categories": []})

    categories = []
    try:
        for e in os.scandir(p):
            if e.is_dir():
                count = sum(
                    1
                    for sub in os.scandir(e.path)
                    if sub.is_file()
                    and sub.name.lower().endswith((".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif"))
                )
                categories.append({"name": e.name, "file_count": count})
        categories.sort(key=lambda x: (not x["name"].startswith("#"), x["name"].lower()))
    except Exception as err:
        return jsonify({"success": False, "error": str(err)})

    return jsonify({"success": True, "categories": categories})


@ai_maps_bp.route("/api/ai/maps/files", methods=["GET"])
def get_category_files():
    """Danh sách file trong 1 danh mục."""
    p = get_maps_path()
    cat = (request.args.get("category") or "").strip()
    if not cat:
        return jsonify({"success": False, "files": []})

    cat_dir = os.path.normpath(os.path.join(p, cat))
    if not os.path.exists(cat_dir) or not os.path.isdir(cat_dir):
        return jsonify({"success": False, "error": "Danh mục không tồn tại"}), 404

    files = []
    try:
        for f in os.scandir(cat_dir):
            if f.is_file() and f.name.lower().endswith((".jpg", ".jpeg", ".png", ".webp", ".bmp")):
                files.append({
                    "name": f.name,
                    "rel_path": f"{cat}/{f.name}",
                    "size": f.stat().st_size,
                    "url": f"/api/ai/maps/file?path={cat}/{f.name}",
                })
        files.sort(key=lambda x: x["name"])
    except Exception as err:
        return jsonify({"success": False, "error": str(err)})

    return jsonify({"success": True, "category": cat, "files": files[:100]})


@ai_maps_bp.route("/api/ai/maps/file", methods=["GET"])
def serve_map_file():
    """Phục vụ file ảnh texture có kiểm tra an toàn."""
    p = get_maps_path()
    rel = (request.args.get("path") or "").strip()
    if not rel:
        return "Missing path parameter", 400

    abs_path = os.path.normpath(os.path.join(p, rel))
    try:
        common = os.path.commonpath([p, abs_path])
        if os.path.normcase(common) != os.path.normcase(p):
            return "Access denied", 403
    except ValueError:
        return "Access denied", 403

    if not os.path.exists(abs_path) or not os.path.isfile(abs_path):
        return "File not found", 404

    mime, _ = mimetypes.guess_type(abs_path)
    if not mime:
        mime = "image/jpeg"

    resp = send_file(abs_path, mimetype=mime)
    resp.headers["Cache-Control"] = "public, max-age=86400"
    return resp
