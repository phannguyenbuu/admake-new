import pathlib
import sys
import unittest
from datetime import date

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

try:
    from api.accounting_erp import (
        compute_aging_bucket,
        validate_journal_balance,
        _recompute_receivable_status,
        _tax_amount,
    )
except ModuleNotFoundError:
    compute_aging_bucket = None  # type: ignore
    validate_journal_balance = None  # type: ignore
    _recompute_receivable_status = None  # type: ignore
    _tax_amount = None  # type: ignore


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

    def test_receivable_status(self):
        as_of = date(2026, 3, 11)
        self.assertEqual(_recompute_receivable_status("confirmed", 0, date(2026, 3, 20), as_of), "paid")
        self.assertEqual(_recompute_receivable_status("confirmed", 10, date(2026, 3, 20), as_of), "confirmed")
        self.assertEqual(_recompute_receivable_status("partially_paid", 10, date(2026, 3, 20), as_of), "partially_paid")
        self.assertEqual(_recompute_receivable_status("confirmed", 10, date(2026, 3, 1), as_of), "overdue")

    def test_tax_amount(self):
        self.assertEqual(_tax_amount(1000000, 10), 100000)
        self.assertEqual(_tax_amount(1000000, 8), 80000)


if __name__ == "__main__":
    unittest.main()
