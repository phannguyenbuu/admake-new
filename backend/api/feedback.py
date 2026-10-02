from flask import Blueprint, request, jsonify, g
import datetime
from models import db, Feedback, User, LeadPayload, generate_datetime_id
from api.messages import upload_a_file_to_vps

feedback_bp = Blueprint("feedback", __name__, url_prefix="/api/feedback")

@feedback_bp.route("/", methods=["POST"])
@feedback_bp.route("", methods=["POST"])
def create_feedback():
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    content = (data.get("content") or "").strip()
    images = data.get("images") or []

    if not content and not title and not images:
        return jsonify({"error": "Vui lòng nhập nội dung hoặc đính kèm hình ảnh góp ý"}), 400

    actor = getattr(g, "permission_actor", None)
    user_id = actor.id if actor else None
    user_name = getattr(actor, "fullName", None) or getattr(actor, "username", None) or "Khách hàng"
    lead_id = getattr(actor, "lead_id", None)
    lead_name = None
    if lead_id:
        lead = db.session.get(LeadPayload, lead_id)
        if lead:
            lead_name = lead.name or lead.company

    fb = Feedback(
        id=generate_datetime_id(),
        title=title,
        user_id=str(user_id) if user_id else None,
        user_name=user_name,
        lead_id=lead_id,
        lead_name=lead_name,
        content=content,
        images=images,
        is_read=False,
        createdAt=datetime.datetime.utcnow()
    )
    db.session.add(fb)
    db.session.commit()
    return jsonify(fb.tdict()), 201


@feedback_bp.route("/upload", methods=["POST"])
def upload_feedback_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400

    filename, filepath, thumb_url = upload_a_file_to_vps(file)
    return jsonify({
        'file_url': filename,
        'thumb_url': thumb_url,
        'link': filepath
    }), 200


@feedback_bp.route("/", methods=["GET"])
@feedback_bp.route("", methods=["GET"])
def get_feedbacks():
    feedbacks = Feedback.query.order_by(Feedback.createdAt.desc()).all()
    return jsonify([f.tdict() for f in feedbacks])


@feedback_bp.route("/<string:id>/read", methods=["PUT"])
def toggle_read_feedback(id):
    fb = db.session.get(Feedback, id)
    if not fb:
        return jsonify({"error": "Feedback not found"}), 404
    data = request.get_json() or {}
    if "is_read" in data:
        fb.is_read = bool(data["is_read"])
    else:
        fb.is_read = not fb.is_read
    db.session.commit()
    return jsonify(fb.tdict())


@feedback_bp.route("/<string:id>", methods=["DELETE"])
def delete_feedback(id):
    fb = db.session.get(Feedback, id)
    if not fb:
        return jsonify({"error": "Feedback not found"}), 404
    db.session.delete(fb)
    db.session.commit()
    return jsonify({"success": True})
