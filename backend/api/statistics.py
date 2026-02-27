from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta

from dateutil.relativedelta import relativedelta
from flask import Blueprint, abort, jsonify, request

from models import LeadPayload, Task, User, Workspace, db

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

    users = lead.users.all()
    user_map = {u.id: u for u in users}
    staff_users = [u for u in users if _is_staff(u)]
    supplier_users = [u for u in users if _is_supplier(u)]

    workspaces = Workspace.query.filter(
        Workspace.lead_id == lead_id,
        Workspace.owner_id.isnot(None),
    ).all()
    workspace_by_id = {w.id: w for w in workspaces}

    tasks = Task.query.filter(
        Task.lead_id == lead_id,
        Task.isDelete.is_(False),
        Task.createdAt >= period_start,
        Task.createdAt <= period_end,
    ).all()

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

    # Monthly task series
    month_series: list[dict] = []
    month_status_counter: dict[str, dict[str, int]] = {}
    for month in _iter_months(from_month, to_month):
        key = month.strftime("%Y-%m")
        month_status_counter[key] = {"OPEN": 0, "IN_PROGRESS": 0, "DONE": 0, "REWARD": 0}

    for task in tasks:
        created_at = task.createdAt
        if not created_at:
            continue
        key = created_at.strftime("%Y-%m")
        if key in month_status_counter and task.status in month_status_counter[key]:
            month_status_counter[key][task.status] += 1

    for key, row in month_status_counter.items():
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

    # Job detail rows
    task_rows = sorted(tasks, key=lambda t: t.updatedAt or t.createdAt or datetime.min, reverse=True)[:30]
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

    # Cost metrics
    total_staff = len(staff_users)
    total_supplier = len(supplier_users)
    staff_salary_values = [float(user.salary or 0) for user in staff_users]
    avg_salary = round((sum(staff_salary_values) / total_staff), 0) if total_staff else 0
    left_count = sum(1 for user in staff_users if _is_inactive(user.status))
    current_month_salary_total = round(sum(staff_salary_values), 0)

    # Monthly salary trend from static salary in profile (real DB values)
    salary_monthly = []
    for month in _iter_months(from_month, to_month):
        key = month.strftime("%Y-%m")
        salary_monthly.append(
            {
                "month": key,
                "label": f"Thg {month.month}",
                "total_salary": round(sum(float(user.salary or 0) for user in staff_users), 0),
                "avg_salary": avg_salary,
            }
        )

    # Department ratio
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

    # Top staff by task count
    task_count_by_user: dict[str, int] = defaultdict(int)
    customer_count_by_user: dict[str, set[str]] = defaultdict(set)

    for task in tasks:
        assign_ids = task.assign_ids or []
        workspace = workspace_by_id.get(task.workspace_id) if task.workspace_id else None
        owner_id = workspace.owner_id if workspace else None

        if isinstance(assign_ids, list):
            for uid in assign_ids:
                if uid in user_map and _is_staff(user_map[uid]):
                    task_count_by_user[uid] += 1
                    if owner_id:
                        customer_count_by_user[uid].add(owner_id)

    top_staff_rows = []
    for user in staff_users:
        top_staff_rows.append(
            {
                "name": user.fullName or user.username or "",
                "salary": float(user.salary or 0),
                "tasks": task_count_by_user.get(user.id, 0),
                "customers": len(customer_count_by_user.get(user.id, set())),
            }
        )
    top_staff_rows = sorted(top_staff_rows, key=lambda x: (x["tasks"], x["customers"], x["salary"]), reverse=True)[:10]

    # Top customers by task volume
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

    # Staff detail rows for cost tab
    staff_detail_rows = []
    sorted_staff = sorted(staff_users, key=lambda u: (u.fullName or u.username or ""))
    for user in sorted_staff:
        created_at = user.createdAt.date() if user.createdAt else None
        staff_detail_rows.append(
            {
                "name": user.fullName or user.username or "",
                "salary": float(user.salary or 0),
                "delta": "0",
                "status": (user.update_role() or {}).get("name", "Nhân sự"),
                "start_date": _format_date(created_at),
            }
        )

    job_status_pie = []
    for status_key in ("OPEN", "IN_PROGRESS", "DONE", "REWARD"):
        job_status_pie.append(
            {
                "label": STATUS_TO_LABEL[status_key],
                "value": status_counts[status_key],
                "color": STATUS_TO_COLOR[status_key],
            }
        )

    staff_structure = [
        {"label": "Nhân sự", "value": total_staff, "color": "#14B8A6"},
        {"label": "Thầu phụ", "value": total_supplier, "color": "#93C5FD"},
    ]

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
                "current_month_salary_total": current_month_salary_total,
            },
            "staff_structure": staff_structure,
            "monthly_salary": salary_monthly,
            "staff_rows": staff_detail_rows,
        },
        "people_customer": {
            "cards": {
                "total_staff": total_staff,
                "total_salary": round(sum(staff_salary_values), 0),
                "total_customers": total_customers,
                "current_month_cost": current_month_salary_total,
            },
            "salary_cost_trend": salary_monthly,
            "staff_change": {"increase": 0, "decrease": left_count},
            "top_customers": top_customers,
            "department_ratio": department_ratio,
            "top_staff": top_staff_rows,
        },
    }

    return jsonify(result), 200
