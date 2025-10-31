from flask import Blueprint, request, jsonify, abort
from models import app, db, Workspace, Task, dateStr,Message, generate_datetime_id, User, Customer
import datetime
from collections import defaultdict
from sqlalchemy import desc
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy.sql import func



workspace_bp = Blueprint('workspace', __name__, url_prefix='/api/workspace')

@workspace_bp.route("/", methods=["GET"])
def get_workspaces():
    print(app.config.get('MAX_CONTENT_LENGTH'))
    workspaces = Workspace.query.order_by(desc(Workspace.updatedAt)).all()
    return jsonify([c.to_dict() for c in workspaces])


@workspace_bp.route("/", methods=["POST"])
def create_worksapce_route():
    data = request.get_json()
    new_workspace = create_workspace(data)

    return jsonify(new_workspace.to_dict()), 201

def create_workspace(data):
    name = data.get('name')
    address = data.get('address')

    max_version = db.session.query(func.max(Workspace.version)).scalar()
    if max_version is None:
        max_version = 0


    new_workspace = Workspace(
        id=generate_datetime_id(),
        name=name,
        address=address,
        version=max_version + 1
    )
    
    db.session.add(new_workspace)
    db.session.commit()
    
    return new_workspace

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

@workspace_bp.route("/<int:group_id>/reward", methods=["PUT"])
def post_workspace_reward_task(group_id):
    data = request.get_json()
    message_id = data.get('message_id')
    rate = data.get('rate')

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
    work = Workspace.query.filter(Workspace.version == group_id).first()
    
    tasks = Task.query.filter_by(workspace_id=work.id).all()
    print('tasks',work, len(tasks))

    for task in tasks:
        print('task', task.title)
        if task.status != "REWARD":
            task.status = "DONE"
            task.check_reward = True

    # "OPEN" | "IN_PROGRESS" | "DONE" | "CHECK_REWARD" | "REWARD"

    
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



@workspace_bp.route("/<string:workspace_id>", methods=["DELETE"])
def delete_workspace(workspace_id):
    workspace = db.session.get(Workspace, workspace_id)
    if not workspace:
        return jsonify({"error": "Workspace not found"}), 404
    
    # print(workspace.owner_id)
    owner = db.session.get(User, workspace.owner_id)

    if owner:
        for customer in owner.customer:
            db.session.delete(customer)
        db.session.query(Message).filter(Message.user_id == owner.id).delete()
        db.session.delete(owner)

    db.session.delete(workspace)
    db.session.commit()
    return jsonify({"message": "Workspace deleted successfully"}), 200

__all__ = ['workspace_bp']