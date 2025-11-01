from flask import Blueprint, request, jsonify, abort
from models import db, User, dateStr, app,LeadPayload
from flask import Flask, request, jsonify, session
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
import datetime
from sqlalchemy import desc, and_, func, select

user_bp = Blueprint('user', __name__, url_prefix='/api/user')

@user_bp.route("/", methods=["GET"])
def get_users():
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)
    lead_id = request.args.get("lead", 0, type=int)
    search = request.args.get("search", "", type=str)
        
    users, pagination = get_query_page_users(lead_id,page,limit,search)

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

from collections import namedtuple
def get_query_page_users(lead_id, page, limit, search):
    if lead_id != 0:
        lead = db.session.get(LeadPayload, lead_id)
        if not lead:
            Pagination = namedtuple('Pagination', ['total', 'pages'])
            empty_pagination = Pagination(total=0, pages=0)
            return [], empty_pagination
        
        query = lead.users.filter(
            and_(
                User.role_id > 0,
                User.role_id < 100,
            )
        )
    else:
        # Lấy toàn bộ user khi lead_id == 0
        query = User.query.filter(
            and_(
                User.role_id > 0,
                User.role_id < 100,
            )
        )

    print('User_query', lead_id, query.count())

    if search:
        query = query.filter(
            (User.username.ilike(f"%{search}%")) | 
            (User.fullName.ilike(f"%{search}%"))
        )

    split_length = func.array_length(func.regexp_split_to_array(User.fullName, ' '), 1)
    last_name = func.split_part(User.fullName, ' ', split_length)

    query = query.order_by(desc(User.updatedAt)).order_by(last_name, User.id)

    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    users = [c.to_dict() for c in pagination.items]

    return users, pagination

@user_bp.route("/", methods=["POST"])
def create_user():
    data = request.get_json()
    print('USER', data)
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







@user_bp.route("/<string:id>", methods=["DELETE"])
def delete_user(id):
    user = db.session.get(User, id)
    if user:
        db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "User deleted"}), 200
