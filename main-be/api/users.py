from flask import Blueprint, request, jsonify, abort
from models import db, User, dateStr, app,LeadPayload, get_query_page_users
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

# @user_bp.route("/<string:user_id/lead", methods=["GET"])
# def get_user_leadId(user_id):
#     user = db.session.get(User,user_id)

#     if not user:
#         print("Unknown user")
#         abort(404, description="Unknown user")

#     return jsonify()
    



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
    
    return jsonify(new_user.tdict()), 201

@user_bp.route("/<string:id>", methods=["GET"])
def get_user_detail(id):
    user = db.session.get(User, id)
    if not user:
        abort(404, description="user not found")
    return jsonify(user.tdict())

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
    gender_map = {
        "female": 1,
        "male": 0,
        "other": 2
    }

    if "gender" in data and isinstance(data["gender"], str):
        gender_val = gender_map.get(data["gender"].lower())
        if gender_val is not None:
            setattr(user, "gender", gender_val)
        else:
            # Xử lý trường hợp giá trị gender không hợp lệ
            # Có thể raise lỗi hoặc gán giá trị mặc định, vd:
            setattr(user, "gender", 3)  # mặc định 'other'
        
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    
    return jsonify(user.tdict()), 200







@user_bp.route("/<string:id>", methods=["DELETE"])
def delete_user(id):
    user = db.session.get(User, id)
    if user:
        db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "User deleted"}), 200
