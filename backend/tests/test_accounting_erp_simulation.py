import pathlib
import sys
import unittest
from dataclasses import dataclass, replace
from datetime import date, timedelta

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

try:
    from api.accounting_erp import (
        _aging_summary,
        _recompute_payable_status,
        _recompute_receivable_status,
        _tax_amount,
        compute_aging_bucket,
        validate_journal_balance,
    )
except ModuleNotFoundError:
    _aging_summary = None  # type: ignore
    _recompute_payable_status = None  # type: ignore
    _recompute_receivable_status = None  # type: ignore
    _tax_amount = None  # type: ignore
    compute_aging_bucket = None  # type: ignore
    validate_journal_balance = None  # type: ignore


@dataclass
class FakeInvoice:
    code: str
    partner_name: str
    total_amount: float
    paid_amount: float
    balance_amount: float
    due_date: date
    status: str


class FakeCrudStore:
    def __init__(self):
        self.rows = {}

    def create(self, row):
        self.rows[row.code] = row
        return row

    def get(self, code):
        return self.rows.get(code)

    def list(self):
        return list(self.rows.values())

    def update(self, code, **changes):
        row = self.rows[code]
        updated = replace(row, **changes)
        self.rows[code] = updated
        return updated

    def delete(self, code):
        return self.rows.pop(code, None)


@unittest.skipIf(compute_aging_bucket is None, "backend dependencies are not installed")
class AccountingSimulationTest(unittest.TestCase):
    RECORDS = 1000

    def test_ar_crud_with_1000_records(self):
        store = FakeCrudStore()
        for index in range(self.RECORDS):
            amount = 1_000_000 + index * 1_000
            row = FakeInvoice(
                code=f"AR-{index:04d}",
                partner_name=f"Khach {index}",
                total_amount=amount,
                paid_amount=0,
                balance_amount=amount,
                due_date=date(2026, 3, 1) + timedelta(days=index % 27),
                status="draft",
            )
            store.create(row)

        self.assertEqual(len(store.list()), self.RECORDS)
        self.assertEqual(store.get("AR-0000").partner_name, "Khach 0")

        for index in range(0, self.RECORDS, 2):
            row = store.get(f"AR-{index:04d}")
            store.update(row.code, status="confirmed")

        confirmed = [row for row in store.list() if row.status == "confirmed"]
        self.assertEqual(len(confirmed), self.RECORDS // 2)

        for index in range(100):
            deleted = store.delete(f"AR-{index:04d}")
            self.assertIsNotNone(deleted)

        self.assertEqual(len(store.list()), self.RECORDS - 100)

    def test_ar_payment_simulation_1000_records(self):
        as_of = date(2026, 3, 11)
        invoices = []
        for index in range(self.RECORDS):
            total = 2_000_000 + index * 500
            due_date = as_of - timedelta(days=index % 120)
            if index % 3 == 0:
                paid = total
            elif index % 3 == 1:
                paid = total * 0.4
                due_date = as_of + timedelta(days=(index % 15) + 1)
            else:
                paid = 0
            balance = round(total - paid, 2)
            status = _recompute_receivable_status("partially_paid", balance, due_date, as_of)
            invoices.append(
                FakeInvoice(
                    code=f"ARPAY-{index:04d}",
                    partner_name=f"Khach {index}",
                    total_amount=total,
                    paid_amount=paid,
                    balance_amount=balance,
                    due_date=due_date,
                    status=status,
                )
            )

        paid_count = sum(1 for row in invoices if row.status == "paid")
        partial_count = sum(1 for row in invoices if row.status == "partially_paid")
        overdue_count = sum(1 for row in invoices if row.status == "overdue")
        self.assertGreater(paid_count, 300)
        self.assertGreater(partial_count, 200)
        self.assertGreater(overdue_count, 200)

        aging = {item["bucket"]: item["amount"] for item in _aging_summary(invoices, as_of)}
        self.assertIn("current", aging)
        self.assertIn("90_plus", aging)
        self.assertGreater(sum(aging.values()), 0)

    def test_ap_crud_and_payment_simulation_1000_records(self):
        store = FakeCrudStore()
        as_of = date(2026, 3, 11)
        for index in range(self.RECORDS):
            amount = 3_000_000 + index * 750
            row = FakeInvoice(
                code=f"AP-{index:04d}",
                partner_name=f"NCC {index}",
                total_amount=amount,
                paid_amount=0,
                balance_amount=amount,
                due_date=as_of - timedelta(days=index % 90),
                status="confirmed",
            )
            store.create(row)

        for index in range(self.RECORDS):
            row = store.get(f"AP-{index:04d}")
            paid = row.total_amount if index % 4 == 0 else row.total_amount * 0.5 if index % 4 == 1 else 0
            balance = round(row.total_amount - paid, 2)
            status = _recompute_payable_status("confirmed", balance, row.due_date, as_of)
            store.update(row.code, paid_amount=paid, balance_amount=balance, status=status)

        paid_count = sum(1 for row in store.list() if row.status == "paid")
        partial_or_overdue = sum(1 for row in store.list() if row.status in {"partially_paid", "overdue"})
        self.assertEqual(paid_count, 250)
        self.assertGreater(partial_or_overdue, 500)

    def test_journal_balance_validation_1000_batches(self):
        for index in range(self.RECORDS):
            amount = 1000 + index
            debit, credit = validate_journal_balance(
                [
                    {"account_code": "111", "debit": amount, "credit": 0},
                    {"account_code": "131", "debit": 0, "credit": amount},
                ]
            )
            self.assertEqual(debit, amount)
            self.assertEqual(credit, amount)

    def test_tax_and_aging_matrix_1000_rows(self):
        as_of = date(2026, 3, 11)
        total_tax = 0
        bucket_counts = {"current": 0, "1_30": 0, "31_60": 0, "61_90": 0, "90_plus": 0, "paid": 0}
        for index in range(self.RECORDS):
            total_tax += _tax_amount(1_000_000 + index * 100, 10 if index % 2 == 0 else 8)
            balance = 0 if index % 10 == 0 else 1_000
            bucket = compute_aging_bucket(balance, as_of - timedelta(days=index % 140), as_of)
            bucket_counts[bucket] += 1

        self.assertGreater(total_tax, 0)
        self.assertGreater(bucket_counts["paid"], 50)
        self.assertGreater(bucket_counts["90_plus"], 100)


if __name__ == "__main__":
    unittest.main()
