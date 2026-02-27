import os
import json
from datetime import datetime
import random
import string
from flask import Blueprint, request, jsonify, current_app

fureal_bp = Blueprint('fureal', __name__, url_prefix='/api/fureal')

@fureal_bp.route("/save", methods=["POST"])
def save_file():
    try:
        data_json = request.get_json()
        if not data_json:
            return jsonify({"error": "No JSON data provided"}), 400

        # Tạo tên file theo format: yyyyMMdd_HHmmss_random.json
        # now = datetime.now().strftime("%Y%m%d_%H%M%S")
        # random_str = ''.join(random.choices(string.ascii_letters + string.digits, k=6))
        filename = data_json.get("username")

        # Đường dẫn tới thư mục static
        static_dir = os.path.join(current_app.root_path, 'static')
        if not os.path.exists(static_dir):
            os.makedirs(static_dir)

        # Đường dẫn đầy đủ tới file
        file_path = os.path.join(static_dir, filename + '.json')

        # Ghi dữ liệu json vào file
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data_json.get("data"), f, ensure_ascii=False, indent=4)

        return jsonify({"message": "File saved", "filename": filename}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@fureal_bp.route("/load", methods=["POST"])
def load_file():
    try:
        data_json = request.get_json()
        if not data_json:
            return jsonify({"error": "No JSON data provided"}), 400

        filename = data_json.get("username")
        if not filename:
            return jsonify({"error": "No filename provided"}), 400

        static_dir = os.path.join(current_app.root_path, 'static')
        file_path = os.path.join(static_dir, filename + '.json')

        print( "Loading ... file", file_path)

        if not os.path.exists(file_path):
            print( "File not found", file_path)
            return jsonify({"error": "File not found"}), 404

        with open(file_path, 'r', encoding='utf-8') as f:
            file_content = json.load(f)

        return jsonify(file_content), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

