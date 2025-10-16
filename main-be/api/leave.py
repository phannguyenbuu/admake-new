from flask import Blueprint, request, jsonify, abort
from models import db, app, Leave, Message,User
from api.chat import socketio
from sqlalchemy import desc

leave_bp = Blueprint('leave', __name__, url_prefix='/api/leave')

@leave_bp.route("/", methods=["GET"])
def get_leaves():
    leaves = Leave.query.order_by(desc(Leave.createdAt)).all()
    return jsonify([c.to_dict() for c in leaves])

@leave_bp.route("/", methods=["POST"])
def create_leave():
    data = request.get_json()

    new_leave = Leave.create_item(data)
    db.session.add(new_leave)
    db.session.commit()

    return jsonify(new_leave.to_dict()), 201

@leave_bp.route("/<int:leave_id>", methods=["DELETE"])
def delete_leave(leave_id):
    leave = Leave.query.get(leave_id)
    if not leave:
        return jsonify({"error": "leavePayload not found"}), 404

    db.session.delete(leave)
    db.session.commit()
    return jsonify({"message": "leavePayload deleted successfully"}), 200

@leave_bp.route("/<int:leave_id>", methods=["GET"])
def get_leave_detail(leave_id):
    leave = db.session.get(Leave, id)
    if not leave:
        abort(404, description="leave not found")
    return jsonify(leave.to_dict())
