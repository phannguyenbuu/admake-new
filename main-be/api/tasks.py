from flask import Blueprint, request, jsonify, abort
from models import db, Task, dateStr
import datetime

task_bp = Blueprint('task', __name__, url_prefix='/task')

@task_bp.route("/", methods=["GET"])
def get_tasks():
    tasks = [t.to_dict() for t in Task.query.all()]

    return jsonify(tasks)