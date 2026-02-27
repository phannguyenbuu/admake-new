from flask import Blueprint, request, jsonify, abort
from models import db, dateStr
import datetime
import json

setting_bp = Blueprint('setting', __name__, url_prefix='/api/setting')

@setting_bp.route("/get-setting", methods=["GET"])
def get_settings():
    return jsonify({'message':''})
