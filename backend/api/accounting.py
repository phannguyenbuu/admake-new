from collections import defaultdict
from datetime import date, datetime

from flask import Blueprint, abort, jsonify, request, g
from sqlalchemy import and_, or_

from models import (
    AccountingDailyCash,
    AccountingDocument,
    APBillPayment,
    ARInvoicePayment,
    DocumentCenterDocument,
    LeadPayload,
    Material,
    db,
    generate_datetime_id,
    upload_a_file_to_vps,
)
from permission_utils import ensure_resource_lead, require_can_view


accounting_bp = Blueprint("accounting", __name__, url_prefix="/api/accounting")


def _permission_for_accounting_request():
    path = (request.path or "").rstrip("/")
    if "/daily-cash" in path:
        return "view_acc_cashflow"
    if "/documents" in path:
        return "view_acc_docs"
    return "view_accountant"


@accounting_bp.before_request
def guard_accounting_permission():
    if request.method == "OPTIONS":
        return

    actor, _ = require_can_view(_permission_for_accounting_request())
    g.permission_actor = actor

    view_args = request.view_args or {}
    resource_checks = (
        ("item_id", AccountingDailyCash, "daily cash row"),
        ("doc_id", AccountingDocument, "accounting document"),
    )
    for arg_name, model, resource_name in resource_checks:
        resource_id = view_args.get(arg_name)
        if not resource_id:
            continue
        resource = db.session.get(model, resource_id)
        if resource:
            ensure_resource_lead(resource, actor, resource_name)
        break

DOCUMENT_TYPES = [
    "BANG_BAO_GIA",
    "HOP_DONG_KINH_TE",
    "BB_TAM_UNG",
    "BB_NGHIEM_THU",
    "DE_NGHI_THANH_TOAN",
    "THANH_LY_HOP_DONG",
    "HOA_DON",
    "MAKET_DINH_KEM",
]

DOCUMENT_STATUS = ["draft", "pending", "approved", "issued", "archived", "cancelled"]
PAYMENT_STATUS = ["unpaid", "partial", "paid", "overdue", "cancelled"]
PAYMENT_METHODS = ["cash", "bank_transfer", "card", "other"]

CASH_DIRECTIONS = ["income", "expense"]
CASH_STATUS = ["draft", "pending", "approved", "paid", "cancelled"]

DOC_TYPE_PREFIX = {
    "BANG_BAO_GIA": "BG",
    "HOP_DONG_KINH_TE": "HDKT",
    "BB_TAM_UNG": "TU",
    "BB_NGHIEM_THU": "NT",
    "DE_NGHI_THANH_TOAN": "DNTT",
    "THANH_LY_HOP_DONG": "TLHD",
    "HOA_DON": "HD",
    "MAKET_DINH_KEM": "MK",
}

LEGACY_TO_CENTER_TYPE = {
    "BANG_BAO_GIA": "QUOTE",
    "HOP_DONG_KINH_TE": "CONTRACT",
    "BB_TAM_UNG": "ADVANCE_REQUEST",
    "BB_NGHIEM_THU": "ACCEPTANCE",
    "DE_NGHI_THANH_TOAN": "PAYMENT_REQUEST",
    "THANH_LY_HOP_DONG": "LIQUIDATION",
    "HOA_DON": "INVOICE_IN",
    "MAKET_DINH_KEM": "OTHER",
}

LEGACY_TO_CENTER_STATUS = {
    "draft": "draft",
    "pending": "submitted",
    "approved": "approved",
    "issued": "invoiced",
    "archived": "closed",
    "cancelled": "cancelled",
}


def _parse_date(value):
    if not value:
        return None
    if isinstance(value, date):
        return value
    text = str(value).strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y-%m"):
        try:
            parsed = datetime.strptime(text, fmt)
            if fmt == "%Y-%m":
                return parsed.replace(day=1).date()
            return parsed.date()
        except ValueError:
            continue
    return None


def _to_float(value, default=0.0):
    if value is None:
        return default
    try:
        return float(value)
    except Exception:
        return default


def _clean_text(value):
    if value is None:
        return None
    text = str(value).strip()
    return text if text else None


def _ensure_lead(lead_id):
    lead = db.session.get(LeadPayload, lead_id)
    if not lead:
        abort(404, description="Lead not found")
    return lead


def _validate_enum(field_name: str, value: str | None, allowed: list[str], default_value: str):
    chosen = (value or default_value).strip()
    if chosen not in allowed:
        abort(400, description=f"Invalid {field_name}: {chosen}")
    return chosen


def _build_cash_voucher_no(lead_id: int, txn_date: date):
    date_key = txn_date.strftime("%Y%m%d")
    prefix = f"TC-{date_key}"
    pattern = f"{prefix}-%"

    existing = (
        AccountingDailyCash.query.filter(
            AccountingDailyCash.lead_id == lead_id,
            AccountingDailyCash.voucher_no.ilike(pattern),
        )
        .order_by(AccountingDailyCash.voucher_no.desc())
        .first()
    )

    seq = 1
    if existing and existing.voucher_no:
        try:
            seq = int(existing.voucher_no.split("-")[-1]) + 1
        except Exception:
            seq = 1
    return f"{prefix}-{seq:04d}"


def _build_doc_no(lead_id: int, doc_type: str, doc_date: date):
    month_key = doc_date.strftime("%Y%m")
    type_prefix = DOC_TYPE_PREFIX.get(doc_type, "CT")
    prefix = f"{type_prefix}-{month_key}"
    pattern = f"{prefix}-%"

    existing = (
        AccountingDocument.query.filter(
            AccountingDocument.lead_id == lead_id,
            AccountingDocument.doc_no.ilike(pattern),
        )
        .order_by(AccountingDocument.doc_no.desc())
        .first()
    )

    seq = 1
    if existing and existing.doc_no:
        try:
            seq = int(existing.doc_no.split("-")[-1]) + 1
        except Exception:
            seq = 1
    return f"{prefix}-{seq:04d}"


def _parse_attachments(data):
    raw = data.get("attachments")
    if raw is None:
        return []
    if isinstance(raw, list):
        return raw
    return []


def _sync_legacy_document_to_center(doc: AccountingDocument):
    center_doc = DocumentCenterDocument.query.filter_by(legacy_document_id=doc.id).first()
    if not center_doc:
        center_doc = DocumentCenterDocument(
            id=generate_datetime_id(),
            lead_id=doc.lead_id,
            legacy_document_id=doc.id,
        )
        db.session.add(center_doc)

    candidate_code = (doc.doc_no or f"LEG-{doc.id}").strip()
    duplicate = (
        DocumentCenterDocument.query.filter(
            DocumentCenterDocument.lead_id == doc.lead_id,
            DocumentCenterDocument.code == candidate_code,
            DocumentCenterDocument.id != center_doc.id,
        )
        .limit(1)
        .first()
    )
    center_doc.code = f"{candidate_code}-{doc.id[-4:]}" if duplicate else candidate_code
    center_doc.type = LEGACY_TO_CENTER_TYPE.get(doc.doc_type, "OTHER")
    center_doc.docDate = doc.doc_date or date.today()
    center_doc.partnerName = _clean_text(doc.partner_name)
    center_doc.projectName = _clean_text(doc.project_name)
    center_doc.amount = _to_float(doc.amount, 0)
    center_doc.currency = _clean_text(doc.currency) or "VND"
    center_doc.status = LEGACY_TO_CENTER_STATUS.get((doc.status or "").strip(), "draft")
    center_doc.description = _clean_text(doc.content)
    center_doc.note = _clean_text(doc.material_name)
    center_doc.tags = doc.tags if isinstance(doc.tags, list) else []
    center_doc.deletedAt = doc.deletedAt


def _soft_delete_synced_center_document(legacy_doc_id: str):
    center_doc = DocumentCenterDocument.query.filter_by(legacy_document_id=legacy_doc_id).first()
    if center_doc and not center_doc.deletedAt:
        center_doc.deletedAt = datetime.utcnow()


@accounting_bp.route("/metadata", methods=["GET"])
def get_accounting_metadata():
    return (
        jsonify(
            {
                "document_types": DOCUMENT_TYPES,
                "document_status": DOCUMENT_STATUS,
                "payment_status": PAYMENT_STATUS,
                "payment_methods": PAYMENT_METHODS,
                "cash_directions": CASH_DIRECTIONS,
                "cash_status": CASH_STATUS,
            }
        ),
        200,
    )


@accounting_bp.route("/document-types", methods=["GET"])
def get_document_types():
    return jsonify({"data": DOCUMENT_TYPES}), 200


@accounting_bp.route("/daily-cash", methods=["GET"])
def get_daily_cash():
    lead_id = request.args.get("lead", 0, type=int)
    _ensure_lead(lead_id)

    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 20, type=int)
    search = request.args.get("search", "", type=str).strip()
    direction = request.args.get("direction", "", type=str).strip()
    status = request.args.get("status", "", type=str).strip()
    payment_method = request.args.get("payment_method", "", type=str).strip()
    from_date = _parse_date(request.args.get("from_date", "", type=str))
    to_date = _parse_date(request.args.get("to_date", "", type=str))

    query = (
        AccountingDailyCash.query
        .outerjoin(
            ARInvoicePayment,
            and_(
                ARInvoicePayment.daily_cash_id == AccountingDailyCash.id,
                ARInvoicePayment.deletedAt.is_(None),
            ),
        )
        .filter(
            AccountingDailyCash.lead_id == lead_id,
            AccountingDailyCash.deletedAt.is_(None),
            or_(ARInvoicePayment.id.is_(None), ARInvoicePayment.payment_type != "phat_sinh"),
        )
    )
    if direction in CASH_DIRECTIONS:
        query = query.filter(AccountingDailyCash.direction == direction)
    if status in CASH_STATUS:
        query = query.filter(AccountingDailyCash.status == status)
    if payment_method in PAYMENT_METHODS:
        query = query.filter(AccountingDailyCash.payment_method == payment_method)
    if from_date:
        query = query.filter(AccountingDailyCash.txn_date >= from_date)
    if to_date:
        query = query.filter(AccountingDailyCash.txn_date <= to_date)
    if search:
        keyword = f"%{search}%"
        query = query.filter(
            or_(
                AccountingDailyCash.voucher_no.ilike(keyword),
                AccountingDailyCash.description.ilike(keyword),
                AccountingDailyCash.material_name.ilike(keyword),
                AccountingDailyCash.counterparty_name.ilike(keyword),
                AccountingDailyCash.doc_ref.ilike(keyword),
                AccountingDailyCash.note.ilike(keyword),
            )
        )

    ordered_query = query.order_by(AccountingDailyCash.txn_date.desc(), AccountingDailyCash.createdAt.desc())
    pagination = ordered_query.paginate(page=page, per_page=limit, error_out=False)
    rows = [row.tdict() for row in pagination.items]

    full_rows = query.all()
    income_total = 0.0
    expense_total = 0.0
    by_status = defaultdict(float)
    by_method = defaultdict(float)
    for row in full_rows:
        amount = float(row.amount or 0)
        if row.direction == "income":
            income_total += amount
        else:
            expense_total += amount
        by_status[row.status or "unknown"] += amount
        by_method[row.payment_method or "unknown"] += amount

    return (
        jsonify(
            {
                "data": rows,
                "total": pagination.total,
                "pagination": {
                    "total": pagination.total,
                    "page": page,
                    "per_page": limit,
                    "pages": pagination.pages,
                },
                "summary": {
                    "income_total": round(income_total, 2),
                    "expense_total": round(expense_total, 2),
                    "net_total": round(income_total - expense_total, 2),
                    "by_status": [{"status": k, "amount": round(v, 2)} for k, v in sorted(by_status.items())],
                    "by_payment_method": [
                        {"payment_method": k, "amount": round(v, 2)} for k, v in sorted(by_method.items())
                    ],
                },
            }
        ),
        200,
    )


@accounting_bp.route("/daily-cash", methods=["POST"])
def create_daily_cash():
    data = request.get_json() or {}
    lead_id = int(data.get("lead_id") or 0)
    _ensure_lead(lead_id)

    txn_date = _parse_date(data.get("txn_date")) or date.today()
    direction = _validate_enum("direction", data.get("direction"), CASH_DIRECTIONS, "expense")
    status = _validate_enum("status", data.get("status"), CASH_STATUS, "draft")
    payment_method = _validate_enum("payment_method", data.get("payment_method"), PAYMENT_METHODS, "cash")

    amount = _to_float(data.get("amount"), 0)
    if amount <= 0:
        abort(400, description="amount must be > 0")

    voucher_no = _clean_text(data.get("voucher_no")) or _build_cash_voucher_no(lead_id, txn_date)

    item = AccountingDailyCash.create_item(
        {
            "lead_id": lead_id,
            "user_id": data.get("user_id"),
            "txn_date": txn_date,
            "voucher_no": voucher_no,
            "direction": direction,
            "amount": amount,
            "description": _clean_text(data.get("description")),
            "counterparty_name": _clean_text(data.get("counterparty_name")),
            "material_name": _clean_text(data.get("material_name")),
            "unit": _clean_text(data.get("unit")),
            "quantity": _to_float(data.get("quantity"), 0),
            "status": status,
            "payment_method": payment_method,
            "doc_ref": _clean_text(data.get("doc_ref")),
            "note": _clean_text(data.get("note")),
            "attachments": _parse_attachments(data),
        }
    )
    return jsonify(item.tdict()), 201


@accounting_bp.route("/daily-cash/<string:item_id>", methods=["PUT"])
def update_daily_cash(item_id):
    data = request.get_json() or {}
    item = db.session.get(AccountingDailyCash, item_id)
    if not item:
        abort(404, description="Daily cash row not found")

    # Guard linked AR/AP payments from amount/direction changes
    if data.get("amount") is not None or data.get("direction") is not None:
        linked_ar = ARInvoicePayment.query.filter(
            ARInvoicePayment.daily_cash_id == item_id,
            ARInvoicePayment.deletedAt.is_(None),
        ).first()
        linked_ap = APBillPayment.query.filter(
            APBillPayment.daily_cash_id == item_id,
            APBillPayment.deletedAt.is_(None),
        ).first()
        if linked_ar or linked_ap:
            abort(400, description="Không thể sửa số tiền/chiều phiếu thu chi đã liên kết thanh toán công nợ. Hãy sửa từ phía thanh toán.")

    if data.get("txn_date") is not None:
        parsed = _parse_date(data.get("txn_date"))
        if parsed:
            item.txn_date = parsed
    if data.get("voucher_no") is not None:
        item.voucher_no = _clean_text(data.get("voucher_no"))
    if data.get("direction") is not None:
        item.direction = _validate_enum("direction", data.get("direction"), CASH_DIRECTIONS, item.direction or "expense")
    if data.get("amount") is not None:
        amount = _to_float(data.get("amount"), 0)
        if amount <= 0:
            abort(400, description="amount must be > 0")
        item.amount = amount
    if data.get("description") is not None:
        item.description = _clean_text(data.get("description"))
    if data.get("counterparty_name") is not None:
        item.counterparty_name = _clean_text(data.get("counterparty_name"))
    if data.get("material_name") is not None:
        item.material_name = _clean_text(data.get("material_name"))
    if data.get("unit") is not None:
        item.unit = _clean_text(data.get("unit"))
    if data.get("quantity") is not None:
        item.quantity = _to_float(data.get("quantity"), 0)
    if data.get("status") is not None:
        item.status = _validate_enum("status", data.get("status"), CASH_STATUS, item.status or "draft")
    if data.get("payment_method") is not None:
        item.payment_method = _validate_enum(
            "payment_method", data.get("payment_method"), PAYMENT_METHODS, item.payment_method or "cash"
        )
    if data.get("doc_ref") is not None:
        item.doc_ref = _clean_text(data.get("doc_ref"))
    if data.get("note") is not None:
        item.note = _clean_text(data.get("note"))
    if data.get("attachments") is not None:
        item.attachments = _parse_attachments(data)

    db.session.commit()
    return jsonify(item.tdict()), 200


@accounting_bp.route("/daily-cash/<string:item_id>", methods=["DELETE"])
def delete_daily_cash(item_id):
    item = db.session.get(AccountingDailyCash, item_id)
    if not item:
        abort(404, description="Daily cash row not found")
    # Block if linked to AR/AP payments
    linked_ar = ARInvoicePayment.query.filter(
        ARInvoicePayment.daily_cash_id == item_id,
        ARInvoicePayment.deletedAt.is_(None),
    ).first()
    linked_ap = APBillPayment.query.filter(
        APBillPayment.daily_cash_id == item_id,
        APBillPayment.deletedAt.is_(None),
    ).first()
    if linked_ar or linked_ap:
        abort(400, description="Không thể xóa phiếu thu/chi đã liên kết với thanh toán công nợ. Hãy xóa thanh toán trước.")
    item.deletedAt = datetime.utcnow()
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200


@accounting_bp.route("/documents", methods=["GET"])
def get_documents():
    lead_id = request.args.get("lead", 0, type=int)
    _ensure_lead(lead_id)

    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 20, type=int)
    search = request.args.get("search", "", type=str).strip()
    doc_type = request.args.get("doc_type", "", type=str).strip()
    status = request.args.get("status", "", type=str).strip()
    payment_status = request.args.get("payment_status", "", type=str).strip()
    payment_method = request.args.get("payment_method", "", type=str).strip()
    from_date = _parse_date(request.args.get("from_date", "", type=str))
    to_date = _parse_date(request.args.get("to_date", "", type=str))

    query = AccountingDocument.query.filter(AccountingDocument.lead_id == lead_id)
    if doc_type in DOCUMENT_TYPES:
        query = query.filter(AccountingDocument.doc_type == doc_type)
    if status in DOCUMENT_STATUS:
        query = query.filter(AccountingDocument.status == status)
    if payment_status in PAYMENT_STATUS:
        query = query.filter(AccountingDocument.payment_status == payment_status)
    if payment_method in PAYMENT_METHODS:
        query = query.filter(AccountingDocument.payment_method == payment_method)
    if from_date:
        query = query.filter(AccountingDocument.doc_date >= from_date)
    if to_date:
        query = query.filter(AccountingDocument.doc_date <= to_date)
    if search:
        keyword = f"%{search}%"
        query = query.filter(
            or_(
                AccountingDocument.doc_no.ilike(keyword),
                AccountingDocument.partner_name.ilike(keyword),
                AccountingDocument.project_name.ilike(keyword),
                AccountingDocument.material_name.ilike(keyword),
                AccountingDocument.content.ilike(keyword),
            )
        )

    ordered_query = query.order_by(AccountingDocument.doc_date.desc(), AccountingDocument.createdAt.desc())
    pagination = ordered_query.paginate(page=page, per_page=limit, error_out=False)
    rows = [row.tdict() for row in pagination.items]

    full_rows = query.all()
    total_amount = 0.0
    by_status = defaultdict(float)
    by_type = defaultdict(float)
    by_payment_status = defaultdict(float)

    for row in full_rows:
        amount = float(row.amount or 0)
        total_amount += amount
        by_status[row.status or "unknown"] += amount
        by_type[row.doc_type or "unknown"] += amount
        by_payment_status[row.payment_status or "unknown"] += amount

    return (
        jsonify(
            {
                "data": rows,
                "total": pagination.total,
                "pagination": {
                    "total": pagination.total,
                    "page": page,
                    "per_page": limit,
                    "pages": pagination.pages,
                },
                "summary": {
                    "total_amount": round(total_amount, 2),
                    "by_status": [{"status": k, "amount": round(v, 2)} for k, v in sorted(by_status.items())],
                    "by_doc_type": [{"doc_type": k, "amount": round(v, 2)} for k, v in sorted(by_type.items())],
                    "by_payment_status": [
                        {"payment_status": k, "amount": round(v, 2)} for k, v in sorted(by_payment_status.items())
                    ],
                },
            }
        ),
        200,
    )


@accounting_bp.route("/documents", methods=["POST"])
def create_document():
    data = request.get_json() or {}
    lead_id = int(data.get("lead_id") or 0)
    _ensure_lead(lead_id)

    doc_type = _validate_enum("doc_type", data.get("doc_type"), DOCUMENT_TYPES, DOCUMENT_TYPES[0])
    doc_date = _parse_date(data.get("doc_date")) or date.today()
    signed_date = _parse_date(data.get("signed_date"))
    due_date = _parse_date(data.get("due_date"))
    status = _validate_enum("status", data.get("status"), DOCUMENT_STATUS, "draft")
    payment_status = _validate_enum("payment_status", data.get("payment_status"), PAYMENT_STATUS, "unpaid")
    payment_method = _validate_enum("payment_method", data.get("payment_method"), PAYMENT_METHODS, "cash")

    subtotal_amount = _to_float(data.get("subtotal_amount"), 0)
    tax_amount = _to_float(data.get("tax_amount"), 0)
    amount = _to_float(data.get("amount"), subtotal_amount + tax_amount)
    if amount < 0:
        abort(400, description="amount must be >= 0")

    doc_no = _clean_text(data.get("doc_no")) or _build_doc_no(lead_id, doc_type, doc_date)

    doc = AccountingDocument.create_item(
        {
            "lead_id": lead_id,
            "doc_no": doc_no,
            "doc_type": doc_type,
            "doc_date": doc_date,
            "signed_date": signed_date,
            "due_date": due_date,
            "partner_name": _clean_text(data.get("partner_name")),
            "project_name": _clean_text(data.get("project_name")),
            "material_name": _clean_text(data.get("material_name")),
            "amount": amount,
            "subtotal_amount": subtotal_amount,
            "tax_amount": tax_amount,
            "payment_status": payment_status,
            "payment_method": payment_method,
            "currency": _clean_text(data.get("currency")) or "VND",
            "status": status,
            "content": _clean_text(data.get("content")),
            "attachments": _parse_attachments(data),
            "tags": data.get("tags") if isinstance(data.get("tags"), list) else [],
        }
    )
    _sync_legacy_document_to_center(doc)
    db.session.commit()
    return jsonify(doc.tdict()), 201


@accounting_bp.route("/documents/<string:doc_id>", methods=["PUT"])
def update_document(doc_id):
    data = request.get_json() or {}
    doc = db.session.get(AccountingDocument, doc_id)
    if not doc:
        abort(404, description="Document not found")

    if data.get("doc_no") is not None:
        doc.doc_no = _clean_text(data.get("doc_no"))
    if data.get("doc_type") is not None:
        doc.doc_type = _validate_enum("doc_type", data.get("doc_type"), DOCUMENT_TYPES, doc.doc_type or DOCUMENT_TYPES[0])
    if data.get("doc_date") is not None:
        parsed = _parse_date(data.get("doc_date"))
        if parsed:
            doc.doc_date = parsed
    if data.get("signed_date") is not None:
        doc.signed_date = _parse_date(data.get("signed_date"))
    if data.get("due_date") is not None:
        doc.due_date = _parse_date(data.get("due_date"))
    if data.get("partner_name") is not None:
        doc.partner_name = _clean_text(data.get("partner_name"))
    if data.get("project_name") is not None:
        doc.project_name = _clean_text(data.get("project_name"))
    if data.get("material_name") is not None:
        doc.material_name = _clean_text(data.get("material_name"))
    if data.get("subtotal_amount") is not None:
        doc.subtotal_amount = _to_float(data.get("subtotal_amount"), 0)
    if data.get("tax_amount") is not None:
        doc.tax_amount = _to_float(data.get("tax_amount"), 0)
    if data.get("amount") is not None:
        amount = _to_float(data.get("amount"), 0)
        if amount < 0:
            abort(400, description="amount must be >= 0")
        doc.amount = amount
    else:
        doc.amount = _to_float(doc.subtotal_amount, 0) + _to_float(doc.tax_amount, 0)
    if data.get("status") is not None:
        doc.status = _validate_enum("status", data.get("status"), DOCUMENT_STATUS, doc.status or "draft")
    if data.get("payment_status") is not None:
        doc.payment_status = _validate_enum(
            "payment_status", data.get("payment_status"), PAYMENT_STATUS, doc.payment_status or "unpaid"
        )
    if data.get("payment_method") is not None:
        doc.payment_method = _validate_enum(
            "payment_method", data.get("payment_method"), PAYMENT_METHODS, doc.payment_method or "cash"
        )
    if data.get("currency") is not None:
        doc.currency = _clean_text(data.get("currency")) or "VND"
    if data.get("content") is not None:
        doc.content = _clean_text(data.get("content"))
    if data.get("attachments") is not None:
        doc.attachments = _parse_attachments(data)
    if data.get("tags") is not None:
        doc.tags = data.get("tags") if isinstance(data.get("tags"), list) else []

    _sync_legacy_document_to_center(doc)
    db.session.commit()
    return jsonify(doc.tdict()), 200


@accounting_bp.route("/documents/<string:doc_id>", methods=["DELETE"])
def delete_document(doc_id):
    doc = db.session.get(AccountingDocument, doc_id)
    if not doc:
        abort(404, description="Document not found")
    _soft_delete_synced_center_document(doc.id)
    db.session.delete(doc)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200


@accounting_bp.route("/material-suggest", methods=["GET"])
def get_material_suggest():
    lead_id = request.args.get("lead", 0, type=int)
    _ensure_lead(lead_id)
    query_text = (request.args.get("q", "", type=str) or "").strip().lower()
    limit = request.args.get("limit", 20, type=int)

    names = set()
    material_query = Material.query.filter(Material.lead_id == lead_id)
    for item in material_query.limit(300).all():
        if item.name:
            names.add(item.name.strip())

    for item in (
        AccountingDocument.query.filter(AccountingDocument.lead_id == lead_id)
        .order_by(AccountingDocument.updatedAt.desc())
        .limit(300)
        .all()
    ):
        if item.material_name:
            names.add(item.material_name.strip())

    for item in (
        AccountingDailyCash.query.filter(AccountingDailyCash.lead_id == lead_id)
        .order_by(AccountingDailyCash.updatedAt.desc())
        .limit(300)
        .all()
    ):
        if item.material_name:
            names.add(item.material_name.strip())

    rows = sorted(list(names))
    if query_text:
        rows = [name for name in rows if query_text in name.lower()]
    rows = rows[: max(1, min(limit, 100))]
    return jsonify({"data": [{"value": name} for name in rows]}), 200


@accounting_bp.route("/upload", methods=["POST"])
def upload_document_file():
    file = request.files.get("file")
    if not file:
        abort(400, description="File is required")

    filename, _filepath, thumb_url = upload_a_file_to_vps(file)
    return (
        jsonify(
            {
                "filename": filename,
                "file_url": filename,
                "thumb_url": thumb_url,
            }
        ),
        200,
    )
