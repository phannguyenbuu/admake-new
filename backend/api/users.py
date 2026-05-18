from flask import Blueprint, request, jsonify, abort
from models import db, User, Task, dateStr, app,UserCanView,LeadPayload, Message, get_query_page_users, generate_datetime_id, Role
from flask import Flask, request, jsonify, session
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
import datetime
from sqlalchemy import desc, and_, func, select
from permission_utils import ensure_resource_lead, require_can_view, require_lead_user, require_self_or_lead

user_bp = Blueprint('user', __name__, url_prefix='/api/user')


def _get_target_user_or_404(user_id, message="User not found"):
    user = db.session.get(User, user_id)
    if not user:
        abort(404, description=message)
    return user


def _require_user_resource_access(target_user: User | None = None, role_id: int | None = None):
    resolved_role_id = role_id if role_id is not None else (target_user.role_id if target_user else None)
    
    is_supplier = False
    if resolved_role_id:
        if resolved_role_id == 101:
            is_supplier = True
        else:
            role_item = db.session.get(Role, resolved_role_id)
            if role_item and role_item.name == "Thầu phụ":
                is_supplier = True

    permission = "view_supplier" if is_supplier else "view_user"
    actor, _ = require_can_view(permission)
    if target_user:
        ensure_resource_lead(target_user, actor, "user")
    return actor

@user_bp.route("/", methods=["GET"])
def get_users():
    actor = _require_user_resource_access(role_id=1)
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)
    lead_id = request.args.get("lead", 0, type=int) or int(actor.lead_id or 0)
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
    actor = _require_user_resource_access(role_id=int((data or {}).get("role_id") or 0))
    if isinstance(data, dict) and not data.get("lead_id"):
        data["lead_id"] = actor.lead_id
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
    require_self_or_lead(user_id)
    data = request.get_json()
    print(data)

    user = _get_target_user_or_404(user_id, "Lead not found")

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
    require_lead_user(user_id)
    data = request.get_json()

    print('canview_data', data)

    user = _get_target_user_or_404(user_id, "Invalid user")

    username = data.get("username")

    if username:
        old_users = User.query.filter(User.username == username).all()

        for u in old_users:
            u.username = ''
            u.password = ''

    user.username = username
    user.password = data.get("password","")

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
        "view_workpoint", "view_supplier", "view_customer", "view_user",
        "view_workspace", "view_material", "view_invoice", "view_accountant", "view_statistic",
        # Kế toán sub-modules
        "view_acc_payroll", "view_acc_cashflow", "view_acc_ar", "view_acc_ap",
        "view_acc_docs", "view_acc_ledger", "view_acc_tax", "view_acc_assets",
        "view_acc_records", "view_acc_reports",
    ]

    for field in fields:
        if field in data:
            setattr(user_view, field, data[field])

    db.session.commit()

    return jsonify({"message": "Updated successfully", 
                    "data": user_view.tdict()}), 200


@user_bp.route("/<string:user_id>/can-view", methods=["POST"])
def post_user_can_view(user_id):
    require_lead_user(user_id)
    user = _get_target_user_or_404(user_id, "Invalid user")

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
    require_lead_user(user_id)
    user = _get_target_user_or_404(user_id, "Invalid user")

    user_view = UserCanView.query.filter_by(user_id=user_id).first()
    
    return jsonify({"message": "Updated successfully", 
                    "data": user_view.tdict() if user_view else []}), 200


@user_bp.route("/<string:id>/can-view", methods=["DELETE"])
def delete_user_can_view(id):
    ucv = db.session.get(UserCanView, id)
    if not ucv:
        print("Invalid UserCanView")
        abort(404, description="Invalid UserCanView")
    require_lead_user(ucv.user_id)

    db.session.delete(ucv)
    db.session.commit()
    
    return jsonify({"message": "DELETE successfully"}), 200

from sqlalchemy.orm import aliased
@user_bp.route("/<string:user_id>/can-view-all", methods=["GET"])
def get_user_can_view_all(user_id):
    require_lead_user(user_id)
    user = _get_target_user_or_404(user_id, "Invalid user")

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
    
    result = [ u.tdict() for u in users_can_view ]
    result_sorted = sorted(result, key=lambda x: x['username'])
    
    return jsonify({"message": "Updated successfully", "data":  result_sorted}), 200



@user_bp.route("/<string:user_id>/check-password", methods=["POST"])
def check_password_lead(user_id):
    require_self_or_lead(user_id)
    data = request.get_json()

    user = _get_target_user_or_404(user_id, "Lead-user not found")

    if data.get("old_password") != user.password:
        print("Mật khẩu cũ không đúng")
        abort(404, description="Mật khẩu cũ không đúng")

    return jsonify({'message':'right password'}), 200




@user_bp.route("/<string:id>", methods=["GET"])
def get_user_detail(id):
    user = _get_target_user_or_404(id, "user not found")
    _require_user_resource_access(user)
    return jsonify(user.tdict())

@user_bp.route("/<string:id>", methods=["PUT"])
def update_user(id):
    data = request.get_json()
    user = _get_target_user_or_404(id, "user not found")
    _require_user_resource_access(user)

    if data and "is_active" in data:
        if isinstance(data["is_active"], str):
            data["is_active"] = data["is_active"].lower() == "true"
        else:
            data["is_active"] = bool(data["is_active"])

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
    user = _get_target_user_or_404(id, "No user")
    _require_user_resource_access(user)
    
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
