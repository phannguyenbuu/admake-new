from flask import Blueprint, request, jsonify, abort
from models import db, Customer, dateStr, User, generate_datetime_id
import datetime

customer_bp = Blueprint('customer', __name__, url_prefix='/customer')
def get_model_columns(model):
    """Lấy danh sách tên các cột từ 1 model"""
    return [c.name for c in model.__table__.columns]

@customer_bp.route("/", methods=["GET"])
def get_customers():
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)
    search = request.args.get("search", "", type=str)

    # print('customer', Customer.query.all())

    query = Customer.query
    if search:
        query = query.filter(Customer.fullName.ilike(f"%{search}%"))

    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    customers = [c.to_dict() for c in pagination.items]

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

# @customer_bp.route("/", methods=["POST"])
# def create_customer():
#     data = request.get_json()
#     new_customer = Customer(
#         fullName=data.get('fullName'),
#         phone=data.get('phone'),
#         workInfo=data.get('workInfo'),
#         workAddress=data.get('workAddress'),
#         workPrice=data.get('workPrice'),
#         status=data.get('status'),
#         workStart=dateStr(data.get('workStart')),
#         workEnd=dateStr(data.get('workEnd'))
#     )
#     db.session.add(new_customer)
#     db.session.commit()
#     return jsonify(new_customer.to_dict()), 201

@customer_bp.route("/", methods=["POST"])
def create_customer():
    data = request.get_json()

    # chia dữ liệu thành phần User và Customer
    user_fields = get_model_columns(User)
    customer_fields = get_model_columns(Customer)

    user_data = {k: v for k, v in data.items() if k in user_fields}
    customer_data = {k: v for k, v in data.items() if k in customer_fields}

    # ép kiểu ngày tháng nếu có
    for key in ['workStart', 'workEnd']:
        if key in customer_data and isinstance(customer_data[key], str):
            customer_data[key] = dateStr(customer_data[key])

    # tạo User trước
    new_user = User(
        id=generate_datetime_id(),   # ✅ bắt buộc gán id string
        **user_data,
        role_id="CUSTOMER"
    )
    db.session.add(new_user)
    db.session.flush()  # lấy id mà chưa commit

    # tạo Customer gắn với user_id
    new_customer = Customer(
        id=generate_datetime_id(),   # ✅ cũng cần id cho customer
        **customer_data,
        user_id=new_user.id
    )
    db.session.add(new_customer)
    db.session.commit()

    return jsonify(new_customer.to_dict()), 201




@customer_bp.route("/<string:id>", methods=["GET"])
def get_customer_detail(id):
    customer = db.session.get(Customer, id)
    if not customer:
        abort(404, description="Customer not found")
    return jsonify(customer.to_dict())

# @customer_bp.route("/<int:id>", methods=["PUT"])
# def update_customer(id):
#     data = request.get_json()
#     customer = db.session.get(Customer, id)
#     if not customer:
#         return jsonify({"error": "Customer not found"}), 404
#     for key, value in data.items():
#         if hasattr(customer, key):
#             if key in ['workStart', 'workEnd'] and isinstance(value, str):
#                 value = dateStr(value)
#             setattr(customer, key, value)
#     db.session.commit()
#     return jsonify(customer.to_dict()), 200




@customer_bp.route("/<int:id>", methods=["PUT"])
def update_customer(id):
    data = request.get_json()
    customer = db.session.get(Customer, id)
    if not customer:
        return jsonify({"error": "Customer not found"}), 404

    user = customer.user  # quan hệ tới User

    user_fields = get_model_columns(User)
    customer_fields = get_model_columns(Customer)

    # update User
    for key, value in data.items():
        if key in user_fields and hasattr(user, key):
            setattr(user, key, value)

    # update Customer
    for key, value in data.items():
        if key in customer_fields and hasattr(customer, key):
            if key in ['workStart', 'workEnd'] and isinstance(value, str):
                value = dateStr(value)
            setattr(customer, key, value)

    db.session.commit()
    return jsonify(customer.to_dict()), 200

