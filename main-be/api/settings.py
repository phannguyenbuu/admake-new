from flask import Blueprint, request, jsonify, abort
from models import db, dateStr
import datetime
import json

setting_bp = Blueprint('setting', __name__, url_prefix='/setting')

@setting_bp.route("/get-setting", methods=["GET"])
def get_settings():
    with open("json/settings.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        return jsonify(data)
