from flask import Blueprint, request, jsonify, abort
from models import db, Task, generate_datetime_id, dateStr, User, Customer, Message, Role,get_lead_by_json, get_lead_by_arg, Workspace
import datetime
from sqlalchemy.orm.attributes import flag_modified
from api.messages import upload_a_file_to_vps
from sqlalchemy import cast, Text

task_bp = Blueprint('task', __name__, url_prefix='/api/task')


@task_bp.route("/all", methods=["GET"])
def get_all_tasks():
    
    tasks = [t.to_dict() for t in Task.query.all()]
    return jsonify(tasks)


@task_bp.route("/inlead/<string:lead_id>", methods=["GET"])
def get_tasks(lead_id):
    if lead_id == 0:
        print("Zero lead")
        abort(404, "Zero lead")
    workspaces = Workspace.query.filter(Workspace.lead_id == lead_id)
    result = []

    for work in workspaces:
        result += Task.query.filter_by(workspace_id=work.id).all()

    tasks = [t.to_dict() for t in result]

    # print('Tak', tasks)
    return jsonify(tasks)

@task_bp.route("/<string:id>", methods=["GET"])
def get_task_by_id(id):
    task = db.session.get(Task,id)

    if task is None:
        abort(404, description="Task not found")

    result = task.to_dict()

    if task.customer_id:
        customer = db.session.get(User, task.customer_id)
        if customer:
            result["customer_id"] = {"id":task.customer_id,"name": customer.fullName}
        else:
            result["customer_id"] = None

    print('Task detail', result)
    
    return jsonify({"data": result,"message":"Success"}),200

@task_bp.route("/<string:id>", methods=["PUT"])
def update_task(id):
    task = Task.query.get(id)
    if not task:
        abort(404, description="Task not found")

    data = request.get_json()
    print('PUT task', id, data.get("customer_id"))

    task.title = data.get("title", task.title)
    task.description = data.get("description", task.description)
    
    task.assign_ids = data.get("assign_ids", task.assign_ids)
    task.customer_id = data.get("customer_id", task.customer_id)

    # task.materials = data.get("materials", task.materials)
    task.start_time = data.get("start_time", task.start_time)
    
    task.end_time = data.get("end_time", task.end_time)

    task.type = data.get("type", task.type)
    task.reward = data.get("reward", task.reward)
    task.amount = data.get("amount", task.amount)
    task.salary_type = data.get("salary_type", task.salary_type)

    flag_modified(task, "assign_ids")
    
    db.session.add(task)
    db.session.commit()

    task = Task.query.get(id)
    print('F', task.to_dict())
    return jsonify(task.to_dict())

@task_bp.route("/<string:user_id>/by_user", methods=["GET"])
def get_task_by_user_id(user_id):
    user = db.session.get(User, user_id)

    if not user:
        abort(404, "No user")

    tasks = Task.query.filter(
        cast(Task.assign_ids, Text).like(f'%"{user_id}"%')
    ).order_by(Task.start_time).all()

    if not tasks:
        return jsonify({'message':'Empty list'}),202

    result = {"data":[], "reward":[]}
    for t in tasks:
        workspace = db.session.get(Workspace, t.workspace_id)
        item = t.to_dict()
        if 'workspace' in item and item['workspace']:
            result["data"].append(item)

            if t.status == "REWARD":
                total_agent_salary = 0

                for _user_id in t.assign_ids:
                    member_user = db.session.get(User, _user_id)
                    if member_user:
                        total_agent_salary += member_user.salary

                result["reward"].append({"title": t.title,
                                         "workspace": workspace.name,
                                         "start_time":t.start_time,
                                         "end_time":t.end_time,
                                         "reward": t.reward * user.salary / total_agent_salary})
            
    return jsonify(result), 200

@task_bp.route("/<string:id>/status", methods=["PUT"])
def update_task_status(id):
    task = Task.query.get(id)
    if not task:
        abort(404, description="Task not found")

    data = request.get_json()

    if task.status != data.get("status"):
        # Cập nhật các trường trong Task từ dữ liệu gửi lên
        task.status = data.get("status", task.status)
        task.check_reward = False
        db.session.commit()

    return jsonify(task.to_dict())



@task_bp.route("/<string:id>/upload", methods=["PUT"])
def update_task_assets(id):
    time = request.form.get("time")
    role = request.form.get("role")
    user_id = request.form.get("user_id")
    task_id = request.form.get("task_id")
    type = request.form.get("type")
    file = request.files.get("file")

    if not role:
        role = ''

    task = Task.query.get(id)
    if not task:
        abort(404, description="Task not found")

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
    
    filename, filepath = upload_a_file_to_vps(file)
    print('upload:', filename, filepath)
    ls = []

    # task.assets có thể None hoặc list
    if task.assets:
        ls = task.assets  # trực tiếp lấy list

    # thêm file mới nếu có
    if not filename:
        abort(404, description="Error when upload")

    message = Message.create_item({"message_id": generate_datetime_id(),
                                   "type": type,
                                    "user_id":user_id, 
                                    "task_id":task_id, 
                                    "file_url":filepath, 
                                    })
    ls.append(message.message_id)

    # gán lại trường assets là list Python
    task.assets = ls

    print('Task_asset', ls)


    flag_modified(task, "assets")
    db.session.commit()

    return jsonify({
        'filename': filename,
        'assets': ls,
        'message': message.to_dict(),
        **task.to_dict()})


@task_bp.route("/<string:id>/message", methods=["PUT"])
def update_task_message(id):
    time = request.form.get("time")
    role = request.form.get("role")
    user_id = request.form.get("user_id")
    task_id = request.form.get("task_id")
    type = request.form.get("type")
    text = request.form.get("text")

    if not role:
        role = ''

    task = Task.query.get(id)
    if not task:
        abort(404, description="Task not found")

    
    ls = []

    # task.assets có thể None hoặc list
    if task.assets:
        ls = task.assets  # trực tiếp lấy list

    message = Message.create_item({"message_id": generate_datetime_id(),
                                   "type": type,
                                    "user_id":user_id, 
                                    "task_id":task_id, 
                                    "text":text, 
                                    })
    ls.append(message.message_id)

    # gán lại trường assets là list Python
    task.assets = ls

    print('Task_asset', ls)


    flag_modified(task, "assets")
    db.session.commit()

    return jsonify({
        'text': text,
        'assets': ls,
        'message': message.to_dict(),
        **task.to_dict()})


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
        print("Task not found", id)
        abort(404, description="Task not found")

    db.session.delete(task)
    db.session.commit()

    return jsonify({"message": "Task deleted successfully"})