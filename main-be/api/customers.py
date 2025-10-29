from flask import Blueprint, request, jsonify, abort
from models import db, Workspace, dateStr, User, generate_datetime_id, Customer
from api.groups import create_group
import datetime
from sqlalchemy import desc
from sqlalchemy import or_

customer_bp = Blueprint('customer', __name__, url_prefix='/api/customer')
def get_model_columns(model):
    """Lấy danh sách tên các cột từ 1 model"""
    return [c.name for c in model.__table__.columns]

@customer_bp.route("/", methods=["GET"])
def get_customers():
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)
    search = request.args.get("search", "", type=str)

    # print('customer', Customer.query.all())

    query = Workspace.query
    if search:
        query = query.filter(
            or_(
                Workspace.user.fullName.ilike(f"%{search}%"),
                Workspace.name.ilike(f"%{search}%")
            )
        )

    query = query.order_by(desc(Workspace.updatedAt))

    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    customers = [c.all_props() for c in pagination.items]

    return jsonify({
        "data": customers,
        "total": pagination.total,
        "pagination": {
            "total": pagination.total,
            "page": page,
            "per_page": limit,
            "pages": pagination.pages,
        }
    })


@customer_bp.route("/", methods=["POST"])
def create_customer():
    data = request.get_json()

    # chia dữ liệu thành phần User và Customer
    user_fields = get_model_columns(User)
    customer_fields = get_model_columns(Workspace)

    user_data = {k: v for k, v in data.items() if f"user_{k}" in user_fields}
    customer_data = {k: v for k, v in data.items() if k in customer_fields}

    # ép kiểu ngày tháng nếu có
    for key in ['workStart', 'workEnd']:
        if key in customer_data and isinstance(customer_data[key], str):
            customer_data[key] = dateStr(customer_data[key])

    # tạo User trước
    new_user = User(
        id=generate_datetime_id(),   # ✅ bắt buộc gán id string
        **user_data,
        role_id=-1
    )
    db.session.add(new_user)
    db.session.flush()  # lấy id mà chưa commit

    # tạo Customer gắn với user_id
    new_customer = Workspace(
        id=generate_datetime_id(),   # ✅ cũng cần id cho customer
        name = data.get("name",""),
        owner_id=new_user.id
    )
    db.session.add(new_customer)
    db.session.commit()

    print(new_customer.to_dict())
    
    return jsonify(new_customer.to_dict()), 201

@customer_bp.route("/<string:id>", methods=["GET"])
def get_customer_detail(id):
    customer = db.session.get(Workspace, id)
    if not customer:
        abort(404, description="Customer not found")

    result = customer.to_dict()
    user = db.session.get(User, customer.owner_id)

    if not user:
        abort(404, description="Workspace owner not found")

    user_fields = get_model_columns(User)
    for k in user_fields:
        result[f"user_{k}"] = getattr(user, k, None)
    
    return jsonify(result)

@customer_bp.route("/<string:id>", methods=["PUT"])
def update_customer(id):
    data = request.get_json()
    customer = db.session.get(Workspace, id)
    if not customer:
        return jsonify({"error": "Workspace not found"}), 404

    user = db.session.get(User, customer.owner_id)

    if not user:
        abort(404, description="Workspace owner not found")

    user_fields = get_model_columns(User)
    customer_fields = get_model_columns(Workspace)

    # update User
    for k, value in data.items():
        if k.startswith("user_"):
            key = k.replace("user_", "")
            if key in user_fields and hasattr(user, key):
                setattr(user, key, value)

    # update Customer
    for key, value in data.items():
        if not key.startswith("user_") and key in customer_fields and hasattr(customer, key):
                if key in ['workStart', 'workEnd'] and isinstance(value, str):
                    value = dateStr(value)
                setattr(customer, key, value)

    db.session.commit()
    return jsonify(customer.to_dict()), 200

@customer_bp.route("/<string:id>", methods=["DELETE"])
def delete_customer(id):
    customer = db.session.get(Workspace, id)
    if not customer:
        return jsonify({"error": "Workspace not found"}), 404

    # Nếu muốn xóa luôn user liên quan:
    user = db.session.get(User, customer.owner_id)
    if user:
        db.session.delete(user)

    db.session.delete(customer)
    db.session.commit()

    return jsonify({"message": "Customer and user deleted"}), 200
