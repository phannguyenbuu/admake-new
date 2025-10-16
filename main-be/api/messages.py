from flask import Blueprint, request, jsonify, abort
from models import db, app, dateStr, Message
from api.chat import socketio
import os

message_bp = Blueprint('message', __name__, url_prefix='/api/message')

@message_bp.route("/", methods=["GET"])
def get_messages():
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)
    search = request.args.get("search", "", type=str)

    if limit == 0:
        messages = [c.to_dict() for c in Message.query.all()]
        total = len(messages)
        pages = 1
    else:
        query = Message.query
        if search:
            query = query.filter(Message.text.ilike(f"%{search}%"))

        pagination = query.paginate(page=page, per_page=limit, error_out=False)
        messages = [c.to_dict() for c in pagination.items]
        total = pagination.total
        pages = pagination.pages

    return jsonify({
        "data": messages,
        "total": total,
        "pagination": {
            "total": total,
            "page": page,
            "per_page": limit,
            "pages": pages,
        }
    })

@message_bp.route("/", methods=["POST"])
def create_message():
    data = request.get_json()

    new_message = Message.create_item(data)
    db.session.add(new_message)
    db.session.commit()

    return jsonify(new_message.to_dict()), 201

@message_bp.route("/<int:id>", methods=["GET"])
def get_message_detail(id):
    message = db.session.get(Message, id)
    if not message:
        abort(404, description="Message not found")
    return jsonify(message.to_dict())

@message_bp.route("/<int:id>/favourite", methods=["PUT"])
def put_message_favourite(id):
    message = db.session.get(Message, id)
    if not message:
        abort(404, description="Message not found")

    print('match', message, message.is_favourite)
    # db.session.refresh(message)
    message.is_favourite = True
    # db.session.add(message)
    db.session.commit()
    
    return jsonify({"message":"OK"}), 200

@message_bp.route("/<int:id>", methods=["PUT"])
def update_message(id):
    data = request.get_json()
    # print(data)
    role = db.session.get(Message, id)
    if not role:
        return jsonify({"error": "role not found"}), 404
    for key, value in data.items():
        if hasattr(role, key):
            if key in ['workStart', 'workEnd'] and isinstance(value, str):
                value = dateStr(value)
            setattr(role, key, value)
    db.session.commit()
    return jsonify(role.to_dict()), 200

@message_bp.route("/<int:message_id>", methods=['DELETE'])
def delete_message(message_id):
    message = Message.query.filter_by(message_id=message_id).first()

    if not message:
        return jsonify({"error": "Message not found"}), 404

    try:
        db.session.delete(message)
        db.session.commit()

        # Phát sự kiện xóa message realtime tới client qua socket
        socketio.emit('message_deleted', {'message_id': message_id})

        return jsonify({"message": "Message deleted successfully"})
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Delete message failed: {e}", exc_info=True)
        return jsonify({"error": "Delete message failed", "details": str(e)}), 500

import uuid

@message_bp.route('/upload', methods=['POST'])
def upload_file():
    user_id = request.form.get('userId')
    try:
        group_id = int(request.form.get('groupId', '0'))
    except ValueError:
        group_id = 0  # hoặc xử lý lỗi phù hợp
    role = request.form.get('role')
    latitude = request.form.get('latitude')
    longitude = request.form.get('longitude')
    time = request.form.get('time')


    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
    

    filename, filepath = upload_a_file_to_vps(file)
    
    data = {
        # 'id': msg.id,
        'user_id': user_id,
        'group_id': group_id,
        'username': '',
        # 'text': text,
        'file_url': filename,
        'link': filepath,
        'role': role,
        'latitude': latitude,
        'longitude': longitude,
        'time': time,
    }

    return jsonify({'message': 'File uploaded successfully', 'filename': filename, 'data': data})
    
def upload_a_file_to_vps(file):
    name, ext = os.path.splitext(file.filename)
    filename = file.filename
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

    if os.path.exists(filepath):
        filename = f"{name}_{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        print('New file name because file exists:', filename)

    file.save(filepath)
    return filename, filepath

    

