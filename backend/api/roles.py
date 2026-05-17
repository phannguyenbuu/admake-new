from flask import Blueprint, request, jsonify, abort
from models import db, Role, dateStr
import datetime

role_bp = Blueprint('role', __name__, url_prefix='/api/role')

@role_bp.route("/", methods=["GET"])
def get_roles():
    lead_id = request.args.get('lead')
    if lead_id:
        roles = [c.tdict() for c in Role.query.filter_by(lead_id=lead_id).all()]
    else:
        roles = [c.tdict() for c in Role.query.all()]

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
    new_role = Role(**data)
    db.session.add(new_role)
    db.session.commit()
    return jsonify(new_role.tdict()), 201

@role_bp.route("/<int:id>", methods=["GET"])
def get_role_detail(id):
    role = db.session.get(Role, id)
    if not role:
        abort(404, description="role not found")
    return jsonify(role.tdict())

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
    return jsonify(role.tdict()), 200

@role_bp.route("/<int:id>", methods=["DELETE"])
def delete_role(id):
    from models import User
    role = db.session.get(Role, id)
    if not role:
        return jsonify({"error": "role not found"}), 404

    user_count = User.query.filter(User.role_id == id, User.lead_id == role.lead_id).count()
    if user_count > 0:
        return jsonify({"error": "Chức danh này đang được ấn định cho nhân sự, không thể xóa"}), 400
    
    db.session.delete(role)
    db.session.commit()
    return jsonify({"message": "Đã xóa chức danh"}), 200
