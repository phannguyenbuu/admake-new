from flask import Blueprint, request, jsonify, abort
from models import db, Workspace, Task, dateStr, generate_datetime_id
import datetime
from collections import defaultdict

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
    workspaces = [c.to_dict() for c in Workspace.query.all()]

    # print(workspaces)

    return jsonify(workspaces)


@workspace_bp.route("/", methods=["POST"])
def create_workspace():
    data = request.get_json()
    new_workspace = Workspace(
        id=generate_datetime_id(),
        name=data.get('name')
    )
    db.session.add(new_workspace)
    db.session.commit()
    return jsonify(new_workspace.to_dict()), 201


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

@workspace_bp.route("/<string:id>", methods=["GET"])
def get_workspace_detail(id):
    work = db.session.get(Workspace, id)

    print('WSPACE', work)
    
    if not work:
        abort(404, description="Workspace not found")

    # tasks = Task.query.filter_by(workspace_id=id).all()
    # print('TASK', tasks)
    
    return jsonify(work.to_dict())