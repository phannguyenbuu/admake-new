from flask import Blueprint, request, jsonify, abort
from models import db, User, Task, dateStr, app,LeadPayload, get_query_page_users, generate_datetime_id
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

    task = Task(
            id=generate_datetime_id(),
            type="salary",
            assign_ids=[new_user.id]
        )
    db.session.add(task)
    
    return jsonify(new_user.tdict()), 201




@user_bp.route("/<string:user_id>", methods=["PUT"])
def update_lead_user_password(user_id):
    data = request.get_json()
    print(data)

    user = db.session.get(User, user_id)

    if not user:
        print("Lead not found")
        abort(404, description="Lead not found")

    if data.get("old_password") != user.password:
        print("Mật khẩu cũ không đúng")
        abort(404, description="Mật khẩu cũ không đúng")
    
    # id = db.Column(db.Integer, primary_key=True)
    # name = db.Column(db.String(120), nullable=False)
    if data.get("fullName"):
        user.fullName = data.get("fullName")

    if data.get("username"):
        user.username = data.get("username")

    if data.get("password"):
        user.password = data.get("password")
        

    # if data.get("company"):
    #     user.company = data.get("company")

    # if data.get("address"):
    #     user.address = data.get("address")

    # if data.get("email"):
    #     user.email = data.get("email")

    # if data.get("phone"):
    #     user.phone = data.get("phone")

    # if data.get("description"):
    #     user.description = data.get("description")

    # if data.get("industry"):
    #     user.industry = data.get("industry")

    db.session.commit()

    # companySize = db.Column(db.String(50), nullable=False)
    # expiredAt = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    # balance_amount = db.Column(db.Float)

    # balance_amount = db.Column(db.Float)

    db.session.refresh(user)
    return jsonify(user.tdict()), 201

@user_bp.route("/<string:user_id>/check-password", methods=["POST"])
def check_password_lead(user_id):
    data = request.get_json()

    user = db.session.get(User, user_id)

    if not user:
        print("Lead-user not found")
        abort(404, description="Lead-user not found")

    if data.get("old_password") != user.password:
        print("Mật khẩu cũ không đúng")
        abort(404, description="Mật khẩu cũ không đúng")

    return jsonify({'message':'right password'}), 200




@user_bp.route("/<string:id>", methods=["GET"])
def get_user_detail(id):
    user = db.session.get(User, id)
    if not user:
        abort(404, description="user not found")
    return jsonify(user.tdict())

@user_bp.route("/<string:id>", methods=["PUT"])
def update_user(id):
    data = request.get_json()
    # print('PUT user', data)
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
