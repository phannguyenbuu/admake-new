import os
import pathlib
import sys
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))


try:
    os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
    from app import app  # type: ignore
    from models import db, LeadPayload, InventoryItem, generate_datetime_id  # type: ignore
except ModuleNotFoundError:
    app = None  # type: ignore


@unittest.skipIf(app is None, "backend dependencies are not installed")
class InventoryItemCrudIntegrationTest(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.ctx = app.app_context()
        self.ctx.push()
        db.drop_all()
        db.create_all()

        self.lead = LeadPayload(id=99999, name="inventory-test-lead")
        db.session.add(self.lead)
        self.item = InventoryItem(
            id=generate_datetime_id(),
            lead_id=self.lead.id,
            code="VT001",
            name="Vật tư A",
            item_type="raw_material",
            unit="cái",
            is_active=True,
        )
        self.other_item = InventoryItem(
            id=generate_datetime_id(),
            lead_id=self.lead.id,
            code="VT002",
            name="Vật tư B",
            item_type="raw_material",
            unit="cái",
            is_active=True,
        )
        db.session.add(self.item)
        db.session.add(self.other_item)
        db.session.commit()
        self.client = app.test_client()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_update_item_allows_code_change(self):
        response = self.client.put(
            f"/api/inventory/items/{self.item.id}",
            json={"code": "vt009", "name": "Vật tư A mới"},
        )
        self.assertEqual(response.status_code, 200)
        db.session.refresh(self.item)
        self.assertEqual(self.item.code, "VT009")
        self.assertEqual(self.item.name, "Vật tư A mới")

    def test_update_item_rejects_duplicate_code(self):
        response = self.client.put(
            f"/api/inventory/items/{self.item.id}",
            json={"code": "vt002"},
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Item code already exists", response.get_data(as_text=True))

    def test_delete_item_soft_deletes_when_no_transactions(self):
        response = self.client.delete(f"/api/inventory/items/{self.item.id}")
        self.assertEqual(response.status_code, 200)
        db.session.refresh(self.item)
        self.assertIsNotNone(self.item.deletedAt)


if __name__ == "__main__":
    unittest.main()
