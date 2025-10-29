from flask import Blueprint, request, jsonify, abort
from models import db, app, Workpoint, Message,User, dateStr, generate_datetime_id, Leave
from api.chat import socketio
from sqlalchemy import desc
from datetime import datetime, time, date
from sqlalchemy.orm.attributes import flag_modified
from api.users import get_query_page_users
from collections import defaultdict

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

@workpoint_bp.route("/page", methods=["GET"])
def get_batch_workpoint_detail():
    from collections import defaultdict

    page = request.args.get("page", 1, type=int)
    

    limit = request.args.get("limit", 10, type=int)
    search = request.args.get("search", "", type=str)

    users, pagination = get_query_page_users(page, limit, search)
    user_id_list = [user["id"] for user in users]

    # print(f"Requested page: {page}", user_id_list)

    workpoints = Workpoint.query.filter(Workpoint.user_id.in_(user_id_list)).all()

    # Tạo dict để lookup nhanh workpoint theo user_id
    # workpoint_dict = {wp.user_id: wp for wp in workpoints}
    workpoint_dict = defaultdict(list)
    for wp in workpoints:
        workpoint_dict[wp.user_id].append(wp)


    leavepoints = Leave.query.filter(Leave.user_id.in_(user_id_list)).all()
    # leavepoint_dict = {lp.user_id: lp for lp in leavepoints}

    leavepoint_dict = defaultdict(list)
    for lp in leavepoints:
        leavepoint_dict[lp.user_id].append(lp)

    # if user_id == "202509242213305021912d62bc":
    

    result = []
    leave_result = []

    for user in users:
        user_id = user["id"]
        username = user["fullName"]
        salary = user["salary"]
        user_role = user.get("role") and user["role"].get("name")
        # user_role = user.get("role", {}).get("name")  # Trả về None nếu `role` hoặc `name` không tồn tại

        if user_id in workpoint_dict:
            workpoints_for_user = workpoint_dict[user_id]  # là list
            wp_data_list = [wp.to_dict() for wp in workpoints_for_user]  # chuyển từng item thành dict
            # Nếu cần, bạn có thể thêm username, userrole cho từng đối tượng trong list
            for wp_data in wp_data_list:
                wp_data["username"] = username
                wp_data["userrole"] = user_role
                wp_data["salary"] = salary
            result.extend(wp_data_list)
        else:
            result.append({"user_id": user_id,"username": username,"userrole": user_role,"salary": salary})
            
        # if wp_data:
        #     result.append(wp_data)

        if user_id in leavepoint_dict:
            leavepoints_for_user = leavepoint_dict[user_id]  # là list
            lp_data_list = [lp.to_dict() for lp in leavepoints_for_user]  # chuyển từng item thành dict
            # Nếu cần, bạn có thể thêm username, userrole cho từng đối tượng trong list
            for lp_data in lp_data_list:
                lp_data["username"] = username
                lp_data["userrole"] = user_role
                lp_data["salary"] = salary
            # Thêm toàn bộ list wp_data_list vào leave_result, hoặc theo cách bạn muốn
            leave_result.extend(lp_data_list)
            
        # if wp_data:
        #     leave_result.append(wp_data)

    # print('leave_result')
    # print(leave_result)
    # print('Leave_dict')
    # print(leavepoint_dict)

    grouped_result = {}

    for wp_data in result:
        user_id = wp_data.get("user_id")
        username = wp_data.get("username")
        userrole = wp_data.get("userrole")
        salary = wp_data.get("salary")

        if user_id not in grouped_result:
            # Tạo nhóm mới với 'user_id', 'username' và danh sách chứa wp_data
            grouped_result[user_id] = {
                "user_id": user_id,
                "username": username,
                "userrole": userrole,
                "salary": salary,
                "items": []
            }
        # Thêm wp_data vào danh sách items của user
        grouped_result[user_id]["items"].append(wp_data)
        grouped_result[user_id]["leaves"] = []
        # leave_grouped_result = {}
        
        for lp_data in leave_result:
            if user_id == lp_data.get("user_id"):
                grouped_result[user_id]["leaves"].append(
                    {"createdAt": lp_data.get("createdAt"),
                     "start_time": lp_data.get("start_time"),
                     "end_time": lp_data.get("end_time"),
                     "id": lp_data.get("id"),
                     "morning": lp_data.get("morning"),
                     "noon": lp_data.get("noon"),
                     "reason": lp_data.get("reason")
                     })
            # username = wp_data.get("username")
            # userrole = wp_data.get("userrole")

            # if user_id not in leave_grouped_result:
            #     # Tạo nhóm mới với 'user_id', 'username' và danh sách chứa wp_data
            #     leave_grouped_result[user_id] = {
            #         "user_id": user_id,
            #         "username": username,
            #         "userrole": userrole,
            #         "items": []
            #     }
            # # Thêm wp_data vào danh sách items của user
            # leave_grouped_result[user_id]["items"].append(wp_data)

    return jsonify({
        "data": list(grouped_result.values()),
        # "leave": list(leave_grouped_result.values()),
        "total": pagination.total,
        "pagination": {
            "total": pagination.total,
            "page": page,
            "per_page": limit,
            "pages": pagination.pages,
        }
    })

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

