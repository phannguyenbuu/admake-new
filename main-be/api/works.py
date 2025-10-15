from flask import Blueprint, request, jsonify, abort
from models import db, Workspace, Task, dateStr,Message, generate_datetime_id, Group, User, Customer
import datetime
from collections import defaultdict
from sqlalchemy import desc
from sqlalchemy.orm.attributes import flag_modified

workspace_bp = Blueprint('workspace', __name__, url_prefix='/api/workspace')

@workspace_bp.route("/", methods=["GET"])
def get_workspaces():
    # page = request.args.get("page", 1, type=int)
    # limit = request.args.get("limit", 10, type=int)
    # search = request.args.get("search", "", type=str)

    # query = Workspace.query
    # if search:
    #     query = query.filter(Workspace.name.ilike(f"%{search}%"))

    # pagination = query.paginate(page=page, per_page=limit, error_out=False)
    workspaces = Workspace.query.order_by(desc(Workspace.createdAt)).all()
       

    # print(workspaces)

    return jsonify([c.to_dict() for c in workspaces])


@workspace_bp.route("/", methods=["POST"])
def create_workspace():
    data = request.get_json()

    group_id = data.get('group_id')

    if group_id:
        group = db.session.get(Group, group_id)

        if group:
            name = group.name
            

    if not name:    
        name = data.get('name')

    if not name:
        return jsonify({"error": "Empty Workspace name"}), 405

    existing = Workspace.query.filter_by(name=name).first()
    if existing:
        return jsonify({"error": "Workspace name already exists"}), 400


    new_workspace = Workspace(
        id=generate_datetime_id(),
        name=name
    )
    
    db.session.add(new_workspace)
    db.session.commit()
    return jsonify(new_workspace.to_dict()), 201


def get_role(user):
    s = user.update_role()
    if s:
        return s.get("name")
    else:
        return ""

def get_all_users_and_customers():
    users = [{
        "fullName": user.fullName,
        "user_id": user.id,
        "role": get_role(user),
        "phone": user.phone
        } for user in User.query.all() if not user.role_id or user.role_id > 0]

    customers = [{
        "fullName": customer.user.fullName,
        "user_id": customer.user.id,
        # "role": "customer",
        "phone": customer.user.phone,
        "workAddress": customer.workAddress,
        } for customer in Customer.query.all()]
    
    return users, customers

@workspace_bp.route("/<string:id>", methods=["PUT"])
def update_workspace(id):
    workspace = Workspace.query.get(id)
    if not workspace:
        abort(404, description="Workspace not found")

    data = request.get_json()

    # Cập nhật các trường
    workspace.name = data.get("name", workspace.name)
    # Nếu có thêm trường khác, cập nhật tương tự
    


    db.session.commit()

    return jsonify(workspace.to_dict())

@workspace_bp.route("/<string:id>/tasks", methods=["GET"])
def get_workspace_task(id):
    work = db.session.get(Workspace, id)
    
    if not work:
        abort(404, description="Workspace not found")

    tasks = Task.query.filter_by(workspace_id=id).all()
    grouped = defaultdict(lambda: {"count": 0, "tasks": []})
    for t in tasks:
        status = t.status or "UNKNOWN"
        grouped[status]["tasks"].append(t.to_dict())
        grouped[status]["count"] += 1
    
    # Chuyển defaultdict về dict bình thường
    tasks_response = dict(grouped)
    
    return jsonify(tasks_response)

@workspace_bp.route("/<int:id>/reward", methods=["PUT"])
def post_workspace_reward_task(id):
    data = request.get_json()
    message_id = data.get('message_id')
    rate = data.get('rate')

    group = db.session.get(Group, id)
    if not group:
        print("Group not found", id)
        abort(404, description="Group not found")

    print("Group", group.name)
    work = Workspace.query.filter(Workspace.name.ilike(group.name)).first()
        
    if not work:
        print("Workspace not found", group.name)
        abort(404, description="Workspace not found")

    msgs = Message.query.filter(Message.message_id == message_id).all()
    print('msgs', len(msgs))

    if len(msgs) == 0:
        print("Message not found", message_id)
        abort(404, description="Message not found")
    
    msg = msgs[0]

    print('-message', msg, rate, msg.react)
    if not msg.react:
        msg.react = {}

    if rate:
        msg.react["rate"] = rate
        flag_modified(msg, "react")
    # db.session.commit()
    
    tasks = Task.query.filter_by(workspace_id=work.id).all()
    # tasks = Task.query.execution_options(autoflush=False).filter_by(workspace_id=work.id).all()

    print('tasks',work, len(tasks))

    for task in tasks:
        print('task', task.title)
        task.status = "REWARD"

    
    db.session.commit()
    
    return jsonify({"message":"OK"}), 200

@workspace_bp.route("/<string:id>", methods=["GET"])
def get_workspace_detail(id):
    work = db.session.get(Workspace, id)

    print('WSPACE', work)
    
    if not work:
        abort(404, description="Workspace not found")

    # tasks = Task.query.filter_by(workspace_id=id).all()
    # print('TASK', tasks)
    
    result = work.to_dict()
    users, customers = get_all_users_and_customers()
    result["users"] = users
    result["customers"] = customers

    return jsonify(result)

__all__ = ['customer_bp']