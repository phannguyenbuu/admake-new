import pathlib
import sys
import unittest
from datetime import date
from types import SimpleNamespace
from werkzeug.exceptions import HTTPException

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

try:
    from api.inventory import (
        compute_moving_average,
        resolve_issue_cost,
        _journal_lines_for_transaction,
        _validate_choice,
        _validate_reference,
        _parse_date,
        _to_bool,
    )
except ModuleNotFoundError:
    compute_moving_average = None  # type: ignore
    resolve_issue_cost = None  # type: ignore
    _journal_lines_for_transaction = None  # type: ignore
    _validate_choice = None  # type: ignore
    _validate_reference = None  # type: ignore
    _parse_date = None  # type: ignore
    _to_bool = None  # type: ignore


class DummyItem:
    item_type = "raw_material"


class DummyTx:
    def __init__(self, transaction_type: str, total_cost: float, note: str = ""):
        self.transaction_type = transaction_type
        self.total_cost = total_cost
        self.note = note
        self.partner_id = None
        self.partner_name = None
        self.quantity = 1


class DummyMapping:
    inventory_account_code = "152"
    cash_account_code = "111"
    ap_account_code = "331"
    cogs_account_code = "632"
    expense_account_code = "621"
    adjustment_gain_account_code = "711"
    adjustment_loss_account_code = "811"
    wip_account_code = "154"


@unittest.skipIf(compute_moving_average is None, "backend dependencies are not installed")
class InventoryLogicTest(unittest.TestCase):
    def test_compute_moving_average(self):
        qty, value, avg = compute_moving_average(10, 1000, 5, 750)
        self.assertEqual(qty, 15)
        self.assertEqual(value, 1750)
        self.assertEqual(avg, round(1750 / 15, 2))
        qty, value, avg = compute_moving_average(0, 0, 0, 0)
        self.assertEqual((qty, value, avg), (0, 0, 0))

    def test_resolve_issue_cost_priority(self):
        self.assertEqual(resolve_issue_cost(120, 100, 90, 80), 120)
        self.assertEqual(resolve_issue_cost(0, 100, 90, 80), 100)
        self.assertEqual(resolve_issue_cost(0, 0, 90, 80), 90)
        self.assertEqual(resolve_issue_cost(0, 0, 0, 80), 80)

    def test_validate_choice(self):
        self.assertEqual(_validate_choice("tx", "purchase_receipt", ["purchase_receipt", "sales_issue"]), "purchase_receipt")
        self.assertEqual(_validate_choice("tx", None, ["purchase_receipt", "sales_issue"], "sales_issue"), "sales_issue")
        with self.assertRaises(HTTPException) as context:
            _validate_choice("tx", "invalid", ["purchase_receipt", "sales_issue"])
        self.assertEqual(context.exception.code, 400)

    def test_validate_reference(self):
        self.assertIsNone(_validate_reference(None, None))
        with self.assertRaises(HTTPException):
            _validate_reference("document", None)
        with self.assertRaises(HTTPException):
            _validate_reference("invalid", "123")

    def test_parse_date_and_bool(self):
        self.assertEqual(_parse_date("2026-03-11"), date(2026, 3, 11))
        self.assertEqual(_parse_date("11/03/2026"), date(2026, 3, 11))
        self.assertEqual(_parse_date("2026-03"), date(2026, 3, 1))
        self.assertIsNone(_parse_date("abc"))
        self.assertTrue(_to_bool("true"))
        self.assertTrue(_to_bool("1"))
        self.assertFalse(_to_bool("false"))
        self.assertFalse(_to_bool(None))

    def test_purchase_receipt_journal_lines_balanced(self):
        lines = _journal_lines_for_transaction(DummyItem(), DummyTx("purchase_receipt", 1500), DummyMapping(), None)
        self.assertEqual(len(lines), 2)
        self.assertEqual(sum(line["debit"] for line in lines), 1500)
        self.assertEqual(sum(line["credit"] for line in lines), 1500)
        self.assertEqual(lines[0]["account_code"], "152")
        self.assertEqual(lines[1]["account_code"], "331")

    def test_task_issue_uses_wip_account(self):
        lines = _journal_lines_for_transaction(DummyItem(), DummyTx("task_issue", 900), DummyMapping(), None)
        self.assertEqual(lines[0]["account_code"], "154")
        self.assertEqual(lines[1]["account_code"], "152")

    def test_sales_issue_journal_lines(self):
        lines = _journal_lines_for_transaction(DummyItem(), DummyTx("sales_issue", 1800), DummyMapping(), None)
        self.assertEqual(lines[0]["account_code"], "632")
        self.assertEqual(lines[1]["account_code"], "152")
        self.assertEqual(sum(line["debit"] for line in lines), sum(line["credit"] for line in lines))

    def test_adjustment_lines_with_reason_mapping(self):
        reason = SimpleNamespace(accounting_mapping={"credit_account_code": "3387", "debit_account_code": "1381"})
        increase_lines = _journal_lines_for_transaction(DummyItem(), DummyTx("adjustment_increase", 500), DummyMapping(), reason)
        decrease_lines = _journal_lines_for_transaction(DummyItem(), DummyTx("adjustment_decrease", 500), DummyMapping(), reason)
        self.assertEqual(increase_lines[1]["account_code"], "3387")
        self.assertEqual(decrease_lines[0]["account_code"], "1381")

    def test_zero_amount_journal_lines_return_empty(self):
        lines = _journal_lines_for_transaction(DummyItem(), DummyTx("purchase_receipt", 0), DummyMapping(), None)
        self.assertEqual(lines, [])


if __name__ == "__main__":
    unittest.main()
