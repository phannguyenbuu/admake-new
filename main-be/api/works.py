from flask import Blueprint, request, jsonify, abort
from models import app, db, Workspace, Task, dateStr,Message, generate_datetime_id, User, create_workspace_method, get_model_columns, LeadPayload,get_lead_by_json, get_lead_by_arg
import datetime
from collections import defaultdict
from sqlalchemy import desc, asc
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy.sql import func

workspace_bp = Blueprint('workspace', __name__, url_prefix='/api/workspace')

@workspace_bp.route("/", methods=["GET"])
def get_workspaces():
    # lead_id, lead = get_lead_by_json(request)
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)
    lead_id = request.args.get("lead", 0, type=int)
    search = request.args.get("search", "", type=str)

    # if lead_id == 0 or not lead:
    #     abort(404, description="Unknown lead")

    workspaces = Workspace.query.filter(
                    Workspace.lead_id == lead_id,
                    Workspace.null_workspace == False
                ).order_by(
                    asc(Workspace.pinned),  # ưu tiên bản ghi có is_pin True
                    desc(Workspace.updatedAt)  # sau đó mới theo thời gian cập nhật
                ).all()
    return jsonify([c.tdict() for c in workspaces])

def get_role(user):
    s = user.update_role()
    if s:
        return s.get("name")
    else:
        return ""

def get_all_users_by_lead_id(lead_id):

    if lead_id == 0:
        return []

    users = [{
        "fullName": user.fullName,
        "user_id": user.id,
        "role": get_role(user),
        "phone": user.phone
        } for user in User.query.all() if user.lead_id == lead_id and (not user.role_id or user.role_id > 0)]

    
    return users

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

    return jsonify(workspace.tdict())

@workspace_bp.route("/<string:id>/pin", methods=["PUT"])
def update_workspace_pin(id):
    workspace = Workspace.query.get(id)
    if not workspace:
        abort(404, description="Workspace not found")

    data = request.get_json()
    pin = data.get('pin', False)

    workspace.pinned = pin
    db.session.commit()

    return jsonify(workspace.tdict())

@workspace_bp.route("/<string:id>/tasks", methods=["GET"])
def get_workspace_task(id):
    work = db.session.get(Workspace, id)
    
    if not work:
        abort(404, description="Workspace not found")

    tasks = Task.query.filter_by(workspace_id=id).all()
    grouped = defaultdict(lambda: {"count": 0, "tasks": []})
    for t in tasks:
        status = t.status or "UNKNOWN"
        grouped[status]["tasks"].append(t.tdict())
        grouped[status]["count"] += 1
    
    # Chuyển defaultdict về dict bình thường
    tasks_response = dict(grouped)

    print('Task', id)
    print(tasks_response)
    
    return jsonify({'data':tasks_response,
                    'namelist':[]}),200

@workspace_bp.route("/<string:workspace_id>/column_name", methods=["PUT"])
def put_workspace_change_column_name(workspace_id):
    data = request.get_json()
    type = data.get('type')
    name = data.get('name')

    
    workspace = db.session.get(Workspace, workspace_id)

    print(workspace, type, name)

    if workspace and type and type != '' and name and name != '':
        if type == "OPEN":
            workspace.column_open_name = name
        elif type == "IN_PROGRESS":
            workspace.column_in_progress_name = name
        elif type == "DONE":
            workspace.column_done_name = name
        elif type == "REWARD":
            workspace.column_reward_name = name
    
    # "OPEN" | "IN_PROGRESS" | "DONE" | "CHECK_REWARD" | "REWARD"

    
    db.session.commit()
    
    return jsonify({"message":"OK"}), 200

@workspace_bp.route("/<string:workspace_id>/reward", methods=["PUT"])
def put_workspace_reward_task(workspace_id):
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
    work = Workspace.query.filter(Workspace.id == workspace_id).first()
    
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
    
    result = work.tdict()
    users = get_all_users_by_lead_id(work.lead_id)
    result["users"] = users
    result["customers"] = []

    return jsonify(result)

@workspace_bp.route("/", methods=["POST"])
def create_workspace():
    data = request.get_json()
    print(data)
    
    return create_workspace_method(data, False)

@workspace_bp.route("/<string:workspace_id>", methods=["DELETE"])
def delete_workspace(workspace_id):
    workspace = db.session.get(Workspace, workspace_id)
    if not workspace:
        print('Cannot find workspace', workspace_id)
        return jsonify({"error": "Workspace not found"}), 404
    
    workspace.null_workspace = True

    db.session.commit()
    return jsonify({"message": "Workspace deleted successfully"}), 200


__all__ = ['workspace_bp']