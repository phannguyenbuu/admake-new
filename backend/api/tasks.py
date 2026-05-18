from flask import Blueprint, request, jsonify, abort, g
from models import db, Task, generate_datetime_id, dateStr, User, Customer, Message, Role,get_lead_by_json, get_lead_by_arg, Workspace
import datetime
import json as _json
from sqlalchemy.orm.attributes import flag_modified
from api.messages import upload_a_file_to_vps
from sqlalchemy import cast, Text
from PIL import Image
from sqlalchemy import func, cast
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import text
from dateutil.relativedelta import relativedelta
from permission_utils import ensure_resource_lead, require_can_view

task_bp = Blueprint('task', __name__, url_prefix='/api/task')


def _require_public_task_user(user_id: str | None) -> User:
    user = db.session.get(User, user_id)
    if not user:
        abort(404, description="User not found")
    return user


@task_bp.before_request
def guard_task_permission():
    if request.method == "OPTIONS":
        return

    endpoint = request.endpoint or ""
    view_args = request.view_args or {}

    if endpoint in {"task.update_task", "task.create_task"}:
        auth_header = (request.headers.get('Authorization') or '')
        cookie_header = (request.headers.get('Cookie') or '')
        print('[task-auth]', 'endpoint=', endpoint, 'auth_present=', bool(auth_header), 'auth_prefix=', auth_header[:48], 'cookie_present=', bool(cookie_header), 'cookie_prefix=', cookie_header[:96], 'content_type=', request.content_type)
        try:
            from flask_login import current_user
            print('[task-auth]', 'current_user_authenticated=', bool(getattr(current_user, 'is_authenticated', False)), 'current_user_id=', getattr(current_user, 'id', None))
        except Exception as log_err:
            print('[task-auth]', 'current_user_log_error=', log_err)

    if endpoint in {"task.get_task_by_user_id", "task.get_user_salary_task"}:
        target_user = _require_public_task_user(view_args.get("user_id"))
        g.permission_actor = target_user
        return

    if endpoint in {"task.update_task_message", "task.update_task_assets"}:
        try:
            actor, _ = require_can_view("view_workspace")
            g.permission_actor = actor
            return
        except Exception:
            user_id = request.form.get("user_id")
            if user_id:
                target_user = _require_public_task_user(user_id)
                g.permission_actor = target_user
                task_id = view_args.get("id")
                if task_id and task_id != "new":
                    task = db.session.get(Task, task_id)
                    if task:
                        assigns = []
                        if task.assign_ids:
                            try:
                                if isinstance(task.assign_ids, str):
                                    assigns = _json.loads(task.assign_ids)
                                elif isinstance(task.assign_ids, list):
                                    assigns = task.assign_ids
                            except Exception:
                                assigns = []
                        assign_str_list = [str(x) for x in assigns]
                        user_in_assigns = str(user_id) in assign_str_list or any(
                            isinstance(x, dict) and str(x.get('id')) == str(user_id) for x in assigns
                        )
                        if not user_in_assigns and str(task.customer_id) != str(user_id):
                            abort(403, description="Task is not assigned to this user")
                return
            abort(401, description="Unauthorized")

    actor, _ = require_can_view("view_workspace")
    g.permission_actor = actor

    task_id = view_args.get("id")
    if task_id and task_id != "new":
        task = db.session.get(Task, task_id)
        if task:
            ensure_resource_lead(task, actor, "task")


@task_bp.route("/all", methods=["GET"])
def get_all_tasks():
    actor = g.permission_actor
    tasks = [
        t.tdict()
        for t in Task.query.filter(Task.isDelete.is_(False), Task.lead_id == actor.lead_id)
    ]
    return jsonify(tasks)


@task_bp.route("/inlead/<string:lead_id>", methods=["GET"])
def get_tasks(lead_id):
    if lead_id == 0:
        print("Zero lead")
        abort(404, "Zero lead")
    workspaces = Workspace.query.filter(Workspace.lead_id == lead_id, Workspace.null_workspace.is_(False))
    result = []

    for work in workspaces:
        # result += Task.query.filter_by(workspace_id=work.id).all()
        result += Task.query.filter(
            Task.workspace_id == work.id,
            Task.isDelete.is_(False)
        ).all()


    tasks = [t.tdict() for t in result]

    # print('Tak', tasks)
    return jsonify(tasks)

@task_bp.route("/<string:id>", methods=["GET"])
def get_task_by_id(id):
    task = db.session.get(Task,id)

    if task is None:
        abort(404, description="Task not found")

    result = task.tdict()

    if task.customer_id:
        customer = db.session.get(User, task.customer_id)
        if customer:
            result["customer_id"] = {"id":task.customer_id,"name": customer.fullName}
        else:
            result["customer_id"] = None

    # print('Task detail', result)
    
    return jsonify({"data": result,"message":"Success"}),200

@task_bp.route("/<string:id>", methods=["PUT"])
def update_task(id):
    task = Task.query.get(id)
    if not task:
        abort(404, description="Task not found")

    data = request.get_json()
    # print('PUT task', id, data.get("customer_id"))

    task.title = data.get("title", task.title)
    task.description = data.get("description", task.description)
    
    task.assign_ids = data.get("assign_ids", task.assign_ids)
    task.customer_id = data.get("customer_id", task.customer_id)

    if data.get("materials") is not None:
        task.materials = data.get("materials")
        flag_modified(task, "materials")
    task.start_time = data.get("start_time", task.start_time)
    
    task.end_time = data.get("end_time", task.end_time)

    task.type = data.get("type", task.type)
    task.reward = data.get("reward", task.reward)
    task.amount = data.get("amount", task.amount)
    task.salary_type = data.get("salary_type", task.salary_type)

    if "icon" in data:
        task.icon = data.get("icon")

    flag_modified(task, "assign_ids")
    
    db.session.add(task)
    db.session.commit()

    task = Task.query.get(id)
    # print('F', task.tdict())
    return jsonify(task.tdict())

@task_bp.route("/<string:user_id>/by_user", methods=["GET"])
def get_task_by_user_id(user_id):
    user = db.session.get(User, user_id)

    if not user:
        abort(404, "No user")

    # tasks = Task.query.filter(
    #     cast(Task.assign_ids, Text).like(f'%"{user_id}"%')
    # ).order_by(Task.start_time).all()

    month_str = request.args.get("month", None, type=str)
    month_year = None
    if month_str:
        try:
            dt = datetime.datetime.strptime(month_str, "%Y-%m")
            month_year = (dt.month, dt.year)
        except ValueError:
            month_year = None

    tasks = Task.query.filter(
        cast(Task.assign_ids, Text).like(f'%"{user_id}"%'),
        Task.isDelete.is_(False)
    ).order_by(Task.start_time).all()

    if not tasks:
        return jsonify({'message':'Empty list'}),202

    result = {"data":[], "reward":[]}
    for t in tasks:
        workspace = db.session.get(Workspace, t.workspace_id)
        item = t.tdict()
        if 'workspace' in item and item['workspace']:
            if month_year and t.end_time:
                if (t.end_time.month, t.end_time.year) != month_year:
                    continue
            

            if t.status == "REWARD":
                total_agent_salary = 0

                for _user_id in t.assign_ids:
                    member_user = db.session.get(User, _user_id)
                    if member_user:
                        salary = member_user.salary if member_user.salary is not None else 0
                        total_agent_salary += salary


                user_salary = user.salary if user.salary is not None else 0
                reward_value = t.reward if t.reward is not None else 0
                result["reward"].append({"title": t.title,
                                         "workspace": workspace.name,
                                         "start_time":t.start_time,
                                         "end_time":t.end_time,
                                         "reward":  reward_value * user_salary / total_agent_salary if total_agent_salary != 0 else 0})
            else:
                result["data"].append(item)

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

    work = db.session.get(Workspace, task.workspace_id)
    new_status = ''

    print('Work', task.workspace_id, work, task.status)

    if work:
        if task.status == "OPEN":
            new_status = work.column_open_name
        elif task.status == "IN_PROGRESS":
            new_status = work.column_in_progress_name
        elif task.status == "DONE":
            new_status = work.column_done_name
        elif task.status == "REWARD":
            new_status = work.column_reward_name

    return jsonify({**task.tdict(), "new_status": new_status})




@task_bp.route("/<string:id>/upload-icon", methods=["PUT"])
def update_task_icon(id):
    try:
        auth_header = (request.headers.get('Authorization') or '')
        cookie_header = (request.headers.get('Cookie') or '')
        print('[upload-icon] auth_present=', bool(auth_header), 'auth_prefix=', auth_header[:48], 'cookie_present=', bool(cookie_header), 'cookie_prefix=', cookie_header[:96], 'content_type=', request.content_type)
        try:
            from flask_login import current_user
            print('[upload-icon] current_user_authenticated=', bool(getattr(current_user, 'is_authenticated', False)), 'current_user_id=', getattr(current_user, 'id', None))
        except Exception as log_err:
            print('[upload-icon] current_user_log_error=', log_err)
        # ✅ Lấy task_id từ param hoặc form
        task_id = request.form.get("task_id", id)
        
        # ✅ Validate file
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Empty filename'}), 400

        # ✅ Upload file
        filename, filepath, thumb_url = upload_a_file_to_vps(file)
        print(f'✅ Upload: {filename} | {filepath} | {thumb_url}')

        if not filename:
            return jsonify({'error': 'Upload failed'}), 500

        new_icon = thumb_url or filename
        pushed_messages = []

        if task_id != 'new':
            # ✅ Query task
            task = Task.query.get(task_id)
            if not task:
                return jsonify({'error': f'Task {task_id} not found'}), 404

            db.session.refresh(task)  # đảm bảo đọc giá trị mới nhất từ DB
            existing_icons = []
            if task.icon:
                try:
                    parsed = _json.loads(task.icon)
                    existing_icons = parsed if isinstance(parsed, list) else [parsed]
                except (ValueError, TypeError):
                    existing_icons = [task.icon]  # format cũ: 1 string plain

            # Nếu có ảnh cũ, chuyển tất cả ảnh cũ sang phần tài liệu (Message)
            if existing_icons:
                user_id = request.form.get("user_id") or getattr(current_user, 'id', None)
                ls = task.assets if task.assets else []
                for old_icon in existing_icons:
                    json_data = {
                        "type": "task",
                        "user_id": str(user_id) if user_id else None,
                        "file_url": old_icon,
                        "thumb_url": old_icon,
                        "message_id": generate_datetime_id(),
                        "task_id": task_id
                    }
                    message = Message.create_item(json_data)
                    ls.append(message.message_id)
                    pushed_messages.append(message.tdict())
                
                task.assets = ls
                flag_modified(task, "assets")

            # Gán ảnh mới làm icon duy nhất
            task.icon = _json.dumps([new_icon])
            flag_modified(task, 'icon')
            db.session.commit()

            return jsonify({
                'success': True,
                'filename': filename,
                'thumb_url': thumb_url,
                'icons': [new_icon],
                'pushed_messages': pushed_messages,
                'task': task.tdict()
            }), 200
        else:
            # Task 'new' chưa lưu DB
            return jsonify({
                'success': True,
                'filename': filename,
                'thumb_url': thumb_url,
                'icons': [new_icon],
                'pushed_messages': []
            }), 200

    except Exception as e:
        print(f"❌ Error upload icon: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@task_bp.route("/<string:id>/delete-icon", methods=["DELETE"])
def delete_task_icon(id):
    """Xóa 1 ảnh khỏi mảng icon theo index"""
    try:
        task = Task.query.get(id)
        if not task:
            return jsonify({'error': f'Task {id} not found'}), 404

        idx = request.args.get('idx', type=int)
        if idx is None:
            return jsonify({'error': 'Missing idx param'}), 400

        db.session.refresh(task)  # đọc mới nhất từ DB
        existing_icons = []
        if task.icon:
            try:
                parsed = _json.loads(task.icon)
                existing_icons = parsed if isinstance(parsed, list) else [parsed]
            except (ValueError, TypeError):
                existing_icons = [task.icon]

        if 0 <= idx < len(existing_icons):
            existing_icons.pop(idx)

        task.icon = _json.dumps(existing_icons) if existing_icons else None
        flag_modified(task, 'icon')
        db.session.commit()

        return jsonify({'success': True, 'icons': existing_icons}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@task_bp.route("/<string:id>/reorder-icons", methods=["PUT"])
def reorder_task_icons(id):
    """Lưu thứ tự ảnh mới sau khi drag-to-reorder"""
    try:
        task = Task.query.get(id)
        if not task:
            return jsonify({'error': f'Task {id} not found'}), 404

        data = request.get_json()
        new_order = data.get('icons', [])

        if not isinstance(new_order, list):
            return jsonify({'error': 'icons must be an array'}), 400

        task.icon = _json.dumps(new_order)
        flag_modified(task, 'icon')
        db.session.commit()

        return jsonify({'success': True, 'icons': new_order}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@task_bp.route("/<string:id>/upload-link", methods=["PUT"])
def link_draft_asset_to_task(id):
    """Link an already-uploaded file (by file_url) to an existing task as a Message asset."""
    try:
        task = Task.query.get(id)
        if not task:
            return jsonify({'error': f'Task {id} not found'}), 404

        file_url = request.form.get("file_url")
        thumb_url = request.form.get("thumb_url", file_url)
        user_id = request.form.get("user_id")
        type_ = request.form.get("type", "task")

        if not file_url:
            return jsonify({'error': 'No file_url provided'}), 400

        ls = task.assets if task.assets else []

        json_data = {
            "type": type_,
            "user_id": user_id,
            "file_url": file_url,
            "thumb_url": thumb_url,
            "message_id": generate_datetime_id(),
            "task_id": id,
        }
        message = Message.create_item(json_data)
        ls.append(message.message_id)

        task.assets = ls
        flag_modified(task, "assets")
        db.session.commit()

        return jsonify({'message': message.tdict(), **task.tdict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


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

    task = None
    if id != 'new':
        task = Task.query.get(id)
        if not task:
            abort(404, description="Task not found")

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
    
    filename, filepath, thumb_url = upload_a_file_to_vps(file)
    print('upload:', filename, filepath, thumb_url)
    ls = []

    # thêm file mới nếu có
    if not filename:
        abort(404, description="Error: cannot upload")

    json_data = {"type": type,
                "user_id":user_id, 
                "file_url":filename, 
                "thumb_url":thumb_url,
                }

    if task:
        if task.assets:
            ls = task.assets

        json_data["message_id"] = generate_datetime_id()
        json_data["task_id"] = task_id
        message = Message.create_item(json_data)
        
        ls.append(message.message_id)

        # gán lại trường assets là list Python
        task.assets = ls

        # print('Task_asset', ls)

        flag_modified(task, "assets")
        db.session.commit()

        return jsonify({
            # 'filename': filename,
            # 'assets': ls,
            'message': message.tdict(),
            **task.tdict()})
    else:
        json_data["message_id"] = generate_datetime_id()
        return jsonify({
            # 'filename': filename,
            # 'assets': ls,
            'message': json_data,
        })


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

    # print('Task_asset', ls)


    flag_modified(task, "assets")
    db.session.commit()

    return jsonify({
        'text': text,
        'assets': ls,
        'message': message.tdict(),
        **task.tdict()})

# @task_bp.route("/trash", methods=["GET"])
# def get_trash_tasks():
#     tasks = Task.query.filter(Task.isDelete.is_(True)).all()
#     return jsonify([t.tdict() for t in tasks])


@task_bp.route("/", methods=["POST"])
def create_task():
    data = request.get_json()
    if isinstance(data, dict):
        if data.get("workspace_id"):
            workspace = db.session.get(Workspace, data.get("workspace_id"))
            if workspace:
                ensure_resource_lead(workspace, g.permission_actor, "workspace")
                data.setdefault("lead_id", workspace.lead_id)
        elif not data.get("lead_id"):
            data["lead_id"] = g.permission_actor.lead_id

    # print('New task', data)

    # Tạo Task mới từ data
    task = Task.create_item(data)

    db.session.add(task)
    db.session.commit()

    return jsonify(task.tdict()), 201


@task_bp.route("/<string:user_id>/salary", methods=["GET"])
def get_user_salary_task(user_id):
    user = db.session.get(User, user_id)
    if not user:
        print("User not found")
        abort(404, description="User not found")

    user_id_str = str(user_id)
    
    tasks = Task.query.filter(text(f"assign_ids::text LIKE '%\"{user_id_str}\"%'")).all()
    if not tasks or len(tasks) == 0:
        print("Tasks A not found")
        abort(404, description="Tasks not found")

    ls = [0,0,0,0,0]

    for t in tasks:
        if t.workspace_id and t.rate and t.rate > 0:
            ls[t.rate - 1] += 1

    task = Task.query.filter(
        text(f"assign_ids::text LIKE '%\"{user_id_str}\"%'"),
        Task.type == "salary"
    ).first()

    if not task:
        print("Task B not found")
        abort(404, description="Task not found")


    month_str = request.args.get("month", None, type=str)
    target_month = None
    if month_str:
        try:
            target_month = datetime.datetime.strptime(month_str, "%Y-%m")
        except ValueError:
            target_month = None

    now = target_month if target_month else datetime.datetime.now()
    first_day = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_day = (first_day + relativedelta(months=1) - relativedelta(days=1)).replace(hour=23, minute=59, second=59, microsecond=999999)

    filtered_messages = Message.query.filter(
        Message.user_id == user_id,
        Message.createdAt >= first_day,
        Message.createdAt <= last_day
    ).all()

    # message = Message.query.filter(Message.user_id == user_id, 
    #                                message.createdAt in this month)
    
    return jsonify({"infor":task.tdict(),
                    "messages": [m.tdict() for m in filtered_messages],
                    "rates": ls,
                    }), 200
        
        


@task_bp.route("/<string:id>", methods=["DELETE"])
def delete_task(id):
    task = Task.query.get(id)
    if not task:
        print("Task not found", id)
        abort(404, description="Task not found")

    task.isDelete = True

    # db.session.delete(task)
    db.session.commit()

    return jsonify({"message": "Task deleted successfully"})

@task_bp.route("/restore/<string:id>", methods=["PUT"])
def restore_task(id):
    task = Task.query.get(id)
    if not task:
        print("Task not found", id)
        abort(404, description="Task not found")

    task.isDelete = False

    # db.session.delete(task)
    db.session.commit()

    return jsonify({"message": "Task restore successfully"})


@task_bp.route("/<string:id>/forever", methods=["DELETE"])
def delete_task_forever(id):
    task = Task.query.get(id)
    if not task:
        print("Task not found", id)
        abort(404, description="Task not found")

    db.session.delete(task)
    db.session.commit()

    return jsonify({"message": "Task deleted successfully"})


@task_bp.route("/trash/inlead/<string:lead_id>", methods=["GET"])
def get_trash_tasks(lead_id):
    workspaces = Workspace.query.filter(
        Workspace.lead_id == lead_id,
        Workspace.null_workspace.is_(False)
    )

    result = []
    for work in workspaces:
        result += Task.query.filter(
            Task.workspace_id == work.id,
            Task.isDelete == True
        ).all()

    return jsonify([t.tdict() for t in result])

@task_bp.route("/trash/clear/inlead/<int:lead_id>", methods=["DELETE"])
def clear_trash_by_lead(lead_id):
    if not lead_id:
        abort(400, "Invalid lead_id")

    tasks = Task.query.filter(
        Task.lead_id == lead_id,
        Task.isDelete == True
    ).all()

    for task in tasks:
        db.session.delete(task)

    db.session.commit()

    return jsonify({
        "message": "Trash cleared",
        "deleted": len(tasks)
    }), 200
