from flask import Blueprint, request, jsonify, abort
from models import db, Workspace, Task, dateStr
import datetime

workspace_bp = Blueprint('workspace', __name__, url_prefix='/workspace')

@workspace_bp.route("/", methods=["GET"])
def get_workspaces():
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)
    search = request.args.get("search", "", type=str)

    query = Workspace.query
    if search:
        query = query.filter(Workspace.name.ilike(f"%{search}%"))

    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    workspaces = [c.to_dict() for c in pagination.items]

    print(workspaces)

    return jsonify({
        "data": workspaces,
        "total": pagination.total,
        "pagination": {
            "total": pagination.total,
            "page": page,
            "per_page": limit,
            "pages": pagination.pages,
        }
    })


@workspace_bp.route("/<string:id>/tasks", methods=["GET"])
def get_workspace_task(id):
    work = db.session.get(Workspace, id)
    
    if not work:
        abort(404, description="Workspace not found")

    tasks = Task.query.filter_by(workspace_id=id).all()
    print('TASK', tasks)
    
    return jsonify([t.to_dict() for t in tasks])

@workspace_bp.route("/<string:id>", methods=["GET"])
def get_workspace_detail(id):
    work = db.session.get(Workspace, id)
    
    if not work:
        abort(404, description="Workspace not found")

    # tasks = Task.query.filter_by(workspace_id=id).all()
    # print('TASK', tasks)
    
    return jsonify(work.to_dict())