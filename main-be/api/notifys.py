from flask import Blueprint, request, jsonify, abort
from models import db, User, dateStr, app,LeadPayload, get_query_page_users, Notify
from flask import Flask, request, jsonify, session
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
import datetime
from sqlalchemy import desc, and_, func, select

notify_bp = Blueprint('notify', __name__, url_prefix='/api/notify')

@notify_bp.route("/", methods=["GET"])
def get_notifies():
    notifies = Notify.query.order_by(Notify.updatedAt).all()
    data = [notify.tdict() for notify in notifies]

    return jsonify({
        "data": data,
    })

@notify_bp.route("/", methods=["POST"])
def create_notifies():
    data = request.get_json()
    new_notify = Notify.create_item(data)
    db.session.refresh(new_notify)
    
    return jsonify(new_notify.tdict()), 201

@notify_bp.route("/<string:id>", methods=["DELETE"])
def delete_notify(id):
    notify = db.session.get(Notify, id)
    if not notify:
        abort(404, description="Notify not found")

    db.session.delete(notify)
    db.session.commit()

    return jsonify({'message':'Delete successful!'})
