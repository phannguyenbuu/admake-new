from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta

from dateutil.relativedelta import relativedelta
from flask import Blueprint, abort, jsonify, request
from sqlalchemy import and_, or_

from models import (
    LeadPayload,
    Message,
    Task,
    User,
    Workpoint,
    WorkpointSetting,
    Workspace,
    db,
)

statistics_bp = Blueprint("statistics", __name__, url_prefix="/api/statistics")


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


def _format_date(value):
    if not value:
        return ""
    try:
        return value.strftime("%d/%m/%Y")
    except Exception:
        return ""


def _is_staff(user: User) -> bool:
    role_id = user.role_id or 0
    return role_id > 0 and role_id < 100


def _is_supplier(user: User) -> bool:
    role_id = user.role_id or 0
    return role_id > 100


def _is_inactive(status: str | None) -> bool:
    normalized = (status or "").strip().lower()
    return normalized in {"inactive", "off", "quit", "disabled", "nghi", "nghỉ"}


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


def _build_payroll_analytics(
    *,
    lead_id: int,
    users: list[User],
    user_map: dict[str, User],
    from_month: datetime,
    to_month: datetime,
    period_start: datetime,
    period_end: datetime,
    tasks_in_period: list[Task],
):
    month_keys = [month.strftime("%Y-%m") for month in _iter_months(from_month, to_month)]
    staff_ids = {user.id for user in users if _is_staff(user)}

    workpoint_setting = WorkpointSetting.query.filter_by(lead_id=lead_id).first()
    overtime_ratio = float(getattr(workpoint_setting, "multiply_in_night_overtime", 1.5) or 1.5)

    all_workpoints = (
        Workpoint.query.filter(
            Workpoint.user_id.in_([u.id for u in users]),
            Workpoint.createdAt >= period_start,
            Workpoint.createdAt <= period_end,
        ).all()
        if users
        else []
    )

    all_messages = (
        Message.query.filter(
            Message.user_id.in_([u.id for u in users]),
            Message.createdAt >= period_start,
            Message.createdAt <= period_end,
            or_(
                Message.type.like("%cash:%"),
                Message.type.like("%cash"),
                Message.type.like("bonus-cash"),
                Message.type.like("advance-salary-cash"),
            ),
        ).all()
        if users
        else []
    )

    by_user_workpoints: dict[str, list[Workpoint]] = defaultdict(list)
    for wp in all_workpoints:
        if wp.user_id:
            by_user_workpoints[wp.user_id].append(wp)

    by_user_messages: dict[str, list[Message]] = defaultdict(list)
    for msg in all_messages:
        if msg.user_id:
            by_user_messages[msg.user_id].append(msg)

    reward_by_user_month: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
    reward_tasks = [task for task in tasks_in_period if task.status == "REWARD" and task.end_time]
    for task in reward_tasks:
        assign_ids = task.assign_ids or []
        if not isinstance(assign_ids, list):
            continue
        valid_ids = [uid for uid in assign_ids if uid in user_map]
        if not valid_ids:
            continue
        month_key = task.end_time.strftime("%Y-%m")
        if month_key not in month_keys:
            continue
        total_agent_salary = sum(float(user_map[uid].salary or 0) for uid in valid_ids)
        if total_agent_salary <= 0:
            continue
        reward_value = float(task.reward or 0)
        for uid in valid_ids:
            user_salary = float(user_map[uid].salary or 0)
            reward_by_user_month[uid][month_key] += reward_value * user_salary / total_agent_salary

    month_totals = {
        key: {
            "staff_net_salary": 0.0,
            "staff_count": 0,
            "all_net_salary": 0.0,
        }
        for key in month_keys
    }
    user_monthly_net: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))

    for user in users:
        salary = float(user.salary or 0)
        for month in _iter_months(from_month, to_month):
            month_key = month.strftime("%Y-%m")
            month_start, month_end = _month_start_end(month)
            month_max_hours = _max_working_hours(month.month, month.year, workpoint_setting)
            salary_unit = (salary / month_max_hours) if month_max_hours > 0 else 0

            month_period_work = 0
            month_work_hours = 0.0
            month_overtime_hours = 0.0

            for wp in by_user_workpoints.get(user.id, []):
                if not wp.createdAt or wp.createdAt < month_start or wp.createdAt > month_end:
                    continue
                checklist = wp.checklist or {}
                if not isinstance(checklist, dict):
                    continue

                for period_name in ("morning", "noon", "evening"):
                    period_data = checklist.get(period_name)
                    if not isinstance(period_data, dict) or not period_data.get("in"):
                        continue
                    if period_name == "evening":
                        month_overtime_hours += _workhour_from_period(period_data, period_name)
                    else:
                        month_period_work += 1
                        month_work_hours += _workhour_from_period(period_data, period_name)

            base_salary_total = salary_unit * 4 * month_period_work
            overtime_salary_total = salary_unit * overtime_ratio * month_overtime_hours

            bonus = 0.0
            punish = 0.0
            advance = 0.0
            for msg in by_user_messages.get(user.id, []):
                if not msg.createdAt or msg.createdAt < month_start or msg.createdAt > month_end:
                    continue
                amount = float(_extract_cash_amount(msg.text))
                msg_type = (msg.type or "").strip()
                if msg_type == "advance-salary-cash":
                    advance += amount
                elif "cash" in msg_type:
                    if amount >= 0:
                        bonus += amount
                    else:
                        punish += amount

            task_reward = float(reward_by_user_month[user.id].get(month_key, 0))
            total_bonus = bonus + task_reward
            net_salary = base_salary_total + overtime_salary_total + total_bonus + punish + advance

            month_totals[month_key]["all_net_salary"] += net_salary
            if user.id in staff_ids:
                month_totals[month_key]["staff_net_salary"] += net_salary
                month_totals[month_key]["staff_count"] += 1
            user_monthly_net[user.id][month_key] = net_salary

    for key in month_keys:
        month_totals[key]["staff_net_salary"] = round(month_totals[key]["staff_net_salary"], 0)
        month_totals[key]["all_net_salary"] = round(month_totals[key]["all_net_salary"], 0)

    return {
        "month_totals": month_totals,
        "user_monthly_net": user_monthly_net,
    }


STATUS_TO_LABEL = {
    "OPEN": "Đơn hàng",
    "IN_PROGRESS": "Phân việc",
    "DONE": "Đang thực hiện",
    "REWARD": "Hoàn thiện",
}

STATUS_TO_COLOR = {
    "OPEN": "#F87171",
    "IN_PROGRESS": "#FBBF24",
    "DONE": "#22C55E",
    "REWARD": "#60A5FA",
}


@statistics_bp.route("/dashboard", methods=["GET"])
def get_statistics_dashboard():
    lead_id = request.args.get("lead", 0, type=int)
    lead = db.session.get(LeadPayload, lead_id)
    if not lead:
        abort(404, description="Lead not found")

    now_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    to_month = _parse_month_arg(request.args.get("to_month")) or now_month
    from_month = _parse_month_arg(request.args.get("from_month")) or (to_month - relativedelta(months=5))

    if from_month > to_month:
        from_month, to_month = to_month, from_month

    period_start, _ = _month_start_end(from_month)
    _, period_end = _month_start_end(to_month)
    month_keys = [month.strftime("%Y-%m") for month in _iter_months(from_month, to_month)]

    users = lead.users.all()
    user_map = {u.id: u for u in users}
    staff_users = [u for u in users if _is_staff(u)]
    supplier_users = [u for u in users if _is_supplier(u)]

    workspaces = Workspace.query.filter(
        Workspace.lead_id == lead_id,
        Workspace.owner_id.isnot(None),
    ).all()
    workspace_by_id = {w.id: w for w in workspaces}
    workspace_ids = [w.id for w in workspaces]

    task_query = Task.query.filter(Task.isDelete.is_(False))
    if workspace_ids:
        task_query = task_query.filter(
            or_(
                Task.workspace_id.in_(workspace_ids),
                Task.lead_id == lead_id,
            )
        )
    else:
        task_query = task_query.filter(Task.lead_id == lead_id)

    task_query = task_query.filter(
        or_(
            and_(
                Task.start_time.isnot(None),
                Task.end_time.isnot(None),
                Task.start_time <= period_end.date(),
                Task.end_time >= period_start.date(),
            ),
            and_(
                Task.start_time.is_(None),
                Task.end_time.isnot(None),
                Task.end_time >= period_start.date(),
                Task.end_time <= period_end.date(),
            ),
            and_(
                Task.end_time.is_(None),
                Task.createdAt >= period_start,
                Task.createdAt <= period_end,
            ),
        )
    )

    tasks = task_query.all()

    status_counts: dict[str, int] = {
        "OPEN": 0,
        "IN_PROGRESS": 0,
        "DONE": 0,
        "REWARD": 0,
    }
    for task in tasks:
        if task.status in status_counts:
            status_counts[task.status] += 1

    total_tasks = len(tasks)
    completed_tasks = status_counts["REWARD"]
    running_tasks = status_counts["IN_PROGRESS"] + status_counts["DONE"]
    completion_rate = round((completed_tasks / total_tasks) * 100, 1) if total_tasks else 0

    month_status_counter = {
        key: {"OPEN": 0, "IN_PROGRESS": 0, "DONE": 0, "REWARD": 0}
        for key in month_keys
    }
    for task in tasks:
        task_month_key = ""
        if task.end_time:
            task_month_key = task.end_time.strftime("%Y-%m")
        elif task.createdAt:
            task_month_key = task.createdAt.strftime("%Y-%m")
        if task_month_key in month_status_counter and task.status in month_status_counter[task_month_key]:
            month_status_counter[task_month_key][task.status] += 1

    month_series: list[dict] = []
    for key in month_keys:
        row = month_status_counter[key]
        month_series.append(
            {
                "month": key,
                "label": f"Thg {int(key.split('-')[1])}",
                "open": row["OPEN"],
                "in_progress": row["IN_PROGRESS"],
                "done": row["DONE"],
                "reward": row["REWARD"],
            }
        )

    task_rows = sorted(tasks, key=lambda t: t.updatedAt or t.createdAt or datetime.min, reverse=True)[:50]
    job_detail_rows = []
    for task in task_rows:
        workspace = workspace_by_id.get(task.workspace_id) if task.workspace_id else None
        job_detail_rows.append(
            {
                "id": task.id,
                "title": task.title or "",
                "type": task.type or "",
                "status": STATUS_TO_LABEL.get(task.status or "", task.status or ""),
                "start_date": _format_date(task.start_time),
                "due_date": _format_date(task.end_time),
                "end_date": _format_date(task.updatedAt.date() if task.status == "REWARD" and task.updatedAt else None),
                "workspace": workspace.name if workspace else "",
            }
        )

    payroll = _build_payroll_analytics(
        lead_id=lead_id,
        users=[*staff_users, *supplier_users],
        user_map=user_map,
        from_month=from_month,
        to_month=to_month,
        period_start=period_start,
        period_end=period_end,
        tasks_in_period=tasks,
    )
    month_totals = payroll["month_totals"]
    user_monthly_net = payroll["user_monthly_net"]

    total_staff = len(staff_users)
    total_supplier = len(supplier_users)
    left_count = sum(1 for user in staff_users if _is_inactive(user.status))

    current_month_key = to_month.strftime("%Y-%m")
    current_month_salary_total = float(month_totals.get(current_month_key, {}).get("staff_net_salary", 0))
    avg_salary = round((current_month_salary_total / total_staff), 0) if total_staff else 0

    salary_monthly = []
    for month in _iter_months(from_month, to_month):
        key = month.strftime("%Y-%m")
        month_staff_total = float(month_totals.get(key, {}).get("staff_net_salary", 0))
        month_avg = round((month_staff_total / total_staff), 0) if total_staff else 0
        salary_monthly.append(
            {
                "month": key,
                "label": f"Thg {month.month}",
                "total_salary": month_staff_total,
                "avg_salary": month_avg,
            }
        )

    department_counter: dict[str, int] = defaultdict(int)
    for user in staff_users:
        role_name = (user.update_role() or {}).get("name") or "Khác"
        department_counter[role_name] += 1

    department_colors = ["#F59E0B", "#22C55E", "#3B82F6", "#A855F7", "#14B8A6", "#F97316"]
    department_ratio = []
    for idx, (dept, value) in enumerate(sorted(department_counter.items(), key=lambda x: x[0])):
        department_ratio.append(
            {
                "label": dept,
                "value": value,
                "color": department_colors[idx % len(department_colors)],
            }
        )

    task_count_by_user: dict[str, int] = defaultdict(int)
    customer_count_by_user: dict[str, set[str]] = defaultdict(set)
    for task in tasks:
        assign_ids = task.assign_ids or []
        workspace = workspace_by_id.get(task.workspace_id) if task.workspace_id else None
        owner_id = workspace.owner_id if workspace else None
        if not isinstance(assign_ids, list):
            continue
        for uid in assign_ids:
            if uid in user_map and _is_staff(user_map[uid]):
                task_count_by_user[uid] += 1
                if owner_id:
                    customer_count_by_user[uid].add(owner_id)

    top_staff_rows = []
    for user in staff_users:
        total_net = sum(float(user_monthly_net.get(user.id, {}).get(key, 0)) for key in month_keys)
        top_staff_rows.append(
            {
                "name": user.fullName or user.username or "",
                "salary": round(total_net, 0),
                "tasks": task_count_by_user.get(user.id, 0),
                "customers": len(customer_count_by_user.get(user.id, set())),
            }
        )
    top_staff_rows = sorted(top_staff_rows, key=lambda x: (x["tasks"], x["customers"], x["salary"]), reverse=True)[:10]

    customer_task_count: dict[str, int] = defaultdict(int)
    for task in tasks:
        workspace = workspace_by_id.get(task.workspace_id) if task.workspace_id else None
        owner_id = workspace.owner_id if workspace else None
        if owner_id:
            customer_task_count[owner_id] += 1

    top_customers = []
    for owner_id, count in sorted(customer_task_count.items(), key=lambda x: x[1], reverse=True)[:10]:
        owner = user_map.get(owner_id) or db.session.get(User, owner_id)
        if not owner:
            continue
        top_customers.append(
            {
                "name": owner.fullName or owner.username or "",
                "phone": owner.phone or "",
                "total_tasks": count,
            }
        )

    total_customers = len(workspaces)

    prev_month_key = (to_month - relativedelta(months=1)).strftime("%Y-%m")
    staff_detail_rows = []
    sorted_staff = sorted(staff_users, key=lambda user: (user.fullName or user.username or ""))
    for user in sorted_staff:
        current_net = float(user_monthly_net.get(user.id, {}).get(current_month_key, 0))
        prev_net = float(user_monthly_net.get(user.id, {}).get(prev_month_key, 0))
        delta = current_net - prev_net
        created_at = user.createdAt.date() if user.createdAt else None
        staff_detail_rows.append(
            {
                "name": user.fullName or user.username or "",
                "salary": round(current_net, 0),
                "delta": f"{delta:+,.0f}".replace(",", "."),
                "status": (user.update_role() or {}).get("name", "Nhân sự"),
                "start_date": _format_date(created_at),
            }
        )

    job_status_pie = [
        {"label": STATUS_TO_LABEL[key], "value": status_counts[key], "color": STATUS_TO_COLOR[key]}
        for key in ("OPEN", "IN_PROGRESS", "DONE", "REWARD")
    ]
    staff_structure = [
        {"label": "Nhân sự", "value": total_staff, "color": "#14B8A6"},
        {"label": "Thầu phụ", "value": total_supplier, "color": "#93C5FD"},
    ]

    total_salary_period = round(sum(float(month_totals[key]["staff_net_salary"]) for key in month_keys), 0)

    result = {
        "period": {
            "from_month": from_month.strftime("%Y-%m"),
            "to_month": to_month.strftime("%Y-%m"),
        },
        "job": {
            "cards": {
                "total_tasks": total_tasks,
                "completed_tasks": completed_tasks,
                "running_tasks": running_tasks,
                "completion_rate": completion_rate,
            },
            "status_pie": job_status_pie,
            "monthly": month_series,
            "detail_rows": job_detail_rows,
        },
        "cost": {
            "cards": {
                "total_staff": total_staff,
                "avg_salary": avg_salary,
                "left_count": left_count,
                "current_month_salary_total": round(current_month_salary_total, 0),
            },
            "staff_structure": staff_structure,
            "monthly_salary": salary_monthly,
            "staff_rows": staff_detail_rows,
        },
        "people_customer": {
            "cards": {
                "total_staff": total_staff,
                "total_salary": total_salary_period,
                "total_customers": total_customers,
                "current_month_cost": round(current_month_salary_total, 0),
            },
            "salary_cost_trend": salary_monthly,
            "staff_change": {"increase": 0, "decrease": left_count},
            "top_customers": top_customers,
            "department_ratio": department_ratio,
            "top_staff": top_staff_rows,
        },
    }

    return jsonify(result), 200
