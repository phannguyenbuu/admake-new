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
    from api.accounting_erp import (
        _build_ar_invoice_snapshot,
        compute_aging_bucket,
        validate_journal_balance,
        _recompute_receivable_status,
        _tax_amount,
        _period_bounds,
        _validate_enum,
        _cash_account_by_method,
        _aging_summary,
        _parse_date,
    )
except ModuleNotFoundError:
    compute_aging_bucket = None  # type: ignore
    _build_ar_invoice_snapshot = None  # type: ignore
    validate_journal_balance = None  # type: ignore
    _recompute_receivable_status = None  # type: ignore
    _tax_amount = None  # type: ignore
    _period_bounds = None  # type: ignore
    _validate_enum = None  # type: ignore
    _cash_account_by_method = None  # type: ignore
    _aging_summary = None  # type: ignore
    _parse_date = None  # type: ignore


@unittest.skipIf(compute_aging_bucket is None, "backend dependencies are not installed")
class AccountingErpLogicTest(unittest.TestCase):
    def test_compute_aging_bucket(self):
        as_of = date(2026, 3, 11)
        self.assertEqual(compute_aging_bucket(100, None, as_of), "current")
        self.assertEqual(compute_aging_bucket(100, date(2026, 3, 20), as_of), "current")
        self.assertEqual(compute_aging_bucket(100, date(2026, 3, 1), as_of), "1_30")
        self.assertEqual(compute_aging_bucket(100, date(2026, 1, 31), as_of), "31_60")
        self.assertEqual(compute_aging_bucket(100, date(2025, 12, 31), as_of), "61_90")
        self.assertEqual(compute_aging_bucket(100, date(2025, 11, 30), as_of), "90_plus")

    def test_validate_journal_balance(self):
        debit, credit = validate_journal_balance(
            [
                {"account_code": "111", "debit": 100, "credit": 0},
                {"account_code": "131", "debit": 0, "credit": 100},
            ]
        )
        self.assertEqual(debit, 100)
        self.assertEqual(credit, 100)

    def test_validate_journal_balance_rejects_unbalanced(self):
        with self.assertRaises(HTTPException) as context:
            validate_journal_balance(
                [
                    {"account_code": "111", "debit": 100, "credit": 0},
                    {"account_code": "131", "debit": 0, "credit": 90},
                ]
            )
        self.assertEqual(context.exception.code, 400)

    def test_receivable_status(self):
        as_of = date(2026, 3, 11)
        self.assertEqual(_recompute_receivable_status("confirmed", 0, date(2026, 3, 20), as_of), "paid")
        self.assertEqual(_recompute_receivable_status("confirmed", 10, date(2026, 3, 20), as_of), "confirmed")
        self.assertEqual(_recompute_receivable_status("partially_paid", 10, date(2026, 3, 20), as_of), "partially_paid")
        self.assertEqual(_recompute_receivable_status("confirmed", 10, date(2026, 3, 1), as_of), "overdue")
        self.assertEqual(_recompute_receivable_status("cancelled", 10, date(2026, 3, 1), as_of), "cancelled")

    def test_tax_amount(self):
        self.assertEqual(_tax_amount(1000000, 10), 100000)
        self.assertEqual(_tax_amount(1000000, 8), 80000)
        self.assertEqual(_tax_amount(1234567, 0), 0)

    def test_period_bounds(self):
        start, end = _period_bounds("2026-03")
        self.assertEqual(start, date(2026, 3, 1))
        self.assertEqual(end, date(2026, 3, 31))

    def test_validate_enum(self):
        self.assertEqual(_validate_enum("status", "posted", ["draft", "posted"], "draft"), "posted")
        with self.assertRaises(HTTPException) as context:
            _validate_enum("status", "invalid", ["draft", "posted"], "draft")
        self.assertEqual(context.exception.code, 400)

    def test_cash_account_by_method(self):
        self.assertEqual(_cash_account_by_method("cash"), "111")
        self.assertEqual(_cash_account_by_method("bank_transfer"), "112")
        self.assertEqual(_cash_account_by_method("other"), "111")

    def test_aging_summary(self):
        as_of = date(2026, 3, 11)
        rows = [
            SimpleNamespace(balance_amount=100, due_date=date(2026, 3, 20)),
            SimpleNamespace(balance_amount=200, due_date=date(2026, 3, 1)),
            SimpleNamespace(balance_amount=300, due_date=date(2026, 1, 31)),
            SimpleNamespace(balance_amount=400, due_date=date(2025, 11, 30)),
            SimpleNamespace(balance_amount=0, due_date=date(2025, 11, 30)),
        ]
        summary = {item["bucket"]: item["amount"] for item in _aging_summary(rows, as_of)}
        self.assertEqual(summary["current"], 100)
        self.assertEqual(summary["1_30"], 200)
        self.assertEqual(summary["31_60"], 300)
        self.assertEqual(summary["90_plus"], 400)

    def test_parse_date(self):
        self.assertEqual(_parse_date("2026-03-11"), date(2026, 3, 11))
        self.assertEqual(_parse_date("11/03/2026"), date(2026, 3, 11))
        self.assertEqual(_parse_date("2026-03"), date(2026, 3, 1))
        self.assertIsNone(_parse_date("not-a-date"))

    def test_ar_snapshot_separates_phat_sinh_and_tam_ung(self):
        invoice = SimpleNamespace(
            total_amount=10_000_000,
            tax_rate=0,
            payments=[
                SimpleNamespace(amount=9_000_000, payment_type="phat_sinh", deletedAt=None),
                SimpleNamespace(amount=3_000_000, payment_type="tam_ung", deletedAt=None),
                SimpleNamespace(amount=1_000_000, payment_type="tam_ung", deletedAt=date(2026, 3, 11)),
            ],
        )
        snapshot = _build_ar_invoice_snapshot(invoice)
        self.assertEqual(snapshot["phat_sinh_amount"], 9_000_000)
        self.assertEqual(snapshot["tam_ung_amount"], 3_000_000)
        self.assertEqual(snapshot["effective_total_amount"], 19_000_000)
        self.assertEqual(snapshot["paid_amount"], 3_000_000)
        self.assertEqual(snapshot["balance_amount"], 16_000_000)


if __name__ == "__main__":
    unittest.main()
