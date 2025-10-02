from flask import Blueprint, request, jsonify, abort
from models import db, app, Workpoint, Message,User, dateStr, generate_datetime_id
from api.chat import socketio
from sqlalchemy import desc
from datetime import datetime, time

workpoint_bp = Blueprint('workpoint', __name__, url_prefix='/api/workpoint')

@workpoint_bp.route("/", methods=["GET"])
def get_workpoints():
    workpoints = Workpoint.query.order_by(desc(Workpoint.createdAt)).all()
    return jsonify([c.to_dict() for c in workpoints])

@workpoint_bp.route("/", methods=["POST"])
def create_workpoint():
    data = request.get_json()

    new_workpoint = Workpoint.create_item(data)
    db.session.add(new_workpoint)
    db.session.commit()

    return jsonify(new_workpoint.to_dict()), 201

@workpoint_bp.route("/<string:id>", methods=["GET"])
def get_workpoint_detail(id):
    workpoint = db.session.get(Workpoint, id)
    if not workpoint:
        abort(404, description="workpoint not found")
    return jsonify(workpoint.to_dict())

@workpoint_bp.route("/<string:id>", methods=["PUT"])
def update_workpoint(id):
    # print(request)
    data = request.get_json()
    # print(data)
    role = db.session.get(Workpoint, id)
    if not role:
        return jsonify({"error": "role not found"}), 404
    for key, value in data.items():
        if hasattr(role, key):
            if key in ['workStart', 'workEnd'] and isinstance(value, str):
                value = dateStr(value)
            setattr(role, key, value)
    db.session.commit()
    return jsonify(role.to_dict()), 200

from datetime import datetime, time, date

@workpoint_bp.route('/check-access/<string:user_id>', methods=['GET'])
def get_workpoint_checkpoint(user_id):
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({"error": "User not found"}), 405
    
    result = user.to_dict()
    
    return jsonify({"valid":True,"data":result})


from datetime import datetime, time, timedelta
import pytz  # pip install pytz

@workpoint_bp.route('/check/<string:user_id>/<string:img_url>/', methods=['POST'])
def post_workpoint_by_user_and_date(user_id, img_url):
    tz = pytz.timezone("Asia/Ho_Chi_Minh")  # múi giờ GMT+7
    
    now = datetime.utcnow().replace(tzinfo=pytz.utc).astimezone(tz)
    print('now', now.time())
    today = now.date()

    workpoint = Workpoint.query.filter(
        Workpoint.user_id == user_id,
        db.func.date(Workpoint.createdAt) == today
    ).first()

    print('work_point',workpoint)

    if not workpoint:
        workpoint = Workpoint(
            id=generate_datetime_id(),
            user_id=user_id,
            createdAt=now  # dùng thời gian theo GMT+7
        )
        db.session.add(workpoint)
        db.session.commit()

    current_time = now.time()

    morning_start = time(5, 0)
    morning_end = time(12, 0)
    noon_end = time(17, 0)

    if morning_start <= current_time < morning_end:
        period = "morning"
    elif current_time < noon_end:
        period = "noon"
    else:
        period = "evening"

    if not workpoint.checklist:
        workpoint.checklist = {}
    if period not in workpoint.checklist:
        workpoint.checklist[period] = {}

    total_hour = 0

    if "in" in workpoint.checklist[period]:
        check_in_time_str = workpoint.checklist[period]["in"]["time"]
        # Chuyển string ISO sang datetime với timezone
        check_in_time = datetime.fromisoformat(check_in_time_str).astimezone(tz)
        diff = now - check_in_time
        work_hours = diff.total_seconds() / 3600

        workpoint.checklist[period]["out"] = {
            "time": now.isoformat(),
            "img": img_url
        }

        print(f"Work hours in {period}: {work_hours:.2f} hours")
    else:
        workpoint.checklist[period]["in"] = {
            "time": now.isoformat(),
            "img": img_url
        }
        print(f"Checked in for {period} at {now.isoformat()}")

    for p in ["morning", "noon", "evening"]:
        if p in workpoint.checklist:
            period_data = workpoint.checklist[p]
            if "in" in period_data and "out" in period_data:
                t_in = datetime.fromisoformat(period_data["in"]["time"]).astimezone(tz)
                t_out = datetime.fromisoformat(period_data["out"]["time"]).astimezone(tz)
                diff = t_out - t_in
                total_hour += diff.total_seconds() / 3600

    db.session.add(workpoint)
    db.session.commit()

    result = workpoint.to_dict()
    result["total_hour"] = total_hour

    return jsonify(result), 201
