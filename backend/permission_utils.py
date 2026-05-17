from __future__ import annotations

from typing import Iterable

from flask import abort, request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from flask_login import current_user

from models import User, UserCanView, db


ACCOUNTING_SUB_PERMISSION_KEYS = [
    "view_acc_payroll",
    "view_acc_cashflow",
    "view_acc_ar",
    "view_acc_ap",
    "view_acc_docs",
    "view_acc_ledger",
    "view_acc_tax",
    "view_acc_assets",
    "view_acc_records",
    "view_acc_reports",
]


def build_default_can_views(default_value: bool = True) -> dict[str, bool]:
    return {
        "view_workpoint": default_value,
        "view_user": default_value,
        "view_supplier": default_value,
        "view_customer": default_value,
        "view_workspace": default_value,
        "view_material": default_value,
        "view_invoice": default_value,
        "view_accountant": default_value,
        "view_statistic": default_value,
        "view_acc_payroll": default_value,
        "view_acc_cashflow": default_value,
        "view_acc_ar": default_value,
        "view_acc_ap": default_value,
        "view_acc_docs": default_value,
        "view_acc_ledger": default_value,
        "view_acc_tax": default_value,
        "view_acc_assets": default_value,
        "view_acc_records": default_value,
        "view_acc_reports": default_value,
    }


def get_user_can_view_map(user: User | None) -> dict[str, bool]:
    can_views = build_default_can_views(default_value=True)

    if not user or user.role_id != -2:
        can_views = build_default_can_views(default_value=False)
        if user:
            user_can_view = UserCanView.query.filter(UserCanView.user_id == user.id).first()
            if user_can_view:
                can_views = {
                    key: bool(getattr(user_can_view, key, False))
                    for key in can_views
                }

    if any(can_views.get(key) for key in ACCOUNTING_SUB_PERMISSION_KEYS):
        can_views["view_accountant"] = True

    return can_views


def resolve_request_user() -> User | None:
    user = None
    auth_header = (request.headers.get("Authorization") or "").strip()

    if auth_header:
        try:
            verify_jwt_in_request(optional=True)
            identity = get_jwt_identity()
            if identity:
                user = db.session.get(User, str(identity))
        except Exception:
            user = None

    if user is None and getattr(current_user, "is_authenticated", False):
        current_user_id = getattr(current_user, "id", None)
        if current_user_id:
            user = db.session.get(User, str(current_user_id))

    return user


def require_authenticated_user() -> User:
    user = resolve_request_user()
    if not user:
        abort(401, description="Authentication required")
    return user


def _parse_lead_id(value) -> int | None:
    if value in (None, ""):
        return None
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return None
    return parsed if parsed > 0 else None


def extract_request_lead_id(keys: Iterable[str] = ("lead", "lead_id")) -> int | None:
    search_keys = tuple(keys)

    for source in (request.view_args or {}, request.args, request.form):
        for key in search_keys:
            lead_id = _parse_lead_id(source.get(key))
            if lead_id:
                return lead_id

    if request.is_json:
        payload = request.get_json(silent=True) or {}
        for key in search_keys:
            lead_id = _parse_lead_id(payload.get(key))
            if lead_id:
                return lead_id

    return None


def ensure_same_lead(user: User, lead_id: int | None):
    if not lead_id:
        return
    if int(user.lead_id or 0) != int(lead_id):
        abort(403, description="You do not have access to this lead")


def ensure_resource_lead(resource, user: User | None = None, resource_name: str = "resource") -> User:
    actor = user or require_authenticated_user()
    resource_lead_id = getattr(resource, "lead_id", None)
    if resource_lead_id is not None and int(actor.lead_id or 0) != int(resource_lead_id or 0):
        abort(403, description=f"You do not have access to this {resource_name}")
    return actor


def require_can_view(
    permission: str | None = None,
    *,
    any_permissions: Iterable[str] | None = None,
    lead_keys: Iterable[str] = ("lead", "lead_id"),
):
    user = require_authenticated_user()
    ensure_same_lead(user, extract_request_lead_id(lead_keys))

    can_views = get_user_can_view_map(user)
    allowed = True

    if permission:
        allowed = bool(can_views.get(permission))
    elif any_permissions:
        allowed = any(bool(can_views.get(key)) for key in any_permissions)

    if not allowed:
        abort(403, description="You do not have permission to access this module")

    return user, can_views


def require_lead_user(target_user_id: str | None = None):
    actor = require_authenticated_user()
    if actor.role_id != -2:
        abort(403, description="Only lead can access this action")

    if target_user_id:
        target_user = db.session.get(User, str(target_user_id))
        if target_user and int(target_user.lead_id or 0) != int(actor.lead_id or 0):
            abort(403, description="You do not have access to this user")

    return actor


def require_self_or_lead(target_user_id: str):
    actor = require_authenticated_user()
    target_user = db.session.get(User, str(target_user_id))
    if not target_user:
        abort(404, description="User not found")

    if str(actor.id) == str(target_user.id):
        return actor, target_user

    if actor.role_id == -2 and int(actor.lead_id or 0) == int(target_user.lead_id or 0):
        return actor, target_user

    abort(403, description="You do not have access to this user")
