from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import json
from datetime import datetime
import os
from flask_cors import CORS

app = Flask(__name__)
base_dir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(base_dir, "instance", "customers.db")

app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

CORS(app)

class Customer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    fullName = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    workInfo = db.Column(db.String(200))
    workStart = db.Column(db.DateTime)
    workEnd = db.Column(db.DateTime)
    workAddress = db.Column(db.String(200))
    workPrice = db.Column(db.Integer)
    status = db.Column(db.String(50))
    delete_at = db.Column(db.DateTime, nullable=True)
    createdAt = db.Column(db.DateTime)
    updatedAt = db.Column(db.DateTime)

    def to_dict(self):
        return {
            "id": self.id,
            "fullName": self.fullName,
            "phone": self.phone,
            "workInfo": self.workInfo,
            "workStart": self.workStart.isoformat() if self.workStart else None,
            "workEnd": self.workEnd.isoformat() if self.workEnd else None,
            "workAddress": self.workAddress,
            "workPrice": self.workPrice,
            "status": self.status,
            "delete_at": self.delete_at.isoformat() if self.delete_at else None,
            "createdAt": self.createdAt.isoformat() if self.createdAt else None,
            "updatedAt": self.updatedAt.isoformat() if self.updatedAt else None,
        }

def parse_date(d):
    # d có dạng {"$date": "2025-07-21T01:03:22.362Z"}
    if isinstance(d, dict) and "$date" in d:
        return datetime.fromisoformat(d["$date"].replace("Z", "+00:00"))
    return None

def load_customers():
    with open("main-be/json/customers.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        for item in data:
            customer = Customer(
                fullName=item.get("fullName"),
                phone=item.get("phone"),
                workInfo=item.get("workInfo"),
                workStart=parse_date(item.get("workStart")),
                workEnd=parse_date(item.get("workEnd")),
                workAddress=item.get("workAddress"),
                workPrice=item.get("workPrice"),
                status=item.get("status"),
                delete_at=parse_date(item.get("delete_at")),
                createdAt=parse_date(item.get("createdAt")),
                updatedAt=parse_date(item.get("updatedAt")),
            )
            db.session.add(customer)
        db.session.commit()