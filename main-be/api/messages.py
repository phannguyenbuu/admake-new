from flask import Blueprint, request, jsonify, abort
from models import db, dateStr, Message

message_bp = Blueprint('message', __name__, url_prefix='/message')

@message_bp.route("/", methods=["GET"])
def get_messages():
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)
    search = request.args.get("search", "", type=str)

    query = Message.query
    if search:
        query = query.filter(Message.text.ilike(f"%{search}%"))

    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    messages = [c.to_dict() for c in pagination.items]

    return jsonify({
        "data": messages,
        "total": pagination.total,
        "pagination": {
            "total": pagination.total,
            "page": page,
            "per_page": limit,
            "pages": pagination.pages,
        }
    })

@message_bp.route("/", methods=["POST"])
def create_message():
    data = request.get_json()

    new_message = Message.create_item(data)
    db.session.add(new_message)
    db.session.commit()

    return jsonify(new_message.to_dict()), 201

@message_bp.route("/<int:id>", methods=["GET"])
def get_message_detail(id):
    message = db.session.get(message, id)
    if not message:
        abort(404, description="Message not found")
    return jsonify(message.to_dict())

@message_bp.route("/<int:id>", methods=["PUT"])
def update_message(id):
    data = request.get_json()
    # print(data)
    role = db.session.get(Message, id)
    if not role:
        return jsonify({"error": "role not found"}), 404
    for key, value in data.items():
        if hasattr(role, key):
            if key in ['workStart', 'workEnd'] and isinstance(value, str):
                value = dateStr(value)
            setattr(role, key, value)
    db.session.commit()
    return jsonify(role.to_dict()), 200

