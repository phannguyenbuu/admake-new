from flask import Blueprint, request, jsonify, abort
from models import db, Material, dateStr
import datetime

material_bp = Blueprint('material', __name__, url_prefix='/material')

@material_bp.route("/", methods=["GET"])
def get_materials():
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)
    search = request.args.get("search", "", type=str)

    query = Material.query
    if search:
        query = query.filter(Material.name.ilike(f"%{search}%"))

    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    materials = [c.to_dict() for c in pagination.items]

    return jsonify({
        "data": materials,
        "total": pagination.total,
        "pagination": {
            "total": pagination.total,
            "page": page,
            "per_page": limit,
            "pages": pagination.pages,
        }
    })


@material_bp.route("/", methods=["POST"])
def create_material():
    data = request.get_json()
    print('MTL', data)
    new_material = Material(
        name=data.get('name'),
        quantity=data.get('quantity'),
        unit=data.get('unit'),
        price=data.get('price'),
        image=data.get('image'),
        description=data.get('description'),
        supplier=data.get('supplier'),
        version=data.get('__v'),
    )
    db.session.add(new_material)
    db.session.commit()
    return jsonify(new_material.to_dict()), 201

@material_bp.route("/<int:id>", methods=["GET"])
def get_material_detail(id):
    material = db.session.get(Material, id)
    if not material:
        abort(404, description="material not found")
    return jsonify(material.to_dict())

@material_bp.route("/<int:id>", methods=["PUT"])
def update_material(id):
    print(request)
    data = request.get_json()
    print(data)
    material = db.session.get(Material, id)
    if not material:
        return jsonify({"error": "material not found"}), 404
    for key, value in data.items():
        if hasattr(material, key):
            if key in ['workStart', 'workEnd'] and isinstance(value, str):
                value = dateStr(value)
            setattr(material, key, value)
    db.session.commit()
    return jsonify(material.to_dict()), 200


