from flask import Blueprint, request, jsonify, abort
from models import db, User, dateStr, app
from flask import Flask, request, jsonify, session
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
import datetime
from sqlalchemy import desc

user_bp = Blueprint('user', __name__, url_prefix='/api/user')

@user_bp.route("/", methods=["GET"])
def get_users():
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)
    search = request.args.get("search", "", type=str)

    query = User.query.filter(User.role_id != -1)

    if search:
        query = query.filter(
            (User.username.ilike(f"%{search}%")) | 
            (User.fullName.ilike(f"%{search}%"))
        )

    query = query.order_by(desc(User.createdAt))

    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    users = [c.to_dict() for c in pagination.items]

    return jsonify({
        "data": users,
        "total": pagination.total,
        "pagination": {
            "total": pagination.total,
            "page": page,
            "per_page": limit,
            "pages": pagination.pages,
        }
    })

@user_bp.route("/", methods=["POST"])
def create_user():
    data = request.get_json()
    print('USER', data)
    new_user = User.parse(data)
        
    db.session.add(new_user)
    db.session.commit()
    return jsonify(new_user.to_dict()), 201

@user_bp.route("/<string:id>", methods=["GET"])
def get_user_detail(id):
    user = db.session.get(User, id)
    if not user:
        abort(404, description="user not found")
    return jsonify(user.to_dict())

@user_bp.route("/<string:id>", methods=["PUT"])
def update_user(id):
    data = request.get_json()
    print(data)
    user = db.session.get(User, id)
    if not user:
        return jsonify({"error": "user not found"}), 404
    
    for key, value in data.items():
        if hasattr(user, key):
            if key in ['workStart', 'workEnd'] and isinstance(value, str):
                value = dateStr(value)

            setattr(user, key, value)
        
    db.session.commit()
    return jsonify(user.to_dict()), 








