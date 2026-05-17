import pathlib
import sys
import unittest
from dataclasses import dataclass, replace

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

try:
    from api.inventory import compute_moving_average, resolve_issue_cost, _journal_lines_for_transaction
except ModuleNotFoundError:
    compute_moving_average = None  # type: ignore
    resolve_issue_cost = None  # type: ignore
    _journal_lines_for_transaction = None  # type: ignore


@dataclass
class FakeItem:
    code: str
    name: str
    item_type: str
    unit: str
    standard_cost: float
    average_cost: float
    min_stock_level: float
    is_active: bool
    quantity_on_hand: float = 0
    inventory_value: float = 0


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


class DummyTx:
    def __init__(self, transaction_type: str, total_cost: float):
        self.transaction_type = transaction_type
        self.total_cost = total_cost
        self.note = None
        self.partner_id = None
        self.partner_name = None


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
class InventorySimulationTest(unittest.TestCase):
    RECORDS = 1000

    def test_item_crud_1000_records(self):
        store = FakeCrudStore()
        for index in range(self.RECORDS):
            store.create(
                FakeItem(
                    code=f"VT-{index:04d}",
                    name=f"Vat tu {index}",
                    item_type="raw_material" if index % 2 == 0 else "merchandise",
                    unit="cai",
                    standard_cost=1000 + index,
                    average_cost=1000 + index,
                    min_stock_level=10,
                    is_active=True,
                )
            )

        self.assertEqual(len(store.list()), self.RECORDS)
        self.assertEqual(store.get("VT-0000").name, "Vat tu 0")

        for index in range(0, self.RECORDS, 5):
            store.update(f"VT-{index:04d}", is_active=False)

        inactive = [row for row in store.list() if not row.is_active]
        self.assertEqual(len(inactive), 200)

        for index in range(50):
            deleted = store.delete(f"VT-{index:04d}")
            self.assertIsNotNone(deleted)
        self.assertEqual(len(store.list()), self.RECORDS - 50)

    def test_stock_receipt_and_issue_1000_records(self):
        store = FakeCrudStore()
        for index in range(self.RECORDS):
            item = FakeItem(
                code=f"STK-{index:04d}",
                name=f"Stock {index}",
                item_type="raw_material",
                unit="tam",
                standard_cost=100_000,
                average_cost=100_000,
                min_stock_level=5,
                is_active=True,
            )
            qty, value, avg = compute_moving_average(0, 0, 10, 1_000_000)
            issue_cost = resolve_issue_cost(0, avg, item.average_cost, item.standard_cost)
            ending_qty = qty - 4
            ending_value = round(value - issue_cost * 4, 2)
            store.create(
                replace(
                    item,
                    quantity_on_hand=ending_qty,
                    inventory_value=ending_value,
                    average_cost=avg,
                )
            )

        rows = store.list()
        self.assertEqual(len(rows), self.RECORDS)
        self.assertTrue(all(row.quantity_on_hand == 6 for row in rows))
        self.assertTrue(all(row.inventory_value > 0 for row in rows))

    def test_inventory_summary_simulation_1000_records(self):
        store = FakeCrudStore()
        for index in range(self.RECORDS):
            quantity = index % 15
            store.create(
                FakeItem(
                    code=f"SUM-{index:04d}",
                    name=f"Summary {index}",
                    item_type="finished_goods",
                    unit="bo",
                    standard_cost=50_000,
                    average_cost=60_000,
                    min_stock_level=8,
                    is_active=index % 7 != 0,
                    quantity_on_hand=quantity,
                    inventory_value=quantity * 60_000,
                )
            )

        rows = store.list()
        active_items = sum(1 for row in rows if row.is_active)
        below_min = sum(1 for row in rows if row.quantity_on_hand < row.min_stock_level)
        total_value = sum(row.inventory_value for row in rows)
        self.assertGreater(active_items, 800)
        self.assertGreater(below_min, 400)
        self.assertGreater(total_value, 0)

    def test_journal_lines_1000_transactions(self):
        for index in range(self.RECORDS):
            tx_type = (
                "purchase_receipt" if index % 5 == 0 else
                "sales_issue" if index % 5 == 1 else
                "task_issue" if index % 5 == 2 else
                "adjustment_increase" if index % 5 == 3 else
                "adjustment_decrease"
            )
            lines = _journal_lines_for_transaction(
                FakeItem(
                    code="VT",
                    name="Vat tu",
                    item_type="raw_material",
                    unit="tam",
                    standard_cost=0,
                    average_cost=0,
                    min_stock_level=0,
                    is_active=True,
                ),
                DummyTx(tx_type, 1000 + index),
                DummyMapping(),
                None,
            )
            if lines:
                self.assertEqual(sum(line["debit"] for line in lines), sum(line["credit"] for line in lines))

    def test_bulk_update_status_and_delete_candidates_1000_records(self):
        store = FakeCrudStore()
        for index in range(self.RECORDS):
            store.create(
                FakeItem(
                    code=f"DEL-{index:04d}",
                    name=f"Delete {index}",
                    item_type="merchandise",
                    unit="cai",
                    standard_cost=10_000,
                    average_cost=10_000,
                    min_stock_level=0,
                    is_active=True,
                )
            )

        for index in range(0, self.RECORDS, 10):
            store.update(f"DEL-{index:04d}", is_active=False)
        for index in range(100, 200):
            store.delete(f"DEL-{index:04d}")

        self.assertEqual(len(store.list()), self.RECORDS - 100)
        self.assertEqual(sum(1 for row in store.list() if not row.is_active), 90)


if __name__ == "__main__":
    unittest.main()
