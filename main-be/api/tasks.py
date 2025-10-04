from flask import Blueprint, request, jsonify, abort
from models import db, Task, dateStr
import datetime

task_bp = Blueprint('task', __name__, url_prefix='/api/task')

@task_bp.route("/", methods=["GET"])
def get_tasks():
    tasks = [t.to_dict() for t in Task.query.all()]

    return jsonify(tasks)

@task_bp.route("/<string:id>", methods=["GET"])
def get_task_by_id(id):
    task = db.session.get(Task,id)

    if task is None:
        abort(404, description="Task not found")
    return jsonify(task.to_dict())

@task_bp.route("/<string:id>", methods=["PUT"])
def update_task(id):
    task = Task.query.get(id)
    if not task:
        abort(404, description="Task not found")

    data = request.get_json()

    # Cập nhật các trường trong Task từ dữ liệu gửi lên
    task.title = data.get("title", task.title)
    task.description = data.get("description", task.description)
    task.status = data.get("status", task.status)
    task.type = data.get("type", task.type)
    task.reward = data.get("reward", task.reward)
    task.assign_ids = data.get("assignIds", task.assign_ids)
    task.workspace_id = data.get("workspaceId", task.workspace_id)
    task.customer_id = data.get("customerId", task.customer_id)
    task.materials = data.get("materials", task.materials)
    task.start_time = data.get("startTime", task.start_time)
    task.end_time = data.get("endTime", task.end_time)

    db.session.commit()

    return jsonify(task.to_dict())


@task_bp.route("/<string:id>/status", methods=["PUT"])
def update_task_status(id):
    task = Task.query.get(id)
    if not task:
        abort(404, description="Task not found")

    data = request.get_json()

    # Cập nhật các trường trong Task từ dữ liệu gửi lên
    task.status = data.get("status", task.status)
    
    db.session.commit()

    return jsonify(task.to_dict())


@task_bp.route("/", methods=["POST"])
def create_task():
    data = request.get_json()

    print('New task', data)

    # Tạo Task mới từ data
    task = Task.parse(data)

    db.session.add(task)
    db.session.commit()

    return jsonify(task.to_dict()), 201

@task_bp.route("/<string:id>", methods=["DELETE"])
def delete_task(id):
    task = Task.query.get(id)
    if not task:
        abort(404, description="Task not found")

    db.session.delete(task)
    db.session.commit()

    return jsonify({"message": "Task deleted successfully"})
