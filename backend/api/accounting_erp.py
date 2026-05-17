from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, timedelta

from flask import Blueprint, abort, jsonify, request, g
from sqlalchemy import and_, func, or_

from models import (
    APBill,
    APBillPayment,
    ARInvoice,
    ARInvoicePayment,
    AccountingDailyCash,
    AccountingLink,
    AccountingPeriod,
    AccountingRecord,
    ChartOfAccount,
    FixedAsset,
    FixedAssetDepreciation,
    FixedAssetEvent,
    JournalEntry,
    JournalEntryLine,
    LeadPayload,
    TaxCode,
    User,
    db,
    generate_datetime_id,
)
from permission_utils import ensure_resource_lead, require_can_view


accounting_erp_bp = Blueprint("accounting_erp", __name__, url_prefix="/api/accounting")


def _permission_for_accounting_erp_request():
    path = (request.path or "").rstrip("/")
    if "/ar-invoices" in path or path.endswith("/ar-aging") or path.endswith("/ar-statement"):
        return "view_acc_ar"
    if "/ap-bills" in path or path.endswith("/ap-aging") or path.endswith("/ap-statement"):
        return "view_acc_ap"
    if "/journal-entries" in path or path.endswith("/ledger") or path.endswith("/trial-balance"):
        return "view_acc_ledger"
    if "/reports/" in path:
        return "view_acc_reports"
    if path.endswith("/vat-report"):
        return "view_acc_tax"
    if "/fixed-assets" in path or path.endswith("/people-list"):
        return "view_acc_assets"
    if "/records" in path:
        return "view_acc_records"
    return "view_accountant"


@accounting_erp_bp.before_request
def guard_accounting_erp_permission():
    actor, _ = require_can_view(_permission_for_accounting_erp_request())
    g.permission_actor = actor

    view_args = request.view_args or {}
    resource_checks = (
        ("invoice_id", ARInvoice, "accounts receivable invoice"),
        ("bill_id", APBill, "accounts payable bill"),
        ("entry_id", JournalEntry, "journal entry"),
        ("asset_id", FixedAsset, "fixed asset"),
        ("record_id", AccountingRecord, "accounting record"),
    )
    for arg_name, model, resource_name in resource_checks:
        resource_id = view_args.get(arg_name)
        if not resource_id:
            continue
        resource = db.session.get(model, resource_id)
        if resource:
            ensure_resource_lead(resource, actor, resource_name)
        break

AR_STATUS = ["draft", "confirmed", "partially_paid", "paid", "overdue", "cancelled"]
AP_STATUS = ["draft", "confirmed", "partially_paid", "paid", "overdue", "cancelled"]
ENTRY_STATUS = ["draft", "posted", "reversed"]
PERIOD_STATUS = ["open", "closed"]
FA_STATUS = ["active", "paused", "maintenance", "repair", "pending_disposal", "disposed"]
PAYMENT_METHODS = ["cash", "bank_transfer", "card", "other"]
TAX_DIRECTIONS = ["input", "output", "both"]
ACCOUNT_TYPES = ["asset", "liability", "equity", "revenue", "expense"]

DEFAULT_ACCOUNTS = [
    {"code": "111", "name": "Tiền mặt", "account_type": "asset"},
    {"code": "112", "name": "Tiền gửi ngân hàng", "account_type": "asset"},
    {"code": "131", "name": "Phải thu khách hàng", "account_type": "asset"},
    {"code": "133", "name": "Thuế GTGT được khấu trừ", "account_type": "asset"},
    {"code": "154", "name": "Chi phí SXKD dở dang", "account_type": "asset"},
    {"code": "155", "name": "Thành phẩm", "account_type": "asset"},
    {"code": "156", "name": "Hàng hóa", "account_type": "asset"},
    {"code": "211", "name": "Tài sản cố định", "account_type": "asset"},
    {"code": "214", "name": "Hao mòn lũy kế", "account_type": "asset"},
    {"code": "331", "name": "Phải trả nhà cung cấp", "account_type": "liability"},
    {"code": "3331", "name": "Thuế GTGT phải nộp", "account_type": "liability"},
    {"code": "334", "name": "Phải trả người lao động", "account_type": "liability"},
    {"code": "511", "name": "Doanh thu bán hàng", "account_type": "revenue"},
    {"code": "632", "name": "Giá vốn hàng bán", "account_type": "expense"},
    {"code": "622", "name": "Chi phí nhân công trực tiếp", "account_type": "expense"},
    {"code": "627", "name": "Chi phí sản xuất chung", "account_type": "expense"},
    {"code": "641", "name": "Chi phí bán hàng", "account_type": "expense"},
    {"code": "642", "name": "Chi phí quản lý doanh nghiệp", "account_type": "expense"},
]

DEFAULT_TAX_CODES = [
    {"code": "VAT0", "name": "Không chịu thuế / 0%", "rate": 0, "direction": "both", "is_default": True},
    {"code": "VATIN8", "name": "VAT đầu vào 8%", "rate": 8, "direction": "input", "is_default": False},
    {"code": "VATIN10", "name": "VAT đầu vào 10%", "rate": 10, "direction": "input", "is_default": True},
    {"code": "VATOUT8", "name": "VAT đầu ra 8%", "rate": 8, "direction": "output", "is_default": False},
    {"code": "VATOUT10", "name": "VAT đầu ra 10%", "rate": 10, "direction": "output", "is_default": True},
]


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


def _period_bounds(period_key: str):
    start = _parse_date(period_key)
    if not start:
        abort(400, description=f"Invalid period: {period_key}")
    next_month = (start.replace(day=28) + timedelta(days=4)).replace(day=1)
    end = next_month - timedelta(days=1)
    return start, end


def _to_float(value, default=0.0):
    if value is None:
        return default
    try:
        return float(value)
    except Exception:
        return default


def _round_money(value):
    return round(_to_float(value, 0), 2)


def _clean_text(value):
    if value is None:
        return None
    text = str(value).strip()
    return text if text else None


def _sum_ar_invoice_payments(invoice: ARInvoice, payment_type: str | None = None):
    return _round_money(
        sum(
            item.amount or 0
            for item in invoice.payments
            if not item.deletedAt and (payment_type is None or item.payment_type == payment_type)
        )
    )


def _build_ar_invoice_snapshot(invoice: ARInvoice):
    phat_sinh_amount = _sum_ar_invoice_payments(invoice, "phat_sinh")
    tam_ung_amount = _sum_ar_invoice_payments(invoice, "tam_ung")
    tax_rate = _to_float(invoice.tax_rate, 0)
    extra_total_amount = _round_money(phat_sinh_amount * (1 + tax_rate / 100.0))
    effective_total_amount = _round_money((invoice.total_amount or 0) + extra_total_amount)
    balance_amount = _round_money(effective_total_amount - tam_ung_amount)
    return {
        "phat_sinh_amount": phat_sinh_amount,
        "tam_ung_amount": tam_ung_amount,
        "paid_amount": tam_ung_amount,
        "effective_total_amount": effective_total_amount,
        "balance_amount": balance_amount,
    }


def _apply_ar_invoice_snapshot(invoice: ARInvoice):
    snapshot = _build_ar_invoice_snapshot(invoice)
    invoice.paid_amount = snapshot["paid_amount"]
    invoice.balance_amount = snapshot["balance_amount"]
    invoice.status = _recompute_receivable_status(invoice.status, invoice.balance_amount, invoice.due_date, date.today())
    invoice.updated_by = _current_user_id()
    return snapshot


def _enrich_ar_invoice_dict(invoice: ARInvoice, data: dict | None = None):
    snapshot = _build_ar_invoice_snapshot(invoice)
    payload = data or invoice.tdict()
    payload["phat_sinh_amount"] = snapshot["phat_sinh_amount"]
    payload["tam_ung_amount"] = snapshot["tam_ung_amount"]
    payload["paid_amount"] = snapshot["paid_amount"]
    payload["effective_total_amount"] = snapshot["effective_total_amount"]
    payload["balance_amount"] = snapshot["balance_amount"]
    return payload


def _refresh_ar_invoice_metrics(lead_id: int):
    rows = ARInvoice.query.filter(ARInvoice.deletedAt.is_(None), ARInvoice.lead_id == lead_id).all()
    changed = False
    for row in rows:
        snapshot = _build_ar_invoice_snapshot(row)
        next_status = _recompute_receivable_status(row.status, snapshot["balance_amount"], row.due_date, date.today())
        if (
            _round_money(row.paid_amount or 0) != snapshot["paid_amount"]
            or _round_money(row.balance_amount or 0) != snapshot["balance_amount"]
            or row.status != next_status
        ):
            row.paid_amount = snapshot["paid_amount"]
            row.balance_amount = snapshot["balance_amount"]
            row.status = next_status
            changed = True
    if changed:
        db.session.commit()


def _sync_ar_payment_links(payment: ARInvoicePayment, invoice: ARInvoice):
    if payment.daily_cash_id:
        cash_row = db.session.get(AccountingDailyCash, payment.daily_cash_id)
        if cash_row and not cash_row.deletedAt:
            cash_row.txn_date = payment.payment_date
            cash_row.amount = payment.amount
            cash_row.counterparty_name = invoice.customer_name
            cash_row.payment_method = payment.payment_method
            cash_row.doc_ref = invoice.code
            cash_row.note = payment.note
    if payment.journal_entry_id:
        entry = db.session.get(JournalEntry, payment.journal_entry_id)
        if entry and not entry.deletedAt:
            entry.entry_date = payment.payment_date
            entry.reference_no = invoice.code
            entry.description = f"Thu tien cong no {invoice.code}"
            entry.updated_by = _current_user_id()
            for line in entry.lines:
                if line.deletedAt:
                    continue
                if _round_money(line.debit or 0) > 0:
                    line.debit = payment.amount
                    line.credit = 0
                elif _round_money(line.credit or 0) > 0:
                    line.debit = 0
                    line.credit = payment.amount


def _soft_delete_ar_payment_links(payment: ARInvoicePayment):
    deleted_at = datetime.utcnow()
    if payment.daily_cash_id:
        cash_row = db.session.get(AccountingDailyCash, payment.daily_cash_id)
        if cash_row and not cash_row.deletedAt:
            cash_row.deletedAt = deleted_at
    if payment.journal_entry_id:
        entry = db.session.get(JournalEntry, payment.journal_entry_id)
        if entry and not entry.deletedAt:
            entry.deletedAt = deleted_at
            entry.updated_by = _current_user_id()
            for line in entry.lines:
                if not line.deletedAt:
                    line.deletedAt = deleted_at


def _require_lead(lead_id: int):
    lead = db.session.get(LeadPayload, lead_id)
    if not lead or lead.deletedAt:
        abort(404, description="Lead not found")
    return lead


def _current_user_id():
    return request.headers.get("X-User-Id") or request.headers.get("X-Actor-Id") or None


def _validate_enum(name: str, value: str | None, allowed: list[str], default_value: str):
    candidate = (value or default_value).strip()
    if candidate not in allowed:
        abort(400, description=f"Invalid {name}: {candidate}")
    return candidate


def _tax_amount(base_amount: float, tax_rate: float):
    return _round_money(base_amount * tax_rate / 100.0)


def validate_journal_balance(lines: list[dict]):
    debit = _round_money(sum(_to_float(item.get("debit"), 0) for item in lines))
    credit = _round_money(sum(_to_float(item.get("credit"), 0) for item in lines))
    if debit <= 0 and credit <= 0:
        abort(400, description="Journal entry lines are empty")
    if debit != credit:
        abort(400, description=f"Journal entry is unbalanced: debit={debit}, credit={credit}")
    return debit, credit


def compute_aging_bucket(balance_amount: float, due_date_value: date | None, as_of: date):
    if balance_amount <= 0:
        return "paid"
    if not due_date_value or due_date_value >= as_of:
        return "current"
    days = (as_of - due_date_value).days
    if days <= 30:
        return "1_30"
    if days <= 60:
        return "31_60"
    if days <= 90:
        return "61_90"
    return "90_plus"


def _recompute_receivable_status(current_status: str, balance_amount: float, due_date_value: date | None, as_of: date):
    if current_status == "cancelled":
        return "cancelled"
    if balance_amount <= 0:
        return "paid"
    if due_date_value and due_date_value < as_of:
        return "overdue"
    return "partially_paid" if current_status in {"partially_paid", "paid", "overdue"} else "confirmed"


def _recompute_payable_status(current_status: str, balance_amount: float, due_date_value: date | None, as_of: date):
    return _recompute_receivable_status(current_status, balance_amount, due_date_value, as_of)


def _build_running_code(model, lead_id: int, prefix: str, date_value: date):
    month_key = date_value.strftime("%Y%m")
    code_prefix = f"{prefix}-{month_key}"
    existing = (
        model.query.filter(model.lead_id == lead_id, model.code.ilike(f"{code_prefix}-%"))
        .order_by(model.code.desc())
        .first()
    )
    seq = 1
    if existing and existing.code:
        try:
            seq = int(existing.code.split("-")[-1]) + 1
        except Exception:
            seq = 1
    return f"{code_prefix}-{seq:04d}"


def _build_entry_no(lead_id: int, entry_date: date):
    month_key = entry_date.strftime("%Y%m")
    prefix = f"JE-{month_key}"
    existing = (
        JournalEntry.query.filter(JournalEntry.lead_id == lead_id, JournalEntry.entry_no.ilike(f"{prefix}-%"))
        .order_by(JournalEntry.entry_no.desc())
        .first()
    )
    seq = 1
    if existing and existing.entry_no:
        try:
            seq = int(existing.entry_no.split("-")[-1]) + 1
        except Exception:
            seq = 1
    return f"{prefix}-{seq:04d}"


def _build_cash_voucher_no(lead_id: int, txn_date: date):
    date_key = txn_date.strftime("%Y%m%d")
    prefix = f"TC-{date_key}"
    existing = (
        AccountingDailyCash.query.filter(
            AccountingDailyCash.lead_id == lead_id,
            AccountingDailyCash.voucher_no.ilike(f"{prefix}-%"),
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


def _ensure_accounting_setup(lead_id: int):
    existing_accounts = {
        row.code
        for row in ChartOfAccount.query.filter(ChartOfAccount.deletedAt.is_(None), ChartOfAccount.lead_id == lead_id).all()
    }
    for item in DEFAULT_ACCOUNTS:
        if item["code"] in existing_accounts:
            continue
        db.session.add(
            ChartOfAccount(
                id=generate_datetime_id(),
                lead_id=lead_id,
                code=item["code"],
                name=item["name"],
                account_type=item["account_type"],
                status="active",
                allow_posting=True,
            )
        )

    existing_tax_codes = {
        row.code
        for row in TaxCode.query.filter(TaxCode.deletedAt.is_(None), TaxCode.lead_id == lead_id).all()
    }
    for item in DEFAULT_TAX_CODES:
        if item["code"] in existing_tax_codes:
            continue
        db.session.add(
            TaxCode(
                id=generate_datetime_id(),
                lead_id=lead_id,
                code=item["code"],
                name=item["name"],
                rate=item["rate"],
                direction=item["direction"],
                is_default=item["is_default"],
                status="active",
            )
        )
    db.session.flush()


def _find_account(lead_id: int, code: str):
    account = ChartOfAccount.query.filter(
        ChartOfAccount.deletedAt.is_(None),
        ChartOfAccount.lead_id == lead_id,
        ChartOfAccount.code == code,
    ).first()
    if not account:
        abort(400, description=f"Account not found: {code}")
    return account


def _find_tax_code(lead_id: int, tax_code_id: str | None, fallback_direction="both"):
    if tax_code_id:
        tax_code = TaxCode.query.filter(
            TaxCode.deletedAt.is_(None),
            TaxCode.lead_id == lead_id,
            TaxCode.id == tax_code_id,
        ).first()
        if not tax_code:
            abort(400, description="Tax code not found")
        return tax_code
    return TaxCode.query.filter(
        TaxCode.deletedAt.is_(None),
        TaxCode.lead_id == lead_id,
        TaxCode.is_default.is_(True),
        or_(TaxCode.direction == fallback_direction, TaxCode.direction == "both"),
    ).first()


def _ensure_period_open(lead_id: int, entry_date: date):
    period_key = entry_date.strftime("%Y-%m")
    period = AccountingPeriod.query.filter_by(lead_id=lead_id, period_key=period_key).first()
    if period and period.status == "closed":
        abort(400, description=f"Accounting period is closed: {period_key}")
    return period


def _upsert_link(lead_id: int, source_type: str, source_id: str, target_type: str, target_id: str, note=None):
    existing = AccountingLink.query.filter_by(
        lead_id=lead_id,
        source_type=source_type,
        source_id=source_id,
        target_type=target_type,
        target_id=target_id,
    ).first()
    if existing:
        if note is not None:
            existing.note = note
        return existing
    link = AccountingLink(
        id=generate_datetime_id(),
        lead_id=lead_id,
        source_type=source_type,
        source_id=source_id,
        target_type=target_type,
        target_id=target_id,
        note=note,
        created_by=_current_user_id(),
        updated_by=_current_user_id(),
    )
    db.session.add(link)
    return link


def _trace_bidirectional(lead_id: int, source_type: str, source_id: str):
    links = AccountingLink.query.filter(
        AccountingLink.lead_id == lead_id,
        AccountingLink.deletedAt.is_(None),
        or_(
            and_(AccountingLink.source_type == source_type, AccountingLink.source_id == source_id),
            and_(AccountingLink.target_type == source_type, AccountingLink.target_id == source_id),
        ),
    ).all()
    return [row.tdict() for row in links]


def _create_journal_entry(
    lead_id: int,
    entry_date: date,
    description: str,
    source_type: str,
    source_id: str,
    reference_no: str | None,
    lines: list[dict],
    status="draft",
):
    _ensure_accounting_setup(lead_id)
    _ensure_period_open(lead_id, entry_date)
    validate_journal_balance(lines)
    entry = JournalEntry(
        id=generate_datetime_id(),
        lead_id=lead_id,
        entry_no=_build_entry_no(lead_id, entry_date),
        entry_date=entry_date,
        doc_date=entry_date,
        description=_clean_text(description),
        source_type=source_type,
        source_id=source_id,
        reference_no=_clean_text(reference_no),
        status=_validate_enum("status", status, ENTRY_STATUS, "draft"),
        posted_at=datetime.utcnow() if status == "posted" else None,
        created_by=_current_user_id(),
        updated_by=_current_user_id(),
    )
    db.session.add(entry)
    db.session.flush()
    for index, item in enumerate(lines, start=1):
        account_code = _clean_text(item.get("account_code"))
        account = _find_account(lead_id, account_code)
        db.session.add(
            JournalEntryLine(
                id=generate_datetime_id(),
                journal_entry_id=entry.id,
                lead_id=lead_id,
                line_no=index,
                account_id=account.id,
                account_code=account.code,
                account_name=account.name,
                partner_type=_clean_text(item.get("partner_type")),
                partner_id=_clean_text(item.get("partner_id")),
                partner_name=_clean_text(item.get("partner_name")),
                description=_clean_text(item.get("description")),
                debit=_round_money(item.get("debit")),
                credit=_round_money(item.get("credit")),
            )
        )
    return entry


def _post_entry(entry: JournalEntry):
    if entry.status == "posted":
        return entry
    if entry.status == "reversed":
        abort(400, description="Cannot post a reversed entry")
    validate_journal_balance([line.tdict() for line in entry.lines if not line.deletedAt])
    entry.status = "posted"
    entry.posted_at = datetime.utcnow()
    entry.updated_by = _current_user_id()
    return entry


def _reverse_entry(entry: JournalEntry, reason: str | None):
    if entry.status != "posted":
        abort(400, description="Only posted entries can be reversed")
    reversal = _create_journal_entry(
        lead_id=entry.lead_id,
        entry_date=date.today(),
        description=f"Reverse {entry.entry_no}: {reason or ''}".strip(),
        source_type="manual",
        source_id=entry.id,
        reference_no=entry.reference_no,
        lines=[
            {
                "account_code": line.account_code,
                "partner_type": line.partner_type,
                "partner_id": line.partner_id,
                "partner_name": line.partner_name,
                "description": f"Reverse line {line.line_no}",
                "debit": line.credit,
                "credit": line.debit,
            }
            for line in entry.lines
            if not line.deletedAt
        ],
        status="posted",
    )
    entry.status = "reversed"
    entry.reversed_entry_id = reversal.id
    _upsert_link(entry.lead_id, "journal_entry", entry.id, "journal_entry", reversal.id, "reversal")
    return reversal


def _cash_account_by_method(method: str):
    return "112" if method == "bank_transfer" else "111"


def _create_daily_cash_row(
    lead_id: int,
    direction: str,
    payment_date: date,
    amount: float,
    counterparty_name: str,
    description: str,
    payment_method: str,
    doc_ref: str,
    source_type: str,
    source_id: str,
):
    row = AccountingDailyCash(
        id=generate_datetime_id(),
        lead_id=lead_id,
        user_id=_current_user_id(),
        txn_date=payment_date,
        voucher_no=_build_cash_voucher_no(lead_id, payment_date),
        direction=direction,
        amount=_round_money(amount),
        description=_clean_text(description),
        counterparty_name=_clean_text(counterparty_name),
        status="paid",
        payment_method=payment_method,
        doc_ref=_clean_text(doc_ref),
        source_type=source_type,
        source_id=source_id,
        account_code=_cash_account_by_method(payment_method),
        note=None,
        attachments=[],
    )
    db.session.add(row)
    db.session.flush()
    return row


def _update_invoice_balances(invoice: ARInvoice):
    _apply_ar_invoice_snapshot(invoice)


def _update_bill_balances(bill: APBill):
    paid_amount = _round_money(sum(item.amount or 0 for item in bill.payments if not item.deletedAt))
    bill.paid_amount = paid_amount
    bill.balance_amount = _round_money((bill.total_amount or 0) - paid_amount)
    bill.status = _recompute_payable_status(bill.status, bill.balance_amount, bill.due_date, date.today())
    bill.updated_by = _current_user_id()


def _generate_ar_confirm_entry(invoice: ARInvoice):
    lines = [
        {
            "account_code": "131",
            "partner_type": "customer",
            "partner_id": invoice.customer_id,
            "partner_name": invoice.customer_name,
            "debit": invoice.total_amount,
            "credit": 0,
        },
        {
            "account_code": "511",
            "partner_type": "customer",
            "partner_id": invoice.customer_id,
            "partner_name": invoice.customer_name,
            "debit": 0,
            "credit": invoice.base_amount,
        },
    ]
    if _round_money(invoice.tax_amount) > 0:
        lines.append(
            {
                "account_code": "3331",
                "partner_type": "customer",
                "partner_id": invoice.customer_id,
                "partner_name": invoice.customer_name,
                "debit": 0,
                "credit": invoice.tax_amount,
            }
        )
    entry = _create_journal_entry(
        lead_id=invoice.lead_id,
        entry_date=invoice.invoice_date,
        description=f"Ghi nhận phải thu {invoice.code}",
        source_type="ar_invoice",
        source_id=invoice.id,
        reference_no=invoice.code,
        lines=lines,
        status="draft",
    )
    invoice.journal_entry_id = entry.id
    _upsert_link(invoice.lead_id, "ar_invoice", invoice.id, "journal_entry", entry.id, "confirm")
    return entry


def _generate_ap_confirm_entry(bill: APBill):
    lines = [
        {
            "account_code": bill.expense_account_code or "642",
            "partner_type": "supplier",
            "partner_id": bill.supplier_id,
            "partner_name": bill.supplier_name,
            "debit": bill.base_amount,
            "credit": 0,
        }
    ]
    if _round_money(bill.tax_amount) > 0:
        lines.append(
            {
                "account_code": "133",
                "partner_type": "supplier",
                "partner_id": bill.supplier_id,
                "partner_name": bill.supplier_name,
                "debit": bill.tax_amount,
                "credit": 0,
            }
        )
    lines.append(
        {
            "account_code": "331",
            "partner_type": "supplier",
            "partner_id": bill.supplier_id,
            "partner_name": bill.supplier_name,
            "debit": 0,
            "credit": bill.total_amount,
        }
    )
    entry = _create_journal_entry(
        lead_id=bill.lead_id,
        entry_date=bill.bill_date,
        description=f"Ghi nhận phải trả {bill.code}",
        source_type="ap_bill",
        source_id=bill.id,
        reference_no=bill.code,
        lines=lines,
        status="draft",
    )
    bill.journal_entry_id = entry.id
    _upsert_link(bill.lead_id, "ap_bill", bill.id, "journal_entry", entry.id, "confirm")
    return entry


def _record_ar_payment(invoice: ARInvoice, payment_date: date, amount: float, payment_method: str, note: str | None, payment_type: str = "phat_sinh"):
    READY_STATUSES = {"confirmed", "partially_paid", "overdue"}
    if invoice.status == "cancelled":
        abort(400, description="Khong the ghi nhan thanh toan cho cong no da huy")
    if payment_type == "phat_sinh":
        if invoice.status not in READY_STATUSES:
            abort(400, description="Cong no chua duoc xac nhan, chi co the them tam ung o trang thai nay")
    if amount <= 0:
        abort(400, description="So tien phai lon hon 0")

    cash_row = None
    entry = None
    if payment_type == "tam_ung":
        snapshot = _build_ar_invoice_snapshot(invoice)
        if amount - snapshot["balance_amount"] > 0.0001:
            abort(400, description="So tien tam ung vuot qua so con phai thu")
        cash_row = _create_daily_cash_row(
            lead_id=invoice.lead_id,
            direction="income",
            payment_date=payment_date,
            amount=amount,
            counterparty_name=invoice.customer_name,
            description=f"Thu tien khach hang {invoice.code}",
            payment_method=payment_method,
            doc_ref=invoice.code,
            source_type="ar_invoice",
            source_id=invoice.id,
        )
        entry = _create_journal_entry(
            lead_id=invoice.lead_id,
            entry_date=payment_date,
            description=f"Thu tien cong no {invoice.code}",
            source_type="ar_payment",
            source_id=invoice.id,
            reference_no=invoice.code,
            lines=[
                {
                    "account_code": _cash_account_by_method(payment_method),
                    "partner_type": "customer",
                    "partner_id": invoice.customer_id,
                    "partner_name": invoice.customer_name,
                    "debit": amount,
                    "credit": 0,
                },
                {
                    "account_code": "131",
                    "partner_type": "customer",
                    "partner_id": invoice.customer_id,
                    "partner_name": invoice.customer_name,
                    "debit": 0,
                    "credit": amount,
                },
            ],
            status="draft",
        )
        cash_row.journal_entry_id = entry.id

    payment = ARInvoicePayment(
        id=generate_datetime_id(),
        invoice_id=invoice.id,
        lead_id=invoice.lead_id,
        payment_date=payment_date,
        amount=amount,
        payment_method=payment_method,
        payment_type=payment_type if payment_type in ("tam_ung", "phat_sinh") else "phat_sinh",
        daily_cash_id=cash_row.id if cash_row else None,
        journal_entry_id=entry.id if entry else None,
        note=_clean_text(note),
        created_by=_current_user_id(),
        updated_by=_current_user_id(),
    )
    db.session.add(payment)
    db.session.flush()
    if cash_row and entry:
        _upsert_link(invoice.lead_id, "ar_invoice", invoice.id, "daily_cash", cash_row.id, "payment")
        _upsert_link(invoice.lead_id, "ar_invoice", invoice.id, "journal_entry", entry.id, "payment")
        _upsert_link(invoice.lead_id, "daily_cash", cash_row.id, "journal_entry", entry.id, "payment_entry")
    _update_invoice_balances(invoice)
    return payment

def _record_ap_payment(bill: APBill, payment_date: date, amount: float, payment_method: str, note: str | None):
    if bill.status not in {"confirmed", "partially_paid", "overdue"}:
        abort(400, description="Bill is not ready for payment")
    if amount <= 0:
        abort(400, description="amount must be > 0")
    if amount - bill.balance_amount > 0.0001:
        abort(400, description="Payment exceeds outstanding balance")
    cash_row = _create_daily_cash_row(
        lead_id=bill.lead_id,
        direction="expense",
        payment_date=payment_date,
        amount=amount,
        counterparty_name=bill.supplier_name,
        description=f"Thanh toán NCC {bill.code}",
        payment_method=payment_method,
        doc_ref=bill.code,
        source_type="ap_bill",
        source_id=bill.id,
    )
    entry = _create_journal_entry(
        lead_id=bill.lead_id,
        entry_date=payment_date,
        description=f"Thanh toán công nợ {bill.code}",
        source_type="ap_payment",
        source_id=bill.id,
        reference_no=bill.code,
        lines=[
            {
                "account_code": "331",
                "partner_type": "supplier",
                "partner_id": bill.supplier_id,
                "partner_name": bill.supplier_name,
                "debit": amount,
                "credit": 0,
            },
            {
                "account_code": _cash_account_by_method(payment_method),
                "partner_type": "supplier",
                "partner_id": bill.supplier_id,
                "partner_name": bill.supplier_name,
                "debit": 0,
                "credit": amount,
            },
        ],
        status="draft",
    )
    cash_row.journal_entry_id = entry.id
    payment = APBillPayment(
        id=generate_datetime_id(),
        bill_id=bill.id,
        lead_id=bill.lead_id,
        payment_date=payment_date,
        amount=amount,
        payment_method=payment_method,
        daily_cash_id=cash_row.id,
        journal_entry_id=entry.id,
        note=_clean_text(note),
        created_by=_current_user_id(),
        updated_by=_current_user_id(),
    )
    db.session.add(payment)
    db.session.flush()
    _upsert_link(bill.lead_id, "ap_bill", bill.id, "daily_cash", cash_row.id, "payment")
    _upsert_link(bill.lead_id, "ap_bill", bill.id, "journal_entry", entry.id, "payment")
    _upsert_link(bill.lead_id, "daily_cash", cash_row.id, "journal_entry", entry.id, "payment_entry")
    _update_bill_balances(bill)
    return payment


def _aging_summary(rows, as_of: date):
    buckets = {"current": 0.0, "1_30": 0.0, "31_60": 0.0, "61_90": 0.0, "90_plus": 0.0}
    for row in rows:
        balance = _round_money(row.balance_amount or 0)
        bucket = compute_aging_bucket(balance, row.due_date, as_of)
        if bucket in buckets:
            buckets[bucket] += balance
    return [{"bucket": key, "amount": _round_money(value)} for key, value in buckets.items()]


def _serialize_entry(entry: JournalEntry | None):
    return entry.tdict(include_lines=True) if entry else None


@accounting_erp_bp.route("/setup/bootstrap", methods=["POST"])
def bootstrap_accounting_setup():
    data = request.get_json() or {}
    lead_id = int(data.get("lead_id") or data.get("lead") or 0)
    _require_lead(lead_id)
    _ensure_accounting_setup(lead_id)
    db.session.commit()
    return jsonify({"message": "Bootstrap completed"}), 200


@accounting_erp_bp.route("/accounts", methods=["GET"])
def list_accounts():
    lead_id = request.args.get("lead", 0, type=int)
    _require_lead(lead_id)
    _ensure_accounting_setup(lead_id)
    db.session.commit()
    rows = (
        ChartOfAccount.query.filter(ChartOfAccount.deletedAt.is_(None), ChartOfAccount.lead_id == lead_id)
        .order_by(ChartOfAccount.code.asc())
        .all()
    )
    return jsonify({"data": [row.tdict() for row in rows]}), 200


@accounting_erp_bp.route("/accounts", methods=["POST"])
def create_account():
    data = request.get_json() or {}
    lead_id = int(data.get("lead_id") or 0)
    _require_lead(lead_id)
    code = _clean_text(data.get("code"))
    name = _clean_text(data.get("name"))
    if not code or not name:
        abort(400, description="code and name are required")
    duplicate = ChartOfAccount.query.filter_by(lead_id=lead_id, code=code).first()
    if duplicate:
        abort(409, description="Account code already exists")
    item = ChartOfAccount(
        id=generate_datetime_id(),
        lead_id=lead_id,
        code=code,
        name=name,
        account_type=_validate_enum("account_type", data.get("account_type"), ACCOUNT_TYPES, "expense"),
        parent_code=_clean_text(data.get("parent_code")),
        allow_posting=bool(data.get("allow_posting", True)),
        status=_clean_text(data.get("status")) or "active",
        created_by=_current_user_id(),
        updated_by=_current_user_id(),
    )
    db.session.add(item)
    db.session.commit()
    return jsonify(item.tdict()), 201


@accounting_erp_bp.route("/accounts/<string:account_id>", methods=["PUT"])
def update_account(account_id):
    item = db.session.get(ChartOfAccount, account_id)
    if not item or item.deletedAt:
        abort(404, description="Account not found")
    data = request.get_json() or {}
    if data.get("name") is not None:
        item.name = _clean_text(data.get("name"))
    if data.get("account_type") is not None:
        item.account_type = _validate_enum("account_type", data.get("account_type"), ACCOUNT_TYPES, item.account_type)
    if data.get("parent_code") is not None:
        item.parent_code = _clean_text(data.get("parent_code"))
    if data.get("allow_posting") is not None:
        item.allow_posting = bool(data.get("allow_posting"))
    if data.get("status") is not None:
        item.status = _clean_text(data.get("status")) or item.status
    item.updated_by = _current_user_id()
    db.session.commit()
    return jsonify(item.tdict()), 200


@accounting_erp_bp.route("/tax-codes", methods=["GET"])
def list_tax_codes():
    lead_id = request.args.get("lead", 0, type=int)
    _require_lead(lead_id)
    _ensure_accounting_setup(lead_id)
    db.session.commit()
    rows = TaxCode.query.filter(TaxCode.deletedAt.is_(None), TaxCode.lead_id == lead_id).order_by(TaxCode.code.asc()).all()
    return jsonify({"data": [row.tdict() for row in rows]}), 200


@accounting_erp_bp.route("/tax-codes", methods=["POST"])
def create_tax_code():
    data = request.get_json() or {}
    lead_id = int(data.get("lead_id") or 0)
    _require_lead(lead_id)
    code = _clean_text(data.get("code"))
    name = _clean_text(data.get("name"))
    if not code or not name:
        abort(400, description="code and name are required")
    duplicate = TaxCode.query.filter_by(lead_id=lead_id, code=code).first()
    if duplicate:
        abort(409, description="Tax code already exists")
    item = TaxCode(
        id=generate_datetime_id(),
        lead_id=lead_id,
        code=code,
        name=name,
        rate=_round_money(data.get("rate")),
        direction=_validate_enum("direction", data.get("direction"), TAX_DIRECTIONS, "both"),
        status=_clean_text(data.get("status")) or "active",
        is_default=bool(data.get("is_default", False)),
        created_by=_current_user_id(),
        updated_by=_current_user_id(),
    )
    db.session.add(item)
    db.session.commit()
    return jsonify(item.tdict()), 201


@accounting_erp_bp.route("/periods", methods=["POST"])
def create_period():
    data = request.get_json() or {}
    lead_id = int(data.get("lead_id") or 0)
    _require_lead(lead_id)
    period_key = _clean_text(data.get("period_key"))
    if not period_key:
        abort(400, description="period_key is required")
    start_date = _parse_date(data.get("start_date"))
    end_date = _parse_date(data.get("end_date"))
    if not start_date or not end_date:
        start_date, end_date = _period_bounds(period_key)
    item = AccountingPeriod.query.filter_by(lead_id=lead_id, period_key=period_key).first()
    if not item:
        item = AccountingPeriod(
            id=generate_datetime_id(),
            lead_id=lead_id,
            period_key=period_key,
            start_date=start_date,
            end_date=end_date,
            status=_validate_enum("status", data.get("status"), PERIOD_STATUS, "open"),
            created_by=_current_user_id(),
            updated_by=_current_user_id(),
        )
        db.session.add(item)
    else:
        item.start_date = start_date
        item.end_date = end_date
        item.status = _validate_enum("status", data.get("status"), PERIOD_STATUS, item.status)
        item.updated_by = _current_user_id()
    db.session.commit()
    return jsonify(item.tdict()), 200


@accounting_erp_bp.route("/ar-invoices", methods=["GET"])
def list_ar_invoices():
    lead_id = request.args.get("lead", 0, type=int)
    _require_lead(lead_id)
    _refresh_ar_invoice_metrics(lead_id)
    page = request.args.get("page", 1, type=int)
    limit = min(request.args.get("limit", 20, type=int), 200)
    status = _clean_text(request.args.get("status"))
    customer_id = _clean_text(request.args.get("customer_id"))
    overdue = request.args.get("overdue")
    from_date = _parse_date(request.args.get("from_date"))
    to_date = _parse_date(request.args.get("to_date"))
    search = _clean_text(request.args.get("search"))
    query = ARInvoice.query.filter(ARInvoice.deletedAt.is_(None), ARInvoice.lead_id == lead_id)
    if status:
        query = query.filter(ARInvoice.status == status)
    if customer_id:
        query = query.filter(ARInvoice.customer_id == customer_id)
    if from_date:
        query = query.filter(ARInvoice.invoice_date >= from_date)
    if to_date:
        query = query.filter(ARInvoice.invoice_date <= to_date)
    if overdue == "true":
        query = query.filter(ARInvoice.balance_amount > 0, ARInvoice.due_date < date.today())
    if overdue == "false":
        query = query.filter(or_(ARInvoice.due_date.is_(None), ARInvoice.due_date >= date.today()))
    if search:
        like = f"%{search}%"
        query = query.filter(or_(ARInvoice.code.ilike(like), ARInvoice.customer_name.ilike(like), ARInvoice.description.ilike(like)))
    pagination = query.order_by(ARInvoice.invoice_date.desc(), ARInvoice.createdAt.desc()).paginate(
        page=page, per_page=limit, error_out=False
    )
    rows = query.all()
    summary = {
        "total_receivable": _round_money(sum(_build_ar_invoice_snapshot(item)["effective_total_amount"] for item in rows)),
        "paid_amount": _round_money(sum(item.paid_amount or 0 for item in rows)),
        "outstanding_amount": _round_money(sum(item.balance_amount or 0 for item in rows)),
        "overdue_amount": _round_money(
            sum((item.balance_amount or 0) for item in rows if item.balance_amount > 0 and item.due_date and item.due_date < date.today())
        ),
    }
    return jsonify({
        "data": [_enrich_ar_invoice_dict(item) for item in pagination.items],
        "pagination": {"page": page, "per_page": limit, "pages": pagination.pages, "total": pagination.total},
        "summary": summary,
    }), 200

@accounting_erp_bp.route("/ar-invoices", methods=["POST"])
def create_ar_invoice():
    data = request.get_json() or {}
    lead_id = int(data.get("lead_id") or 0)
    _require_lead(lead_id)
    _ensure_accounting_setup(lead_id)
    invoice_date = _parse_date(data.get("invoice_date")) or date.today()
    tax_code = _find_tax_code(lead_id, _clean_text(data.get("tax_code_id")), "output")
    base_amount = _round_money(data.get("base_amount"))
    tax_rate = _round_money(data.get("tax_rate") if data.get("tax_rate") is not None else getattr(tax_code, "rate", 0))
    tax_amount = _round_money(data.get("tax_amount") if data.get("tax_amount") is not None else _tax_amount(base_amount, tax_rate))
    total_amount = _round_money(data.get("total_amount") if data.get("total_amount") is not None else base_amount + tax_amount)
    item = ARInvoice(
        id=generate_datetime_id(),
        lead_id=lead_id,
        code=_clean_text(data.get("code")) or _build_running_code(ARInvoice, lead_id, "AR", invoice_date),
        customer_id=_clean_text(data.get("customer_id")),
        customer_name=_clean_text(data.get("customer_name")) or "Khách hàng",
        invoice_date=invoice_date,
        due_date=_parse_date(data.get("due_date")),
        document_id=_clean_text(data.get("document_id")),
        tax_code_id=tax_code.id if tax_code else None,
        base_amount=base_amount,
        tax_rate=tax_rate,
        tax_amount=tax_amount,
        total_amount=total_amount,
        paid_amount=0,
        balance_amount=total_amount,
        currency=_clean_text(data.get("currency")) or "VND",
        status="draft",
        description=_clean_text(data.get("description")),
        created_by=_current_user_id(),
        updated_by=_current_user_id(),
    )
    db.session.add(item)
    db.session.commit()
    if item.document_id:
        _upsert_link(lead_id, "ar_invoice", item.id, "document", item.document_id, "source_document")
        db.session.commit()
    return jsonify(item.tdict()), 201


@accounting_erp_bp.route("/ar-invoices/<string:invoice_id>", methods=["GET"])
def get_ar_invoice_detail(invoice_id):
    item = ARInvoice.query.filter(ARInvoice.id == invoice_id, ARInvoice.deletedAt.is_(None)).first()
    if not item:
        abort(404, description="AR invoice not found")
    _update_invoice_balances(item)
    payload = _enrich_ar_invoice_dict(item, item.tdict(include_payments=True))
    payload["journal_entry"] = _serialize_entry(item.journal_entry)
    payload["links"] = _trace_bidirectional(item.lead_id, "ar_invoice", item.id)
    return jsonify(payload), 200

@accounting_erp_bp.route("/ar-invoices/<string:invoice_id>", methods=["PUT"])
def update_ar_invoice(invoice_id):
    item = ARInvoice.query.filter(ARInvoice.id == invoice_id, ARInvoice.deletedAt.is_(None)).first()
    if not item:
        abort(404, description="AR invoice not found")
    if item.status == "cancelled":
        abort(400, description="Không thể sửa công nợ đã huỷ")
    data = request.get_json() or {}

    # ── Trường thông tin: luôn cho phép sửa ──────────────────────────────
    if data.get("customer_id") is not None:
        item.customer_id = _clean_text(data.get("customer_id"))
    if data.get("customer_name") is not None:
        item.customer_name = _clean_text(data.get("customer_name")) or item.customer_name
    if data.get("invoice_date") is not None:
        parsed = _parse_date(data.get("invoice_date"))
        if not parsed:
            abort(400, description="Ngày hoá đơn không hợp lệ")
        item.invoice_date = parsed
    if data.get("due_date") is not None:
        item.due_date = _parse_date(data.get("due_date"))
    if data.get("description") is not None:
        item.description = _clean_text(data.get("description"))
    if data.get("document_id") is not None:
        item.document_id = _clean_text(data.get("document_id"))
    if data.get("currency") is not None:
        item.currency = _clean_text(data.get("currency")) or "VND"

    # ── Trường tài chính: chặn khi đã xác nhận và có journal ─────────────
    finance_fields = {"base_amount", "tax_rate", "tax_code_id", "tax_amount", "total_amount"}
    wants_finance_edit = any(data.get(k) is not None for k in finance_fields)
    finance_locked = item.status in {"confirmed", "partially_paid", "paid", "overdue"} and item.journal_entry_id
    if wants_finance_edit and finance_locked:
        abort(400, description="Không thể thay đổi số tiền sau khi đã xác nhận và tạo bút toán")

    if not finance_locked:
        if data.get("tax_code_id") is not None:
            tax_code = _find_tax_code(item.lead_id, _clean_text(data.get("tax_code_id")), "output")
            item.tax_code_id = tax_code.id if tax_code else None
            item.tax_rate = _round_money(getattr(tax_code, "rate", 0))
        if data.get("base_amount") is not None:
            item.base_amount = _round_money(data.get("base_amount"))
        if data.get("tax_rate") is not None:
            item.tax_rate = _round_money(data.get("tax_rate"))
        item.tax_amount = _round_money(
            data.get("tax_amount") if data.get("tax_amount") is not None
            else _tax_amount(item.base_amount, item.tax_rate)
        )
        item.total_amount = _round_money(
            data.get("total_amount") if data.get("total_amount") is not None
            else item.base_amount + item.tax_amount
        )
        _update_invoice_balances(item)

    item.updated_by = _current_user_id()
    db.session.commit()
    return jsonify(_enrich_ar_invoice_dict(item)), 200



@accounting_erp_bp.route("/ar-invoices/<string:invoice_id>/confirm", methods=["POST"])
def confirm_ar_invoice(invoice_id):
    item = ARInvoice.query.filter(ARInvoice.id == invoice_id, ARInvoice.deletedAt.is_(None)).first()
    if not item:
        abort(404, description="AR invoice not found")
    if item.status != "draft":
        abort(400, description="Only draft invoice can be confirmed")
    if item.total_amount <= 0:
        abort(400, description="Invoice total must be > 0")
    try:
        _generate_ar_confirm_entry(item)
        item.status = "confirmed"
        item.confirmed_at = datetime.utcnow()
        item.updated_by = _current_user_id()
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    return jsonify(item.tdict()), 200


@accounting_erp_bp.route("/ar-invoices/<string:invoice_id>/cancel", methods=["POST"])
def cancel_ar_invoice(invoice_id):
    item = ARInvoice.query.filter(ARInvoice.id == invoice_id, ARInvoice.deletedAt.is_(None)).first()
    if not item:
        abort(404, description="AR invoice not found")
    if item.paid_amount > 0 or item.journal_entry_id:
        abort(400, description="Cannot cancel invoice with payment or journal")
    item.status = "cancelled"
    item.cancelled_at = datetime.utcnow()
    item.updated_by = _current_user_id()
    db.session.commit()
    return jsonify(item.tdict()), 200


@accounting_erp_bp.route("/ar-invoices/<string:invoice_id>/payments", methods=["POST"])
def record_ar_invoice_payment(invoice_id):
    item = ARInvoice.query.filter(ARInvoice.id == invoice_id, ARInvoice.deletedAt.is_(None)).first()
    if not item:
        abort(404, description="AR invoice not found")
    data = request.get_json() or {}
    payment_date = _parse_date(data.get("payment_date")) or date.today()
    payment_method = _validate_enum("payment_method", data.get("payment_method"), PAYMENT_METHODS, "cash")
    payment_type = _clean_text(data.get("payment_type")) or "phat_sinh"
    amount = _round_money(data.get("amount"))
    try:
        payment = _record_ar_payment(item, payment_date, amount, payment_method, _clean_text(data.get("note")), payment_type)
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    return jsonify(payment.tdict()), 201


@accounting_erp_bp.route("/ar-invoices/<string:invoice_id>/payments", methods=["GET"])
def list_ar_invoice_payments(invoice_id):
    item = ARInvoice.query.filter(ARInvoice.id == invoice_id, ARInvoice.deletedAt.is_(None)).first()
    if not item:
        abort(404, description="AR invoice not found")
    return jsonify({"data": [payment.tdict() for payment in item.payments if not payment.deletedAt]}), 200


@accounting_erp_bp.route("/ar-invoices/<string:invoice_id>/payments/<string:payment_id>", methods=["PATCH"])
def update_ar_invoice_payment(invoice_id, payment_id):
    """Sửa note, payment_date, amount của một payment entry."""
    item = ARInvoice.query.filter(ARInvoice.id == invoice_id, ARInvoice.deletedAt.is_(None)).first()
    if not item:
        abort(404, description="AR invoice not found")
    payment = ARInvoicePayment.query.filter(
        ARInvoicePayment.id == payment_id,
        ARInvoicePayment.invoice_id == invoice_id,
        ARInvoicePayment.deletedAt.is_(None),
    ).first()
    if not payment:
        abort(404, description="Payment not found")
    data = request.get_json() or {}
    next_date = payment.payment_date
    next_amount = payment.amount
    next_note = payment.note
    if "note" in data:
        next_note = _clean_text(data["note"])
    if "payment_date" in data:
        new_date = _parse_date(data["payment_date"])
        if new_date:
            next_date = new_date
    if "amount" in data:
        new_amt = _round_money(data["amount"])
        if new_amt > 0:
            next_amount = new_amt
    if payment.payment_type == "tam_ung":
        snapshot = _build_ar_invoice_snapshot(item)
        max_amount = _round_money(snapshot["balance_amount"] + (payment.amount or 0))
        if next_amount - max_amount > 0.0001:
            abort(400, description="So tien tam ung vuot qua so con phai thu")
    elif payment.daily_cash_id or payment.journal_entry_id:
        _soft_delete_ar_payment_links(payment)
        payment.daily_cash_id = None
        payment.journal_entry_id = None
    payment.payment_date = next_date
    payment.amount = next_amount
    payment.note = next_note
    _update_invoice_balances(item)
    _sync_ar_payment_links(payment, item)
    payment.updated_by = _current_user_id()
    db.session.commit()
    return jsonify(payment.tdict()), 200


@accounting_erp_bp.route("/ar-invoices/<string:invoice_id>/payments/<string:payment_id>", methods=["DELETE"])
def delete_ar_invoice_payment(invoice_id, payment_id):
    """Xóa mềm một payment entry, hoàn lại balance."""
    item = ARInvoice.query.filter(ARInvoice.id == invoice_id, ARInvoice.deletedAt.is_(None)).first()
    if not item:
        abort(404, description="AR invoice not found")
    payment = ARInvoicePayment.query.filter(
        ARInvoicePayment.id == payment_id,
        ARInvoicePayment.invoice_id == invoice_id,
        ARInvoicePayment.deletedAt.is_(None),
    ).first()
    if not payment:
        abort(404, description="Payment not found")
    # Xóa mềm: đặt deletedAt
    _soft_delete_ar_payment_links(payment)
    payment.deletedAt = datetime.utcnow()
    payment.updated_by = _current_user_id()
    _update_invoice_balances(item)
    db.session.commit()
    return jsonify({"ok": True}), 200


@accounting_erp_bp.route("/ar-aging", methods=["GET"])
def ar_aging():
    lead_id = request.args.get("lead", 0, type=int)
    as_of = _parse_date(request.args.get("as_of")) or date.today()
    _require_lead(lead_id)
    _refresh_ar_invoice_metrics(lead_id)
    rows = ARInvoice.query.filter(ARInvoice.deletedAt.is_(None), ARInvoice.lead_id == lead_id).all()
    return jsonify({"data": _aging_summary(rows, as_of)}), 200

@accounting_erp_bp.route("/ar-statement", methods=["GET"])
def ar_statement():
    lead_id = request.args.get("lead", 0, type=int)
    customer_id = _clean_text(request.args.get("customer_id"))
    _require_lead(lead_id)
    _refresh_ar_invoice_metrics(lead_id)
    query = ARInvoice.query.filter(ARInvoice.deletedAt.is_(None), ARInvoice.lead_id == lead_id)
    if customer_id:
        query = query.filter(ARInvoice.customer_id == customer_id)
    rows = query.order_by(ARInvoice.invoice_date.asc()).all()
    return jsonify({"data": [_enrich_ar_invoice_dict(row, row.tdict(include_payments=True)) for row in rows]}), 200

@accounting_erp_bp.route("/ap-bills", methods=["GET"])
def list_ap_bills():
    lead_id = request.args.get("lead", 0, type=int)
    _require_lead(lead_id)
    page = request.args.get("page", 1, type=int)
    limit = min(request.args.get("limit", 20, type=int), 200)
    status = _clean_text(request.args.get("status"))
    supplier_id = _clean_text(request.args.get("supplier_id"))
    overdue = request.args.get("overdue")
    from_date = _parse_date(request.args.get("from_date"))
    to_date = _parse_date(request.args.get("to_date"))
    search = _clean_text(request.args.get("search"))
    query = APBill.query.filter(APBill.deletedAt.is_(None), APBill.lead_id == lead_id)
    if status:
        query = query.filter(APBill.status == status)
    if supplier_id:
        query = query.filter(APBill.supplier_id == supplier_id)
    if from_date:
        query = query.filter(APBill.bill_date >= from_date)
    if to_date:
        query = query.filter(APBill.bill_date <= to_date)
    if overdue == "true":
        query = query.filter(APBill.balance_amount > 0, APBill.due_date < date.today())
    if overdue == "false":
        query = query.filter(or_(APBill.due_date.is_(None), APBill.due_date >= date.today()))
    if search:
        like = f"%{search}%"
        query = query.filter(or_(APBill.code.ilike(like), APBill.supplier_name.ilike(like), APBill.description.ilike(like)))
    pagination = query.order_by(APBill.bill_date.desc(), APBill.createdAt.desc()).paginate(page=page, per_page=limit, error_out=False)
    rows = query.all()
    summary = {
        "total_payable": _round_money(sum(item.total_amount or 0 for item in rows)),
        "paid_amount": _round_money(sum(item.paid_amount or 0 for item in rows)),
        "outstanding_amount": _round_money(sum(item.balance_amount or 0 for item in rows)),
        "overdue_amount": _round_money(
            sum((item.balance_amount or 0) for item in rows if item.balance_amount > 0 and item.due_date and item.due_date < date.today())
        ),
    }
    return jsonify({
        "data": [item.tdict() for item in pagination.items],
        "pagination": {"page": page, "per_page": limit, "pages": pagination.pages, "total": pagination.total},
        "summary": summary,
    }), 200


@accounting_erp_bp.route("/ap-bills", methods=["POST"])
def create_ap_bill():
    data = request.get_json() or {}
    lead_id = int(data.get("lead_id") or 0)
    _require_lead(lead_id)
    _ensure_accounting_setup(lead_id)
    bill_date = _parse_date(data.get("bill_date")) or date.today()
    tax_code = _find_tax_code(lead_id, _clean_text(data.get("tax_code_id")), "input")
    base_amount = _round_money(data.get("base_amount"))
    tax_rate = _round_money(data.get("tax_rate") if data.get("tax_rate") is not None else getattr(tax_code, "rate", 0))
    tax_amount = _round_money(data.get("tax_amount") if data.get("tax_amount") is not None else _tax_amount(base_amount, tax_rate))
    total_amount = _round_money(data.get("total_amount") if data.get("total_amount") is not None else base_amount + tax_amount)
    item = APBill(
        id=generate_datetime_id(),
        lead_id=lead_id,
        code=_clean_text(data.get("code")) or _build_running_code(APBill, lead_id, "AP", bill_date),
        supplier_id=_clean_text(data.get("supplier_id")),
        supplier_name=_clean_text(data.get("supplier_name")) or "Nhà cung cấp",
        bill_date=bill_date,
        due_date=_parse_date(data.get("due_date")),
        document_id=_clean_text(data.get("document_id")),
        tax_code_id=tax_code.id if tax_code else None,
        expense_account_code=_clean_text(data.get("expense_account_code")) or "642",
        base_amount=base_amount,
        tax_rate=tax_rate,
        tax_amount=tax_amount,
        total_amount=total_amount,
        paid_amount=0,
        balance_amount=total_amount,
        currency=_clean_text(data.get("currency")) or "VND",
        status="draft",
        description=_clean_text(data.get("description")),
        created_by=_current_user_id(),
        updated_by=_current_user_id(),
    )
    db.session.add(item)
    db.session.commit()
    if item.document_id:
        _upsert_link(lead_id, "ap_bill", item.id, "document", item.document_id, "source_document")
        db.session.commit()
    return jsonify(item.tdict()), 201


@accounting_erp_bp.route("/ap-bills/<string:bill_id>", methods=["GET"])
def get_ap_bill_detail(bill_id):
    item = APBill.query.filter(APBill.id == bill_id, APBill.deletedAt.is_(None)).first()
    if not item:
        abort(404, description="AP bill not found")
    payload = item.tdict(include_payments=True)
    payload["journal_entry"] = _serialize_entry(item.journal_entry)
    payload["links"] = _trace_bidirectional(item.lead_id, "ap_bill", item.id)
    return jsonify(payload), 200


@accounting_erp_bp.route("/ap-bills/<string:bill_id>", methods=["PUT"])
def update_ap_bill(bill_id):
    item = APBill.query.filter(APBill.id == bill_id, APBill.deletedAt.is_(None)).first()
    if not item:
        abort(404, description="AP bill not found")
    if item.status in {"confirmed", "partially_paid", "paid", "overdue"} and (item.journal_entry_id or item.paid_amount > 0):
        abort(400, description="Cannot edit confirmed bill with journal or payment")
    data = request.get_json() or {}
    if data.get("supplier_id") is not None:
        item.supplier_id = _clean_text(data.get("supplier_id"))
    if data.get("supplier_name") is not None:
        item.supplier_name = _clean_text(data.get("supplier_name")) or item.supplier_name
    if data.get("bill_date") is not None:
        parsed = _parse_date(data.get("bill_date"))
        if not parsed:
            abort(400, description="Invalid bill_date")
        item.bill_date = parsed
    if data.get("due_date") is not None:
        item.due_date = _parse_date(data.get("due_date"))
    if data.get("document_id") is not None:
        item.document_id = _clean_text(data.get("document_id"))
    if data.get("tax_code_id") is not None:
        tax_code = _find_tax_code(item.lead_id, _clean_text(data.get("tax_code_id")), "input")
        item.tax_code_id = tax_code.id if tax_code else None
        item.tax_rate = _round_money(getattr(tax_code, "rate", 0))
    if data.get("expense_account_code") is not None:
        item.expense_account_code = _clean_text(data.get("expense_account_code")) or item.expense_account_code
    if data.get("base_amount") is not None:
        item.base_amount = _round_money(data.get("base_amount"))
    if data.get("tax_rate") is not None:
        item.tax_rate = _round_money(data.get("tax_rate"))
    item.tax_amount = _round_money(data.get("tax_amount") if data.get("tax_amount") is not None else _tax_amount(item.base_amount, item.tax_rate))
    item.total_amount = _round_money(data.get("total_amount") if data.get("total_amount") is not None else item.base_amount + item.tax_amount)
    item.balance_amount = _round_money(item.total_amount - item.paid_amount)
    if data.get("currency") is not None:
        item.currency = _clean_text(data.get("currency")) or "VND"
    if data.get("description") is not None:
        item.description = _clean_text(data.get("description"))
    item.updated_by = _current_user_id()
    db.session.commit()
    return jsonify(item.tdict()), 200


@accounting_erp_bp.route("/ap-bills/<string:bill_id>/confirm", methods=["POST"])
def confirm_ap_bill(bill_id):
    item = APBill.query.filter(APBill.id == bill_id, APBill.deletedAt.is_(None)).first()
    if not item:
        abort(404, description="AP bill not found")
    if item.status != "draft":
        abort(400, description="Only draft bill can be confirmed")
    if item.total_amount <= 0:
        abort(400, description="Bill total must be > 0")
    try:
        _generate_ap_confirm_entry(item)
        item.status = "confirmed"
        item.confirmed_at = datetime.utcnow()
        item.updated_by = _current_user_id()
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    return jsonify(item.tdict()), 200


@accounting_erp_bp.route("/ap-bills/<string:bill_id>/cancel", methods=["POST"])
def cancel_ap_bill(bill_id):
    item = APBill.query.filter(APBill.id == bill_id, APBill.deletedAt.is_(None)).first()
    if not item:
        abort(404, description="AP bill not found")
    if item.paid_amount > 0 or item.journal_entry_id:
        abort(400, description="Cannot cancel bill with payment or journal")
    item.status = "cancelled"
    item.cancelled_at = datetime.utcnow()
    item.updated_by = _current_user_id()
    db.session.commit()
    return jsonify(item.tdict()), 200


@accounting_erp_bp.route("/ap-bills/<string:bill_id>/payments", methods=["POST"])
def record_ap_bill_payment(bill_id):
    item = APBill.query.filter(APBill.id == bill_id, APBill.deletedAt.is_(None)).first()
    if not item:
        abort(404, description="AP bill not found")
    data = request.get_json() or {}
    payment_date = _parse_date(data.get("payment_date")) or date.today()
    payment_method = _validate_enum("payment_method", data.get("payment_method"), PAYMENT_METHODS, "cash")
    amount = _round_money(data.get("amount"))
    try:
        payment = _record_ap_payment(item, payment_date, amount, payment_method, _clean_text(data.get("note")))
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    return jsonify(payment.tdict()), 201


@accounting_erp_bp.route("/ap-bills/<string:bill_id>/payments", methods=["GET"])
def list_ap_bill_payments(bill_id):
    item = APBill.query.filter(APBill.id == bill_id, APBill.deletedAt.is_(None)).first()
    if not item:
        abort(404, description="AP bill not found")
    return jsonify({"data": [payment.tdict() for payment in item.payments if not payment.deletedAt]}), 200


@accounting_erp_bp.route("/ap-bills/<string:bill_id>/payments/<string:payment_id>", methods=["PATCH"])
def update_ap_bill_payment(bill_id, payment_id):
    """Sửa note, payment_date, amount của một AP payment entry."""
    item = APBill.query.filter(APBill.id == bill_id, APBill.deletedAt.is_(None)).first()
    if not item:
        abort(404, description="AP bill not found")
    payment = APBillPayment.query.filter(
        APBillPayment.id == payment_id,
        APBillPayment.bill_id == bill_id,
        APBillPayment.deletedAt.is_(None),
    ).first()
    if not payment:
        abort(404, description="Payment not found")
    data = request.get_json() or {}
    if "note" in data:
        payment.note = _clean_text(data["note"])
    if "payment_date" in data:
        new_date = _parse_date(data["payment_date"])
        if new_date:
            payment.payment_date = new_date
    if "amount" in data:
        new_amt = _round_money(data["amount"])
        if new_amt > 0:
            payment.amount = new_amt
            _update_bill_balances(item)
    payment.updated_by = _current_user_id()
    db.session.commit()
    return jsonify(payment.tdict()), 200


@accounting_erp_bp.route("/ap-bills/<string:bill_id>/payments/<string:payment_id>", methods=["DELETE"])
def delete_ap_bill_payment(bill_id, payment_id):
    """Xóa mềm một AP payment entry, hoàn lại balance."""
    item = APBill.query.filter(APBill.id == bill_id, APBill.deletedAt.is_(None)).first()
    if not item:
        abort(404, description="AP bill not found")
    payment = APBillPayment.query.filter(
        APBillPayment.id == payment_id,
        APBillPayment.bill_id == bill_id,
        APBillPayment.deletedAt.is_(None),
    ).first()
    if not payment:
        abort(404, description="Payment not found")
    payment.deletedAt = datetime.utcnow()
    _update_bill_balances(item)
    db.session.commit()
    return jsonify({"ok": True}), 200


@accounting_erp_bp.route("/ap-aging", methods=["GET"])
def ap_aging():
    lead_id = request.args.get("lead", 0, type=int)
    as_of = _parse_date(request.args.get("as_of")) or date.today()
    _require_lead(lead_id)
    rows = APBill.query.filter(APBill.deletedAt.is_(None), APBill.lead_id == lead_id).all()
    return jsonify({"data": _aging_summary(rows, as_of)}), 200


@accounting_erp_bp.route("/ap-statement", methods=["GET"])
def ap_statement():
    lead_id = request.args.get("lead", 0, type=int)
    supplier_id = _clean_text(request.args.get("supplier_id"))
    _require_lead(lead_id)
    query = APBill.query.filter(APBill.deletedAt.is_(None), APBill.lead_id == lead_id)
    if supplier_id:
        query = query.filter(APBill.supplier_id == supplier_id)
    rows = query.order_by(APBill.bill_date.asc()).all()
    return jsonify({"data": [row.tdict(include_payments=True) for row in rows]}), 200


@accounting_erp_bp.route("/journal-entries", methods=["GET"])
def list_journal_entries():
    lead_id = request.args.get("lead", 0, type=int)
    _require_lead(lead_id)
    page = request.args.get("page", 1, type=int)
    limit = min(request.args.get("limit", 50, type=int), 200)
    status = _clean_text(request.args.get("status"))
    source_type = _clean_text(request.args.get("source_type"))
    from_date = _parse_date(request.args.get("from_date"))
    to_date = _parse_date(request.args.get("to_date"))
    query = JournalEntry.query.filter(JournalEntry.deletedAt.is_(None), JournalEntry.lead_id == lead_id)
    if status:
        query = query.filter(JournalEntry.status == status)
    if source_type:
        query = query.filter(JournalEntry.source_type == source_type)
    if from_date:
        query = query.filter(JournalEntry.entry_date >= from_date)
    if to_date:
        query = query.filter(JournalEntry.entry_date <= to_date)
    pagination = query.order_by(JournalEntry.entry_date.desc(), JournalEntry.createdAt.desc()).paginate(page=page, per_page=limit, error_out=False)
    return jsonify({
        "data": [row.tdict() for row in pagination.items],
        "pagination": {"page": page, "per_page": limit, "pages": pagination.pages, "total": pagination.total},
    }), 200


@accounting_erp_bp.route("/journal-entries", methods=["POST"])
def create_manual_journal_entry():
    data = request.get_json() or {}
    lead_id = int(data.get("lead_id") or 0)
    _require_lead(lead_id)
    entry_date = _parse_date(data.get("entry_date")) or date.today()
    lines = data.get("lines") if isinstance(data.get("lines"), list) else []
    entry = _create_journal_entry(
        lead_id=lead_id,
        entry_date=entry_date,
        description=_clean_text(data.get("description")) or "Manual journal entry",
        source_type="manual",
        source_id=generate_datetime_id(),
        reference_no=_clean_text(data.get("reference_no")),
        lines=lines,
        status="draft",
    )
    db.session.commit()
    return jsonify(entry.tdict(include_lines=True)), 201


@accounting_erp_bp.route("/journal-entries/<string:entry_id>", methods=["GET"])
def get_journal_entry_detail(entry_id):
    entry = JournalEntry.query.filter(JournalEntry.id == entry_id, JournalEntry.deletedAt.is_(None)).first()
    if not entry:
        abort(404, description="Journal entry not found")
    payload = entry.tdict(include_lines=True)
    payload["links"] = _trace_bidirectional(entry.lead_id, "journal_entry", entry.id)
    return jsonify(payload), 200


@accounting_erp_bp.route("/journal-entries/<string:entry_id>/post", methods=["POST"])
def post_journal_entry(entry_id):
    entry = JournalEntry.query.filter(JournalEntry.id == entry_id, JournalEntry.deletedAt.is_(None)).first()
    if not entry:
        abort(404, description="Journal entry not found")
    _post_entry(entry)
    db.session.commit()
    return jsonify(entry.tdict(include_lines=True)), 200


@accounting_erp_bp.route("/journal-entries/<string:entry_id>/reverse", methods=["POST"])
def reverse_journal_entry(entry_id):
    entry = JournalEntry.query.filter(JournalEntry.id == entry_id, JournalEntry.deletedAt.is_(None)).first()
    if not entry:
        abort(404, description="Journal entry not found")
    data = request.get_json() or {}
    reversal = _reverse_entry(entry, _clean_text(data.get("reason")))
    db.session.commit()
    return jsonify(reversal.tdict(include_lines=True)), 201


@accounting_erp_bp.route("/ledger", methods=["GET"])
def ledger_by_account():
    lead_id = request.args.get("lead", 0, type=int)
    account_code = _clean_text(request.args.get("account_code"))
    if not account_code:
        abort(400, description="account_code is required")
    from_date = _parse_date(request.args.get("from_date"))
    to_date = _parse_date(request.args.get("to_date"))
    _require_lead(lead_id)
    query = (
        JournalEntryLine.query.join(JournalEntry, JournalEntryLine.journal_entry_id == JournalEntry.id)
        .filter(
            JournalEntryLine.deletedAt.is_(None),
            JournalEntry.deletedAt.is_(None),
            JournalEntryLine.lead_id == lead_id,
            JournalEntryLine.account_code == account_code,
        )
    )
    if from_date:
        query = query.filter(JournalEntry.entry_date >= from_date)
    if to_date:
        query = query.filter(JournalEntry.entry_date <= to_date)
    rows = query.order_by(JournalEntry.entry_date.asc(), JournalEntry.entry_no.asc(), JournalEntryLine.line_no.asc()).all()
    balance = 0.0
    data = []
    for row in rows:
        balance += _round_money((row.debit or 0) - (row.credit or 0))
        payload = row.tdict()
        payload["entry_date"] = row.journal_entry.entry_date.isoformat() if row.journal_entry.entry_date else None
        payload["entry_no"] = row.journal_entry.entry_no
        payload["entry_status"] = row.journal_entry.status
        payload["running_balance"] = _round_money(balance)
        data.append(payload)
    return jsonify({"data": data, "summary": {"balance": _round_money(balance)}}), 200


@accounting_erp_bp.route("/trial-balance", methods=["GET"])
def trial_balance():
    lead_id = request.args.get("lead", 0, type=int)
    from_date = _parse_date(request.args.get("from_date"))
    to_date = _parse_date(request.args.get("to_date"))
    _require_lead(lead_id)
    query = (
        db.session.query(
            JournalEntryLine.account_code,
            JournalEntryLine.account_name,
            func.sum(JournalEntryLine.debit).label("debit"),
            func.sum(JournalEntryLine.credit).label("credit"),
        )
        .join(JournalEntry, JournalEntryLine.journal_entry_id == JournalEntry.id)
        .filter(
            JournalEntryLine.deletedAt.is_(None),
            JournalEntry.deletedAt.is_(None),
            JournalEntryLine.lead_id == lead_id,
            JournalEntry.status == "posted",
        )
        .group_by(JournalEntryLine.account_code, JournalEntryLine.account_name)
    )
    if from_date:
        query = query.filter(JournalEntry.entry_date >= from_date)
    if to_date:
        query = query.filter(JournalEntry.entry_date <= to_date)
    rows = query.order_by(JournalEntryLine.account_code.asc()).all()
    payload = []
    total_debit = 0.0
    total_credit = 0.0
    for row in rows:
        debit = _round_money(row.debit)
        credit = _round_money(row.credit)
        total_debit += debit
        total_credit += credit
        payload.append({"account_code": row.account_code, "account_name": row.account_name, "debit": debit, "credit": credit, "balance": _round_money(debit - credit)})
    return jsonify({"data": payload, "summary": {"debit": _round_money(total_debit), "credit": _round_money(total_credit)}}), 200


def _sum_posted_by_prefix(lead_id: int, prefixes: list[str], from_date: date | None, to_date: date | None):
    query = (
        db.session.query(func.sum(JournalEntryLine.debit).label("debit"), func.sum(JournalEntryLine.credit).label("credit"))
        .join(JournalEntry, JournalEntryLine.journal_entry_id == JournalEntry.id)
        .filter(
            JournalEntryLine.deletedAt.is_(None),
            JournalEntry.deletedAt.is_(None),
            JournalEntry.status == "posted",
            JournalEntryLine.lead_id == lead_id,
            or_(*[JournalEntryLine.account_code.like(f"{prefix}%") for prefix in prefixes]),
        )
    )
    if from_date:
        query = query.filter(JournalEntry.entry_date >= from_date)
    if to_date:
        query = query.filter(JournalEntry.entry_date <= to_date)
    row = query.first()
    return _round_money(row.debit or 0), _round_money(row.credit or 0)


@accounting_erp_bp.route("/reports/profit-loss", methods=["GET"])
def profit_and_loss():
    lead_id = request.args.get("lead", 0, type=int)
    from_date = _parse_date(request.args.get("from_date"))
    to_date = _parse_date(request.args.get("to_date"))
    _require_lead(lead_id)
    rev_debit, rev_credit = _sum_posted_by_prefix(lead_id, ["511"], from_date, to_date)
    cogs_debit, cogs_credit = _sum_posted_by_prefix(lead_id, ["632"], from_date, to_date)
    sell_debit, sell_credit = _sum_posted_by_prefix(lead_id, ["641"], from_date, to_date)
    admin_debit, admin_credit = _sum_posted_by_prefix(lead_id, ["642"], from_date, to_date)
    revenue = _round_money(rev_credit - rev_debit)
    cogs = _round_money(cogs_debit - cogs_credit)
    selling = _round_money(sell_debit - sell_credit)
    admin = _round_money(admin_debit - admin_credit)
    return jsonify({"data": [
        {"label": "Doanh thu bán hàng", "amount": revenue},
        {"label": "Giá vốn hàng bán", "amount": cogs},
        {"label": "Chi phí bán hàng", "amount": selling},
        {"label": "Chi phí quản lý doanh nghiệp", "amount": admin},
        {"label": "Lợi nhuận thuần", "amount": _round_money(revenue - cogs - selling - admin)},
    ]}), 200


@accounting_erp_bp.route("/reports/balance-sheet", methods=["GET"])
def balance_sheet():
    lead_id = request.args.get("lead", 0, type=int)
    _require_lead(lead_id)
    trial_rows = trial_balance()[0].json["data"]  # type: ignore[attr-defined]
    assets = 0.0
    liabilities = 0.0
    profit_bucket = 0.0
    for row in trial_rows:
        code = row["account_code"]
        balance = row["balance"]
        if code.startswith(("1", "2")):
            assets += balance
        elif code.startswith("3"):
            liabilities += -balance if balance < 0 else balance
        else:
            profit_bucket += balance
    return jsonify({"data": [
        {"label": "Tài sản", "amount": _round_money(assets)},
        {"label": "Nợ phải trả", "amount": _round_money(liabilities)},
        {"label": "Vốn / KQKD", "amount": _round_money(profit_bucket)},
    ]}), 200


@accounting_erp_bp.route("/reports/cashflow", methods=["GET"])
def cashflow_summary():
    lead_id = request.args.get("lead", 0, type=int)
    from_date = _parse_date(request.args.get("from_date"))
    to_date = _parse_date(request.args.get("to_date"))
    _require_lead(lead_id)
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
            AccountingDailyCash.deletedAt.is_(None),
            AccountingDailyCash.lead_id == lead_id,
            or_(ARInvoicePayment.id.is_(None), ARInvoicePayment.payment_type != "phat_sinh"),
        )
    )
    if from_date:
        query = query.filter(AccountingDailyCash.txn_date >= from_date)
    if to_date:
        query = query.filter(AccountingDailyCash.txn_date <= to_date)
    rows = query.all()
    income = _round_money(sum(item.amount or 0 for item in rows if item.direction == "income"))
    expense = _round_money(sum(item.amount or 0 for item in rows if item.direction == "expense"))
    return jsonify({"summary": {"income": income, "expense": expense, "net": _round_money(income - expense)}}), 200

@accounting_erp_bp.route("/vat-report", methods=["GET"])
def vat_report():
    lead_id = request.args.get("lead", 0, type=int)
    from_date = _parse_date(request.args.get("from_date"))
    to_date = _parse_date(request.args.get("to_date"))
    _require_lead(lead_id)
    ar_query = ARInvoice.query.filter(ARInvoice.deletedAt.is_(None), ARInvoice.lead_id == lead_id, ARInvoice.status != "cancelled")
    ap_query = APBill.query.filter(APBill.deletedAt.is_(None), APBill.lead_id == lead_id, APBill.status != "cancelled")
    if from_date:
        ar_query = ar_query.filter(ARInvoice.invoice_date >= from_date)
        ap_query = ap_query.filter(APBill.bill_date >= from_date)
    if to_date:
        ar_query = ar_query.filter(ARInvoice.invoice_date <= to_date)
        ap_query = ap_query.filter(APBill.bill_date <= to_date)
    output_tax = _round_money(sum(item.tax_amount or 0 for item in ar_query.all()))
    input_tax = _round_money(sum(item.tax_amount or 0 for item in ap_query.all()))
    return jsonify({"summary": {"vat_input": input_tax, "vat_output": output_tax, "net_vat_payable": _round_money(output_tax - input_tax)}}), 200


@accounting_erp_bp.route("/fixed-assets", methods=["GET"])
def list_fixed_assets():
    lead_id = request.args.get("lead", 0, type=int)
    status = _clean_text(request.args.get("status"))
    _require_lead(lead_id)
    query = FixedAsset.query.filter(FixedAsset.deletedAt.is_(None), FixedAsset.lead_id == lead_id)
    if status:
        query = query.filter(FixedAsset.status == status)
    rows = query.order_by(FixedAsset.purchase_date.desc()).all()
    result = []
    for row in rows:
        d = row.tdict()
        d["events"] = [
            ev.tdict() for ev in row.events
            if not ev.deletedAt
        ]
        result.append(d)
    return jsonify({"data": result}), 200


@accounting_erp_bp.route("/fixed-assets", methods=["POST"])
def create_fixed_asset():
    data = request.get_json() or {}
    lead_id = int(data.get("lead_id") or 0)
    _require_lead(lead_id)
    purchase_date = _parse_date(data.get("purchase_date")) or date.today()
    useful_life_months = int(data.get("useful_life_months") or 0)
    if useful_life_months <= 0:
        abort(400, description="useful_life_months must be > 0")
    cost = _round_money(data.get("cost"))
    salvage_value = _round_money(data.get("salvage_value"))
    monthly = _round_money((cost - salvage_value) / useful_life_months)
    item = FixedAsset(
        id=generate_datetime_id(),
        lead_id=lead_id,
        code=_clean_text(data.get("code")) or _build_running_code(FixedAsset, lead_id, "FA", purchase_date),
        name=_clean_text(data.get("name")) or "Tài sản cố định",
        purchase_date=purchase_date,
        capitalized_date=_parse_date(data.get("capitalized_date")) or purchase_date,
        cost=cost,
        salvage_value=salvage_value,
        useful_life_months=useful_life_months,
        monthly_depreciation=monthly,
        accumulated_depreciation=_round_money(data.get("accumulated_depreciation")),
        quantity=int(data.get("quantity") or 1),
        department=_clean_text(data.get("department")),
        asset_account_code=_clean_text(data.get("asset_account_code")) or "211",
        accumulated_account_code=_clean_text(data.get("accumulated_account_code")) or "214",
        expense_account_code=_clean_text(data.get("expense_account_code")) or "642",
        status=_validate_enum("status", data.get("status"), FA_STATUS, "active"),
        source_document_id=_clean_text(data.get("source_document_id")),
        created_by=_current_user_id(),
        updated_by=_current_user_id(),
    )
    db.session.add(item)
    db.session.commit()
    return jsonify(item.tdict()), 201


@accounting_erp_bp.route("/fixed-assets/run-depreciation", methods=["POST"])
def run_monthly_depreciation():
    data = request.get_json() or {}
    lead_id = int(data.get("lead_id") or 0)
    period_key = _clean_text(data.get("period_key"))
    _require_lead(lead_id)
    if not period_key:
        abort(400, description="period_key is required")
    _, period_end = _period_bounds(period_key)
    rows = FixedAsset.query.filter(
        FixedAsset.deletedAt.is_(None),
        FixedAsset.lead_id == lead_id,
        FixedAsset.status == "active",
        FixedAsset.capitalized_date <= period_end,
    ).all()
    created = []
    try:
        for asset in rows:
            existing = FixedAssetDepreciation.query.filter_by(asset_id=asset.id, period_key=period_key).first()
            if existing:
                continue
            amount = min(asset.monthly_depreciation, max(0.0, _round_money(asset.cost - asset.salvage_value - asset.accumulated_depreciation)))
            if amount <= 0:
                continue
            entry = _create_journal_entry(
                lead_id=lead_id,
                entry_date=period_end,
                description=f"Khấu hao {asset.code} kỳ {period_key}",
                source_type="depreciation",
                source_id=asset.id,
                reference_no=asset.code,
                lines=[
                    {"account_code": asset.expense_account_code, "debit": amount, "credit": 0, "description": asset.name},
                    {"account_code": asset.accumulated_account_code, "debit": 0, "credit": amount, "description": asset.name},
                ],
                status="draft",
            )
            depreciation = FixedAssetDepreciation(
                id=generate_datetime_id(),
                asset_id=asset.id,
                lead_id=lead_id,
                period_key=period_key,
                depreciation_date=period_end,
                amount=amount,
                status="draft",
                journal_entry_id=entry.id,
                created_by=_current_user_id(),
                updated_by=_current_user_id(),
            )
            asset.accumulated_depreciation = _round_money(asset.accumulated_depreciation + amount)
            db.session.add(depreciation)
            _upsert_link(lead_id, "fixed_asset", asset.id, "journal_entry", entry.id, period_key)
            created.append(depreciation)
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    return jsonify({"data": [item.tdict() for item in created], "count": len(created)}), 200


@accounting_erp_bp.route("/fixed-assets/<string:asset_id>/depreciations", methods=["GET"])
def depreciation_schedule(asset_id):
    item = FixedAsset.query.filter(FixedAsset.id == asset_id, FixedAsset.deletedAt.is_(None)).first()
    if not item:
        abort(404, description="Fixed asset not found")
    rows = FixedAssetDepreciation.query.filter(
        FixedAssetDepreciation.deletedAt.is_(None),
        FixedAssetDepreciation.asset_id == asset_id,
    ).order_by(FixedAssetDepreciation.period_key.asc()).all()
    return jsonify({"data": [row.tdict() for row in rows]}), 200


# ─── People list (employees + subcontractors for picker) ─────────────────────

@accounting_erp_bp.route("/people-list", methods=["GET"])
def people_list():
    """Return employees + subcontractors for a lead (for PersonPicker dropdown)."""
    lead_id = request.args.get("lead", 0, type=int)
    _require_lead(lead_id)
    lead = LeadPayload.query.get(lead_id)
    if not lead:
        abort(404, description="Lead not found")

    users = lead.users.filter(User.deletedAt.is_(None)).order_by(User.fullName).all()

    result = []
    seen_names = set()
    for u in users:
        name = (u.fullName or u.username or "").strip()
        if not name:                    # bỏ qua tên trống
            continue
        if name in seen_names:          # bỏ qua tên trùng
            continue
        seen_names.add(name)
        result.append({
            "id": u.id,
            "name": name,
            "phone": (u.phone or "").strip(),
            "user_type": "subcontractor" if (u.role_id or 0) > 100 else "employee",
        })

    return jsonify({"data": result}), 200


# ─── Fixed Asset Events (sub-rows) ────────────────────────────────────────────

@accounting_erp_bp.route("/fixed-assets/<string:asset_id>/events", methods=["GET"])
def list_asset_events(asset_id):
    item = FixedAsset.query.filter(FixedAsset.id == asset_id, FixedAsset.deletedAt.is_(None)).first()
    if not item:
        abort(404, description="Fixed asset not found")
    rows = FixedAssetEvent.query.filter(
        FixedAssetEvent.deletedAt.is_(None),
        FixedAssetEvent.asset_id == asset_id,
    ).order_by(FixedAssetEvent.event_date.asc()).all()
    return jsonify({"data": [row.tdict() for row in rows]}), 200


@accounting_erp_bp.route("/fixed-assets/<string:asset_id>/events", methods=["POST"])
def create_asset_event(asset_id):
    item = FixedAsset.query.filter(FixedAsset.id == asset_id, FixedAsset.deletedAt.is_(None)).first()
    if not item:
        abort(404, description="Fixed asset not found")
    data = request.get_json() or {}
    ev = FixedAssetEvent(
        id=generate_datetime_id(),
        asset_id=asset_id,
        lead_id=item.lead_id,
        event_type=_clean_text(data.get("event_type")) or "purchase",
        event_date=_parse_date(data.get("event_date")),
        person_name=_clean_text(data.get("person_name")),
        person_phone=_clean_text(data.get("person_phone")),
        note=_clean_text(data.get("note")),
        created_by=_current_user_id(),
        updated_by=_current_user_id(),
    )
    db.session.add(ev)
    db.session.commit()
    return jsonify(ev.tdict()), 201


@accounting_erp_bp.route("/fixed-assets/<string:asset_id>/events/<string:event_id>", methods=["PATCH"])
def update_asset_event(asset_id, event_id):
    ev = FixedAssetEvent.query.filter(
        FixedAssetEvent.id == event_id,
        FixedAssetEvent.asset_id == asset_id,
        FixedAssetEvent.deletedAt.is_(None),
    ).first()
    if not ev:
        abort(404, description="Event not found")
    data = request.get_json() or {}
    if "event_type" in data:
        ev.event_type = _clean_text(data["event_type"]) or ev.event_type
    if "event_date" in data:
        ev.event_date = _parse_date(data["event_date"])
    if "person_name" in data:
        ev.person_name = _clean_text(data["person_name"])
    if "person_phone" in data:
        ev.person_phone = _clean_text(data["person_phone"])
    if "note" in data:
        ev.note = _clean_text(data["note"])
    ev.updated_by = _current_user_id()
    db.session.commit()
    return jsonify(ev.tdict()), 200


@accounting_erp_bp.route("/fixed-assets/<string:asset_id>/events/<string:event_id>", methods=["DELETE"])
def delete_asset_event(asset_id, event_id):
    ev = FixedAssetEvent.query.filter(
        FixedAssetEvent.id == event_id,
        FixedAssetEvent.asset_id == asset_id,
        FixedAssetEvent.deletedAt.is_(None),
    ).first()
    if not ev:
        abort(404, description="Event not found")
    import datetime as _dt
    ev.deletedAt = _dt.datetime.utcnow()
    db.session.commit()
    return jsonify({"message": "deleted"}), 200


# ─── Accounting Records (Hồ sơ kế toán) ──────────────────────────────────────

@accounting_erp_bp.route("/records", methods=["GET"])
def list_accounting_records():
    """GET /api/accounting/records?lead=<id>&sub_tab=<hop-dong|nghiem-thu|thanh-toan>"""
    lead_id = request.args.get("lead", 0, type=int)
    if not lead_id:
        abort(400, description="lead is required")
    sub_tab = request.args.get("sub_tab", None, type=str)

    q = AccountingRecord.query.filter(
        AccountingRecord.lead_id == lead_id,
        AccountingRecord.deletedAt.is_(None),
    )
    if sub_tab:
        q = q.filter(AccountingRecord.sub_tab == sub_tab)
    q = q.order_by(AccountingRecord.createdAt.desc())
    return jsonify({"data": [r.tdict() for r in q.all()]}), 200


@accounting_erp_bp.route("/records", methods=["POST"])
def create_accounting_record():
    """POST /api/accounting/records"""
    data = request.get_json(force=True) or {}
    lead_id = int(data.get("lead_id") or 0)
    if not lead_id:
        abort(400, description="lead_id is required")

    name = str(data.get("name") or "").strip()
    if not name:
        abort(400, description="name is required")

    rec = AccountingRecord(
        id=generate_datetime_id(),
        lead_id=lead_id,
        sub_tab=str(data.get("sub_tab") or "hop-dong"),
        name=name,
        file_type=str(data.get("file_type") or "doc"),
        folder=str(data.get("folder") or ""),
        content=str(data.get("content") or ""),
        created_by=str(data.get("created_by") or ""),
        updated_by=str(data.get("created_by") or ""),
    )
    db.session.add(rec)
    db.session.commit()
    return jsonify(rec.tdict()), 201


@accounting_erp_bp.route("/records/<string:record_id>", methods=["PUT"])
def update_accounting_record(record_id: str):
    """PUT /api/accounting/records/<id>"""
    rec = AccountingRecord.query.filter_by(id=record_id).first()
    if not rec or rec.deletedAt:
        abort(404, description="Record not found")

    data = request.get_json(force=True) or {}
    if "name" in data and str(data["name"]).strip():
        rec.name = str(data["name"]).strip()
    if "sub_tab" in data:
        rec.sub_tab = str(data["sub_tab"])
    if "file_type" in data:
        rec.file_type = str(data["file_type"])
    if "folder" in data:
        rec.folder = str(data["folder"])
    if "content" in data:
        rec.content = str(data["content"])
    if "updated_by" in data:
        rec.updated_by = str(data["updated_by"])

    import datetime as _dt
    rec.updatedAt = _dt.datetime.utcnow()
    db.session.commit()
    return jsonify(rec.tdict()), 200


@accounting_erp_bp.route("/records/<string:record_id>", methods=["DELETE"])
def delete_accounting_record(record_id: str):
    """DELETE /api/accounting/records/<id>"""
    rec = AccountingRecord.query.filter_by(id=record_id).first()
    if not rec or rec.deletedAt:
        abort(404, description="Record not found")

    import datetime as _dt
    rec.deletedAt = _dt.datetime.utcnow()
    db.session.commit()
    return jsonify({"message": "deleted"}), 200


# ─── Convert .doc / .docx → HTML ─────────────────────────────────────────────

@accounting_erp_bp.route("/records/convert-doc", methods=["POST"])
def convert_doc_to_html():
    """POST /api/accounting/records/convert-doc
    Upload file .doc hoặc .docx → trả về {"html": "..."}
    """
    file = request.files.get("file")
    if not file or not file.filename:
        abort(400, description="No file uploaded")

    import os, tempfile, subprocess, uuid, shutil

    suffix = os.path.splitext((file.filename or "").lower())[1]  # .doc / .docx
    tmp_dir = tempfile.mkdtemp()
    tmp_path = os.path.join(tmp_dir, f"{uuid.uuid4()}{suffix}")

    try:
        file.save(tmp_path)

        # 1️⃣  python-docx cho .docx  ─────────────────────────────────────
        if suffix == ".docx":
            try:
                from docx import Document as DocxDocument
                doc = DocxDocument(tmp_path)
                parts = []
                for para in doc.paragraphs:
                    if para.text.strip():
                        style = para.style.name if para.style else ""
                        tag = "h1" if "Heading 1" in style else (
                              "h2" if "Heading 2" in style else "p")
                        text_html = para.text.replace("&", "&amp;").replace("<", "&lt;")
                        parts.append(f"<{tag}>{text_html}</{tag}>")
                    else:
                        parts.append("<br/>")
                html = "\n".join(parts) or "<p></p>"
                return jsonify({"html": html}), 200
            except Exception:
                pass  # fall through

        # 2️⃣  LibreOffice headless → HTML  ───────────────────────────────
        import glob as _glob
        lo_candidates = ["/usr/bin/libreoffice", "/usr/bin/soffice"] + \
                        _glob.glob("/opt/libreoffice*/program/soffice")
        lo_bin = next((p for p in lo_candidates if os.path.isfile(p)), None)

        if lo_bin:
            subprocess.run(
                [lo_bin, "--headless", "--convert-to", "html",
                 "--outdir", tmp_dir, tmp_path],
                capture_output=True, timeout=30
            )
            base_name = os.path.splitext(os.path.basename(tmp_path))[0]
            html_file = os.path.join(tmp_dir, base_name + ".html")
            if os.path.isfile(html_file):
                import re
                raw = open(html_file, "r", encoding="utf-8", errors="replace").read()
                m = re.search(r"<body[^>]*>(.*?)</body>", raw, re.DOTALL | re.IGNORECASE)
                body = m.group(1).strip() if m else raw
                return jsonify({"html": body}), 200

        # 3️⃣  antiword / catdoc cho .doc cũ  ─────────────────────────────
        for cmd_name in ["antiword", "catdoc"]:
            try:
                r = subprocess.run([cmd_name, tmp_path],
                                   capture_output=True, timeout=15)
                text = r.stdout.decode("utf-8", "replace").strip()
                if text:
                    esc = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                    return jsonify({"html": f"<pre style='white-space:pre-wrap'>{esc}</pre>"}), 200
            except FileNotFoundError:
                continue

        # 4️⃣  Không có công cụ nào → báo lại  ────────────────────────────
        return jsonify({"html": "", "error": "no_converter"}), 200

    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


@accounting_erp_bp.route("/trace", methods=["GET"])
def trace_source():
    lead_id = request.args.get("lead", 0, type=int)
    source_type = _clean_text(request.args.get("source_type"))
    source_id = _clean_text(request.args.get("source_id"))
    _require_lead(lead_id)
    if not source_type or not source_id:
        abort(400, description="source_type and source_id are required")
    return jsonify({"data": _trace_bidirectional(lead_id, source_type, source_id)}), 200
