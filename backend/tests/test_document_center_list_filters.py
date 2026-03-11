import os
import pathlib
import sys
import unittest
from datetime import date


ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))


try:
    os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
    from models import app, db, LeadPayload, DocumentCenterDocument, generate_datetime_id  # type: ignore
except ModuleNotFoundError:
    app = None  # type: ignore


@unittest.skipIf(app is None, "backend dependencies are not installed")
class DocumentCenterListFilterIntegrationTest(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.ctx = app.app_context()
        self.ctx.push()
        db.drop_all()
        db.create_all()

        lead = LeadPayload(id=99999, name="test-lead")
        db.session.add(lead)
        db.session.add(
            DocumentCenterDocument(
                id=generate_datetime_id(),
                lead_id=lead.id,
                code="QT-202603-0001",
                type="QUOTE",
                docDate=date(2026, 3, 1),
                partnerName="A Corp",
                amount=1000,
                status="draft",
                currency="VND",
            )
        )
        db.session.add(
            DocumentCenterDocument(
                id=generate_datetime_id(),
                lead_id=lead.id,
                code="CT-202603-0001",
                type="CONTRACT",
                docDate=date(2026, 3, 2),
                partnerName="B Corp",
                amount=2000,
                status="submitted",
                currency="VND",
            )
        )
        db.session.commit()
        self.client = app.test_client()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_filter_by_type(self):
        res = self.client.get("/api/documents?lead=99999&type=QUOTE&page=1&pageSize=20")
        self.assertEqual(res.status_code, 200)
        body = res.get_json()
        self.assertEqual(len(body["data"]), 1)
        self.assertEqual(body["data"][0]["type"], "QUOTE")

    def test_filter_by_status(self):
        res = self.client.get("/api/documents?lead=99999&status=submitted&page=1&pageSize=20")
        self.assertEqual(res.status_code, 200)
        body = res.get_json()
        self.assertEqual(len(body["data"]), 1)
        self.assertEqual(body["data"][0]["status"], "submitted")


if __name__ == "__main__":
    unittest.main()
