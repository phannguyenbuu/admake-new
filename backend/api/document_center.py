from datetime import date, datetime

from flask import Blueprint, abort, jsonify, request
from sqlalchemy import func, or_

from models import (
    DocumentCenterAttachment,
    DocumentCenterAuditLog,
    DocumentCenterDocument,
    DocumentCenterLink,
    LeadPayload,
    db,
    generate_datetime_id,
)


document_center_bp = Blueprint("document_center", __name__, url_prefix="/api/documents")

DOCUMENT_TYPES = [
    "QUOTE",
    "CONTRACT",
    "CONTRACT_LABOR",
    "CONTRACT_ECONOMIC",
    "CONTRACT_COOPERATION",
    "CONTRACT_APPENDIX",
    "ADVANCE_REQUEST",
    "ADVANCE_PAYMENT",
    "ADVANCE_SETTLEMENT",
    "ACCEPTANCE",
    "HANDOVER",
    "PAYMENT_REQUEST",
    "RECEIPT",
    "PAYMENT",
    "INVOICE_IN",
    "INVOICE_OUT",
    "LIQUIDATION",
    "PURCHASE_ORDER",
    "DELIVERY_NOTE",
    "OTHER",
]

WORKFLOW_STATUSES = [
    "draft",
    "submitted",
    "approved",
    "paid",
    "invoiced",
    "closed",
    "cancelled",
]

WORKFLOW_TRANSITIONS = {
    "draft": {"submitted", "cancelled"},
    "submitted": {"approved", "cancelled"},
    "approved": {"paid", "invoiced", "closed", "cancelled"},
    "paid": {"closed", "cancelled"},
    "invoiced": {"closed", "cancelled"},
    "closed": set(),
    "cancelled": set(),
}

TYPE_PREFIX = {
    "QUOTE": "QT",
    "CONTRACT": "CT",
    "CONTRACT_LABOR": "CLD",
    "CONTRACT_ECONOMIC": "CKT",
    "CONTRACT_COOPERATION": "CHT",
    "CONTRACT_APPENDIX": "PL",
    "ADVANCE_REQUEST": "AR",
    "ADVANCE_PAYMENT": "AP",
    "ADVANCE_SETTLEMENT": "AS",
    "ACCEPTANCE": "AC",
    "HANDOVER": "HO",
    "PAYMENT_REQUEST": "PR",
    "RECEIPT": "RC",
    "PAYMENT": "PM",
    "INVOICE_IN": "IIN",
    "INVOICE_OUT": "IOU",
    "LIQUIDATION": "LQ",
    "PURCHASE_ORDER": "PO",
    "DELIVERY_NOTE": "DN",
    "OTHER": "DOC",
}

SORT_FIELDS = {
    "docDate": DocumentCenterDocument.docDate,
    "updatedAt": DocumentCenterDocument.updatedAt,
    "createdAt": DocumentCenterDocument.createdAt,
    "amount": DocumentCenterDocument.amount,
    "code": DocumentCenterDocument.code,
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


def _ensure_lead(lead_id: int):
    lead = LeadPayload.query.filter(LeadPayload.id == lead_id, LeadPayload.deletedAt.is_(None)).first()
    if not lead:
        abort(404, description="Lead not found")
    return lead


def _clean_text(value):
    if value is None:
        return None
    text = str(value).strip()
    return text if text else None


def _parse_paging():
    page = max(1, request.args.get("page", 1, type=int))
    page_size = request.args.get("pageSize", type=int)
    if page_size is None:
        page_size = request.args.get("limit", 20, type=int)
    page_size = max(1, min(page_size, 200))
    return page, page_size


def _parse_sort():
    sort_raw = (request.args.get("sort", "-docDate") or "").strip()
    direction = "desc" if sort_raw.startswith("-") else "asc"
    field_name = sort_raw[1:] if sort_raw.startswith("-") else sort_raw
    field = SORT_FIELDS.get(field_name, DocumentCenterDocument.docDate)
    return field.desc() if direction == "desc" else field.asc()


def _validate_type(doc_type: str):
    candidate = (doc_type or "").strip()
    if candidate not in DOCUMENT_TYPES:
        abort(400, description=f"Invalid type: {candidate}")
    return candidate


def _validate_status(status: str):
    candidate = (status or "").strip().lower()
    if candidate not in WORKFLOW_STATUSES:
        abort(400, description=f"Invalid status: {candidate}")
    return candidate


def _build_document_code(lead_id: int, doc_type: str, doc_date: date):
    prefix = TYPE_PREFIX.get(doc_type, "DOC")
    month_key = doc_date.strftime("%Y%m")
    code_prefix = f"{prefix}-{month_key}"
    existing = (
        DocumentCenterDocument.query.filter(
            DocumentCenterDocument.lead_id == lead_id,
            DocumentCenterDocument.code.ilike(f"{code_prefix}-%"),
        )
        .order_by(DocumentCenterDocument.code.desc())
        .first()
    )
    seq = 1
    if existing and existing.code:
        try:
            seq = int(existing.code.split("-")[-1]) + 1
        except Exception:
            seq = 1
    return f"{code_prefix}-{seq:04d}"


def is_valid_transition(from_status: str, to_status: str) -> bool:
    return to_status in WORKFLOW_TRANSITIONS.get((from_status or "").strip(), set())


def _apply_filters(query):
    doc_type = _clean_text(request.args.get("type"))
    status = _clean_text(request.args.get("status"))
    partner_id = _clean_text(request.args.get("partnerId"))
    project_id = _clean_text(request.args.get("projectId"))
    query_text = _clean_text(request.args.get("q"))
    from_date = _parse_date(request.args.get("from"))
    to_date = _parse_date(request.args.get("to"))

    if doc_type:
        query = query.filter(DocumentCenterDocument.type == doc_type)
    if status:
        query = query.filter(DocumentCenterDocument.status == status)
    if partner_id:
        query = query.filter(DocumentCenterDocument.partnerId == partner_id)
    if project_id:
        query = query.filter(DocumentCenterDocument.projectId == project_id)
    if from_date:
        query = query.filter(DocumentCenterDocument.docDate >= from_date)
    if to_date:
        query = query.filter(DocumentCenterDocument.docDate <= to_date)
    if query_text:
        keyword = f"%{query_text}%"
        query = query.filter(
            or_(
                DocumentCenterDocument.code.ilike(keyword),
                DocumentCenterDocument.partnerName.ilike(keyword),
                DocumentCenterDocument.projectName.ilike(keyword),
                DocumentCenterDocument.description.ilike(keyword),
                DocumentCenterDocument.note.ilike(keyword),
            )
        )
    return query


def _log_audit(document_id: str, action: str, from_status=None, to_status=None, payload=None):
    actor_id = request.headers.get("X-User-Id") or request.headers.get("X-Actor-Id")
    actor_name = request.headers.get("X-User-Name") or request.headers.get("X-Actor-Name")
    audit = DocumentCenterAuditLog(
        id=generate_datetime_id(),
        document_id=document_id,
        action=action,
        from_status=from_status,
        to_status=to_status,
        actor_id=actor_id,
        actor_name=actor_name,
        payload=payload or {},
    )
    db.session.add(audit)


def _serialize_document(doc: DocumentCenterDocument):
    return doc.tdict(include_attachments=True, include_links=True, include_audit=True)


@document_center_bp.route("/metadata", methods=["GET"])
def get_document_center_metadata():
    return jsonify({"types": DOCUMENT_TYPES, "statuses": WORKFLOW_STATUSES}), 200


@document_center_bp.route("", methods=["GET"])
@document_center_bp.route("/", methods=["GET"])
def list_documents():
    lead_id = request.args.get("lead", type=int)
    if lead_id is None:
        lead_id = request.args.get("lead_id", 0, type=int)
    _ensure_lead(lead_id)

    page, page_size = _parse_paging()
    order_by = _parse_sort()

    query = DocumentCenterDocument.query.filter(
        DocumentCenterDocument.lead_id == lead_id,
        DocumentCenterDocument.deletedAt.is_(None),
    )
    query = _apply_filters(query)

    paginated = query.order_by(order_by, DocumentCenterDocument.updatedAt.desc()).paginate(
        page=page, per_page=page_size, error_out=False
    )

    doc_ids = [x.id for x in paginated.items]
    attachment_counts = {}
    if doc_ids:
        rows = (
            db.session.query(
                DocumentCenterAttachment.document_id,
                func.count(DocumentCenterAttachment.id),
            )
            .filter(
                DocumentCenterAttachment.document_id.in_(doc_ids),
                DocumentCenterAttachment.deletedAt.is_(None),
            )
            .group_by(DocumentCenterAttachment.document_id)
            .all()
        )
        attachment_counts = {document_id: count for document_id, count in rows}

    rows = []
    for row in paginated.items:
        item = row.tdict()
        item["attachmentCount"] = int(attachment_counts.get(row.id, 0))
        item.pop("legacy_document_id", None)
        rows.append(item)

    return (
        jsonify(
            {
                "data": rows,
                "pagination": {
                    "page": page,
                    "pageSize": page_size,
                    "total": paginated.total,
                    "totalPages": paginated.pages,
                },
            }
        ),
        200,
    )


@document_center_bp.route("", methods=["POST"])
@document_center_bp.route("/", methods=["POST"])
def create_document():
    data = request.get_json() or {}
    lead_id = int(data.get("lead_id") or data.get("lead") or 0)
    _ensure_lead(lead_id)

    doc_type = _validate_type(data.get("type") or "OTHER")
    doc_date = _parse_date(data.get("docDate")) or date.today()

    provided_code = _clean_text(data.get("code"))
    code = provided_code or _build_document_code(lead_id, doc_type, doc_date)

    if (
        DocumentCenterDocument.query.filter(
            DocumentCenterDocument.lead_id == lead_id,
            DocumentCenterDocument.code == code,
            DocumentCenterDocument.deletedAt.is_(None),
        )
        .limit(1)
        .first()
    ):
        abort(409, description="Document code already exists")

    doc = DocumentCenterDocument(
        id=generate_datetime_id(),
        lead_id=lead_id,
        code=code,
        type=doc_type,
        docDate=doc_date,
        partnerId=_clean_text(data.get("partnerId")),
        partnerName=_clean_text(data.get("partnerName")),
        projectId=_clean_text(data.get("projectId")),
        projectName=_clean_text(data.get("projectName")),
        taskId=_clean_text(data.get("taskId")),
        amount=_to_float(data.get("amount"), 0),
        currency=_clean_text(data.get("currency")) or "VND",
        status=_validate_status(data.get("status") or "draft"),
        description=_clean_text(data.get("description")),
        note=_clean_text(data.get("note")),
        tags=data.get("tags") if isinstance(data.get("tags"), list) else [],
        createdBy=_clean_text(data.get("createdBy")),
        approvedBy=_clean_text(data.get("approvedBy")),
    )

    db.session.add(doc)

    attachment_ids = data.get("attachmentIds") if isinstance(data.get("attachmentIds"), list) else []
    if attachment_ids:
        attachments = DocumentCenterAttachment.query.filter(DocumentCenterAttachment.id.in_(attachment_ids)).all()
        for att in attachments:
            att.document_id = doc.id

    _log_audit(doc.id, "create", to_status=doc.status, payload={"code": code, "type": doc.type})
    db.session.commit()
    return jsonify(_serialize_document(doc)), 201


@document_center_bp.route("/<string:document_id>", methods=["GET"])
def get_document_detail(document_id):
    doc = DocumentCenterDocument.query.filter(
        DocumentCenterDocument.id == document_id, DocumentCenterDocument.deletedAt.is_(None)
    ).first()
    if not doc:
        abort(404, description="Document not found")
    return jsonify(_serialize_document(doc)), 200


@document_center_bp.route("/<string:document_id>", methods=["PATCH"])
def update_document(document_id):
    doc = DocumentCenterDocument.query.filter(
        DocumentCenterDocument.id == document_id, DocumentCenterDocument.deletedAt.is_(None)
    ).first()
    if not doc:
        abort(404, description="Document not found")

    data = request.get_json() or {}

    if data.get("type") is not None:
        doc.type = _validate_type(data.get("type"))
    if data.get("docDate") is not None:
        parsed = _parse_date(data.get("docDate"))
        if not parsed:
            abort(400, description="Invalid docDate")
        doc.docDate = parsed
    if data.get("code") is not None:
        new_code = _clean_text(data.get("code"))
        if not new_code:
            abort(400, description="code is required")
        duplicate = (
            DocumentCenterDocument.query.filter(
                DocumentCenterDocument.lead_id == doc.lead_id,
                DocumentCenterDocument.code == new_code,
                DocumentCenterDocument.id != doc.id,
                DocumentCenterDocument.deletedAt.is_(None),
            )
            .limit(1)
            .first()
        )
        if duplicate:
            abort(409, description="Document code already exists")
        doc.code = new_code

    if data.get("partnerId") is not None:
        doc.partnerId = _clean_text(data.get("partnerId"))
    if data.get("partnerName") is not None:
        doc.partnerName = _clean_text(data.get("partnerName"))
    if data.get("projectId") is not None:
        doc.projectId = _clean_text(data.get("projectId"))
    if data.get("projectName") is not None:
        doc.projectName = _clean_text(data.get("projectName"))
    if data.get("taskId") is not None:
        doc.taskId = _clean_text(data.get("taskId"))
    if data.get("amount") is not None:
        doc.amount = _to_float(data.get("amount"), 0)
    if data.get("currency") is not None:
        doc.currency = _clean_text(data.get("currency")) or "VND"
    if data.get("description") is not None:
        doc.description = _clean_text(data.get("description"))
    if data.get("note") is not None:
        doc.note = _clean_text(data.get("note"))
    if data.get("tags") is not None:
        doc.tags = data.get("tags") if isinstance(data.get("tags"), list) else []

    _log_audit(doc.id, "update", from_status=doc.status, to_status=doc.status, payload=data)
    db.session.commit()
    return jsonify(_serialize_document(doc)), 200


@document_center_bp.route("/<string:document_id>/attachments", methods=["POST"])
def attach_attachments(document_id):
    doc = DocumentCenterDocument.query.filter(
        DocumentCenterDocument.id == document_id, DocumentCenterDocument.deletedAt.is_(None)
    ).first()
    if not doc:
        abort(404, description="Document not found")

    data = request.get_json() or {}
    attachment_ids = data.get("attachmentIds") if isinstance(data.get("attachmentIds"), list) else []
    if not attachment_ids:
        abort(400, description="attachmentIds is required")

    attachments = DocumentCenterAttachment.query.filter(DocumentCenterAttachment.id.in_(attachment_ids)).all()
    for att in attachments:
        att.document_id = doc.id

    _log_audit(doc.id, "attach", payload={"attachmentIds": attachment_ids})
    db.session.commit()
    return jsonify({"message": "Attached", "count": len(attachments)}), 200


@document_center_bp.route("/<string:document_id>/attachments/<string:attachment_id>", methods=["DELETE"])
def detach_attachment(document_id, attachment_id):
    doc = DocumentCenterDocument.query.filter(
        DocumentCenterDocument.id == document_id, DocumentCenterDocument.deletedAt.is_(None)
    ).first()
    if not doc:
        abort(404, description="Document not found")

    att = DocumentCenterAttachment.query.filter(
        DocumentCenterAttachment.id == attachment_id,
        DocumentCenterAttachment.document_id == document_id,
        DocumentCenterAttachment.deletedAt.is_(None),
    ).first()
    if not att:
        abort(404, description="Attachment not found")

    att.document_id = None
    _log_audit(doc.id, "detach", payload={"attachmentId": attachment_id})
    db.session.commit()
    return jsonify({"message": "Detached"}), 200


@document_center_bp.route("/<string:document_id>/links", methods=["POST"])
def add_link(document_id):
    doc = DocumentCenterDocument.query.filter(
        DocumentCenterDocument.id == document_id, DocumentCenterDocument.deletedAt.is_(None)
    ).first()
    if not doc:
        abort(404, description="Document not found")

    data = request.get_json() or {}
    link = DocumentCenterLink(
        id=generate_datetime_id(),
        document_id=document_id,
        linked_document_id=_clean_text(data.get("linkedDocumentId")),
        link_type=_clean_text(data.get("linkType")),
        note=_clean_text(data.get("note")),
    )
    db.session.add(link)
    _log_audit(doc.id, "link", payload=data)
    db.session.commit()
    return jsonify(link.tdict()), 201


def _transition_document(document_id: str, to_status: str):
    doc = DocumentCenterDocument.query.filter(
        DocumentCenterDocument.id == document_id, DocumentCenterDocument.deletedAt.is_(None)
    ).first()
    if not doc:
        abort(404, description="Document not found")

    from_status = (doc.status or "").strip()
    if not is_valid_transition(from_status, to_status):
        abort(400, description=f"Invalid transition: {from_status} -> {to_status}")

    doc.status = to_status
    if to_status == "approved":
        actor_id = request.headers.get("X-User-Id") or request.headers.get("X-Actor-Id")
        doc.approvedBy = actor_id or doc.approvedBy

    payload = request.get_json(silent=True) or {}
    _log_audit(
        doc.id,
        action=f"transition:{to_status}",
        from_status=from_status,
        to_status=to_status,
        payload=payload,
    )
    db.session.commit()
    return jsonify(_serialize_document(doc)), 200


@document_center_bp.route("/<string:document_id>/submit", methods=["POST"])
def submit_document(document_id):
    return _transition_document(document_id, "submitted")


@document_center_bp.route("/<string:document_id>/approve", methods=["POST"])
def approve_document(document_id):
    return _transition_document(document_id, "approved")


@document_center_bp.route("/<string:document_id>/cancel", methods=["POST"])
def cancel_document(document_id):
    return _transition_document(document_id, "cancelled")
