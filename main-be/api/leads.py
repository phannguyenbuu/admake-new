from flask import Blueprint, request, jsonify, abort
from models import db, app, LeadPayload, Message,User
from api.chat import socketio
from sqlalchemy import desc

lead_bp = Blueprint('lead', __name__, url_prefix='/api/lead')

@lead_bp.route("/", methods=["GET"])
def get_leads():
    leads = LeadPayload.query.order_by(desc(LeadPayload.createdAt)).all()
    return jsonify([c.tdict() for c in leads])

@lead_bp.route("/", methods=["POST"])
def create_lead():
    data = request.get_json()
    print(data)
    new_lead = LeadPayload.create_item(data)
    
    return jsonify(new_lead.tdict()), 201

@lead_bp.route("/<int:lead_id>/check-password", methods=["POST"])
def check_password_lead(lead_id):
    data = request.get_json()

    lead = db.session.get(LeadPayload, lead_id)

    if not lead:
        print("Lead not found")
        abort(404, description="Lead not found")

    if data.get("old_password") != lead.password:
        print("Mật khẩu cũ không đúng")
        abort(404, description="Mật khẩu cũ không đúng")

    return jsonify({'message':'right password'}), 200

@lead_bp.route("/<int:lead_id>", methods=["PUT"])
def update_lead(lead_id):
    data = request.get_json()
    print(data)

    lead = db.session.get(LeadPayload, lead_id)

    if not lead:
        print("Lead not found")
        abort(404, description="Lead not found")

    if data.get("old_password") != lead.password:
        print("Mật khẩu cũ không đúng")
        abort(404, description="Mật khẩu cũ không đúng")
    
    # id = db.Column(db.Integer, primary_key=True)
    # name = db.Column(db.String(120), nullable=False)
    if data.get("fullName"):
        lead.fullName = data.get("fullName")

    if data.get("username"):
        lead.username = data.get("username")

    if data.get("password"):
        lead.password = data.get("password")
        

    if data.get("company"):
        lead.company = data.get("company")

    if data.get("address"):
        lead.address = data.get("address")

    if data.get("email"):
        lead.email = data.get("email")

    if data.get("phone"):
        lead.phone = data.get("phone")

    if data.get("description"):
        lead.description = data.get("description")

    if data.get("industry"):
        lead.industry = data.get("industry")

    db.session.commit()

    # companySize = db.Column(db.String(50), nullable=False)
    # expiredAt = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    # balance_amount = db.Column(db.Float)

    # balance_amount = db.Column(db.Float)

    db.session.refresh(lead)
    return jsonify(lead.tdict()), 201

@lead_bp.route("/<int:lead_id>", methods=["DELETE"])
def delete_lead(lead_id):
    lead = LeadPayload.query.get(lead_id)
    if not lead:
        return jsonify({"error": "LeadPayload not found"}), 404

    db.session.delete(lead)
    db.session.commit()
    return jsonify({"message": "LeadPayload deleted successfully"}), 200

@lead_bp.route("/<int:lead_id>", methods=["GET"])
def get_lead_detail(lead_id):
    lead = db.session.get(LeadPayload, id)
    if not lead:
        abort(404, description="lead not found")
    return jsonify(lead.tdict())
