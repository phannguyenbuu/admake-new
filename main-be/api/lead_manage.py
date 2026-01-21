from flask import Blueprint, render_template, request
from sqlalchemy import cast, func, Integer

from models import LeadPayload, User

lead_manage_bp = Blueprint("lead_manage", __name__, url_prefix="/lead-manage")


@lead_manage_bp.route("/", methods=["GET"])
def admin_leads():
    page = request.args.get("page", 1, type=int)
    per_page = 50

    users = User.query.filter(
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

    pagination = LeadPayload.query.order_by(LeadPayload.id).paginate(
        page=page, per_page=per_page, error_out=False
    )

    leads_data = []
    for lead in pagination.items:
        lead_dict = lead.tdict()
        lead_dict["user_id_str"] = str(lead.user_id) if lead.user_id else None
        leads_data.append(lead_dict)

    return render_template(
        "admin_leads.html",
        total_users=len(users),
        users=[
            {
                "fullName": "None",
                "id": u.id,
                "username": u.username,
                "password": u.password,
            }
            for u in users
        ],
        leads=leads_data,
        page=page,
        total_pages=pagination.pages,
    )
