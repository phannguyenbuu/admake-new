from flask import Blueprint, request, jsonify, abort, g
from sqlalchemy import func
from models import db, Material, MaterialTransaction, generate_datetime_id
from permission_utils import ensure_resource_lead, require_can_view

material_bp = Blueprint("material", __name__, url_prefix="/api/material")


@material_bp.before_request
def guard_material_permission():
    actor, _ = require_can_view("view_material")
    g.permission_actor = actor

    material_id = (request.view_args or {}).get("material_id")
    if material_id:
        material = db.session.get(Material, material_id)
        if material:
            ensure_resource_lead(material, actor, "material")


def _to_float(value, default=0.0):
    try:
        if value is None or value == "":
            return float(default)
        return float(value)
    except (TypeError, ValueError):
        return float(default)


def _to_int(value, default=0):
    try:
        if value is None or value == "":
            return int(default)
        return int(value)
    except (TypeError, ValueError):
        return int(default)


@material_bp.route("/", methods=["GET"])
def get_materials():
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 20, type=int)
    search = request.args.get("search", "", type=str).strip()
    lead_id = request.args.get("lead", 0, type=int) or int(g.permission_actor.lead_id or 0)
    category = request.args.get("category", "", type=str).strip()

    query = Material.query
    if lead_id > 0:
        query = query.filter(Material.lead_id == lead_id)

    if search:
        query = query.filter(
            (Material.name.ilike(f"%{search}%"))
            | (Material.description.ilike(f"%{search}%"))
            | (Material.supplier.ilike(f"%{search}%"))
        )

    if category:
        query = query.filter(Material.description.ilike(f"%category:{category}%"))

    pagination = query.order_by(Material.updatedAt.desc()).paginate(
        page=page, per_page=limit, error_out=False
    )
    materials = [m.tdict() for m in pagination.items]

    return jsonify(
        {
            "data": materials,
            "total": pagination.total,
            "pagination": {
                "total": pagination.total,
                "page": page,
                "per_page": limit,
                "pages": pagination.pages,
            },
        }
    )


@material_bp.route("/summary", methods=["GET"])
def get_material_summary():
    lead_id = request.args.get("lead", 0, type=int) or int(g.permission_actor.lead_id or 0)
    query = Material.query
    if lead_id > 0:
        query = query.filter(Material.lead_id == lead_id)

    materials = query.all()
    total_items = len(materials)
    total_stock = sum(_to_float(m.quantity) for m in materials)
    total_value = sum(_to_float(m.quantity) * _to_float(m.price) for m in materials)

    return jsonify(
        {
            "total_items": total_items,
            "total_stock": total_stock,
            "total_value": total_value,
        }
    )


@material_bp.route("/", methods=["POST"])
def create_material():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400

    quantity = _to_float(data.get("quantity"), 0.0)
    price = _to_float(data.get("price"), 0.0)
    lead_id = _to_int(data.get("lead_id"), int(g.permission_actor.lead_id or 0)) or None

    # Embed category metadata in description for backward compatibility
    category = (data.get("category") or "").strip()
    description = (data.get("description") or "").strip()
    if category and f"category:{category}" not in description:
        description = f"{description}\ncategory:{category}".strip()

    new_material = Material(
        name=name,
        quantity=quantity,
        unit=(data.get("unit") or "").strip() or "Kg",
        price=price,
        image=data.get("image"),
        description=description,
        supplier=(data.get("supplier") or "").strip(),
        lead_id=lead_id,
        version=data.get("__v"),
    )
    # Production schema currently stores material.id as VARCHAR. Use explicit id to avoid
    # sequence drift causing duplicate-key errors on legacy data.
    new_material.id = generate_datetime_id()
    db.session.add(new_material)
    db.session.flush()

    if quantity > 0:
        tx = MaterialTransaction(
            id=generate_datetime_id(),
            material_id=new_material.id,
            movement_type="IN",
            quantity=quantity,
            unit_cost=price,
            note="Khởi tạo vật tư",
            lead_id=lead_id,
        )
        db.session.add(tx)

    db.session.commit()
    return jsonify(new_material.tdict()), 201


@material_bp.route("/<string:material_id>", methods=["GET"])
def get_material_detail(material_id):
    material = db.session.get(Material, material_id)
    if not material:
        abort(404, description="material not found")
    return jsonify(material.tdict())


@material_bp.route("/<string:material_id>", methods=["PUT"])
def update_material(material_id):
    data = request.get_json() or {}
    material = db.session.get(Material, material_id)
    if not material:
        return jsonify({"error": "material not found"}), 404

    for key, value in data.items():
        if hasattr(material, key):
            setattr(material, key, value)

    db.session.commit()
    return jsonify(material.tdict()), 200


@material_bp.route("/<string:material_id>/ledger", methods=["GET"])
def get_material_ledger(material_id):
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 20, type=int)
    query = MaterialTransaction.query.filter(MaterialTransaction.material_id == material_id)
    pagination = query.order_by(MaterialTransaction.createdAt.desc()).paginate(
        page=page, per_page=limit, error_out=False
    )

    return jsonify(
        {
            "data": [row.tdict() for row in pagination.items],
            "total": pagination.total,
            "pagination": {
                "total": pagination.total,
                "page": page,
                "per_page": limit,
                "pages": pagination.pages,
            },
        }
    )


@material_bp.route("/movement", methods=["POST"])
def create_material_movement():
    data = request.get_json() or {}
    material_id = str(data.get("material_id") or "").strip()
    movement_type = (data.get("movement_type") or "IN").upper().strip()
    quantity = _to_float(data.get("quantity"), 0.0)
    unit_cost = _to_float(data.get("unit_cost"), 0.0)
    task_id = data.get("task_id")
    note = (data.get("note") or "").strip()
    lead_id = _to_int(data.get("lead_id"), 0) or None

    if not material_id:
        return jsonify({"error": "material_id is required"}), 400
    if movement_type not in {"IN", "OUT", "ADJUST"}:
        return jsonify({"error": "movement_type must be IN/OUT/ADJUST"}), 400
    if quantity <= 0 and movement_type != "ADJUST":
        return jsonify({"error": "quantity must be > 0"}), 400

    material = db.session.get(Material, material_id)
    if not material:
        return jsonify({"error": "material not found"}), 404

    current_stock = _to_float(material.quantity, 0.0)
    if movement_type == "IN":
        new_stock = current_stock + quantity
    elif movement_type == "OUT":
        if quantity > current_stock:
            return jsonify({"error": "insufficient stock"}), 400
        new_stock = current_stock - quantity
    else:
        new_stock = quantity
        quantity = abs(new_stock - current_stock)

    material.quantity = new_stock
    if unit_cost > 0:
        material.price = unit_cost

    tx = MaterialTransaction(
        id=generate_datetime_id(),
        material_id=material.id,
        movement_type=movement_type,
        quantity=quantity,
        unit_cost=unit_cost if unit_cost > 0 else None,
        task_id=task_id,
        note=note,
        lead_id=lead_id or material.lead_id,
    )
    db.session.add(tx)
    db.session.commit()

    return jsonify({"material": material.tdict(), "transaction": tx.tdict()}), 201
