from flask import Blueprint, request, jsonify, abort
from models import db, Group, dateStr, GroupMember, generate_datetime_id

group_bp = Blueprint('group', __name__, url_prefix='/group')

@group_bp.route("/", methods=["GET"])
def get_groups():
    return jsonify([c.to_dict() for c in Group.query.all()])

@group_bp.route("/member/", methods=["GET"])
def get_group_members():
    group_members = [c.to_dict() for c in GroupMember.query.all()]
    return jsonify(group_members)

@group_bp.route("/", methods=["POST"])
def create_group():
    data = request.get_json()

    new_group = Group.create_item(data)
    db.session.add(new_group)
    db.session.commit()

    return jsonify(new_group.to_dict()), 201

@group_bp.route("/<int:id>", methods=["GET"])
def get_group_detail(id):
    group = db.session.get(group, id)
    if not group:
        abort(404, description="group not found")
    return jsonify(group.to_dict())

@group_bp.route("/<int:id>", methods=["PUT"])
def update_group(id):
    # print(request)
    data = request.get_json()
    # print(data)
    role = db.session.get(Group, id)
    if not role:
        return jsonify({"error": "role not found"}), 404
    for key, value in data.items():
        if hasattr(role, key):
            if key in ['workStart', 'workEnd'] and isinstance(value, str):
                value = dateStr(value)
            setattr(role, key, value)
    db.session.commit()
    return jsonify(role.to_dict()), 200

