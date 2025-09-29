from flask import Blueprint, request, jsonify, abort
from models import db, app, socketio, Group, Message,User, dateStr, GroupMember, generate_datetime_id

group_bp = Blueprint('group', __name__, url_prefix='/api/group')

@group_bp.route("/", methods=["GET"])
def get_groups():
    return jsonify([c.to_dict() for c in Group.query.all()])

@group_bp.route("/member/", methods=["GET"])
def get_group_members():
    group_members = [c.to_dict() for c in GroupMember.query.all()]
    return jsonify(group_members)

@group_bp.route("/", methods=["POST"])
def create_group():
    data = request.get_json()

    new_group = Group.create_item(data)
    db.session.add(new_group)
    db.session.commit()

    return jsonify(new_group.to_dict()), 201

@group_bp.route("/<int:id>", methods=["GET"])
def get_group_detail(id):
    group = db.session.get(group, id)
    if not group:
        abort(404, description="group not found")
    return jsonify(group.to_dict())

@group_bp.route("/<int:id>", methods=["PUT"])
def update_group(id):
    # print(request)
    data = request.get_json()
    # print(data)
    role = db.session.get(Group, id)
    if not role:
        return jsonify({"error": "role not found"}), 404
    for key, value in data.items():
        if hasattr(role, key):
            if key in ['workStart', 'workEnd'] and isinstance(value, str):
                value = dateStr(value)
            setattr(role, key, value)
    db.session.commit()
    return jsonify(role.to_dict()), 200








# Tạo Message
@app.route('/api/groups/<int:group_id>/messages', methods=['POST'])
def create_message(group_id):
    data = request.json
    user_id = data.get('user_id')
    text = data.get('text')
    file_url = data.get('file_url')  # URL lưu file đã upload
    link = data.get('link')          # Link gửi kèm
    
    # Kiểm tra user có trong nhóm không
    member = GroupMember.query.filter_by(user_id=user_id, group_id=group_id).first()
    if not member:
        return jsonify({'error': 'User not a member of the group'}), 403

    msg = Message(
        group_id=group_id,
        user_id=user_id,
        username=User.query.get(user_id).username,
        text=text,
        file_url=file_url,
        link=link,
    )
    db.session.add(msg)
    db.session.commit()
    
    # Phát message qua socket
    socketio.emit('message', {
        'id': msg.id,
        'group_id': group_id,
        'username': msg.username,
        'text': text,
        'file_url': file_url,
        'link': link,
    }, room=str(group_id))
    
    return jsonify({'message': 'Message sent'})
