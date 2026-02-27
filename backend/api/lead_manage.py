from flask import Blueprint, render_template, request
import json
import os
from sqlalchemy import cast, func, Integer, or_

from models import (
    LeadPayload,
    app,
    db,
    User,
    Workspace,
    Task,
    Message,
    Workpoint,
    Leave,
    Notify,
    Customer,
    Material,
    Role,
    UsingHistoryData,
)

lead_manage_bp = Blueprint("lead_manage", __name__, url_prefix="/lead-manage")


@lead_manage_bp.route("/", methods=["GET"])
def admin_leads():
    page = request.args.get("page", 1, type=int)
    query_text = request.args.get("q", "").strip()
    per_page = 50

    labels_path = os.path.join(os.path.dirname(__file__), "..", "config", "lead_dashboard_labels.json")
    try:
        with open(labels_path, "r", encoding="utf-8") as handle:
            labels = json.load(handle)
    except (OSError, json.JSONDecodeError):
        labels = {}

    assignable_users = User.query.filter(
        User.role_id == -2,
        User.fullName.isnot(None),
        User.fullName != "",
        ~User.fullName.startswith("Lead"),
    ).order_by(
        func.coalesce(
            cast(
                func.nullif(
                    func.regexp_replace(
                        func.substring(User.username, 2), r"[^0-9]", "", "g"
                    ),
                    "",
                ),
                Integer,
            ),
            0,
        )
    ).all()

    lead_query = LeadPayload.query
    if query_text:
        like = f"%{query_text}%"
        lead_query = lead_query.filter(
            or_(
                LeadPayload.name.ilike(like),
                LeadPayload.company.ilike(like),
                LeadPayload.phone.ilike(like),
            )
        )

    pagination = lead_query.order_by(LeadPayload.id).paginate(
        page=page, per_page=per_page, error_out=False
    )

    lead_ids = [lead.id for lead in pagination.items]

    totals = {
        "leads": LeadPayload.query.count(),
        "users": User.query.count(),
        "workspaces": Workspace.query.count(),
        "tasks": Task.query.count(),
        "messages": Message.query.count(),
        "workpoints": Workpoint.query.count(),
        "leaves": Leave.query.count(),
        "notifies": Notify.query.count(),
        "customers": Customer.query.count(),
        "materials": Material.query.count(),
        "roles": Role.query.count(),
        "using_history": UsingHistoryData.query.count(),
    }

    def _count_by_lead(model):
        if not lead_ids:
            return {}
        return dict(
            db.session.query(model.lead_id, func.count())
            .filter(model.lead_id.in_(lead_ids))
            .group_by(model.lead_id)
            .all()
        )

    def _max_by_lead(model, column):
        if not lead_ids:
            return {}
        return dict(
            db.session.query(model.lead_id, func.max(column))
            .filter(model.lead_id.in_(lead_ids))
            .group_by(model.lead_id)
            .all()
        )

    def _is_image(path_value):
        if not path_value:
            return False
        lower = path_value.lower()
        return lower.endswith((".png", ".jpg", ".jpeg", ".gif", ".webp"))

    def _unique_keep_order(items):
        seen = set()
        result = []
        for item in items:
            if item in seen:
                continue
            seen.add(item)
            result.append(item)
        return result

    def _unique_keep_order_images(items):
        seen = set()
        result = []
        for item in items:
            if item in seen:
                continue
            seen.add(item)
            result.append(item)
        return result

    def _is_remote_url(path_value):
        if not path_value:
            return False
        return path_value.startswith("http://") or path_value.startswith("https://")

    def _resolve_local_path(path_value):
        if not path_value or _is_remote_url(path_value):
            return None
        upload_folder = app.config.get("UPLOAD_FOLDER", "")
        if path_value.startswith("/static/"):
            return os.path.join(upload_folder, path_value[len("/static/"):])
        if path_value.startswith("/"):
            return path_value
        return os.path.join(upload_folder, path_value)

    def _file_exists(path_value):
        local_path = _resolve_local_path(path_value)
        if not local_path:
            return False
        return os.path.exists(local_path)

    def _add_image(target_map, lead_id, thumb_url, full_url):
        if not lead_id:
            return
        full_ok = _is_image(full_url)
        if not full_ok:
            return
        if full_url and os.path.basename(full_url).lower().startswith("thumb_"):
            return
        if _is_remote_url(full_url):
            return
        if not _file_exists(full_url):
            return
        target_map.setdefault(lead_id, []).append(full_url)

    total_users_by_lead = _count_by_lead(User)
    employee_users_by_lead = dict(
        db.session.query(User.lead_id, func.count())
        .filter(User.lead_id.in_(lead_ids), User.role_id > 0, User.role_id < 100)
        .group_by(User.lead_id)
        .all()
    )
    customer_role_by_lead = dict(
        db.session.query(User.lead_id, func.count())
        .filter(User.lead_id.in_(lead_ids), User.role_id == -1)
        .group_by(User.lead_id)
        .all()
    )
    customer_table_by_lead = dict(
        db.session.query(User.lead_id, func.count(Customer.id))
        .join(Customer, Customer.user_id == User.id)
        .filter(User.lead_id.in_(lead_ids))
        .group_by(User.lead_id)
        .all()
    )

    workspace_by_lead = _count_by_lead(Workspace)
    task_by_lead = _count_by_lead(Task)
    message_by_lead = _count_by_lead(Message)
    workpoint_by_lead = _count_by_lead(Workpoint)
    leave_by_lead = _count_by_lead(Leave)

    last_message_at = _max_by_lead(Message, Message.updatedAt)
    last_workspace_at = _max_by_lead(Workspace, Workspace.updatedAt)
    last_task_at = _max_by_lead(Task, Task.updatedAt)
    last_user_at = _max_by_lead(User, User.updatedAt)
    last_workpoint_at = _max_by_lead(Workpoint, Workpoint.updatedAt)

    workspace_lead_map = {}
    if lead_ids:
        workspace_lead_map = dict(
            db.session.query(Workspace.id, Workspace.lead_id)
            .filter(Workspace.lead_id.in_(lead_ids))
            .all()
        )

    message_images_by_lead = {}
    if lead_ids:
        message_rows = (
            db.session.query(
                Message.workspace_id,
                Message.user_id,
                Message.lead_id,
                Message.file_url,
                Message.thumb_url,
            )
            .filter(
                Message.file_url.isnot(None),
                Message.file_url != "",
            )
            .all()
        )
        user_lead_map = dict(
            db.session.query(User.id, User.lead_id)
            .filter(User.lead_id.in_(lead_ids))
            .all()
        )
        for workspace_id, user_id, message_lead_id, file_url, thumb_url in message_rows:
            lead_id = (
                workspace_lead_map.get(workspace_id)
                or user_lead_map.get(user_id)
                or message_lead_id
            )
            if lead_id not in lead_ids:
                continue
            _add_image(message_images_by_lead, lead_id, None, file_url)

    task_icon_by_lead = {}
    if lead_ids:
        task_icon_rows = (
            db.session.query(Task.lead_id, Task.workspace_id, Task.icon)
            .filter(Task.icon.isnot(None), Task.icon != "")
            .all()
        )
        for lead_id, workspace_id, icon in task_icon_rows:
            resolved_lead_id = lead_id or workspace_lead_map.get(workspace_id)
            if resolved_lead_id not in lead_ids:
                continue
            _add_image(task_icon_by_lead, resolved_lead_id, None, icon)

    task_asset_map = {}
    if lead_ids:
        task_rows = (
            db.session.query(Task.lead_id, Task.workspace_id, Task.assets)
            .all()
        )
        asset_ids = set()
        for lead_id, workspace_id, assets in task_rows:
            resolved_lead_id = lead_id or workspace_lead_map.get(workspace_id)
            if resolved_lead_id not in lead_ids:
                continue
            if not assets:
                continue
            if isinstance(assets, list):
                for asset_id in assets:
                    if isinstance(asset_id, str):
                        task_asset_map.setdefault(resolved_lead_id, []).append(asset_id)
                        asset_ids.add(asset_id)
        asset_images_by_message = {}
        if asset_ids:
            asset_rows = (
                db.session.query(Message.message_id, Message.file_url, Message.thumb_url)
                .filter(Message.message_id.in_(asset_ids))
                .all()
            )
            for message_id, file_url, thumb_url in asset_rows:
                if not _is_image(file_url):
                    continue
                if file_url and os.path.basename(file_url).lower().startswith("thumb_"):
                    continue
                asset_images_by_message[message_id] = file_url

        asset_images_by_lead = {}
        for lead_id, message_ids in task_asset_map.items():
            urls = []
            for message_id in message_ids:
                url = asset_images_by_message.get(message_id)
                if url:
                    urls.append(url)
            if urls:
                asset_images_by_lead[lead_id] = urls
    else:
        asset_images_by_lead = {}

    leads_data = []
    for lead in pagination.items:
        lead_dict = lead.tdict()
        lead_dict["user_id_str"] = str(lead.user_id) if lead.user_id else None
        lead_dict["stats"] = {
            "users_total": total_users_by_lead.get(lead.id, 0),
            "users_staff": employee_users_by_lead.get(lead.id, 0),
            "users_customer_role": customer_role_by_lead.get(lead.id, 0),
            "customers": customer_table_by_lead.get(lead.id, 0),
            "workspaces": workspace_by_lead.get(lead.id, 0),
            "tasks": task_by_lead.get(lead.id, 0),
            "messages": message_by_lead.get(lead.id, 0),
            "workpoints": workpoint_by_lead.get(lead.id, 0),
            "leaves": leave_by_lead.get(lead.id, 0),
            "last_message_at": last_message_at.get(lead.id),
            "last_workspace_at": last_workspace_at.get(lead.id),
            "last_task_at": last_task_at.get(lead.id),
            "last_user_at": last_user_at.get(lead.id),
            "last_workpoint_at": last_workpoint_at.get(lead.id),
            "preview_images": _unique_keep_order_images(
                (
                    message_images_by_lead.get(lead.id, [])
                    + asset_images_by_lead.get(lead.id, [])
                    + task_icon_by_lead.get(lead.id, [])
                )
            ),
        }
        leads_data.append(lead_dict)

    return render_template(
        "admin_leads.html",
        total_users=len(assignable_users),
        total_users_all=totals["users"],
        totals=totals,
        users=[
            {
                "fullName": "None",
                "id": u.id,
                "username": u.username,
                "password": u.password,
            }
            for u in assignable_users
        ],
        leads=leads_data,
        page=page,
        total_pages=pagination.pages,
        query_text=query_text,
        labels=labels,
    )
