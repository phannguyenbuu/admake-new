from flask import Blueprint, request, jsonify, abort
from models import db, User, dateStr, app
from flask import Flask, request, jsonify, session
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
import datetime
from sqlalchemy import desc, and_

user_bp = Blueprint('user', __name__, url_prefix='/api/user')

@user_bp.route("/", methods=["GET"])
def get_users():
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)
    search = request.args.get("search", "", type=str)

    users, pagination = get_query_page_users(page,limit,search)

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

def get_query_page_users(page,limit,search):
    query = User.query.filter(
        and_(
            User.role_id != -1,
            User.role_id != 3
        )
    )

    if search:
        query = query.filter(
            (User.username.ilike(f"%{search}%")) | 
            (User.fullName.ilike(f"%{search}%"))
        )

    query = query.order_by(desc(User.createdAt), User.id)

    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    users = [c.to_dict() for c in pagination.items]

    return users, pagination

@user_bp.route("/", methods=["POST"])
def create_user():
    data = request.get_json()
    # print('USER', data)
    new_user = User.create_item(data)
        
    db.session.add(new_user)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"Commit error: {e}")
        raise

    db.session.refresh(new_user)
    
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
    print('PUT user', data)
    user = db.session.get(User, id)
    if not user:
        return jsonify({"error": "user not found"}), 404
    
    for key, value in data.items():
        if hasattr(user, key):
            if key in ['workStart', 'workEnd'] and isinstance(value, str):
                value = dateStr(value)

            setattr(user, key, value)
        
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    
    return jsonify(user.to_dict()), 200








