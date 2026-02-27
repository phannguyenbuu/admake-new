from flask import Blueprint, request, jsonify, abort
from models import db, app, Workpoint, WorkpointSetting, Message, User, Task, dateStr, generate_datetime_id, Leave, LeadPayload
from api.chat import socketio
from sqlalchemy import desc
from datetime import datetime, time, date, timedelta
from sqlalchemy.orm.attributes import flag_modified
from api.users import get_query_page_users
from collections import defaultdict
from dateutil.relativedelta import relativedelta
from sqlalchemy import and_, or_

workpoint_bp = Blueprint('workpoint', __name__, url_prefix='/api/workpoint')


def _parse_month_arg(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m")
    except ValueError:
        return None


def _month_start_end(month_dt: datetime) -> tuple[datetime, datetime]:
    start = month_dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    end = (start + relativedelta(months=1)) - timedelta(microseconds=1)
    return start, end


def _iter_months(from_month: datetime, to_month: datetime):
    current = from_month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    end = to_month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    while current <= end:
        yield current
        current = current + relativedelta(months=1)


def _default_out_time(period_name: str) -> int:
    if period_name == "morning":
        return 12
    if period_name == "noon":
        return 17
    return 22


def _workhour_from_period(period_data: dict, period_name: str) -> float:
    if not period_data or "in" not in period_data:
        return 0.0

    workhour = period_data.get("workhour")
    if isinstance(workhour, (int, float)) and workhour > 0:
        return float(workhour)

    in_data = period_data.get("in") or {}
    in_time = in_data.get("time")
    if not in_time:
        return 0.0

    try:
        in_dt = datetime.fromisoformat(in_time)
    except Exception:
        return 0.0

    out_data = period_data.get("out") or {}
    out_time = out_data.get("time")

    if out_time:
        try:
            out_dt = datetime.fromisoformat(out_time)
        except Exception:
            return 0.0
    else:
        end_hour = _default_out_time(period_name)
        out_dt = in_dt.replace(hour=end_hour, minute=0, second=0, microsecond=0)

    diff_hours = (out_dt - in_dt).total_seconds() / 3600
    return diff_hours if diff_hours > 0 else 0.0


def _max_working_hours(month: int, year: int, setting: WorkpointSetting | None) -> int:
    days_in_month = (datetime(year, month, 1) + relativedelta(months=1) - relativedelta(days=1)).day
    total_hours = 0

    for day in range(1, days_in_month + 1):
        d = datetime(year, month, day)
        weekday = d.weekday()  # Mon=0 ... Sun=6
        if weekday == 6:
            total_hours += 8 if bool(getattr(setting, "work_in_sunday", False)) else 0
        elif weekday == 5:
            total_hours += 8 if bool(getattr(setting, "work_in_saturday_noon", False)) else 4
        else:
            total_hours += 8

    return total_hours


def _extract_cash_amount(text_value) -> int:
    if text_value is None:
        return 0
    raw = str(text_value).split("/")[0].strip()
    if not raw:
        return 0
    normalized = raw.replace(".", "").replace(",", "").replace(" ", "")
    try:
        return int(float(normalized))
    except Exception:
        return 0


@workpoint_bp.route("/payroll-summary", methods=["GET"])
def get_payroll_summary():
    lead_id = request.args.get("lead", 0, type=int)
    lead = db.session.get(LeadPayload, lead_id)
    if not lead:
        abort(404, description="Lead not found")

    month_arg = request.args.get("month", type=str)
    from_month_arg = request.args.get("from_month", type=str)
    to_month_arg = request.args.get("to_month", type=str)

    now_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_dt = _parse_month_arg(month_arg)
    from_month_dt = _parse_month_arg(from_month_arg)
    to_month_dt = _parse_month_arg(to_month_arg)

    if month_dt:
        from_month_dt = month_dt
        to_month_dt = month_dt
    else:
        if not from_month_dt and not to_month_dt:
            from_month_dt = now_month
            to_month_dt = now_month
        elif from_month_dt and not to_month_dt:
            to_month_dt = from_month_dt
        elif to_month_dt and not from_month_dt:
            from_month_dt = to_month_dt

    if not from_month_dt or not to_month_dt:
        abort(400, description="Invalid month range")

    if from_month_dt > to_month_dt:
        from_month_dt, to_month_dt = to_month_dt, from_month_dt

    date_start, _ = _month_start_end(from_month_dt)
    _, date_end = _month_start_end(to_month_dt)

    users = [u for u in lead.users if u.role_id not in (-2, 0)]
    user_ids = [u.id for u in users]
    if not user_ids:
        return jsonify(
            {
                "rows": [],
                "summary": {
                    "from_month": from_month_dt.strftime("%Y-%m"),
                    "to_month": to_month_dt.strftime("%Y-%m"),
                    "total_people": 0,
                    "total_staff": 0,
                    "total_supplier": 0,
                    "total_base_salary": 0,
                    "total_overtime_salary": 0,
                    "total_bonus": 0,
                    "total_punish": 0,
                    "total_advance": 0,
                    "total_net_salary": 0,
                },
            }
        )

    workpoint_setting = WorkpointSetting.query.filter_by(lead_id=lead_id).first()
    overtime_ratio = float(getattr(workpoint_setting, "multiply_in_night_overtime", 1.5) or 1.5)

    all_workpoints = (
        Workpoint.query.filter(
            Workpoint.user_id.in_(user_ids),
            Workpoint.createdAt >= date_start,
            Workpoint.createdAt <= date_end,
        ).all()
    )

    all_messages = (
        Message.query.filter(
            Message.user_id.in_(user_ids),
            Message.createdAt >= date_start,
            Message.createdAt <= date_end,
            or_(
                Message.type.like("%cash:%"),
                Message.type.like("%cash"),
                Message.type.like("bonus-cash"),
                Message.type.like("advance-salary-cash"),
            ),
        ).all()
    )

    all_tasks = (
        Task.query.filter(
            Task.isDelete.is_(False),
            Task.status == "REWARD",
            Task.end_time.isnot(None),
            Task.end_time >= date_start.date(),
            Task.end_time <= date_end.date(),
        ).all()
    )

    by_user_workpoints: dict[str, list[Workpoint]] = defaultdict(list)
    for wp in all_workpoints:
        if wp.user_id:
            by_user_workpoints[wp.user_id].append(wp)

    by_user_messages: dict[str, list[Message]] = defaultdict(list)
    for msg in all_messages:
        if msg.user_id:
            by_user_messages[msg.user_id].append(msg)

    users_by_id = {u.id: u for u in users}
    reward_by_user: dict[str, float] = defaultdict(float)
    for task in all_tasks:
        assign_ids = task.assign_ids or []
        if not isinstance(assign_ids, list):
            continue
        valid_ids = [uid for uid in assign_ids if uid in users_by_id]
        if not valid_ids:
            continue
        total_agent_salary = sum(float(users_by_id[uid].salary or 0) for uid in valid_ids)
        if total_agent_salary <= 0:
            continue
        reward_value = float(task.reward or 0)
        for uid in valid_ids:
            user_salary = float(users_by_id[uid].salary or 0)
            reward_by_user[uid] += reward_value * user_salary / total_agent_salary

    rows = []
    summary = {
        "from_month": from_month_dt.strftime("%Y-%m"),
        "to_month": to_month_dt.strftime("%Y-%m"),
        "total_people": 0,
        "total_staff": 0,
        "total_supplier": 0,
        "total_base_salary": 0.0,
        "total_overtime_salary": 0.0,
        "total_bonus": 0.0,
        "total_punish": 0.0,
        "total_advance": 0.0,
        "total_net_salary": 0.0,
    }

    month_list = list(_iter_months(from_month_dt, to_month_dt))

    for user in users:
        role_name = (user.update_role() or {}).get("name", "")
        is_supplier = (user.role_id and user.role_id > 100) or user.role_id == -1
        salary = float(user.salary or 0)
        period_work = 0
        work_hours = 0.0
        overtime_hours = 0.0
        base_salary_total = 0.0
        overtime_salary_total = 0.0

        for month_item in month_list:
            month_start, month_end = _month_start_end(month_item)
            month_max_hours = _max_working_hours(month_item.month, month_item.year, workpoint_setting)
            salary_unit = (salary / month_max_hours) if month_max_hours > 0 else 0

            month_period_work = 0
            month_work_hours = 0.0
            month_overtime_hours = 0.0

            for wp in by_user_workpoints.get(user.id, []):
                if not wp.createdAt or wp.createdAt < month_start or wp.createdAt > month_end:
                    continue
                checklist = wp.checklist or {}

                morning = checklist.get("morning") if isinstance(checklist, dict) else None
                noon = checklist.get("noon") if isinstance(checklist, dict) else None
                evening = checklist.get("evening") if isinstance(checklist, dict) else None

                if isinstance(morning, dict) and morning.get("in"):
                    month_period_work += 1
                    month_work_hours += _workhour_from_period(morning, "morning")
                if isinstance(noon, dict) and noon.get("in"):
                    month_period_work += 1
                    month_work_hours += _workhour_from_period(noon, "noon")
                if isinstance(evening, dict) and evening.get("in"):
                    month_overtime_hours += _workhour_from_period(evening, "evening")

            period_work += month_period_work
            work_hours += month_work_hours
            overtime_hours += month_overtime_hours
            base_salary_total += salary_unit * 4 * month_period_work
            overtime_salary_total += salary_unit * overtime_ratio * month_overtime_hours

        bonus = 0.0
        punish = 0.0
        advance = 0.0
        for msg in by_user_messages.get(user.id, []):
            amount = float(_extract_cash_amount(msg.text))
            msg_type = (msg.type or "").strip()
            if msg_type == "advance-salary-cash":
                advance += amount
            elif "cash" in msg_type:
                if amount >= 0:
                    bonus += amount
                else:
                    punish += amount

        task_reward = float(reward_by_user.get(user.id, 0))
        total_bonus = bonus + task_reward
        net_salary = base_salary_total + overtime_salary_total + total_bonus + punish + advance

        row = {
            "user_id": user.id,
            "full_name": user.fullName or user.username,
            "phone": user.phone or "",
            "department": role_name or ("Thầu phụ" if is_supplier else "Nhân sự"),
            "group_type": "supplier" if is_supplier else "staff",
            "salary_base": salary,
            "period_work": period_work,
            "work_hours": round(work_hours, 2),
            "overtime_hours": round(overtime_hours, 2),
            "salary_base_total": round(base_salary_total, 0),
            "salary_overtime_total": round(overtime_salary_total, 0),
            "bonus_total": round(total_bonus, 0),
            "punish_total": round(punish, 0),
            "advance_total": round(advance, 0),
            "net_salary": round(net_salary, 0),
        }
        rows.append(row)

        summary["total_people"] += 1
        if is_supplier:
            summary["total_supplier"] += 1
        else:
            summary["total_staff"] += 1
        summary["total_base_salary"] += row["salary_base_total"]
        summary["total_overtime_salary"] += row["salary_overtime_total"]
        summary["total_bonus"] += row["bonus_total"]
        summary["total_punish"] += row["punish_total"]
        summary["total_advance"] += row["advance_total"]
        summary["total_net_salary"] += row["net_salary"]

    rows.sort(key=lambda r: (r["group_type"], r["full_name"]))

    for key in (
        "total_base_salary",
        "total_overtime_salary",
        "total_bonus",
        "total_punish",
        "total_advance",
        "total_net_salary",
    ):
        summary[key] = round(float(summary[key]), 0)

    return jsonify({"rows": rows, "summary": summary}), 200

@workpoint_bp.route("/all", methods=["GET"])
def get_all_workpoints():
    workpoints = Workpoint.query.order_by(desc(Workpoint.createdAt)).all()
    return jsonify([c.tdict() for c in workpoints])

@workpoint_bp.route("/", methods=["GET"])
def get_workpoints():
    lead_id = request.args.get("lead", 0, type=int)
    lead = db.session.get(LeadPayload, lead_id)

    if not lead:
        abort(404, description="Lead not found")

    workpoints = Workpoint.query.filter(Workpoint.user_id.in_([user.id for user in lead.users])).order_by(desc(Workpoint.createdAt)).all()
    return jsonify([c.tdict() for c in workpoints])

@workpoint_bp.route("/today/<string:user_id>", methods=["GET"])
def get_workpoint_today_detail(user_id):
    workpoint, _, _ = get_workpoint_today(user_id)
    if not workpoint:
        abort(404, description="workpoint not found")
    return jsonify(workpoint.tdict())

@workpoint_bp.route("/<string:user_id>", methods=["GET"])
def get_workpoint_detail(user_id):
    workpoints = get_all_workpoints(user_id)
    if not workpoints:
        abort(404, description="workpoints not found")

    return jsonify([c.tdict() for c in workpoints])

@workpoint_bp.route("/<string:id>/", methods=["PUT"])
def put_remove_workpoint(id):
    data = request.args.get_json()
    prd = data["period"]
    workpoint = db.session.get(Workpoint,id)

    if not workpoint:
        abort(404, description="workpoints not found")

    if prd in workpoint.checklist:
        if 'out' in workpoint.checklist[prd]:
            del workpoint.checklist[prd]['out']
        elif 'in' in workpoint.checklist[prd]:
            del workpoint.checklist[prd]['in']

    flag_modified(workpoint, "checklist")
    db.session.commit()
    
    return jsonify([c.tdict() for c in workpoint]), 200

@workpoint_bp.route("/message", methods=["POST"])
def post_workpoint_message():
    user_id = request.form.get("user_id")
    type = request.form.get("type")
    text = request.form.get("text")

    message = Message.create_item({"message_id": generate_datetime_id(),
                                   "type": type,
                                    "user_id":user_id, 
                                    "text":text, 
                                    })
    
    print("Workpoint message", message.tdict())

    return jsonify({
        'text': text,
        'message': message.tdict()
        })



@workpoint_bp.route("/<string:user_id>/salary", methods=["GET"])
def get_user_workpoint_salary_task(user_id):
    user = db.session.get(User, user_id)
    if not user:
        print("User not found")
        abort(404, description="User not found")

    month_str = request.args.get("month", None, type=str)
    target_month = _parse_month_arg(month_str) if month_str else None
    now = target_month if target_month else datetime.now()
    first_day = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_day = (first_day + relativedelta(months=1) - relativedelta(days=1)).replace(hour=23, minute=59, second=59, microsecond=999999)



    

    filtered_messages = Message.query.filter(
        Message.user_id == user_id,
        Message.createdAt >= first_day,
        Message.createdAt <= last_day,
        or_(
            Message.type.like("%cash:%"),
            Message.type.like("%cash"),     # ✅ "bonus-cash"
            Message.type.like("bonus-cash"),
            Message.type.like("advance-salary-cash")
        )
    ).all()

    
    return jsonify({"messages": [m.tdict() for m in filtered_messages],}), 200


@workpoint_bp.route("/page", methods=["GET"])
def get_batch_workpoint_detail():
    from collections import defaultdict

    page = request.args.get("page", 1, type=int)
    lead_id = request.args.get("lead", 0, type=int)



    limit = request.args.get("limit", 10, type=int)
    search = request.args.get("search", "", type=str)

    users, pagination = get_query_page_users(lead_id, page, limit, search)
    user_id_list = [user["id"] for user in users]

    month_str = request.args.get("month", None)
    # month_param  = request.args.get("month", None, type=int)

    # print(f"Requested page: {page}", user_id_list)

    # Lấy TẤT CẢ workpoints trước (giống leavepoints)
    all_workpoints = Workpoint.query.filter(Workpoint.user_id.in_(user_id_list)).all()

    if month_str:
        target_date = datetime.strptime(month_str, "%Y-%m")  # "2025-11" → datetime
        target_month = target_date.month  # 11
        target_year = target_date.year    # 2025
        
        workpoints = [
            wp for wp in all_workpoints
            if wp.createdAt.month == target_month 
            and wp.createdAt.year == target_year
        ]
        print(f"✅ Filtered {len(workpoints)} workpoints: {month_str}")
    else:
        workpoints = all_workpoints

    # Tạo dict lookup
    workpoint_dict = defaultdict(list)
    for wp in workpoints:
        workpoint_dict[wp.user_id].append(wp)

    # ✅ Leavepoints (giữ nguyên)
    all_leavepoints = Leave.query.filter(Leave.user_id.in_(user_id_list)).all()

    if month_str:
        target_date = datetime.strptime(month_str, "%Y-%m")
        leavepoints = [
            lp for lp in all_leavepoints
            if lp.start_time and lp.start_time.month == target_date.month 
            and lp.start_time.year == target_date.year
        ]
    else:
        leavepoints = all_leavepoints

    leavepoint_dict = defaultdict(list)
    for lp in leavepoints:
        leavepoint_dict[lp.user_id].append(lp)




    leavepoint_dict = defaultdict(list)
    for lp in leavepoints:
        leavepoint_dict[lp.user_id].append(lp)

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
            wp_data_list = [wp.tdict() for wp in workpoints_for_user]  # chuyển từng item thành dict
            # Nếu cần, bạn có thể thêm username, userrole cho từng đối tượng trong list
            for wp_data in wp_data_list:
                wp_data["username"] = username
                wp_data["userrole"] = user_role
                wp_data["salary"] = salary
            result.extend(wp_data_list)
        else:
            result.append({"user_id": user_id,"username": username,"userrole": user_role,"salary": salary})

        if user_id in leavepoint_dict:
            leavepoints_for_user = leavepoint_dict[user_id]  # là list
            lp_data_list = [lp.tdict() for lp in leavepoints_for_user]  # chuyển từng item thành dict
            # Nếu cần, bạn có thể thêm username, userrole cho từng đối tượng trong list
            for lp_data in lp_data_list:
                lp_data["username"] = username
                lp_data["userrole"] = user_role
                lp_data["salary"] = salary
            # Thêm toàn bộ list wp_data_list vào leave_result, hoặc theo cách bạn muốn
            leave_result.extend(lp_data_list)

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









@workpoint_bp.route("/by_user/<string:user_id>", methods=["GET"])
def get_single_workpoint_detail(user_id):
    user = User.query.get(user_id)
    if not user:
        abort(404, description="Invalid user")

    username = user.fullName
    salary = user.salary
    # user_role = getattr(user.role, "name", None) if user.role else None

    workpoints = Workpoint.query.filter_by(user_id=user_id).all()
    leavepoints = Leave.query.filter_by(user_id=user_id).all()

    wp_data_list = [wp.tdict() for wp in workpoints]
    for wp_data in wp_data_list:
        wp_data["username"] = username
        # wp_data["userrole"] = user_role
        wp_data["salary"] = salary

    lp_data_list = [lp.tdict() for lp in leavepoints]
    for lp_data in lp_data_list:
        lp_data["username"] = username
        # lp_data["userrole"] = user_role
        lp_data["salary"] = salary

    result = {
        "user_id": user_id,
        "username": username,
        # "userrole": user_role,
        "salary": salary,
        "items": wp_data_list,
        "leaves": lp_data_list,
    }

    return jsonify(result), 200









@workpoint_bp.route('/check-access/<string:user_id>', methods=['GET'])
def get_workpoint_checkpoint(user_id):
    user = db.session.get(User, user_id)

    if not user:
        return jsonify({"error": "User not found"}), 405
    
    result = user.tdict()
    
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
    
    # print('work_point', workpoint, now)

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
        # print(f"Work hours in {period}: {work_hours:.2f} hours", workpoint.checklist)
    elif "in" not in workpoint.checklist[period]:
        workpoint.checklist[period]["in"] = {
            "time": now.isoformat(),
            "img": img_url,
            "lat": lat,
            "long": long,
        }

        workpoint.checklist[period]["workhour"] = 0
        flag_modified(workpoint, "checklist")
        # print(f"Checked in for {period} at {now.isoformat()}")
    else:
        return jsonify(
            message=f"Already checked out for {period}, skipping update",
            data=workpoint.tdict()
        ), 202

    db.session.add(workpoint)
    db.session.commit()

    result = workpoint.tdict()
    
    return jsonify(result), 201



@workpoint_bp.route('/remove/<string:user_id>/', methods=['PUT'])
def remove_workpoint_checklist(user_id):
    day = request.args.get("day")

    # print('Workday', day, user_id)

    ws = Workpoint.query.filter(Workpoint.user_id == user_id).all()
    # print('Workpoint query', len(ws))

    for w in ws:
        for k,v in w.checklist.items():
            for k_1, v_1 in v.items():
                if type(v_1) == dict:
                    if (day + "T") in v_1.get('time'):
                        # print(k, k_1, v_1)
                        w.remove_checklist()
                        # print(w.tdict())
                        return jsonify({f'message':'Remove workpoint done: {k} {k_1}'}), 200
    return jsonify({'message':'No workpoint found'}), 200


@workpoint_bp.route('/setting/<string:lead_id>/', methods=['GET'])
def get_workpoint_setting(lead_id):
    workpoint_setting = WorkpointSetting.query.filter_by(lead_id=lead_id).first()
    if not workpoint_setting:
        print("WorkpointSetting not found", lead_id)
        abort(404, description="WorkpointSetting not found")
    
    # print("WorkpointSetting found", workpoint_setting.tdict())
    return jsonify(workpoint_setting.tdict()), 200


@workpoint_bp.route('/setting/<string:lead_id>/', methods=['PUT'])
def update_workpoint_setting(lead_id):
    workpoint_setting = WorkpointSetting.query.filter_by(lead_id=lead_id).first()
    if not workpoint_setting:
        abort(404, description="WorkpointSetting not found")

    data = request.get_json()
    if not data:
        abort(400, description="Invalid JSON body")

    # Cập nhật các trường cho workpoint_setting nếu có trong data
    for key, value in data.items():
        if hasattr(workpoint_setting, key):
            setattr(workpoint_setting, key, value)

    db.session.commit()
    return jsonify(workpoint_setting.tdict()), 200
