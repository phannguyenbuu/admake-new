from flask import Blueprint, request, jsonify, abort
from models import db, dateStr, User, generate_datetime_id, LeadPayload
import datetime
from sqlalchemy import desc

supplier_bp = Blueprint('supplier', __name__, url_prefix='/api/supplier')
def get_model_columns(model):
    """Lấy danh sách tên các cột từ 1 model"""
    return [c.name for c in model.__table__.columns]

@supplier_bp.route("/", methods=["GET"])
def get_suppliers():
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)
    search = request.args.get("search", "", type=str)
    lead_id = request.args.get("lead", 0, type=int)
    lead = db.session.get(LeadPayload, lead_id)

    if not lead:
        abort(404, description="Lead not found")


    query = lead.users.filter(User.role_id > 100)

    if search:
        # Lọc theo tên (user.fullName), cách này dùng ilike để không phân biệt hoa thường
        query = query.filter(User.fullName.ilike(f"%{search}%"))

    query = query.order_by(desc(User.updatedAt))

    # Phân trang
    pagination = query.paginate(page=page, per_page=limit, error_out=False)

    # Chuyển danh sách kết quả sang dạng dict
    suppliers = [c.tdict() for c in pagination.items]

    # Trả về json gồm dữ liệu và thông tin phân trang
    return jsonify({
        "data": suppliers,
        "total": pagination.total,
        "pagination": {
            "total": pagination.total,
            "page": page,
            "per_page": limit,
            "pages": pagination.pages,
        }
    })

@supplier_bp.route("/", methods=["POST"])
def create_supplier():
    data = request.get_json()
    print('Create new supplier', data)

    # chia dữ liệu thành phần User và supplier
    user_fields = get_model_columns(User)
    # supplier_fields = get_model_columns(supplier)

    user_data = {k: v for k, v in data.items() if k in user_fields}
    # supplier_data = {k: v for k, v in data.items() if k in supplier_fields}

    # ép kiểu ngày tháng nếu có
    for key in ['workStart', 'workEnd']:
        if key in user_data and isinstance(user_data[key], str):
            user_data[key] = dateStr(user_data[key])

    # tạo User trước
    new_user = User(
        id=generate_datetime_id(),   # ✅ bắt buộc gán id string
        **user_data,
        role_id=-1
    )
    # db.session.add(new_user)
    # db.session.flush()  # lấy id mà chưa commit

    # tạo supplier gắn với user_id
    # new_supplier = supplier(
    #     id=generate_datetime_id(),   # ✅ cũng cần id cho supplier
    #     **supplier_data,
    #     user_id=new_user.id
    # )
    # db.session.add(new_supplier)
    db.session.commit()

    return jsonify(new_user.tdict()), 201

@supplier_bp.route("/<string:id>", methods=["GET"])
def get_supplier_detail(id):
    supplier = db.session.get(supplier, id)
    if not supplier:
        abort(404, description="supplier not found")
    return jsonify(supplier.tdict())

# @supplier_bp.route("/<string:id>", methods=["PUT"])
# def update_supplier(id):
#     data = request.get_json()
#     supplier = db.session.get(supplier, id)
#     if not supplier:
#         return jsonify({"error": "supplier not found"}), 404

#     user = supplier.user  # quan hệ tới User

#     user_fields = get_model_columns(User)
#     supplier_fields = get_model_columns(supplier)

#     # update User
#     for key, value in data.items():
#         if key in user_fields and hasattr(user, key):
#             setattr(user, key, value)

#     # update supplier
#     for key, value in data.items():
#         if key in supplier_fields and hasattr(supplier, key):
#             if key in ['workStart', 'workEnd'] and isinstance(value, str):
#                 value = dateStr(value)
#             setattr(supplier, key, value)

#     db.session.commit()
#     return jsonify(supplier.tdict()), 200


@supplier_bp.route("/<string:id>", methods=["PUT"])
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
    
    return jsonify(user.tdict()), 200

@supplier_bp.route("/<string:id>", methods=["DELETE"])
def delete_user(id):
    user = db.session.get(User, id)
    if user:
        db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "Supplier deleted"}), 200