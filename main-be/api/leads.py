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
