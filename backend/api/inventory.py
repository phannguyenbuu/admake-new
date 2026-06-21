from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, timedelta

from flask import Blueprint, abort, jsonify, request, g
from sqlalchemy import or_

from models import (
    APBill,
    ARInvoice,
    AccountingLink,
    ChartOfAccount,
    DocumentCenterDocument,
    InventoryAccountMapping,
    InventoryBalance,
    InventoryItem,
    ItemCategory,
    JournalEntry,
    JournalEntryLine,
    LeadPayload,
    Message,
    StockAdjustmentReason,
    StockTransaction,
    Task,
    Warehouse,
    Workspace,
    db,
    generate_datetime_id,
)
from permission_utils import ensure_resource_lead, require_can_view


inventory_bp = Blueprint("inventory", __name__, url_prefix="/api/inventory")


@inventory_bp.before_request
def guard_inventory_permission():
    if request.method == "OPTIONS":
        return

    actor, _ = require_can_view("view_material")
    g.permission_actor = actor

    view_args = request.view_args or {}
    resource_checks = (
        ("category_id", ItemCategory, "inventory category"),
        ("warehouse_id", Warehouse, "warehouse"),
        ("item_id", InventoryItem, "inventory item"),
        ("transaction_id", StockTransaction, "stock transaction"),
    )
    for arg_name, model, resource_name in resource_checks:
        resource_id = view_args.get(arg_name)
        if not resource_id:
            continue
        resource = db.session.get(model, resource_id)
        if resource:
            ensure_resource_lead(resource, actor, resource_name)
        break

ITEM_TYPES = ["raw_material", "merchandise", "semi_finished", "finished_goods"]
CATEGORY_STATUS = ["active", "inactive"]
WAREHOUSE_STATUS = ["active", "inactive"]
TX_STATUS = ["draft", "confirmed", "cancelled"]
TX_TYPES = [
    "purchase_receipt",
    "sales_issue",
    "internal_issue",
    "task_issue",
    "sales_return",
    "adjustment_increase",
    "adjustment_decrease",
    "transfer",
]
INBOUND_TYPES = {"purchase_receipt", "sales_return", "adjustment_increase"}
OUTBOUND_TYPES = {"sales_issue", "internal_issue", "task_issue", "adjustment_decrease"}
REFERENCE_TYPES = {"document", "ap_bill", "ar_invoice", "task", "workspace", "manual"}
ALLOW_NEGATIVE_STOCK = False

DEFAULT_CATEGORY_SEED = [
    ("RM", "Nguyên vật liệu", "active"),
    ("MER", "Hàng hóa", "active"),
    ("SFG", "Bán thành phẩm", "active"),
    ("FG", "Thành phẩm", "active"),
]

DEFAULT_WAREHOUSE_SEED = [("KHO-TONG", "Kho tổng", True)]

DEFAULT_REASON_SEED = [
    ("ADJ_PLUS", "Điều chỉnh tăng", "increase"),
    ("ADJ_MINUS", "Điều chỉnh giảm", "decrease"),
    ("KK", "Kiểm kê chênh lệch", "mixed"),
]

DEFAULT_MAPPING_BY_TYPE = {
    "raw_material": {
        "inventory_account_code": "152",
        "cogs_account_code": "632",
        "expense_account_code": "621",
        "adjustment_gain_account_code": "711",
        "adjustment_loss_account_code": "811",
        "ap_account_code": "331",
        "cash_account_code": "111",
        "vat_account_code": "133",
        "wip_account_code": "154",
    },
    "merchandise": {
        "inventory_account_code": "156",
        "cogs_account_code": "632",
        "expense_account_code": "641",
        "adjustment_gain_account_code": "711",
        "adjustment_loss_account_code": "811",
        "ap_account_code": "331",
        "cash_account_code": "111",
        "vat_account_code": "133",
    },
    "semi_finished": {
        "inventory_account_code": "154",
        "cogs_account_code": "632",
        "expense_account_code": "627",
        "adjustment_gain_account_code": "711",
        "adjustment_loss_account_code": "811",
        "ap_account_code": "331",
        "cash_account_code": "111",
        "vat_account_code": "133",
        "wip_account_code": "154",
    },
    "finished_goods": {
        "inventory_account_code": "155",
        "cogs_account_code": "632",
        "expense_account_code": "641",
        "adjustment_gain_account_code": "711",
        "adjustment_loss_account_code": "811",
        "ap_account_code": "331",
        "cash_account_code": "111",
        "vat_account_code": "133",
    },
}

ACCOUNT_SEED = [
    ("152", "Nguyên liệu, vật liệu", "asset"),
    ("153", "Công cụ dụng cụ", "asset"),
    ("621", "Chi phí nguyên vật liệu trực tiếp", "expense"),
    ("711", "Thu nhập khác", "revenue"),
    ("811", "Chi phí khác", "expense"),
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


def _clean_text(value):
    if value is None:
        return None
    text = str(value).strip()
    return text if text else None


def _to_float(value, default=0.0):
    if value is None or value == "":
        return float(default)
    try:
        return float(value)
    except Exception:
        return float(default)


def _to_bool(value, default=False):
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {"1", "true", "yes", "y", "on"}


def _round_money(value):
    return round(_to_float(value, 0), 2)


def compute_moving_average(current_qty, current_value, inbound_qty, inbound_total_cost):
    new_qty = _round_money(_to_float(current_qty) + _to_float(inbound_qty))
    new_value = _round_money(_to_float(current_value) + _to_float(inbound_total_cost))
    new_avg = _round_money(new_value / new_qty) if new_qty > 0 else 0
    return new_qty, new_value, new_avg


def resolve_issue_cost(manual_cost, balance_avg_cost, item_avg_cost, standard_cost):
    return _round_money(manual_cost or balance_avg_cost or item_avg_cost or standard_cost)


def _require_lead(lead_id: int):
    lead = db.session.get(LeadPayload, lead_id)
    if not lead or lead.deletedAt:
        abort(404, description="Lead not found")
    return lead


def _current_user_id():
    return request.headers.get("X-User-Id") or request.headers.get("X-Actor-Id") or None


def _validate_choice(name: str, value: str | None, allowed: list[str], default_value: str | None = None):
    candidate = _clean_text(value) or default_value
    if candidate not in allowed:
        abort(400, description=f"Invalid {name}: {candidate}")
    return candidate


def _build_code(prefix: str, date_value: date, model, lead_id: int, attr_name: str):
    key = date_value.strftime("%Y%m")
    head = f"{prefix}-{key}"
    existing = (
        model.query.filter(model.lead_id == lead_id, getattr(model, attr_name).ilike(f"{head}-%"))
        .order_by(getattr(model, attr_name).desc())
        .first()
    )
    seq = 1
    if existing:
        value = getattr(existing, attr_name, None)
        if value:
            try:
                seq = int(value.split("-")[-1]) + 1
            except Exception:
                seq = 1
    return f"{head}-{seq:04d}"


def _ensure_inventory_setup(lead_id: int):
    for code, name, account_type in ACCOUNT_SEED:
        account = ChartOfAccount.query.filter(
            ChartOfAccount.deletedAt.is_(None),
            ChartOfAccount.lead_id == lead_id,
            ChartOfAccount.code == code,
        ).first()
        if not account:
            db.session.add(
                ChartOfAccount(
                    id=generate_datetime_id(),
                    lead_id=lead_id,
                    code=code,
                    name=name,
                    account_type=account_type,
                    status="active",
                    allow_posting=True,
                )
            )

    for code, name, status in DEFAULT_CATEGORY_SEED:
        exists = ItemCategory.query.filter(
            ItemCategory.deletedAt.is_(None), ItemCategory.lead_id == lead_id, ItemCategory.code == code
        ).first()
        if not exists:
            db.session.add(
                ItemCategory(
                    id=generate_datetime_id(),
                    lead_id=lead_id,
                    code=code,
                    name=name,
                    status=status,
                )
            )

    for code, name, is_default in DEFAULT_WAREHOUSE_SEED:
        exists = Warehouse.query.filter(
            Warehouse.deletedAt.is_(None), Warehouse.lead_id == lead_id, Warehouse.code == code
        ).first()
        if not exists:
            db.session.add(
                Warehouse(
                    id=generate_datetime_id(),
                    lead_id=lead_id,
                    code=code,
                    name=name,
                    is_default=is_default,
                    status="active",
                )
            )

    for code, name, effect_type in DEFAULT_REASON_SEED:
        exists = StockAdjustmentReason.query.filter(
            StockAdjustmentReason.deletedAt.is_(None),
            StockAdjustmentReason.lead_id == lead_id,
            StockAdjustmentReason.code == code,
        ).first()
        if not exists:
            db.session.add(
                StockAdjustmentReason(
                    id=generate_datetime_id(),
                    lead_id=lead_id,
                    code=code,
                    name=name,
                    effect_type=effect_type,
                    status="active",
                )
            )

    existing_mapping_types = {
        row.item_type
        for row in InventoryAccountMapping.query.filter(
            InventoryAccountMapping.deletedAt.is_(None),
            InventoryAccountMapping.lead_id == lead_id,
            InventoryAccountMapping.category_id.is_(None),
        ).all()
    }
    for item_type, mapping in DEFAULT_MAPPING_BY_TYPE.items():
        if item_type in existing_mapping_types:
            continue
        db.session.add(
            InventoryAccountMapping(
                id=generate_datetime_id(),
                lead_id=lead_id,
                item_type=item_type,
                status="active",
                **mapping,
            )
        )


def _find_item(item_id: str, lead_id: int):
    item = InventoryItem.query.filter(
        InventoryItem.deletedAt.is_(None), InventoryItem.id == item_id, InventoryItem.lead_id == lead_id
    ).first()
    if not item:
        abort(404, description="Item not found")
    return item


def _find_warehouse(warehouse_id: str, lead_id: int):
    warehouse = Warehouse.query.filter(
        Warehouse.deletedAt.is_(None), Warehouse.id == warehouse_id, Warehouse.lead_id == lead_id
    ).first()
    if not warehouse:
        abort(404, description="Warehouse not found")
    return warehouse


def _find_balance(lead_id: int, item_id: str, warehouse_id: str, lock=False):
    query = InventoryBalance.query.filter(
        InventoryBalance.deletedAt.is_(None),
        InventoryBalance.lead_id == lead_id,
        InventoryBalance.item_id == item_id,
        InventoryBalance.warehouse_id == warehouse_id,
    )
    if lock:
        query = query.with_for_update()
    balance = query.first()
    if balance:
        return balance
    balance = InventoryBalance(
        id=generate_datetime_id(),
        lead_id=lead_id,
        item_id=item_id,
        warehouse_id=warehouse_id,
        quantity_on_hand=0,
        average_cost=0,
        inventory_value=0,
        created_by=_current_user_id(),
        updated_by=_current_user_id(),
    )
    db.session.add(balance)
    db.session.flush()
    return balance


def _find_mapping(lead_id: int, item: InventoryItem):
    mapping = None
    if item.category_id:
        mapping = InventoryAccountMapping.query.filter(
            InventoryAccountMapping.deletedAt.is_(None),
            InventoryAccountMapping.lead_id == lead_id,
            InventoryAccountMapping.category_id == item.category_id,
            InventoryAccountMapping.status == "active",
        ).first()
    if not mapping:
        mapping = InventoryAccountMapping.query.filter(
            InventoryAccountMapping.deletedAt.is_(None),
            InventoryAccountMapping.lead_id == lead_id,
            InventoryAccountMapping.item_type == item.item_type,
            InventoryAccountMapping.category_id.is_(None),
            InventoryAccountMapping.status == "active",
        ).first()
    if not mapping:
        abort(400, description=f"Missing inventory account mapping for item type {item.item_type}")
    return mapping


def _find_reason(lead_id: int, reason_id: str | None):
    if not reason_id:
        return None
    reason = StockAdjustmentReason.query.filter(
        StockAdjustmentReason.deletedAt.is_(None),
        StockAdjustmentReason.id == reason_id,
        StockAdjustmentReason.lead_id == lead_id,
    ).first()
    if not reason:
        abort(404, description="Adjustment reason not found")
    return reason


def _validate_reference(reference_type: str | None, reference_id: str | None):
    if not reference_type and not reference_id:
        return
    if not reference_type or not reference_id:
        abort(400, description="reference_type and reference_id must be provided together")
    if reference_type not in REFERENCE_TYPES:
        abort(400, description=f"Invalid reference_type: {reference_type}")


def _resolve_reference_code(reference_type: str | None, reference_id: str | None):
    if not reference_type or not reference_id:
        return None
    if reference_type == "document":
        doc = db.session.get(DocumentCenterDocument, reference_id)
        return doc.code if doc else None
    if reference_type == "ap_bill":
        doc = db.session.get(APBill, reference_id)
        return doc.code if doc else None
    if reference_type == "ar_invoice":
        doc = db.session.get(ARInvoice, reference_id)
        return doc.code if doc else None
    if reference_type == "task":
        doc = db.session.get(Task, reference_id)
        return doc.title if doc else None
    if reference_type == "workspace":
        doc = db.session.get(Workspace, reference_id)
        return doc.name if doc else None
    return reference_id


def _journal_lines_for_transaction(item: InventoryItem, tx: StockTransaction, mapping: InventoryAccountMapping, reason):
    amount = _round_money(tx.total_cost)
    if amount <= 0:
        return []

    inventory_account = mapping.inventory_account_code
    cash_account = mapping.cash_account_code or "111"
    ap_account = mapping.ap_account_code or "331"
    cogs_account = mapping.cogs_account_code or "632"
    expense_account = mapping.expense_account_code or "642"
    gain_account = mapping.adjustment_gain_account_code or "711"
    loss_account = mapping.adjustment_loss_account_code or "811"

    if tx.transaction_type == "purchase_receipt":
        counterpart = ap_account
        return [
            {"account_code": inventory_account, "debit": amount, "credit": 0},
            {"account_code": counterpart, "debit": 0, "credit": amount},
        ]
    if tx.transaction_type == "sales_issue":
        return [
            {"account_code": cogs_account, "debit": amount, "credit": 0},
            {"account_code": inventory_account, "debit": 0, "credit": amount},
        ]
    if tx.transaction_type in {"internal_issue", "task_issue"}:
        debit_account = mapping.wip_account_code if tx.transaction_type == "task_issue" and mapping.wip_account_code else expense_account
        return [
            {"account_code": debit_account, "debit": amount, "credit": 0},
            {"account_code": inventory_account, "debit": 0, "credit": amount},
        ]
    if tx.transaction_type == "sales_return":
        return [
            {"account_code": inventory_account, "debit": amount, "credit": 0},
            {"account_code": cogs_account, "debit": 0, "credit": amount},
        ]
    if tx.transaction_type == "adjustment_increase":
        credit_account = gain_account
        if reason and isinstance(reason.accounting_mapping, dict):
            credit_account = reason.accounting_mapping.get("credit_account_code") or credit_account
        return [
            {"account_code": inventory_account, "debit": amount, "credit": 0},
            {"account_code": credit_account, "debit": 0, "credit": amount},
        ]
    if tx.transaction_type == "adjustment_decrease":
        debit_account = loss_account
        if reason and isinstance(reason.accounting_mapping, dict):
            debit_account = reason.accounting_mapping.get("debit_account_code") or debit_account
        return [
            {"account_code": debit_account, "debit": amount, "credit": 0},
            {"account_code": inventory_account, "debit": 0, "credit": amount},
        ]
    return []


def _create_journal_entry(lead_id: int, tx: StockTransaction, lines: list[dict]):
    if not lines:
        return None
    debit = _round_money(sum(_to_float(item.get("debit"), 0) for item in lines))
    credit = _round_money(sum(_to_float(item.get("credit"), 0) for item in lines))
    if debit != credit:
        abort(400, description="Inventory journal entry is unbalanced")

    entry = JournalEntry(
        id=generate_datetime_id(),
        lead_id=lead_id,
        entry_no=_build_code("INVJE", tx.transaction_date, JournalEntry, lead_id, "entry_no"),
        entry_date=tx.transaction_date,
        doc_date=tx.transaction_date,
        description=tx.note or f"Giao dịch kho {tx.transaction_code}",
        source_type="stock_transaction",
        source_id=tx.id,
        reference_no=tx.transaction_code,
        status="posted",
        posted_at=datetime.utcnow(),
        created_by=_current_user_id(),
        updated_by=_current_user_id(),
    )
    db.session.add(entry)
    db.session.flush()

    for index, line in enumerate(lines, start=1):
        account = ChartOfAccount.query.filter(
            ChartOfAccount.deletedAt.is_(None),
            ChartOfAccount.lead_id == lead_id,
            ChartOfAccount.code == line["account_code"],
        ).first()
        db.session.add(
            JournalEntryLine(
                id=generate_datetime_id(),
                journal_entry_id=entry.id,
                lead_id=lead_id,
                line_no=index,
                account_id=account.id if account else None,
                account_code=line["account_code"],
                account_name=account.name if account else None,
                partner_id=tx.partner_id,
                partner_name=tx.partner_name,
                description=tx.note,
                debit=_round_money(line.get("debit")),
                credit=_round_money(line.get("credit")),
            )
        )
    return entry


def _reverse_journal_entry(entry: JournalEntry | None, lead_id: int, tx: StockTransaction):
    if not entry or entry.status != "posted":
        return None
    reversal = JournalEntry(
        id=generate_datetime_id(),
        lead_id=lead_id,
        entry_no=_build_code("REVINV", tx.transaction_date, JournalEntry, lead_id, "entry_no"),
        entry_date=tx.transaction_date,
        doc_date=tx.transaction_date,
        description=f"Đảo bút toán {entry.entry_no}",
        source_type="stock_transaction_reversal",
        source_id=tx.id,
        reference_no=tx.transaction_code,
        status="posted",
        posted_at=datetime.utcnow(),
        reversed_entry_id=entry.id,
        created_by=_current_user_id(),
        updated_by=_current_user_id(),
    )
    db.session.add(reversal)
    db.session.flush()

    for index, line in enumerate(entry.lines, start=1):
        db.session.add(
            JournalEntryLine(
                id=generate_datetime_id(),
                journal_entry_id=reversal.id,
                lead_id=lead_id,
                line_no=index,
                account_id=line.account_id,
                account_code=line.account_code,
                account_name=line.account_name,
                partner_type=line.partner_type,
                partner_id=line.partner_id,
                partner_name=line.partner_name,
                description=f"Đảo {line.description or ''}".strip(),
                debit=_round_money(line.credit),
                credit=_round_money(line.debit),
            )
        )
    entry.status = "reversed"
    entry.updated_by = _current_user_id()
    return reversal


def _upsert_trace_links(lead_id: int, tx: StockTransaction):
    targets = []
    if tx.accounting_entry_id:
        targets.append(("journal_entry", tx.accounting_entry_id))
    if tx.reference_type and tx.reference_id:
        targets.append((tx.reference_type, tx.reference_id))
    if tx.task_id:
        targets.append(("task", tx.task_id))
    if tx.project_id:
        targets.append(("workspace", tx.project_id))
    for target_type, target_id in targets:
        exists = AccountingLink.query.filter(
            AccountingLink.deletedAt.is_(None),
            AccountingLink.lead_id == lead_id,
            AccountingLink.source_type == "stock_transaction",
            AccountingLink.source_id == tx.id,
            AccountingLink.target_type == target_type,
            AccountingLink.target_id == target_id,
        ).first()
        if not exists:
            db.session.add(
                AccountingLink(
                    id=generate_datetime_id(),
                    lead_id=lead_id,
                    source_type="stock_transaction",
                    source_id=tx.id,
                    target_type=target_type,
                    target_id=target_id,
                    note=tx.transaction_code,
                    created_by=_current_user_id(),
                    updated_by=_current_user_id(),
                )
            )


def _apply_transaction_to_balance(tx: StockTransaction, item: InventoryItem, reverse=False):
    if tx.transaction_type == "transfer" and tx.destination_warehouse_id:
        source_balance = _find_balance(tx.lead_id, tx.item_id, tx.warehouse_id, lock=True)
        dest_balance = _find_balance(tx.lead_id, tx.item_id, tx.destination_warehouse_id, lock=True)
        factor = -1 if reverse else 1
        quantity = tx.quantity * factor
        issue_cost = _round_money(source_balance.average_cost or item.average_cost or tx.unit_cost)
        total_cost = _round_money(issue_cost * tx.quantity)
        if not reverse and not ALLOW_NEGATIVE_STOCK and source_balance.quantity_on_hand < tx.quantity:
            abort(400, description="Insufficient stock for transfer")
        source_balance.quantity_on_hand = _round_money(source_balance.quantity_on_hand - quantity)
        source_balance.inventory_value = _round_money(source_balance.inventory_value - total_cost * factor)
        source_balance.average_cost = (
            _round_money(source_balance.inventory_value / source_balance.quantity_on_hand)
            if source_balance.quantity_on_hand > 0
            else 0
        )
        dest_balance.quantity_on_hand = _round_money(dest_balance.quantity_on_hand + quantity)
        dest_balance.inventory_value = _round_money(dest_balance.inventory_value + total_cost * factor)
        dest_balance.average_cost = (
            _round_money(dest_balance.inventory_value / dest_balance.quantity_on_hand)
            if dest_balance.quantity_on_hand > 0
            else issue_cost
        )
        tx.balance_after = source_balance.quantity_on_hand
        tx.unit_cost = issue_cost
        tx.total_cost = total_cost
        item.average_cost = dest_balance.average_cost or source_balance.average_cost or item.average_cost
        return issue_cost, total_cost

    balance = _find_balance(tx.lead_id, tx.item_id, tx.warehouse_id, lock=True)
    current_qty = _to_float(balance.quantity_on_hand)
    current_value = _to_float(balance.inventory_value)
    multiplier = -1 if reverse else 1

    if tx.direction == "in":
        quantity = _round_money(tx.quantity * multiplier)
        total_cost = _round_money(tx.total_cost * multiplier)
        new_qty, new_value, new_avg = compute_moving_average(current_qty, current_value, quantity, total_cost)
        balance.quantity_on_hand = new_qty
        balance.inventory_value = max(0, new_value) if new_qty == 0 else new_value
        balance.average_cost = new_avg
        tx.balance_after = new_qty
        item.average_cost = new_avg
        return tx.unit_cost, abs(total_cost)

    if tx.direction == "out":
        issue_cost = resolve_issue_cost(tx.unit_cost, balance.average_cost, item.average_cost, item.standard_cost)
        total_cost = _round_money(issue_cost * tx.quantity)
        quantity_delta = _round_money(tx.quantity * multiplier)
        if not reverse and not ALLOW_NEGATIVE_STOCK and current_qty < tx.quantity:
            abort(400, description="Insufficient stock")
        new_qty = _round_money(current_qty - quantity_delta)
        if new_qty < 0 and not ALLOW_NEGATIVE_STOCK:
            abort(400, description="Negative stock is not allowed")
        new_value = _round_money(current_value - total_cost * multiplier)
        balance.quantity_on_hand = new_qty
        balance.inventory_value = max(0, new_value) if new_qty <= 0 else new_value
        balance.average_cost = _round_money(balance.inventory_value / new_qty) if new_qty > 0 else item.average_cost
        tx.balance_after = new_qty
        tx.unit_cost = issue_cost
        tx.total_cost = total_cost
        return issue_cost, total_cost

    abort(400, description=f"Unsupported transaction direction: {tx.direction}")


def _serialize_tx_with_trace(tx: StockTransaction):
    result = tx.tdict()
    links = AccountingLink.query.filter(
        AccountingLink.deletedAt.is_(None),
        AccountingLink.lead_id == tx.lead_id,
        or_(
            (AccountingLink.source_type == "stock_transaction") & (AccountingLink.source_id == tx.id),
            (AccountingLink.target_type == "stock_transaction") & (AccountingLink.target_id == tx.id),
        ),
    ).all()
    result["trace_links"] = [row.tdict() for row in links]
    return result


def _transaction_query(lead_id: int):
    return StockTransaction.query.filter(
        StockTransaction.deletedAt.is_(None), StockTransaction.lead_id == lead_id
    )


def _build_transaction_payload(data, lead_id: int, current: StockTransaction | None = None):
    item_id = _clean_text(data.get("item_id")) or (current.item_id if current else None)
    warehouse_id = _clean_text(data.get("warehouse_id")) or (current.warehouse_id if current else None)
    tx_type = _validate_choice(
        "transaction_type",
        data.get("transaction_type") or (current.transaction_type if current else None),
        TX_TYPES,
        "purchase_receipt",
    )
    if not item_id or not warehouse_id:
        abort(400, description="item_id and warehouse_id are required")
    item = _find_item(item_id, lead_id)
    if not item.is_active:
        abort(400, description="Item is inactive")
    warehouse = _find_warehouse(warehouse_id, lead_id)
    if warehouse.status != "active":
        abort(400, description="Warehouse is inactive")
    tx_date = _parse_date(data.get("transaction_date")) or (current.transaction_date if current else date.today())
    status = data.get("status") or (current.status if current else "draft")
    quantity = _to_float(data.get("quantity"), current.quantity if current else 0)
    if status != "draft" and quantity <= 0:
        abort(400, description="quantity must be > 0")
    reference_type = _clean_text(data.get("reference_type")) or (current.reference_type if current else None)
    reference_id = _clean_text(data.get("reference_id")) or (current.reference_id if current else None)
    _validate_reference(reference_type, reference_id)
    destination_warehouse_id = _clean_text(data.get("destination_warehouse_id")) or (
        current.destination_warehouse_id if current else None
    )
    if tx_type == "transfer":
        if not destination_warehouse_id:
            abort(400, description="destination_warehouse_id is required for transfer")
        _find_warehouse(destination_warehouse_id, lead_id)
        if destination_warehouse_id == warehouse_id:
            abort(400, description="source and destination warehouse must differ")
    direction = "in" if tx_type in INBOUND_TYPES else "out"
    if tx_type == "transfer":
        direction = "transfer"
    unit_cost = _round_money(
        data.get("unit_cost") if data.get("unit_cost") is not None else (current.unit_cost if current else 0)
    )
    if tx_type in INBOUND_TYPES and unit_cost < 0:
        abort(400, description="unit_cost must be >= 0")
    adjustment_reason_id = _clean_text(data.get("adjustment_reason_id")) or (
        current.adjustment_reason_id if current else None
    )
    if tx_type.startswith("adjustment"):
        _find_reason(lead_id, adjustment_reason_id)
    return {
        "item": item,
        "warehouse": warehouse,
        "transaction_date": tx_date,
        "transaction_type": tx_type,
        "direction": direction,
        "quantity": quantity,
        "unit_cost": unit_cost,
        "warehouse_id": warehouse_id,
        "destination_warehouse_id": destination_warehouse_id,
        "partner_id": _clean_text(data.get("partner_id")) if data.get("partner_id") is not None else (current.partner_id if current else None),
        "partner_name": _clean_text(data.get("partner_name")) if data.get("partner_name") is not None else (current.partner_name if current else None),
        "task_id": _clean_text(data.get("task_id")) if data.get("task_id") is not None else (current.task_id if current else None),
        "project_id": _clean_text(data.get("project_id")) if data.get("project_id") is not None else (current.project_id if current else None),
        "note": _clean_text(data.get("note")) if data.get("note") is not None else (current.note if current else None),
        "reference_type": reference_type,
        "reference_id": reference_id,
        "reference_code": _resolve_reference_code(reference_type, reference_id),
        "source_type": _clean_text(data.get("source_type")) if data.get("source_type") is not None else (current.source_type if current else None),
        "source_id": _clean_text(data.get("source_id")) if data.get("source_id") is not None else (current.source_id if current else None),
        "adjustment_reason_id": adjustment_reason_id,
        "storekeeper_id": _clean_text(data.get("storekeeper_id")) if data.get("storekeeper_id") is not None else (current.storekeeper_id if current else None),
    }


@inventory_bp.route("/bootstrap", methods=["POST"])
def bootstrap_inventory():
    data = request.get_json() or {}
    lead_id = int(data.get("lead_id") or 0)
    _require_lead(lead_id)
    _ensure_inventory_setup(lead_id)
    db.session.commit()
    return jsonify({"message": "ok"}), 200


@inventory_bp.route("/categories", methods=["GET"])
def list_categories():
    lead_id = request.args.get("lead", type=int) or request.args.get("lead_id", type=int)
    _require_lead(lead_id)
    rows = ItemCategory.query.filter(
        ItemCategory.deletedAt.is_(None), ItemCategory.lead_id == lead_id
    ).order_by(ItemCategory.code.asc()).all()
    return jsonify({"data": [row.tdict() for row in rows]}), 200


@inventory_bp.route("/categories", methods=["POST"])
def create_category():
    data = request.get_json() or {}
    lead_id = int(data.get("lead_id") or data.get("lead") or 0)
    _require_lead(lead_id)
    code = (_clean_text(data.get("code")) or "").upper()
    name = _clean_text(data.get("name"))
    if not code or not name:
        abort(400, description="code and name are required")
    exists = ItemCategory.query.filter(
        ItemCategory.deletedAt.is_(None), ItemCategory.lead_id == lead_id, ItemCategory.code == code
    ).first()
    if exists:
        abort(400, description="Category code already exists")
    row = ItemCategory(
        id=generate_datetime_id(),
        lead_id=lead_id,
        code=code,
        name=name,
        description=_clean_text(data.get("description")),
        status=_validate_choice("status", data.get("status"), CATEGORY_STATUS, "active"),
        created_by=_current_user_id(),
        updated_by=_current_user_id(),
    )
    db.session.add(row)
    db.session.commit()
    return jsonify(row.tdict()), 201


@inventory_bp.route("/categories/<string:category_id>", methods=["GET"])
def get_category(category_id: str):
    row = ItemCategory.query.filter(ItemCategory.deletedAt.is_(None), ItemCategory.id == category_id).first()
    if not row:
        abort(404, description="Category not found")
    return jsonify(row.tdict()), 200


@inventory_bp.route("/categories/<string:category_id>", methods=["PUT"])
def update_category(category_id: str):
    data = request.get_json() or {}
    row = ItemCategory.query.filter(ItemCategory.deletedAt.is_(None), ItemCategory.id == category_id).first()
    if not row:
        abort(404, description="Category not found")
    if data.get("name") is not None:
        row.name = _clean_text(data.get("name"))
    if data.get("description") is not None:
        row.description = _clean_text(data.get("description"))
    if data.get("status") is not None:
        row.status = _validate_choice("status", data.get("status"), CATEGORY_STATUS, row.status)
    row.updated_by = _current_user_id()
    db.session.commit()
    return jsonify(row.tdict()), 200


@inventory_bp.route("/categories/<string:category_id>", methods=["DELETE"])
def delete_category(category_id: str):
    row = ItemCategory.query.filter(ItemCategory.deletedAt.is_(None), ItemCategory.id == category_id).first()
    if not row:
        abort(404, description="Category not found")
    linked_item = InventoryItem.query.filter(
        InventoryItem.deletedAt.is_(None), InventoryItem.category_id == category_id
    ).first()
    if linked_item:
        abort(400, description="Category already used by inventory items")
    row.deletedAt = datetime.utcnow()
    row.updated_by = _current_user_id()
    db.session.commit()
    return jsonify({"message": "deleted"}), 200


@inventory_bp.route("/warehouses", methods=["GET"])
def list_warehouses():
    lead_id = request.args.get("lead", type=int) or request.args.get("lead_id", type=int)
    _require_lead(lead_id)
    rows = Warehouse.query.filter(
        Warehouse.deletedAt.is_(None), Warehouse.lead_id == lead_id
    ).order_by(Warehouse.code.asc()).all()
    return jsonify({"data": [row.tdict() for row in rows]}), 200


@inventory_bp.route("/warehouses", methods=["POST"])
def create_warehouse():
    data = request.get_json() or {}
    lead_id = int(data.get("lead_id") or data.get("lead") or 0)
    _require_lead(lead_id)
    code = (_clean_text(data.get("code")) or "").upper()
    name = _clean_text(data.get("name"))
    if not code or not name:
        abort(400, description="code and name are required")
    row = Warehouse(
        id=generate_datetime_id(),
        lead_id=lead_id,
        code=code,
        name=name,
        location=_clean_text(data.get("location")),
        description=_clean_text(data.get("description")),
        status=_validate_choice("status", data.get("status"), WAREHOUSE_STATUS, "active"),
        is_default=_to_bool(data.get("is_default")),
        created_by=_current_user_id(),
        updated_by=_current_user_id(),
    )
    if row.is_default:
        Warehouse.query.filter(
            Warehouse.deletedAt.is_(None), Warehouse.lead_id == lead_id, Warehouse.is_default.is_(True)
        ).update({"is_default": False}, synchronize_session=False)
    db.session.add(row)
    db.session.commit()
    return jsonify(row.tdict()), 201


@inventory_bp.route("/warehouses/<string:warehouse_id>", methods=["GET"])
def get_warehouse(warehouse_id: str):
    row = Warehouse.query.filter(Warehouse.deletedAt.is_(None), Warehouse.id == warehouse_id).first()
    if not row:
        abort(404, description="Warehouse not found")
    return jsonify(row.tdict()), 200


@inventory_bp.route("/warehouses/<string:warehouse_id>", methods=["PUT"])
def update_warehouse(warehouse_id: str):
    data = request.get_json() or {}
    row = Warehouse.query.filter(Warehouse.deletedAt.is_(None), Warehouse.id == warehouse_id).first()
    if not row:
        abort(404, description="Warehouse not found")
    if data.get("name") is not None:
        row.name = _clean_text(data.get("name"))
    if data.get("location") is not None:
        row.location = _clean_text(data.get("location"))
    if data.get("description") is not None:
        row.description = _clean_text(data.get("description"))
    if data.get("status") is not None:
        row.status = _validate_choice("status", data.get("status"), WAREHOUSE_STATUS, row.status)
    if data.get("is_default") is not None and _to_bool(data.get("is_default")):
        Warehouse.query.filter(
            Warehouse.deletedAt.is_(None), Warehouse.lead_id == row.lead_id, Warehouse.is_default.is_(True)
        ).update({"is_default": False}, synchronize_session=False)
        row.is_default = True
    row.updated_by = _current_user_id()
    db.session.commit()
    return jsonify(row.tdict()), 200


@inventory_bp.route("/warehouses/<string:warehouse_id>", methods=["DELETE"])
def delete_warehouse(warehouse_id: str):
    row = Warehouse.query.filter(Warehouse.deletedAt.is_(None), Warehouse.id == warehouse_id).first()
    if not row:
        abort(404, description="Warehouse not found")
    exists_tx = StockTransaction.query.filter(
        StockTransaction.deletedAt.is_(None), StockTransaction.warehouse_id == warehouse_id
    ).first()
    if exists_tx:
        abort(400, description="Warehouse already has transactions")
    row.deletedAt = datetime.utcnow()
    row.updated_by = _current_user_id()
    db.session.commit()
    return jsonify({"message": "deleted"}), 200


@inventory_bp.route("/items", methods=["GET"])
def list_items():
    lead_id = request.args.get("lead", type=int) or request.args.get("lead_id", type=int)
    _require_lead(lead_id)
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 50, type=int)
    search = _clean_text(request.args.get("search"))
    category_id = _clean_text(request.args.get("category_id"))
    warehouse_id = _clean_text(request.args.get("warehouse_id"))
    status = _clean_text(request.args.get("status"))
    query = InventoryItem.query.filter(InventoryItem.deletedAt.is_(None), InventoryItem.lead_id == lead_id)
    if search:
        keyword = f"%{search}%"
        query = query.filter(
            or_(
                InventoryItem.name.ilike(keyword),
                InventoryItem.code.ilike(keyword),
                InventoryItem.sku.ilike(keyword),
                InventoryItem.default_supplier_name.ilike(keyword),
            )
        )
    if category_id:
        query = query.filter(InventoryItem.category_id == category_id)
    if status == "active":
        query = query.filter(InventoryItem.is_active.is_(True))
    elif status == "inactive":
        query = query.filter(InventoryItem.is_active.is_(False))
    pagination = query.order_by(InventoryItem.code.asc()).paginate(page=page, per_page=limit, error_out=False)
    rows = []
    for item in pagination.items:
        payload = item.tdict()
        balances_query = InventoryBalance.query.filter(
            InventoryBalance.deletedAt.is_(None), InventoryBalance.lead_id == lead_id, InventoryBalance.item_id == item.id
        )
        if warehouse_id:
            balances_query = balances_query.filter(InventoryBalance.warehouse_id == warehouse_id)
        balances = balances_query.all()
        payload["quantity_on_hand"] = _round_money(sum(_to_float(row.quantity_on_hand) for row in balances))
        payload["inventory_value"] = _round_money(sum(_to_float(row.inventory_value) for row in balances))
        payload["below_min_stock"] = payload["quantity_on_hand"] < _to_float(item.min_stock_level)
        rows.append(payload)
    return jsonify(
        {
            "data": rows,
            "pagination": {
                "page": page,
                "per_page": limit,
                "total": pagination.total,
                "pages": pagination.pages,
            },
        }
    ), 200


@inventory_bp.route("/items", methods=["POST"])
def create_item():
    data = request.get_json() or {}
    lead_id = int(data.get("lead_id") or data.get("lead") or 0)
    _require_lead(lead_id)
    _ensure_inventory_setup(lead_id)
    code = (_clean_text(data.get("code")) or "").upper()
    name = _clean_text(data.get("name"))
    if not code or not name:
        abort(400, description="code and name are required")
    if InventoryItem.query.filter(
        InventoryItem.deletedAt.is_(None), InventoryItem.lead_id == lead_id, InventoryItem.code == code
    ).first():
        abort(400, description="Item code already exists")
    sku = _clean_text(data.get("sku"))
    if sku and InventoryItem.query.filter(
        InventoryItem.deletedAt.is_(None), InventoryItem.lead_id == lead_id, InventoryItem.sku == sku
    ).first():
        abort(400, description="SKU already exists")
    category_id = _clean_text(data.get("category_id"))
    if category_id:
        ItemCategory.query.filter(
            ItemCategory.deletedAt.is_(None), ItemCategory.id == category_id, ItemCategory.lead_id == lead_id
        ).first() or abort(404, description="Category not found")
    default_warehouse_id = _clean_text(data.get("default_warehouse_id"))
    if default_warehouse_id:
        _find_warehouse(default_warehouse_id, lead_id)
    row = InventoryItem(
        id=generate_datetime_id(),
        lead_id=lead_id,
        code=code,
        name=name,
        sku=sku,
        category_id=category_id,
        item_type=_validate_choice("item_type", data.get("item_type"), ITEM_TYPES, "raw_material"),
        unit=_clean_text(data.get("unit")) or "cái",
        default_supplier_id=_clean_text(data.get("default_supplier_id")),
        default_supplier_name=_clean_text(data.get("default_supplier_name")),
        default_warehouse_id=default_warehouse_id,
        standard_cost=_round_money(data.get("standard_cost")),
        average_cost=_round_money(data.get("average_cost")),
        min_stock_level=_to_float(data.get("min_stock_level"), 0),
        is_active=_to_bool(data.get("is_active"), True),
        note=_clean_text(data.get("note")),
        created_by=_current_user_id(),
        updated_by=_current_user_id(),
        spec_rows=data.get("spec_rows") or [],
        # 3D material properties
        diffuse=_clean_text(data.get("diffuse")) or "#ffffff",
        reflection=_to_float(data.get("reflection"), 0.0),
        glossy=_to_float(data.get("glossy"), 0.0),
        refraction=_to_float(data.get("refraction"), 1.0),
        transparent=_to_bool(data.get("transparent"), False),
        bump=_to_bool(data.get("bump"), False),
        displacement=_to_bool(data.get("displacement"), False),
        metalness=_to_float(data.get("metalness"), 0.0),
        roughness=_to_float(data.get("roughness"), 1.0),
        emissive=_clean_text(data.get("emissive")) or "#000000",
        emissive_intensity=_to_float(data.get("emissive_intensity") or data.get("emissiveIntensity"), 0.0),
        opacity=_to_float(data.get("opacity"), 1.0),
    )
    db.session.add(row)
    db.session.commit()
    return jsonify(row.tdict()), 201


@inventory_bp.route("/items/<string:item_id>", methods=["GET"])
def get_item(item_id: str):
    item = InventoryItem.query.filter(InventoryItem.deletedAt.is_(None), InventoryItem.id == item_id).first()
    if not item:
        abort(404, description="Item not found")
    payload = item.tdict()
    payload["balances"] = [
        row.tdict()
        for row in InventoryBalance.query.filter(
            InventoryBalance.deletedAt.is_(None), InventoryBalance.item_id == item.id
        ).all()
    ]
    return jsonify(payload), 200


@inventory_bp.route("/items/<string:item_id>", methods=["PUT"])
def update_item(item_id: str):
    data = request.get_json() or {}
    item = InventoryItem.query.filter(InventoryItem.deletedAt.is_(None), InventoryItem.id == item_id).first()
    if not item:
        abort(404, description="Item not found")
    if data.get("code") is not None:
        code = (_clean_text(data.get("code")) or "").upper()
        if not code:
            abort(400, description="code is required")
        if InventoryItem.query.filter(
            InventoryItem.deletedAt.is_(None),
            InventoryItem.lead_id == item.lead_id,
            InventoryItem.code == code,
            InventoryItem.id != item.id,
        ).first():
            abort(400, description="Item code already exists")
        item.code = code
    if data.get("name") is not None:
        item.name = _clean_text(data.get("name"))
    if data.get("sku") is not None:
        sku = _clean_text(data.get("sku"))
        if sku and InventoryItem.query.filter(
            InventoryItem.deletedAt.is_(None),
            InventoryItem.lead_id == item.lead_id,
            InventoryItem.sku == sku,
            InventoryItem.id != item.id,
        ).first():
            abort(400, description="SKU already exists")
        item.sku = sku
    if data.get("category_id") is not None:
        category_id = _clean_text(data.get("category_id"))
        if category_id:
            ItemCategory.query.filter(
                ItemCategory.deletedAt.is_(None),
                ItemCategory.id == category_id,
                ItemCategory.lead_id == item.lead_id,
            ).first() or abort(404, description="Category not found")
        item.category_id = category_id
    if data.get("item_type") is not None:
        item.item_type = _validate_choice("item_type", data.get("item_type"), ITEM_TYPES, item.item_type)
    if data.get("unit") is not None:
        item.unit = _clean_text(data.get("unit")) or item.unit
    if data.get("default_supplier_id") is not None:
        item.default_supplier_id = _clean_text(data.get("default_supplier_id"))
    if data.get("default_supplier_name") is not None:
        item.default_supplier_name = _clean_text(data.get("default_supplier_name"))
    if data.get("default_warehouse_id") is not None:
        default_warehouse_id = _clean_text(data.get("default_warehouse_id"))
        if default_warehouse_id:
            _find_warehouse(default_warehouse_id, item.lead_id)
        item.default_warehouse_id = default_warehouse_id
    if data.get("standard_cost") is not None:
        item.standard_cost = _round_money(data.get("standard_cost"))
    if data.get("average_cost") is not None:
        item.average_cost = _round_money(data.get("average_cost"))
    if data.get("min_stock_level") is not None:
        item.min_stock_level = _to_float(data.get("min_stock_level"), item.min_stock_level)
    if data.get("is_active") is not None:
        item.is_active = _to_bool(data.get("is_active"), item.is_active)
    if data.get("note") is not None:
        item.note = _clean_text(data.get("note"))
    if "spec_rows" in data:
        item.spec_rows = data.get("spec_rows") or []
    if data.get("preview_material") is not None:
        item.preview_material = _clean_text(data.get("preview_material")) or "lumion_standard"
    
    # 3D material properties
    if "diffuse" in data:
        item.diffuse = _clean_text(data.get("diffuse"))
    if "reflection" in data:
        item.reflection = _to_float(data.get("reflection"), item.reflection)
    if "glossy" in data:
        item.glossy = _to_float(data.get("glossy"), item.glossy)
    if "refraction" in data:
        item.refraction = _to_float(data.get("refraction"), item.refraction)
    if "transparent" in data:
        item.transparent = _to_bool(data.get("transparent"), item.transparent)
    if "bump" in data:
        item.bump = _to_bool(data.get("bump"), item.bump)
    if "displacement" in data:
        item.displacement = _to_bool(data.get("displacement"), item.displacement)
    if "metalness" in data:
        item.metalness = _to_float(data.get("metalness"), item.metalness)
    if "roughness" in data:
        item.roughness = _to_float(data.get("roughness"), item.roughness)
    if "emissive" in data:
        item.emissive = _clean_text(data.get("emissive"))
    if "emissive_intensity" in data or "emissiveIntensity" in data:
        item.emissive_intensity = _to_float(data.get("emissive_intensity") or data.get("emissiveIntensity"), item.emissive_intensity)
    if "opacity" in data:
        item.opacity = _to_float(data.get("opacity"), item.opacity)

    item.updated_by = _current_user_id()
    db.session.commit()
    return jsonify(item.tdict()), 200


@inventory_bp.route("/items/<string:item_id>/status", methods=["PATCH"])
def patch_item_status(item_id: str):
    data = request.get_json() or {}
    lead_id = int(data.get("lead_id") or data.get("lead") or 0)
    item = _find_item(item_id, lead_id)
    item.is_active = _to_bool(data.get("is_active"), item.is_active)
    item.updated_by = _current_user_id()
    db.session.commit()
    return jsonify(item.tdict()), 200


@inventory_bp.route("/items/<string:item_id>", methods=["DELETE"])
def delete_item(item_id: str):
    item = InventoryItem.query.filter(InventoryItem.deletedAt.is_(None), InventoryItem.id == item_id).first()
    if not item:
        abort(404, description="Item not found")
    exists_tx = StockTransaction.query.filter(
        StockTransaction.deletedAt.is_(None), StockTransaction.item_id == item_id
    ).first()
    if exists_tx:
        abort(400, description="Item already has stock transactions")
    item.deletedAt = datetime.utcnow()
    item.updated_by = _current_user_id()
    db.session.commit()
    return jsonify({"message": "deleted"}), 200


@inventory_bp.route("/transactions", methods=["GET"])
def list_transactions():
    lead_id = request.args.get("lead", type=int) or request.args.get("lead_id", type=int)
    _require_lead(lead_id)
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 20, type=int)
    status = _clean_text(request.args.get("status"))
    tx_type = _clean_text(request.args.get("transaction_type"))
    warehouse_id = _clean_text(request.args.get("warehouse_id"))
    item_id = _clean_text(request.args.get("item_id"))
    search = _clean_text(request.args.get("search"))
    storekeeper_id = _clean_text(request.args.get("storekeeper_id"))
    from_date = _parse_date(request.args.get("from_date"))
    to_date = _parse_date(request.args.get("to_date"))
    query = _transaction_query(lead_id)
    if status:
        query = query.filter(StockTransaction.status == status)
    if tx_type:
        query = query.filter(StockTransaction.transaction_type == tx_type)
    if warehouse_id:
        query = query.filter(StockTransaction.warehouse_id == warehouse_id)
    if item_id:
        query = query.filter(StockTransaction.item_id == item_id)
    if storekeeper_id:
        query = query.filter(StockTransaction.storekeeper_id == storekeeper_id)
    if from_date:
        query = query.filter(StockTransaction.transaction_date >= from_date)
    if to_date:
        query = query.filter(StockTransaction.transaction_date <= to_date)
    if search:
        keyword = f"%{search}%"
        query = query.filter(
            or_(
                StockTransaction.transaction_code.ilike(keyword),
                StockTransaction.partner_name.ilike(keyword),
                StockTransaction.reference_code.ilike(keyword),
                StockTransaction.note.ilike(keyword),
            )
        )
    pagination = query.order_by(StockTransaction.transaction_date.desc(), StockTransaction.createdAt.desc()).paginate(
        page=page, per_page=limit, error_out=False
    )
    return jsonify(
        {
            "data": [row.tdict() for row in pagination.items],
            "pagination": {
                "page": page,
                "per_page": limit,
                "total": pagination.total,
                "pages": pagination.pages,
            },
        }
    ), 200


@inventory_bp.route("/transactions", methods=["POST"])
def create_transaction():
    data = request.get_json() or {}
    lead_id = int(data.get("lead_id") or data.get("lead") or 0)
    _require_lead(lead_id)
    _ensure_inventory_setup(lead_id)
    payload = _build_transaction_payload(data, lead_id)
    tx = StockTransaction(
        id=generate_datetime_id(),
        lead_id=lead_id,
        transaction_code=_clean_text(data.get("transaction_code"))
        or _build_code("STK", payload["transaction_date"], StockTransaction, lead_id, "transaction_code"),
        transaction_date=payload["transaction_date"],
        transaction_type=payload["transaction_type"],
        status="draft",
        warehouse_id=payload["warehouse_id"],
        destination_warehouse_id=payload["destination_warehouse_id"],
        item_id=payload["item"].id,
        quantity=payload["quantity"],
        unit_cost=payload["unit_cost"],
        total_cost=_round_money(payload["quantity"] * payload["unit_cost"]),
        direction=payload["direction"],
        partner_id=payload["partner_id"],
        partner_name=payload["partner_name"],
        task_id=payload["task_id"],
        project_id=payload["project_id"],
        note=payload["note"],
        reference_type=payload["reference_type"],
        reference_id=payload["reference_id"],
        reference_code=payload["reference_code"],
        source_type=payload["source_type"],
        source_id=payload["source_id"],
        adjustment_reason_id=payload["adjustment_reason_id"],
        storekeeper_id=payload["storekeeper_id"],
        created_by=_current_user_id(),
        updated_by=_current_user_id(),
    )
    db.session.add(tx)
    db.session.commit()
    return jsonify(tx.tdict()), 201


@inventory_bp.route("/transactions/<string:transaction_id>", methods=["GET"])
def get_transaction(transaction_id: str):
    tx = StockTransaction.query.filter(StockTransaction.deletedAt.is_(None), StockTransaction.id == transaction_id).first()
    if not tx:
        abort(404, description="Transaction not found")
    return jsonify(_serialize_tx_with_trace(tx)), 200


@inventory_bp.route("/transactions/<string:transaction_id>", methods=["PUT"])
def update_transaction(transaction_id: str):
    tx = StockTransaction.query.filter(StockTransaction.deletedAt.is_(None), StockTransaction.id == transaction_id).first()
    if not tx:
        abort(404, description="Transaction not found")
    if tx.status != "draft":
        abort(400, description="Only draft transaction can be updated")
    data = request.get_json() or {}
    payload = _build_transaction_payload(data, tx.lead_id, tx)
    tx.transaction_date = payload["transaction_date"]
    tx.transaction_type = payload["transaction_type"]
    tx.direction = payload["direction"]
    tx.warehouse_id = payload["warehouse_id"]
    tx.destination_warehouse_id = payload["destination_warehouse_id"]
    tx.item_id = payload["item"].id
    tx.quantity = payload["quantity"]
    tx.unit_cost = payload["unit_cost"]
    tx.total_cost = _round_money(payload["quantity"] * payload["unit_cost"])
    tx.partner_id = payload["partner_id"]
    tx.partner_name = payload["partner_name"]
    tx.task_id = payload["task_id"]
    tx.project_id = payload["project_id"]
    tx.note = payload["note"]
    tx.reference_type = payload["reference_type"]
    tx.reference_id = payload["reference_id"]
    tx.reference_code = payload["reference_code"]
    tx.source_type = payload["source_type"]
    tx.source_id = payload["source_id"]
    tx.adjustment_reason_id = payload["adjustment_reason_id"]
    tx.storekeeper_id = payload["storekeeper_id"]
    tx.updated_by = _current_user_id()
    db.session.commit()
    return jsonify(tx.tdict()), 200


@inventory_bp.route("/transactions/<string:transaction_id>/confirm", methods=["POST"])
def confirm_transaction(transaction_id: str):
    tx = StockTransaction.query.filter(StockTransaction.deletedAt.is_(None), StockTransaction.id == transaction_id).first()
    if not tx:
        abort(404, description="Transaction not found")
    if tx.status != "draft":
        abort(400, description="Only draft transaction can be confirmed")
    if tx.quantity <= 0:
        abort(400, description="quantity must be > 0 to confirm")

    _ensure_inventory_setup(tx.lead_id)
    item = _find_item(tx.item_id, tx.lead_id)
    mapping = _find_mapping(tx.lead_id, item)
    reason = _find_reason(tx.lead_id, tx.adjustment_reason_id) if tx.adjustment_reason_id else None

    try:
        unit_cost, total_cost = _apply_transaction_to_balance(tx, item, reverse=False)
        tx.unit_cost = _round_money(unit_cost)
        tx.total_cost = _round_money(total_cost)
        lines = _journal_lines_for_transaction(item, tx, mapping, reason)
        entry = _create_journal_entry(tx.lead_id, tx, lines)
        tx.accounting_entry_id = entry.id if entry else None
        tx.status = "confirmed"
        tx.confirmed_at = datetime.utcnow()
        tx.approved_by = _current_user_id()
        tx.updated_by = _current_user_id()
        _upsert_trace_links(tx.lead_id, tx)
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise

    return jsonify(_serialize_tx_with_trace(tx)), 200


@inventory_bp.route("/transactions/<string:transaction_id>/cancel", methods=["POST"])
def cancel_transaction(transaction_id: str):
    tx = StockTransaction.query.filter(StockTransaction.deletedAt.is_(None), StockTransaction.id == transaction_id).first()
    if not tx:
        abort(404, description="Transaction not found")
    if tx.status == "cancelled":
        abort(400, description="Transaction already cancelled")

    if tx.status == "draft":
        tx.status = "cancelled"
        tx.cancelled_at = datetime.utcnow()
        tx.updated_by = _current_user_id()
        db.session.commit()
        return jsonify(tx.tdict()), 200

    item = _find_item(tx.item_id, tx.lead_id)
    try:
        reversal = StockTransaction(
            id=generate_datetime_id(),
            lead_id=tx.lead_id,
            transaction_code=_build_code("RVSTK", date.today(), StockTransaction, tx.lead_id, "transaction_code"),
            transaction_date=date.today(),
            transaction_type=tx.transaction_type,
            status="confirmed",
            warehouse_id=tx.warehouse_id,
            destination_warehouse_id=tx.destination_warehouse_id,
            item_id=tx.item_id,
            quantity=tx.quantity,
            unit_cost=tx.unit_cost,
            total_cost=tx.total_cost,
            direction=tx.direction,
            partner_id=tx.partner_id,
            partner_name=tx.partner_name,
            task_id=tx.task_id,
            project_id=tx.project_id,
            note=f"Đảo giao dịch {tx.transaction_code}",
            reference_type="stock_transaction",
            reference_id=tx.id,
            reference_code=tx.transaction_code,
            source_type="stock_transaction_cancel",
            source_id=tx.id,
            adjustment_reason_id=tx.adjustment_reason_id,
            storekeeper_id=tx.storekeeper_id,
            reversal_transaction_id=tx.id,
            confirmed_at=datetime.utcnow(),
            created_by=_current_user_id(),
            approved_by=_current_user_id(),
            updated_by=_current_user_id(),
        )
        db.session.add(reversal)
        db.session.flush()
        _apply_transaction_to_balance(reversal, item, reverse=True)
        original_entry = db.session.get(JournalEntry, tx.accounting_entry_id) if tx.accounting_entry_id else None
        reversal_entry = _reverse_journal_entry(original_entry, tx.lead_id, reversal)
        reversal.accounting_entry_id = reversal_entry.id if reversal_entry else None
        tx.status = "cancelled"
        tx.cancelled_at = datetime.utcnow()
        tx.reversal_transaction_id = reversal.id
        tx.updated_by = _current_user_id()
        _upsert_trace_links(reversal.lead_id, reversal)
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    return jsonify(_serialize_tx_with_trace(tx)), 200


@inventory_bp.route("/balances", methods=["GET"])
def get_balances():
    lead_id = request.args.get("lead", type=int) or request.args.get("lead_id", type=int)
    _require_lead(lead_id)
    warehouse_id = _clean_text(request.args.get("warehouse_id"))
    item_id = _clean_text(request.args.get("item_id"))
    query = InventoryBalance.query.filter(
        InventoryBalance.deletedAt.is_(None), InventoryBalance.lead_id == lead_id
    )
    if warehouse_id:
        query = query.filter(InventoryBalance.warehouse_id == warehouse_id)
    if item_id:
        query = query.filter(InventoryBalance.item_id == item_id)
    rows = []
    for row in query.order_by(InventoryBalance.updatedAt.desc()).all():
        payload = row.tdict()
        if row.item:
            payload["item_name"] = row.item.name
            payload["item_code"] = row.item.code
            payload["unit"] = row.item.unit
            payload["min_stock_level"] = row.item.min_stock_level
            payload["below_min_stock"] = _to_float(row.quantity_on_hand) < _to_float(row.item.min_stock_level)
        if row.warehouse:
            payload["warehouse_name"] = row.warehouse.name
        rows.append(payload)
    return jsonify({"data": rows}), 200


@inventory_bp.route("/stock-card", methods=["GET"])
def get_stock_card():
    lead_id = request.args.get("lead", type=int) or request.args.get("lead_id", type=int)
    item_id = _clean_text(request.args.get("item_id"))
    warehouse_id = _clean_text(request.args.get("warehouse_id"))
    from_date = _parse_date(request.args.get("from_date"))
    to_date = _parse_date(request.args.get("to_date"))
    _require_lead(lead_id)
    if not item_id:
        abort(400, description="item_id is required")
    query = _transaction_query(lead_id).filter(StockTransaction.item_id == item_id, StockTransaction.status == "confirmed")
    if warehouse_id:
        query = query.filter(StockTransaction.warehouse_id == warehouse_id)
    if from_date:
        query = query.filter(StockTransaction.transaction_date >= from_date)
    if to_date:
        query = query.filter(StockTransaction.transaction_date <= to_date)
    rows = []
    running_balance = 0.0
    for row in query.order_by(StockTransaction.transaction_date.asc(), StockTransaction.createdAt.asc()).all():
        stock_in = row.quantity if row.direction == "in" else 0
        stock_out = row.quantity if row.direction == "out" else 0
        running_balance = _round_money(row.balance_after if row.balance_after is not None else running_balance + stock_in - stock_out)
        payload = row.tdict()
        payload["stock_in"] = stock_in
        payload["stock_out"] = stock_out
        payload["running_balance"] = running_balance
        rows.append(payload)
    return jsonify({"data": rows}), 200


@inventory_bp.route("/movement-report", methods=["GET"])
def movement_report():
    lead_id = request.args.get("lead", type=int) or request.args.get("lead_id", type=int)
    _require_lead(lead_id)
    from_date = _parse_date(request.args.get("from_date"))
    to_date = _parse_date(request.args.get("to_date"))
    query = _transaction_query(lead_id).filter(StockTransaction.status == "confirmed")
    if from_date:
        query = query.filter(StockTransaction.transaction_date >= from_date)
    if to_date:
        query = query.filter(StockTransaction.transaction_date <= to_date)
    grouped = defaultdict(lambda: {"stock_in": 0.0, "stock_out": 0.0, "value_in": 0.0, "value_out": 0.0})
    for row in query.all():
        key = row.item_id
        if row.direction == "in":
            grouped[key]["stock_in"] += _to_float(row.quantity)
            grouped[key]["value_in"] += _to_float(row.total_cost)
        elif row.direction == "out":
            grouped[key]["stock_out"] += _to_float(row.quantity)
            grouped[key]["value_out"] += _to_float(row.total_cost)
    result = []
    for item_id, values in grouped.items():
        item = db.session.get(InventoryItem, item_id)
        result.append(
            {
                "item_id": item_id,
                "item_code": item.code if item else None,
                "item_name": item.name if item else None,
                "unit": item.unit if item else None,
                "stock_in": _round_money(values["stock_in"]),
                "stock_out": _round_money(values["stock_out"]),
                "value_in": _round_money(values["value_in"]),
                "value_out": _round_money(values["value_out"]),
            }
        )
    return jsonify({"data": result}), 200


@inventory_bp.route("/valuation-report", methods=["GET"])
def valuation_report():
    lead_id = request.args.get("lead", type=int) or request.args.get("lead_id", type=int)
    _require_lead(lead_id)
    balances = InventoryBalance.query.filter(
        InventoryBalance.deletedAt.is_(None), InventoryBalance.lead_id == lead_id
    ).all()
    rows = []
    for balance in balances:
        rows.append(
            {
                "item_id": balance.item_id,
                "item_code": balance.item.code if balance.item else None,
                "item_name": balance.item.name if balance.item else None,
                "warehouse_id": balance.warehouse_id,
                "warehouse_name": balance.warehouse.name if balance.warehouse else None,
                "quantity_on_hand": _round_money(balance.quantity_on_hand),
                "average_cost": _round_money(balance.average_cost),
                "inventory_value": _round_money(balance.inventory_value),
            }
        )
    return jsonify({"data": rows}), 200


@inventory_bp.route("/summary", methods=["GET"])
def inventory_summary():
    lead_id = request.args.get("lead", type=int) or request.args.get("lead_id", type=int)
    month = request.args.get("month", type=str)
    _require_lead(lead_id)
    query_items = InventoryItem.query.filter(
        InventoryItem.deletedAt.is_(None), InventoryItem.lead_id == lead_id, InventoryItem.is_active.is_(True)
    )
    balances = InventoryBalance.query.filter(
        InventoryBalance.deletedAt.is_(None), InventoryBalance.lead_id == lead_id
    ).all()
    tx_query = _transaction_query(lead_id)
    if month and len(month) == 7:
        start_date = _parse_date(month)
        if start_date:
            next_month = (start_date.replace(day=28) + timedelta(days=4)).replace(day=1)
            tx_query = tx_query.filter(
                StockTransaction.transaction_date >= start_date,
                StockTransaction.transaction_date < next_month,
            )
    below_min = 0
    balance_by_item = defaultdict(float)
    total_value = 0.0
    for balance in balances:
        balance_by_item[balance.item_id] += _to_float(balance.quantity_on_hand)
        total_value += _to_float(balance.inventory_value)
    for item in query_items.all():
        if balance_by_item[item.id] < _to_float(item.min_stock_level):
            below_min += 1
    return jsonify(
        {
            "active_items": query_items.count(),
            "transaction_count": tx_query.count(),
            "total_inventory_value": _round_money(total_value),
            "below_min_stock_count": below_min,
        }
    ), 200


@inventory_bp.route("/trace", methods=["GET"])
def inventory_trace():
    lead_id = request.args.get("lead", type=int) or request.args.get("lead_id", type=int)
    source_type = _clean_text(request.args.get("source_type"))
    source_id = _clean_text(request.args.get("source_id"))
    _require_lead(lead_id)
    if not source_type or not source_id:
        abort(400, description="source_type and source_id are required")
    links = AccountingLink.query.filter(
        AccountingLink.deletedAt.is_(None),
        AccountingLink.lead_id == lead_id,
        or_(
            (AccountingLink.source_type == source_type) & (AccountingLink.source_id == source_id),
            (AccountingLink.target_type == source_type) & (AccountingLink.target_id == source_id),
        ),
    ).all()
    return jsonify({"data": [row.tdict() for row in links]}), 200


@inventory_bp.route("/items/<string:item_id>/messages", methods=["GET"])
def get_item_messages(item_id):
    messages = Message.query.filter(Message.task_id == item_id).order_by(Message.createdAt.asc()).all()
    return jsonify({"messages": [m.tdict() for m in messages]}), 200


@inventory_bp.route("/items/<string:item_id>/message", methods=["POST"])
def post_item_message(item_id):
    user_id = request.form.get("user_id") or _current_user_id()
    type = request.form.get("type") or "material"
    text = request.form.get("text")
    file_url = request.form.get("file_url")

    item = InventoryItem.query.get(item_id)
    if not item:
        abort(404, description="Item not found")

    message = Message.create_item({
        "message_id": generate_datetime_id(),
        "type": type,
        "user_id": user_id,
        "task_id": item_id,
        "text": text,
        "file_url": file_url,
        "lead_id": item.lead_id
    })
    db.session.commit()
    return jsonify({"message": message.tdict()}), 200
