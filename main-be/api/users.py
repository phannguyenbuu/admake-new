from flask import Blueprint, request, jsonify, abort
from models import db, User, Task, dateStr, app,UserCanView,LeadPayload, Message, get_query_page_users, generate_datetime_id
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
    db.session.commit()
    
    return jsonify(new_user.tdict()), 201



@user_bp.route("/<string:user_id>/password", methods=["PUT"])
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
      
    db.session.commit()
    # db.session.refresh(user)

    return jsonify(user.tdict()), 201


@user_bp.route("/<string:user_id>/can-view", methods=["PUT"])
def update_user_can_view(user_id):
    data = request.get_json()

    user = db.session.get(User, user_id)
    if not user:
        print("Invalid user")
        abort(404, description="Invalid user")

    # Tìm bản ghi UserCanView theo user_id
    user_view = UserCanView.query.filter_by(user_id=user_id).first()
    if not user_view:
        # Nếu chưa có, tạo mới
        user_view = UserCanView(
            id = generate_datetime_id(),
            user_id=user_id)
        db.session.add(user_view)

    # Cập nhật các trường boolean từ dữ liệu gửi lên
    fields = [
        "view_workpoint", "view_user", "view_supplier", "view_customer",
        "view_workspace", "view_material", "view_price", "view_accountant", "view_statistic"
    ]
    for field in fields:
        if field in data:
            setattr(user_view, field, data[field])

    db.session.commit()

    return jsonify({"message": "Updated successfully", 
                    "data": user_view.tdict}), 200


@user_bp.route("/<string:user_id>/can-view", methods=["POST"])
def post_user_can_view(user_id):
    user = db.session.get(User, user_id)
    if not user:
        print("Invalid user")
        abort(404, description="Invalid user")

    # Tìm bản ghi UserCanView theo user_id
    user_view = UserCanView.query.filter_by(user_id=user_id).first()
    if not user_view:
        # Nếu chưa có, tạo mới
        user_view = UserCanView(
            id = generate_datetime_id(),
            user_id=user_id)
        db.session.add(user_view)

    db.session.commit()

    return jsonify({"message": "Updated successfully", 
                    "data": user_view.tdict()}), 200


@user_bp.route("/<string:user_id>/can-view", methods=["GET"])
def get_user_can_view(user_id):
    user = db.session.get(User, user_id)
    if not user:
        print("Invalid user")
        abort(404, description="Invalid user")

    user_view = UserCanView.query.filter_by(user_id=user_id).first()
    
    return jsonify({"message": "Updated successfully", 
                    "data": user_view.tdict() if user_view else []}), 200


@user_bp.route("/<string:id>/can-view", methods=["DELETE"])
def delete_user_can_view(id):
    user = db.session.get(UserCanView, id)
    if not user:
        print("Invalid UserCanView")
        abort(404, description="Invalid UserCanView")

    db.session.delete(id)
    db.session.commit()
    
    return jsonify({"message": "DELETE successfully"}), 200

from sqlalchemy.orm import aliased
@user_bp.route("/<string:user_id>/can-view-all", methods=["GET"])
def get_user_can_view_all(user_id):
    user = db.session.get(User, user_id)
    if not user:
        print("Invalid user")
        abort(404, description="Invalid user")

    user_view = UserCanView.query.filter_by(user_id=user_id).first()
    if not user_view:
        return jsonify({"message": "Updated successfully", "data": [] }), 200

    UserAlias = aliased(User)

    users_can_view = (
                UserCanView.query
                .join(UserAlias, UserAlias.id == UserCanView.user_id)
                .filter(UserAlias.lead_id == user.lead_id, UserAlias.id != user.id)
                .all()
            )
    
    return jsonify({"message": "Updated successfully", 
                    "data": [ u.tdict() for u in users_can_view ] }), 200



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
    
    if not user:
        print("No user", id)
        abort(404, description = "No user")
    else:
        Message.query.filter_by(user_id=user.id).delete(synchronize_session=False)
        db.session.commit()  # Đảm bảo các message được xóa trước, tránh vi phạm khoá ngoại

        # Lấy user và xóa
        user = db.session.get(User, user.id)
        if user:
            db.session.delete(user)
            db.session.commit()

    return jsonify({"message": "User deleted"}), 200
