from flask import Blueprint, request, jsonify, abort
from models import db, Workspace, dateStr, User, create_workspace_method, Message, LeadPayload, get_model_columns, get_query_page_users
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

    # customers, pagination = get_query_page_users(lead_id,page,limit,search, role_id = -1)
    
    # print('customer', len(customers))

    query = Workspace.query.filter(
            Workspace.lead_id == lead_id,
            Workspace.owner_id != None)

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
    
    return create_workspace_method(data)

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
        if k != 'id':
            result[k] = getattr(user, k, None)

    print('Customer', result)
    
    return jsonify(result)

@customer_bp.route("/<string:id>", methods=["PUT"])
def update_customer(id):
    data = request.get_json()
    workspace = db.session.get(Workspace, id)
    if not workspace:
        return jsonify({"error": "Workspace not found"}), 404

    user = db.session.get(User, workspace.owner_id)

    if not user:
        abort(404, description="Workspace owner not found")

    user_fields = get_model_columns(User)
    workspace_fields = get_model_columns(Workspace)

    # update User
    for key, value in data.items():
        if key in user_fields and hasattr(user, key):
            if key in ['workStart', 'workEnd'] and isinstance(value, str):
                    value = dateStr(value)
            setattr(user, key, value)

    # update Customer
    for key, value in data.items():
        if key in workspace_fields and hasattr(workspace, key):
            if key in ['workStart', 'workEnd'] and isinstance(value, str):
                value = dateStr(value)
            setattr(workspace, key, value)

    db.session.commit()
    return jsonify(workspace.to_dict()), 200

@customer_bp.route("/<string:workspace_id>", methods=["DELETE"])
def delete_customer(workspace_id):
    workspace = db.session.get(Workspace, workspace_id)
    if not workspace:
        print('Cannot find workspace', workspace_id)
        return jsonify({"error": "Workspace not found"}), 404
    
    print('Delete workspace', workspace.owner_id)
    owner = db.session.get(User, workspace.owner_id)

    if owner:
        for customer in owner.customer:
            db.session.delete(customer)
        db.session.query(Message).filter(Message.user_id == owner.id).delete()
        db.session.delete(owner)

    db.session.delete(workspace)
    db.session.commit()
    return jsonify({"message": "Workspace deleted successfully"}), 200