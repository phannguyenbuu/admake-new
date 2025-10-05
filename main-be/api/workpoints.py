from flask import Blueprint, request, jsonify, abort
from models import db, app, Workpoint, Message,User, dateStr, generate_datetime_id
from api.chat import socketio
from sqlalchemy import desc
from datetime import datetime, time
from sqlalchemy.orm.attributes import flag_modified

workpoint_bp = Blueprint('workpoint', __name__, url_prefix='/api/workpoint')

@workpoint_bp.route("/", methods=["GET"])
def get_workpoints():
    workpoints = Workpoint.query.order_by(desc(Workpoint.createdAt)).all()
    return jsonify([c.to_dict() for c in workpoints])

# @workpoint_bp.route("/", methods=["POST"])
# def create_workpoint():
#     data = request.get_json()

#     new_workpoint = Workpoint.create_item(data)
#     db.session.add(new_workpoint)
#     db.session.commit()

#     return jsonify(new_workpoint.to_dict()), 201

@workpoint_bp.route("/today/<string:user_id>", methods=["GET"])
def get_workpoint_today_detail(user_id):
    workpoint, _, _ = get_workpoint_today(user_id)
    if not workpoint:
        abort(404, description="workpoint not found")
    return jsonify(workpoint.to_dict())

@workpoint_bp.route("/<string:user_id>", methods=["GET"])
def get_workpoint_detail(user_id):
    workpoints = get_all_workpoints(user_id)
    if not workpoints:
        abort(404, description="workpoints not found")

    return jsonify([c.to_dict() for c in workpoints])

# @workpoint_bp.route("/<string:id>", methods=["PUT"])
# def update_workpoint(id):
#     # print(request)
#     data = request.get_json()
#     # print(data)
#     role = db.session.get(Workpoint, id)
#     if not role:
#         return jsonify({"error": "role not found"}), 404
#     for key, value in data.items():
#         if hasattr(role, key):
#             if key in ['workStart', 'workEnd'] and isinstance(value, str):
#                 value = dateStr(value)
#             setattr(role, key, value)
#     db.session.commit()
#     return jsonify(role.to_dict()), 200

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
from sqlalchemy import and_, cast, Date

def filter_by_date(query, model_field, date_to_compare):
    """
    Lọc trong query với điều kiện chỉ so sánh phần ngày (không giờ, phút, giây)
    model_field: trường kiểu datetime trong model SQLAlchemy
    date_to_compare: datetime.date hoặc datetime.datetime 
    """
    return query.filter(cast(model_field, Date) == date_to_compare)


def get_all_workpoints(user_id):
    workpoints = Workpoint.query.filter(Workpoint.user_id == user_id).all()
    return workpoints

def get_workpoint_today(user_id):
    tz = pytz.timezone("Asia/Ho_Chi_Minh")  # múi giờ GMT+7
    now = datetime.utcnow().replace(tzinfo=pytz.utc).astimezone(tz)
    
    today = now.date()
    workpoints = get_all_workpoints(user_id)

    workpoints_same_date = [wp for wp in workpoints if wp.get_date() == today]
    workpoint = workpoints_same_date[0] if workpoints_same_date else None

    return workpoint, now, tz

@workpoint_bp.route('/check/<string:user_id>/', methods=['POST'])
def post_workpoint_by_user_and_date(user_id):
    data = request.get_json()
    img_url = data.get("img")
    lat = data.get("lat")
    long = data.get("long")

    workpoint, now, tz = get_workpoint_today(user_id)
    
    print('work_point', workpoint, now)

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
    noon_end = time(18, 0)

    if morning_start <= current_time < morning_end:
        period = "morning"
    elif current_time < noon_end:
        period = "noon"
    else:
        period = "evening"

    # print('period',period, workpoint.checklist)

    if not workpoint.checklist:
        workpoint.checklist = {}
    if period not in workpoint.checklist:
        workpoint.checklist[period] = {}

    total_hour = 0

    # print('period',period, workpoint.checklist)

    if "in" in workpoint.checklist[period] and "out" not in workpoint.checklist[period]:
        check_in_time_str = workpoint.checklist[period]["in"]["time"]
        check_in_time = datetime.fromisoformat(check_in_time_str).astimezone(tz)
        diff = now - check_in_time
        work_hours = diff.total_seconds() / 3600

        workpoint.checklist[period]["out"] = {
            "time": now.isoformat(),
            "img": img_url,
            "lat": lat,
            "long": long,
            
        }

        workpoint.checklist[period]["workhour"] = work_hours
        flag_modified(workpoint, "checklist")
        print(f"Work hours in {period}: {work_hours:.2f} hours", workpoint.checklist)
    elif "in" not in workpoint.checklist[period]:
        workpoint.checklist[period]["in"] = {
            "time": now.isoformat(),
            "img": img_url,
            "lat": lat,
            "long": long,
        }

        workpoint.checklist[period]["workhour"] = 0
        flag_modified(workpoint, "checklist")
        print(f"Checked in for {period} at {now.isoformat()}")
    else:
        return jsonify(
            message=f"Already checked out for {period}, skipping update",
            data=workpoint.to_dict()
        ), 202

    db.session.add(workpoint)
    db.session.commit()

    result = workpoint.to_dict()
    
    return jsonify(result), 201
