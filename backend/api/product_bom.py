import copy
import io
import os
import uuid
import unicodedata
import requests
import re
from pathlib import Path
from datetime import datetime

from flask import Blueprint, abort, current_app, g, jsonify, request, send_from_directory
from PIL import Image, ImageOps
from sqlalchemy import or_

from models import ProductFormula, ProductQuotation, InventoryItem, InventoryBalance, db
from permission_utils import require_can_view
from .product_formula_engine import BASE_NAMES, FUNCTIONS, KINDS, calculate, numeric, variables_for, evaluate, validate_dimensions

product_bom_bp = Blueprint("product_bom", __name__, url_prefix="/api/product-bom")


def is_admin():
    return g.bom_actor.role_id == -2 and g.bom_actor.lead_id == int(os.getenv("PRODUCT_FORMULA_ADMIN_LEAD", "243"))


@product_bom_bp.before_request
def guard():
    if request.method == "OPTIONS":
        return
    if request.method == "GET" and request.endpoint in ("product_bom.public_library", "product_bom.library_image"):
        return
    if request.method == "PUT" and request.endpoint in ("product_bom.save_library_properties", "product_bom.save_library_review"):
        return
    if request.method == "POST" and request.endpoint == "product_bom.normalize_materials":
        return
    if request.endpoint == "product_bom.library_photos" and request.method in ("POST", "PUT", "DELETE"):
        return
    g.bom_actor, _ = require_can_view("view_invoice")
    if request.path.startswith("/api/product-bom/admin") and not is_admin():
        abort(403, description="Chỉ admin thư viện được quản lý công thức")


def catalog():
    items = InventoryItem.query.filter(InventoryItem.deletedAt.is_(None), InventoryItem.is_active.is_(True),
        or_(InventoryItem.lead_id == 243, InventoryItem.lead_id == g.bom_actor.lead_id)).all()
    items.sort(key=lambda x: (x.lead_id != 243, x.code))
    stock = {}
    for balance in InventoryBalance.query.filter(InventoryBalance.deletedAt.is_(None),
            InventoryBalance.lead_id == g.bom_actor.lead_id).all():
        entry = stock.setdefault(balance.item_id, {'quantity_on_hand': 0, 'inventory_value': 0, 'balances': []})
        entry['quantity_on_hand'] += balance.quantity_on_hand or 0
        entry['inventory_value'] += balance.inventory_value or 0
        entry['balances'].append({'warehouse_name': getattr(getattr(balance, 'warehouse', None), 'name', None) or balance.warehouse_id,
            'quantity_on_hand': balance.quantity_on_hand or 0, 'average_cost': balance.average_cost or 0,
            'inventory_value': balance.inventory_value or 0})
    own_by_code = {item.code: item for item in items if item.lead_id == g.bom_actor.lead_id}
    result = {}
    for item in items:
        if item.code not in result:
            result[item.code] = {"id": item.id, "code": item.code, "name": item.name, "unit": item.unit,
                                 "price": item.standard_cost or item.average_cost or 0, "specs": item.spec_rows or []}
            for field in ("sku", "item_type", "default_supplier_name", "supplier_link", "standard_cost", "average_cost", "min_stock_level", "item_status", "note"):
                result[item.code][field] = getattr(item, field, None)
            result[item.code]["category_name"] = getattr(getattr(item, "category", None), "name", None)
            result[item.code]["warehouse_name"] = getattr(getattr(item, "default_warehouse", None), "name", None)
            own = own_by_code.get(item.code)
            inventory = stock.get(own.id, {}) if own else {}
            result[item.code].update(quantity_on_hand=inventory.get('quantity_on_hand', 0),
                inventory_value=inventory.get('inventory_value', 0), balances=inventory.get('balances', []))
            result[item.code]['below_min_stock'] = result[item.code]['quantity_on_hand'] < ((own.min_stock_level or 0) if own else 0)
    return result


def product_dict(row):
    return {"id": row.id, "name": row.name, "category": row.category, "image_url": row.image_url,
            "definition": row.definition, "is_published": row.is_published, "version": row.version}


def get_product(product_id, lock=False):
    query = ProductFormula.query.filter_by(id=product_id, deletedAt=None)
    row = (query.with_for_update() if lock else query).first()
    if not row:
        abort(404, description="Không tìm thấy sản phẩm")
    return row


def checked_definition(definition):
    if not isinstance(definition, dict):
        raise ValueError("Công thức không hợp lệ")
    if not isinstance(definition.get("lines", []), list) or not isinstance(definition.get("parameters", []), list):
        raise ValueError("Danh sách công thức không hợp lệ")
    if len(definition.get("lines", [])) > 150 or len(definition.get("parameters", [])) > 40:
        raise ValueError("Quá nhiều dòng hoặc tham số")
    ids, keys = set(), set()
    for param in definition.get("parameters", []):
        if not isinstance(param, dict):
            raise ValueError("Tham số không hợp lệ")
        key = param.get("key", "")
        if key in keys or not key.isidentifier() or key in BASE_NAMES or key in FUNCTIONS or key.startswith("_"):
            raise ValueError("Tên tham số không hợp lệ: " + key)
        keys.add(key)
        numeric(param.get("min", 0)); numeric(param.get("max", 1e8))
        numeric(param.get("default", 0), param.get("min", 0), param.get("max", 1e8))
    for line in definition.get("lines", []):
        if not isinstance(line, dict):
            raise ValueError("Dòng công thức không hợp lệ")
        if not line.get("id") or line["id"] in ids or line.get("kind") not in KINDS:
            raise ValueError("Dòng công thức không hợp lệ hoặc trùng ID")
        ids.add(line["id"])
        if not line.get("code") and not line.get("name"):
            raise ValueError("Chọn vật tư hoặc nhập tên")
    dims = definition.get("defaults") or {"L": 60, "H": 80, "W": 6, "F": 1, "count": 1}
    variables = variables_for(dims, {}, definition.get("parameters", []))
    validate_dimensions(definition, dims)
    for line in definition.get("lines", []):
        evaluate(line.get("formula", "1"), variables)
    return copy.deepcopy(definition)


@product_bom_bp.errorhandler(ValueError)
def invalid(exc):
    db.session.rollback()
    return jsonify({"error": str(exc)}), 400


@product_bom_bp.get("/library")
def public_library():
    rows = ProductFormula.query.filter_by(deletedAt=None).order_by(ProductFormula.category, ProductFormula.name).all()
    master = {item.code: item for item in InventoryItem.query.filter_by(lead_id=243, deletedAt=None, is_active=True).all()}
    products = []
    for row in rows:
        definition = row.definition or {}
        materials = []
        for line in definition.get("lines", []):
            if line.get("kind") != "material" or line.get("selected", True) is False:
                continue
            item = master.get(line.get("code"))
            materials.append({"code": line.get("code", ""), "name": item.name if item else line.get("name") or line.get("code") or "Chưa khai báo",
                              "unit": item.unit if item else line.get("unit", ""), "note": line.get("note", "")})
        images = {view: f"/api/product-bom/library-image/{row.id}/{view}"
                  for view in ("before", "after") if re.fullmatch(r"[a-f0-9]{32}", row.id) and (library_image_folder() / f"{row.id}-photo-{view}.png").is_file()}
        products.append({"id": row.id, "name": row.name, "category": row.category,
                         "image_url": row.image_url, "is_published": row.is_published, "version": row.version,
                         "images": images, **library_photos_data(row), "properties": {"defaults": definition.get("defaults", {}),
                         "materials": materials, "parameters": [{"label": p.get("label") or p.get("key"), "value": p.get("default"), "unit": p.get("unit", "")} for p in definition.get("parameters", [])],
                         "reviewed": definition.get("reviewed") is True, "materials_text": definition.get("materials_text"), "constraints": definition.get("constraints", {}),
                         "note": definition.get("note", "")}})
    return jsonify({"products": products, "can_manage": False})


def library_image_folder():
    configured = current_app.config.get("PRODUCT_REFERENCE_DIR")
    if configured:
        return Path(configured)
    deployed = Path("/var/www/admake/product-references")
    return deployed if deployed.is_dir() else Path(__file__).resolve().parents[2] / "frontend/public/product-references"


@product_bom_bp.get("/library-image/<product_id>/<view>")
def library_image(product_id, view):
    if not re.fullmatch(r"[a-f0-9]{32}", product_id) or view not in ("before", "after"):
        abort(404)
    return send_from_directory(str(library_image_folder()), f"{product_id}-photo-{view}.png", max_age=3600)


@product_bom_bp.put("/library/<product_id>/review")
def save_library_review(product_id):
    data = request.get_json() or {}
    row = get_product(product_id, lock=True)
    if data.get("version") != row.version:
        abort(409, description="Sản phẩm đã được cập nhật. Tải lại trước khi lưu.")
    if not isinstance(data.get("reviewed"), bool):
        abort(400, description="Trạng thái kiểm tra không hợp lệ.")
    definition = copy.deepcopy(row.definition or {})
    definition["reviewed"] = data["reviewed"]
    row.definition = definition
    row.version = (row.version or 0) + 1
    row.updatedAt = datetime.utcnow()
    db.session.commit()
    return jsonify(success=True, version=row.version, reviewed=definition["reviewed"])


@product_bom_bp.put("/library/<product_id>/properties")
def save_library_properties(product_id):
    data = request.get_json() or {}
    row = get_product(product_id, lock=True)
    if data.get("version") != row.version:
        abort(409, description="Sản phẩm đã được cập nhật. Tải lại trước khi lưu.")
    definition = copy.deepcopy(row.definition or {})
    defaults = data.get("defaults")
    constraints = data.get("constraints")
    if not isinstance(defaults, dict) or not isinstance(constraints, dict):
        raise ValueError("Thiếu kích thước hoặc giá tối thiểu")
    definition["defaults"] = {key: numeric(defaults.get(key), .0001, 1e8) for key in ("L", "H", "W", "F", "count")}
    for key in ("F", "count"):
        if definition["defaults"][key] < 1 or definition["defaults"][key] != int(definition["defaults"][key]):
            raise ValueError("Số mặt và số sản phẩm phải là số nguyên từ 1")
    policy = copy.deepcopy(definition.get("constraints") or {})
    dimensions = constraints.get("dimensions")
    if not isinstance(dimensions, dict):
        raise ValueError("Thiếu kích thước tối thiểu")
    policy.setdefault("dimensions", {})
    for key in ("L", "H", "W"):
        limits = dimensions.get(key)
        if not isinstance(limits, dict):
            raise ValueError("Thiếu kích thước tối thiểu")
        policy["dimensions"].setdefault(key, {})["min"] = numeric(limits.get("min"), .0001, 1e8)
    for key in ("minimum_unit_price", "minimum_order_price"):
        policy[key] = numeric(constraints.get(key), 0, 1e12)
    definition["constraints"] = policy
    for key in ("materials_text", "note"):
        value = data.get(key, "")
        if not isinstance(value, str) or len(value) > 20000:
            raise ValueError("Nội dung tối đa 20.000 ký tự")
        definition[key] = value.strip()
    # Keep the existing BOM lines, formulas and material codes intact.
    row.definition = checked_definition(definition)
    row.is_published = False
    row.version = (row.version or 0) + 1
    row.updatedAt = datetime.utcnow()
    db.session.commit()
    return jsonify({"success": True, "version": row.version})


@product_bom_bp.post("/library/normalize-materials")
def normalize_materials():
    data = request.get_json(silent=True) or {}
    text = data.get("text")
    if not isinstance(text, str) or not text.strip() or len(text) > 20000:
        raise ValueError("Nhập nội dung vật liệu từ 1 đến 20.000 ký tự")
    try:
        response = requests.post("https://genai.toolxprint.com/api/ai/signage/normalize-materials",
                                 json={"text": text.strip()}, timeout=(5, 90))
        response.raise_for_status()
        result = response.json()
        normalized = result.get("text")
        if result.get("success") is not True or not isinstance(normalized, str) or not normalized.strip() or len(normalized) > 20000:
            raise ValueError("invalid response")
    except (requests.RequestException, ValueError, AttributeError):
        return jsonify({"error": "Chưa thể chuẩn hóa vật liệu. Vui lòng thử lại."}), 502
    return jsonify({"success": True, "text": normalized.strip()})


def library_photos_data(row):
    definition = row.definition or {}
    assets = definition.get("image_assets")
    if assets is None:
        assets = ([{"id": "original", "url": row.image_url, "name": "Hình mẫu gốc"}] if row.image_url else [])
        for view, label in (("before", "Ảnh chính diện"), ("after", "Ảnh góc nghiêng")):
            if re.fullmatch(r"[a-f0-9]{32}", row.id) and (library_image_folder() / f"{row.id}-photo-{view}.png").is_file():
                assets.append({"id": view, "url": f"/api/product-bom/library-image/{row.id}/{view}", "name": label})
    selected = definition.get("gallery_ids", [a["id"] for a in assets if a["id"] != "original"][:2])
    if "gallery_ids" not in definition and not selected:
        selected = [a["id"] for a in assets[:2]]
    return {"image_assets": assets, "gallery_ids": selected,
            "gallery_images": [a for key in selected for a in assets if a["id"] == key]}


@product_bom_bp.route("/library/<product_id>/photos", methods=["POST", "PUT", "DELETE"])
def library_photos(product_id):
    data = request.form if request.method == "POST" else (request.get_json(silent=True) or {})
    row = get_product(product_id, lock=True)
    if str(data.get("version")) != str(row.version):
        abort(409, description="Sản phẩm đã được cập nhật. Tải lại trước khi lưu.")
    photos = library_photos_data(row)
    assets = copy.deepcopy(photos["image_assets"])
    selected = list(photos["gallery_ids"])
    asset_id = data.get("asset_id")
    if request.method == "PUT":
        selected = data.get("gallery_ids")
        if (not isinstance(selected, list) or len(selected) > 2
                or any(not isinstance(key, str) for key in selected)
                or len(set(selected)) != len(selected)
                or any(key not in {a["id"] for a in assets} for key in selected)):
            raise ValueError("Chọn tối đa 2 ảnh trong thư viện sản phẩm")
    elif request.method == "DELETE":
        if not any(a["id"] == asset_id for a in assets):
            abort(404, description="Không tìm thấy ảnh")
        assets = [a for a in assets if a["id"] != asset_id]
        selected = [key for key in selected if key != asset_id]
    else:
        if asset_id and not any(a["id"] == asset_id for a in assets):
            abort(404, description="Không tìm thấy ảnh")
        if not asset_id and len(assets) >= 30:
            raise ValueError("Mỗi sản phẩm tối đa 30 ảnh")
        file = request.files.get("file")
        if not file:
            raise ValueError("Chọn ảnh cần tải lên")
        raw = file.read(10 * 1024 * 1024 + 1)
        if len(raw) > 10 * 1024 * 1024:
            raise ValueError("Ảnh tối đa 10 MB")
        try:
            with Image.open(io.BytesIO(raw)) as source:
                if source.width * source.height > 40000000:
                    raise ValueError("Ảnh quá lớn")
                image = ImageOps.exif_transpose(source)
                image.thumbnail((4096, 4096))
                image = image.convert("RGBA")
        except Exception:
            raise ValueError("Chọn ảnh PNG, JPG hoặc WebP hợp lệ")
        folder = Path(current_app.static_folder) / "product-bom" / "library"
        folder.mkdir(parents=True, exist_ok=True)
        name = uuid.uuid4().hex + ".png"
        image.save(folder / name, format="PNG")
        url = "/static/product-bom/library/" + name
        if asset_id:
            next(a for a in assets if a["id"] == asset_id)["url"] = url
        else:
            assets.append({"id": uuid.uuid4().hex, "url": url, "name": "Ảnh sản phẩm"})
    definition = copy.deepcopy(row.definition or {})
    definition.update(image_assets=assets, gallery_ids=selected)
    row.definition = definition
    # Keep the list thumbnail in sync when the original is replaced or removed.
    original = next((a for a in assets if a["id"] == "original"), None)
    row.image_url = original["url"] if original else (assets[0]["url"] if assets else "")
    row.version = (row.version or 0) + 1
    row.updatedAt = datetime.utcnow()
    db.session.commit()
    return jsonify(success=True, version=row.version, image_url=row.image_url, **library_photos_data(row))


@product_bom_bp.get("/catalog")
def get_catalog():
    return jsonify(list(catalog().values()))


@product_bom_bp.get("/products")
def products():
    rows = ProductFormula.query.filter_by(deletedAt=None).order_by(ProductFormula.category, ProductFormula.name).all()
    return jsonify({"products": [product_dict(r) for r in rows], "can_manage": is_admin()})


@product_bom_bp.post("/preview")
def preview():
    data = request.get_json() or {}
    product = get_product(data.get("product_id"))
    return jsonify(calculate(product.definition, data.get("dimensions") or product.definition["defaults"],
                             data.get("parameters") or {}, catalog(), data.get("overrides"), data.get("extras"),
                             data.get("markup", 30), data.get("vat", 0)))


@product_bom_bp.post("/classify")
def classify_prompt():
    data = request.get_json(silent=True) or {}
    text = data.get("text")
    mode = data.get("mode", "standard")
    if not isinstance(text, str) or not text.strip() or len(text) > 4000:
        raise ValueError("Nhập yêu cầu từ 1 đến 4000 ký tự")
    if mode not in ("standard", "fast"):
        raise ValueError("Chế độ xử lý không hợp lệ")
    fallback = False
    try:
        response = requests.post("https://genai.toolxprint.com/api/ai/signage/classify",
                                 json={"text": text.strip(), "mode": mode}, timeout=(5, 15 if mode == "fast" else 60))
        response.raise_for_status()
        result = response.json()
        if not isinstance(result, dict) or result.get("success") is not True:
            raise ValueError("invalid classification")
    except (requests.RequestException, ValueError):
        result = {}
        fallback = True

    # Explicit public schema: never forward engine metadata or raw upstream errors.
    def field(key):
        value = result.get(key)
        return value[:1000] if isinstance(value, str) else ""

    def normalize(value):
        value = unicodedata.normalize("NFD", value.lower().replace("đ", "d"))
        return " ".join("".join(c for c in value if not unicodedata.combining(c)).split())

    template = field("mau_admake_tuong_ung")
    library = ProductFormula.query.filter_by(deletedAt=None).all()
    if not library:
        return jsonify({"error": "Thư viện chưa có mẫu sản phẩm để tiếp tục."}), 404
    matches = [p.id for p in library
               if template and normalize(p.name) == normalize(template)]
    if library:
        # The classifier may omit the template; rank actual library names using
        # the customer's wording and the normalized technical classification.
        ignored = set("toi can lam cho cua hang tiem mot bang hieu san pham va co voi".split())
        query_words = set(normalize(text + " " + field("ten_loai_bang_hieu") + " " + template).split()) - ignored
        technical = {"alu", "mica", "inox", "decal", "led", "neon", "bat", "hop", "noi", "dong", "formex"}
        ranked = []
        for p in library:
            words = set(normalize(p.name).split())
            overlap = words & query_words
            score = sum(4 if word in technical else 1 for word in overlap)
            score -= 2 * len((words & technical) - query_words)
            ranked.append((score, len(overlap), p.id))
        ranked.sort(key=lambda value: (-value[0], -value[1], value[2]))
        if not matches and ranked:
            matches = [ranked[0][2]]
            fallback = True
    matches = sorted(matches)[:1]
    chosen = next(p for p in library if p.id == matches[0])
    materials = result.get("vat_lieu_chu_dao")
    materials = materials if isinstance(materials, list) else []
    return jsonify({"success": True, "mode": mode, "input_text": text.strip(), "fallback": fallback,
                    "loai_bang_hieu": field("loai_bang_hieu"),
                    "ten_loai_bang_hieu": field("ten_loai_bang_hieu"), "mo_ta_loai": field("mo_ta_loai"),
                    "mau_admake_tuong_ung": chosen.name,
                    "product_id": chosen.id,
                    "candidate_ids": list(dict.fromkeys([chosen.id] + [row[2] for row in ranked]))[:5],
                    "vat_lieu_chu_dao": [{"code": m["code"][:100], "ten": m["ten"][:255]}
                                         for m in materials[:30] if isinstance(m, dict)
                                         and isinstance(m.get("code"), str) and isinstance(m.get("ten"), str)]})


@product_bom_bp.post("/admin/preview")
def admin_preview():
    data = request.get_json() or {}
    definition = checked_definition(data.get("definition"))
    return jsonify(calculate(definition, data.get("dimensions") or definition["defaults"],
                             data.get("parameters") or {}, catalog()))


@product_bom_bp.post("/admin/products")
@product_bom_bp.put("/admin/products/<product_id>")
def save_product(product_id=None):
    data = request.get_json() or {}
    row = get_product(product_id, lock=True) if product_id else ProductFormula(id=uuid.uuid4().hex, version=0)
    if product_id and data.get("version") != row.version:
        abort(409, description="Công thức đã thay đổi. Tải lại.")
    definition = checked_definition(data.get("definition"))
    if not str(data.get("name") or "").strip():
        raise ValueError("Chưa nhập tên sản phẩm")
    if data.get("is_published"):
        if data.get("confirmed") is not True:
            raise ValueError("Chưa xác nhận công thức")
        result = calculate(definition, definition["defaults"], {}, catalog())
        if result["issues"] or not any(r["selected"] and r["quantity"] > 0 for r in result["rows"]):
            raise ValueError("Chưa thể áp dụng: " + "; ".join(result["issues"] or ["BOM trống"]))
    row.name = str(data["name"]).strip()[:255]
    row.category = str(data.get("category") or "Khác")[:120]
    image_url = str(data.get("image_url") or "")
    if image_url and not image_url.startswith("/static/product-bom/"):
        raise ValueError("Ảnh sản phẩm không hợp lệ")
    row.image_url = image_url
    row.definition = definition
    row.is_published = bool(data.get("is_published"))
    row.version = (row.version or 0) + 1
    row.updatedAt = datetime.utcnow()
    db.session.add(row); db.session.commit()
    return jsonify(product_dict(row))


@product_bom_bp.post("/admin/image")
def upload_image():
    file = request.files.get("file")
    if not file:
        raise ValueError("Chưa chọn ảnh")
    raw = file.read(10 * 1024 * 1024 + 1)
    if len(raw) > 10 * 1024 * 1024:
        raise ValueError("Ảnh tối đa 10 MB")
    try:
        image = Image.open(io.BytesIO(raw)).convert("RGB")
        image.thumbnail((1600, 1600))
    except Exception:
        raise ValueError("Không đọc được ảnh")
    folder = os.path.join(current_app.static_folder, "product-bom")
    os.makedirs(folder, exist_ok=True)
    name = uuid.uuid4().hex + ".jpg"
    image.save(os.path.join(folder, name), quality=90)
    return jsonify({"url": "/static/product-bom/" + name})


@product_bom_bp.post("/company-logo")
def upload_company_logo():
    file = request.files.get("file")
    if not file:
        raise ValueError("Chưa chọn logo")
    raw = file.read(5 * 1024 * 1024 + 1)
    if len(raw) > 5 * 1024 * 1024:
        raise ValueError("Logo tối đa 5 MB")
    try:
        with Image.open(io.BytesIO(raw)) as source:
            if source.format not in ("PNG", "JPEG", "WEBP"):
                raise ValueError("Định dạng logo không hợp lệ")
            source.thumbnail((1200, 1200))
            image = ImageOps.exif_transpose(source).convert("RGBA")
    except Exception:
        raise ValueError("Chọn logo PNG, JPG hoặc WebP hợp lệ")
    relative = f"product-bom/company-logos/{g.bom_actor.lead_id}"
    folder = os.path.join(current_app.static_folder, relative)
    os.makedirs(folder, exist_ok=True)
    name = uuid.uuid4().hex + ".png"
    image.save(os.path.join(folder, name), format="PNG")
    return jsonify({"url": f"/static/{relative}/{name}"})


def get_quote(quote_id, lock=False):
    query = ProductQuotation.query.filter_by(id=quote_id, user_id=g.bom_actor.id,
                                             lead_id=g.bom_actor.lead_id, deletedAt=None)
    row = (query.with_for_update() if lock else query).first()
    if not row:
        abort(404, description="Không tìm thấy báo giá")
    return row


def quote_dict(row):
    return {"id": row.id, "version": row.version, "stage": row.stage, "payload": row.payload}


def quote_payload(data, product):
    dimensions = data.get("dimensions") or product.definition["defaults"]
    # Snapshot recipe/version and evaluated prices; old quotes never silently change with the library.
    result = calculate(product.definition, dimensions, data.get("parameters") or {}, catalog(),
                       data.get("overrides"), data.get("extras"), data.get("markup", 30), data.get("vat", 0))
    brief = data.get("brief") or {}
    if not isinstance(brief, dict):
        raise ValueError("Thông tin bảng quảng cáo không hợp lệ")
    brief = {key: str(brief.get(key) or "")[:4000]
             for key in ("request_text", "sign_content", "notes", "sign_type", "materials", "generated_image_url", "render_signature",
                         "company_name", "company_address", "company_phone", "company_email", "company_logo_url",
                         "customer_name", "customer_phone", "customer_address")}
    brief["company_name"] = brief["company_name"].strip()[:255] or "Admake"
    brief["company_logo_url"] = brief["company_logo_url"] or "/logo.jpg"
    if brief["company_logo_url"] != "/logo.jpg" and not re.fullmatch(
        rf"/static/product-bom/company-logos/{re.escape(str(g.bom_actor.lead_id))}/[a-f0-9]{{32}}\.png", brief["company_logo_url"]):
        raise ValueError("Logo công ty không hợp lệ")
    return {"product": product_dict(product), "dimensions": dimensions, "brief": brief,
            "parameters": data.get("parameters") or {}, "overrides": data.get("overrides") or {},
            "extras": data.get("extras") or [], "markup": data.get("markup", 30), "vat": data.get("vat", 0),
            "result": result, "confirmations": []}


@product_bom_bp.get("/quotes")
def quotes():
    rows = ProductQuotation.query.filter_by(user_id=g.bom_actor.id, lead_id=g.bom_actor.lead_id,
                                            deletedAt=None).order_by(ProductQuotation.updatedAt.desc()).limit(50).all()
    return jsonify([{"id": r.id, "name": r.payload["product"]["name"], "stage": r.stage,
                     "total": r.payload["result"]["total"]} for r in rows])


@product_bom_bp.post("/quotes")
def create_quote():
    data = request.get_json() or {}
    product = get_product(data.get("product_id"))
    row = ProductQuotation(id=uuid.uuid4().hex, product_id=product.id, lead_id=g.bom_actor.lead_id,
                            user_id=g.bom_actor.id, version=1, stage=0, payload=quote_payload(data, product))
    db.session.add(row); db.session.commit()
    return jsonify(quote_dict(row)), 201


@product_bom_bp.get("/quotes/<quote_id>")
def read_quote(quote_id):
    return jsonify(quote_dict(get_quote(quote_id)))


@product_bom_bp.put("/quotes/<quote_id>")
def update_quote(quote_id):
    row = get_quote(quote_id, lock=True)
    data = request.get_json() or {}
    if data.get("version") != row.version:
        abort(409, description="Báo giá đã thay đổi. Tải lại.")
    # Revisions deliberately use the current recipe/price library and require reconfirmation.
    product = get_product(row.product_id)
    payload = quote_payload(data, product)
    old = row.payload
    same_dimensions = payload["dimensions"] == old["dimensions"] and payload["parameters"] == old["parameters"]
    same_bom = (payload["overrides"] == old["overrides"] and payload["extras"] == old["extras"]
                and payload["result"]["rows"] == old["result"]["rows"])
    same_price_options = payload["markup"] == old["markup"] and payload["vat"] == old["vat"]
    cap = (4 if same_price_options else 3) if same_dimensions and same_bom else (1 if same_dimensions else 0)
    if payload["product"]["version"] != old["product"]["version"]:
        cap = 0
    if payload["brief"] != old.get("brief", {key: "" for key in payload["brief"]}):
        cap = min(cap, 1)
    row.stage = min(row.stage, cap)
    payload["confirmations"] = old.get("confirmations", [])[:row.stage]
    row.payload = payload
    row.version += 1
    row.updatedAt = datetime.utcnow()
    db.session.commit()
    return jsonify(quote_dict(row))


@product_bom_bp.post("/quotes/<quote_id>/confirm")
def confirm_quote(quote_id):
    row = get_quote(quote_id, lock=True)
    data = request.get_json() or {}
    if data.get("version") != row.version or data.get("step") != row.stage or row.stage >= 4:
        abort(409, description="Bước xác nhận đã thay đổi")
    product = get_product(row.product_id)
    if product.version != row.payload["product"]["version"]:
        abort(409, description="Công thức đã đổi. Lưu và tính lại BOM trước khi xác nhận.")
    result = row.payload["result"]
    if row.stage >= 1 and (result["issues"] or not any(r["selected"] and r["quantity"] > 0 for r in result["rows"])):
        raise ValueError("; ".join(result["issues"] or ["Chưa chọn vật tư"]))
    if row.stage == 3 and not product.is_published:
        raise ValueError("Admin chưa duyệt công thức sản phẩm")
    payload = copy.deepcopy(row.payload)
    payload["confirmations"] = payload.get("confirmations", []) + [{"step": row.stage, "user_id": g.bom_actor.id,
                                                                     "at": datetime.utcnow().isoformat()}]
    row.stage += 1; row.version += 1; row.payload = payload; row.updatedAt = datetime.utcnow()
    db.session.commit()
    return jsonify(quote_dict(row))
