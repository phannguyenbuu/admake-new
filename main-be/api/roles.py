from flask import Blueprint, request, jsonify, abort
from models import db, Role, dateStr
import datetime

role_bp = Blueprint('role', __name__, url_prefix='/api/role')

@role_bp.route("/", methods=["GET"])
def get_roles():
    roles = [c.to_dict() for c in Role.query.all()]

    print(roles)

    return jsonify(roles)

@role_bp.route("/role/list/permission/", methods=["GET"])
def get_role_list_permission():
    result = set()
    roles = Role.query.all()
    for c in roles:
        # Giả sử c.permissions là list hoặc iterable các permission string
        # Nếu là dict, cần lấy keys hoặc values tùy ý
        result.update(c.permissions)  # thêm nhiều phần tử vào set

    return jsonify(list(result))  # convert set thành list để jsonify


@role_bp.route("/", methods=["POST"])
def create_role():
    data = request.get_json()
    print('Role', data)
    new_role = Role.parse(data)
    db.session.add(new_role)
    db.session.commit()
    return jsonify(new_role.to_dict()), 201

@role_bp.route("/<int:id>", methods=["GET"])
def get_role_detail(id):
    role = db.session.get(Role, id)
    if not role:
        abort(404, description="role not found")
    return jsonify(role.to_dict())

@role_bp.route("/<int:id>", methods=["PUT"])
def update_role(id):
    print(request)
    data = request.get_json()
    print(data)
    role = db.session.get(Role, id)
    if not role:
        return jsonify({"error": "role not found"}), 404
    for key, value in data.items():
        if hasattr(role, key):
            if key in ['workStart', 'workEnd'] and isinstance(value, str):
                value = dateStr(value)
            setattr(role, key, value)
    db.session.commit()
    return jsonify(role.to_dict()), 200
