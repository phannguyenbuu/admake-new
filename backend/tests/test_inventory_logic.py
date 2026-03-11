import pathlib
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

try:
    from api.inventory import compute_moving_average, resolve_issue_cost, _journal_lines_for_transaction
except ModuleNotFoundError:
    compute_moving_average = None  # type: ignore
    resolve_issue_cost = None  # type: ignore
    _journal_lines_for_transaction = None  # type: ignore


class DummyItem:
    item_type = "raw_material"


class DummyTx:
    def __init__(self, transaction_type: str, total_cost: float, note: str = ""):
        self.transaction_type = transaction_type
        self.total_cost = total_cost
        self.note = note
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
class InventoryLogicTest(unittest.TestCase):
    def test_compute_moving_average(self):
        qty, value, avg = compute_moving_average(10, 1000, 5, 750)
        self.assertEqual(qty, 15)
        self.assertEqual(value, 1750)
        self.assertEqual(avg, round(1750 / 15, 2))

    def test_resolve_issue_cost_priority(self):
        self.assertEqual(resolve_issue_cost(120, 100, 90, 80), 120)
        self.assertEqual(resolve_issue_cost(0, 100, 90, 80), 100)
        self.assertEqual(resolve_issue_cost(0, 0, 90, 80), 90)
        self.assertEqual(resolve_issue_cost(0, 0, 0, 80), 80)

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


if __name__ == "__main__":
    unittest.main()
