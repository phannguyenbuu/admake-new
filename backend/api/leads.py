from flask import Blueprint, request, jsonify, abort, make_response
import json
import os
import time
from urllib.parse import urlsplit, urlunsplit
from werkzeug.utils import secure_filename
from models import db, app, LeadPayload, Message,User
from api.chat import socketio
from sqlalchemy import desc

lead_bp = Blueprint('lead', __name__, url_prefix='/api/lead')


def _landing_content_path():
    return os.path.join(os.path.dirname(__file__), "..", "content.json")


def _load_landing_content():
    content_path = _landing_content_path()
    with open(content_path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def _write_landing_content(data):
    content_path = _landing_content_path()
    with open(content_path, "w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def _split_asset_url(value):
    parsed = urlsplit(value or "")
    asset_path = parsed.path or ""
    return parsed, asset_path


def _append_cache_bust(value):
    parsed, asset_path = _split_asset_url(value)
    bust = str(int(time.time()))
    return urlunsplit(parsed._replace(path=asset_path, query=f"v={bust}"))


def _resolve_content_asset_target(asset_path):
    if not asset_path:
        raise ValueError("Missing asset path")

    normalized = asset_path.replace("\\", "/")
    if os.path.isabs(normalized):
        return normalized

    if normalized.startswith("/static/"):
        relative_path = normalized[len("/static/"):]
        return os.path.join(app.config.get("UPLOAD_FOLDER", ""), relative_path)

    if normalized.startswith("public/"):
        relative_path = normalized[len("public/"):]
        candidates = [
            os.getenv("LANDING_PUBLIC_DIR"),
            "/var/www/admake-landing-page/public",
            os.path.join(os.path.dirname(__file__), "..", "..", "admake-landing-page", "public"),
        ]
        for candidate in candidates:
            if candidate and os.path.isdir(candidate):
                return os.path.join(candidate, relative_path)
        if candidates[0]:
            return os.path.join(candidates[0], relative_path)
        raise ValueError("Landing public directory is not configured")

    if normalized.startswith("/"):
        return normalized

    return os.path.join(app.config.get("UPLOAD_FOLDER", ""), normalized)


@lead_bp.route("/<int:lead_id>/assign-user", methods=["PUT"])
def assign_user(lead_id):
    data = request.get_json()
    user_id = data.get("user_id")  # ✅ FIX tên field
    print("assign_user", user_id)
    lead = LeadPayload.query.get_or_404(lead_id)
    lead.user_id = user_id         # ✅ FIX field name
    db.session.commit()
    return jsonify({"success": True})

@lead_bp.route("/", methods=["GET"])
def get_leads():
    leads = LeadPayload.query.order_by(desc(LeadPayload.createdAt)).all()
    return jsonify([c.tdict() for c in leads])

@lead_bp.route("/", methods=["POST"])
def create_lead():
    data = request.get_json()
    print(data)
    new_lead = LeadPayload.create_item(data)
    
    return jsonify(new_lead.tdict()), 201

@lead_bp.route("/content/", methods=["GET"])
def get_landing_content():
    data = _load_landing_content()

    response = make_response(jsonify(data))
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, PUT, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response

@lead_bp.route("/content/", methods=["PUT"])
def update_landing_content():
    data = request.get_json()
    if data is None:
        return jsonify({"error": "Invalid payload"}), 400

    try:
        _write_landing_content(data)
    except OSError:
        return jsonify({"error": "Failed to write content"}), 500

    response = make_response(jsonify({"success": True}))
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, PUT, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response

@lead_bp.route("/content/pricing-image", methods=["PUT"])
def update_pricing_image():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file or file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    original_name = secure_filename(file.filename or "")
    base_name, ext = os.path.splitext(original_name)
    ext = ext.lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
        return jsonify({"error": "Unsupported file type"}), 400

    try:
        data = _load_landing_content()
    except (OSError, json.JSONDecodeError):
        return jsonify({"error": "Failed to load content"}), 500

    image_path = (data.get("pricing") or {}).get("image")
    if not image_path:
        return jsonify({"error": "Missing pricing image path"}), 400

    _, current_asset_path = _split_asset_url(image_path)
    current_dir = os.path.dirname(current_asset_path).replace("\\", "/")
    safe_base_name = secure_filename(base_name) or "pricing-image"
    stamped_name = f"{safe_base_name}-{int(time.time())}{ext}"
    next_asset_path = f"{current_dir}/{stamped_name}" if current_dir else stamped_name

    try:
        target_path = _resolve_content_asset_target(next_asset_path)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    try:
        file.save(target_path)
    except OSError:
        return jsonify({"error": "Failed to write file"}), 500

    try:
        old_target_path = _resolve_content_asset_target(current_asset_path)
    except ValueError:
        old_target_path = None
    if old_target_path and old_target_path != target_path and os.path.exists(old_target_path):
        try:
            os.remove(old_target_path)
        except OSError:
            pass

    data.setdefault("pricing", {})["image"] = _append_cache_bust(next_asset_path)
    try:
        _write_landing_content(data)
    except OSError:
        return jsonify({"error": "Failed to update content"}), 500

    response = make_response(jsonify({"success": True, "path": data["pricing"]["image"]}))
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, PUT, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response

@lead_bp.route("/content/", methods=["OPTIONS"])
def landing_content_options():
    response = make_response("", 204)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, PUT, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Cache-Control"] = "no-store"
    return response

@lead_bp.route("/<int:lead_id>/check", methods=["PUT"])
def check_invite_lead(lead_id):
    data = request.get_json()
    print(data)
    lead = db.session.get(LeadPayload, lead_id)

    if not lead:
        abort(404, description="No lead")
    lead.isInvited = data.get("isInvited", False)

    db.session.commit()
    
    return jsonify('Check done!'), 201

@lead_bp.route("/<int:lead_id>/activate", methods=["PUT"])
def check_activate_lead(lead_id):
    data = request.get_json()
    print(data)
    lead = db.session.get(LeadPayload, lead_id)

    if not lead:
        abort(404, description="No lead")
    lead.isActivated = data.get("isActivated", False)

    db.session.commit()
    
    return jsonify('isActivated done!'), 201

@lead_bp.route("/<int:lead_id>/level", methods=["PUT"])
def update_lead_level(lead_id):
    data = request.get_json() or {}
    level = data.get("level")
    try:
        level = int(level)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid level"}), 400
    if level < 0 or level > 3:
        return jsonify({"error": "Level must be between 0 and 3"}), 400

    lead = db.session.get(LeadPayload, lead_id)
    if not lead:
        abort(404, description="No lead")
    lead.level = level
    db.session.commit()
    return jsonify({"success": True, "level": level})

@lead_bp.route("/<int:lead_id>", methods=["DELETE"])
def delete_lead(lead_id):
    lead = LeadPayload.query.get(lead_id)
    if not lead:
        return jsonify({"error": "LeadPayload not found"}), 404

    db.session.delete(lead)
    db.session.commit()
    return jsonify({"message": "LeadPayload deleted successfully"}), 200

@lead_bp.route("/<int:lead_id>", methods=["GET"])
def get_lead_detail(lead_id):
    lead = db.session.get(LeadPayload, id)
    if not lead:
        abort(404, description="lead not found")
    return jsonify(lead.tdict())


# ── Contract Flow ───────────────────────────────────────────────

PRICING = {
    "basic":        {"6": 2000000, "12": 3000000},
    "professional": {"6": 2500000, "12": 4000000},
    "specialized":  {"yearly": 2000000},
}


def _calc_contract_amount(plan, billing):
    """Return total VND including 10% VAT."""
    plan_prices = PRICING.get(plan, {})
    base = plan_prices.get(billing, 0)
    return int(base * 1.1)


@lead_bp.route("/contract", methods=["POST"])
def submit_contract():
    """Landing page submits full contract form (13 fields + plan/billing)."""
    import datetime as dt
    data = request.get_json() or {}

    # Required fields
    name = (data.get("name") or "").strip()
    phone = (data.get("phone") or "").strip()
    if not name or not phone:
        return jsonify({"error": "name and phone are required"}), 400

    plan = data.get("selected_plan", "")
    billing = data.get("selected_billing", "")

    # Try to find existing lead by phone or email
    email = (data.get("email") or "").strip()
    lead = None
    if phone:
        lead = LeadPayload.query.filter_by(phone=phone).first()
    if not lead and email:
        lead = LeadPayload.query.filter_by(email=email).first()

    if lead:
        # Update existing lead with contract fields
        for field in [
            "name", "company", "address", "email", "industry",
            "companySize", "description", "tax_code", "legal_rep",
            "legal_rep_position", "invoice_email", "promo_code",
        ]:
            val = data.get(field)
            if val is not None:
                setattr(lead, field, val.strip() if isinstance(val, str) else val)
    else:
        # Create new lead
        lead_fields = {}
        for field in [
            "name", "phone", "email", "company", "address",
            "industry", "companySize", "description", "tax_code",
            "legal_rep", "legal_rep_position", "invoice_email", "promo_code",
        ]:
            val = data.get(field)
            if val is not None:
                lead_fields[field] = val.strip() if isinstance(val, str) else val
        lead = LeadPayload(**lead_fields)
        db.session.add(lead)

    # Set plan + contract info
    lead.selected_plan = plan
    lead.selected_billing = billing
    amount = data.get("contract_amount")
    if amount:
        lead.contract_amount = int(amount)
    else:
        lead.contract_amount = _calc_contract_amount(plan, billing)
    lead.contract_status = "submitted"
    lead.contract_submitted_at = dt.datetime.utcnow()

    db.session.commit()

    return jsonify(lead.tdict()), 201


@lead_bp.route("/<int:lead_id>/confirm-payment", methods=["PUT"])
def confirm_payment(lead_id):
    """Admin confirms payment → activate account + set expiry."""
    import datetime as dt
    lead = db.session.get(LeadPayload, lead_id)
    if not lead:
        abort(404, description="Lead not found")

    lead.contract_status = "paid"
    lead.payment_confirmed_at = dt.datetime.utcnow()
    lead.isActivated = True

    if not lead.trial_started_at:
        lead.trial_started_at = dt.datetime.utcnow()

    # Set expiredAt based on billing period
    billing = lead.selected_billing or "12"
    if billing == "yearly":
        months = 12
    else:
        try:
            months = int(billing)
        except (TypeError, ValueError):
            months = 12

    lead.expiredAt = dt.datetime.utcnow() + dt.timedelta(days=months * 30)

    db.session.commit()
    return jsonify({"success": True, "lead": lead.tdict()})


@lead_bp.route("/<int:lead_id>/amount", methods=["PUT"])
def update_amount(lead_id):
    """Admin sets custom contract amount."""
    data = request.get_json() or {}
    amount = data.get("amount")
    if amount is None:
        return jsonify({"error": "amount is required"}), 400
    try:
        amount = int(amount)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid amount"}), 400

    lead = db.session.get(LeadPayload, lead_id)
    if not lead:
        abort(404, description="Lead not found")

    lead.contract_amount = amount
    db.session.commit()
    return jsonify({"success": True, "amount": amount})


@lead_bp.route("/trial-summary", methods=["GET"])
def trial_summary():
    """Return trial/subscription tracking summary."""
    import datetime as dt
    now = dt.datetime.utcnow()

    leads = LeadPayload.query.filter(
        LeadPayload.isActivated == True
    ).all()

    expired = []
    expiring_soon = []    # ≤ 7 days
    expiring_month = []   # ≤ 30 days
    active = []

    for lead in leads:
        lead_data = lead.tdict()
        if lead.expiredAt:
            exp = lead.expiredAt
            if exp.tzinfo is not None:
                exp = exp.replace(tzinfo=None)
            delta = exp - now
            days_remaining = delta.days
            lead_data["days_remaining"] = days_remaining

            if days_remaining <= 0:
                expired.append(lead_data)
            elif days_remaining <= 7:
                expiring_soon.append(lead_data)
            elif days_remaining <= 30:
                expiring_month.append(lead_data)
            else:
                active.append(lead_data)
        else:
            lead_data["days_remaining"] = None
            active.append(lead_data)

    return jsonify({
        "expired": expired,
        "expiring_soon": expiring_soon,
        "expiring_month": expiring_month,
        "active": active,
        "counts": {
            "expired": len(expired),
            "expiring_soon": len(expiring_soon),
            "expiring_month": len(expiring_month),
            "active": len(active),
        }
    })
