from flask import Blueprint, request, jsonify, abort
from models import db, Workspace, dateStr, User, create_customer_method, Message, LeadPayload, get_model_columns
# from api.groups import create_group
import datetime
from sqlalchemy import desc
from sqlalchemy import or_

customer_bp = Blueprint('customer', __name__, url_prefix='/api/customer')

@customer_bp.route("/", methods=["GET"])
def get_customers():
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)
    search = request.args.get("search", "", type=str)
    lead_id = request.args.get("lead", 0, type=int)

    if lead_id == 0:
        print("Zero lead")
        abort(404, description="Zero lead")
        
    lead = db.session.get(LeadPayload, lead_id)

    if not lead:
        abort(404, description="Lead not found")

    # print('customer', Customer.query.all(), search)

    query = Workspace.query.filter(Workspace.lead_id == lead_id)

    if search:
        query = query.filter(Workspace.name.ilike(f"%{search}%"))

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
    
    return create_customer_method(data)



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
    print('DELETE', customer, customer.owner_id, user)

    if user:
        db.session.query(Message).filter(Message.user_id == user.id).delete()
        db.session.delete(user)

    db.session.delete(customer)
    db.session.commit()

    return jsonify({"message": "Customer and user deleted"}), 200
