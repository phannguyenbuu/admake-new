from flask import Blueprint, request, jsonify, abort
from models import db, app, Group, Message,User, dateStr, GroupMember, generate_datetime_id
from api.chat import socketio
from sqlalchemy import desc

group_bp = Blueprint('group', __name__, url_prefix='/api/group')

@group_bp.route("/", methods=["GET"])
def get_groups():
    groups = Group.query.order_by(desc(Group.createdAt)).all()
    return jsonify([c.to_dict() for c in groups])

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

@group_bp.route("/<int:group_id>", methods=["DELETE"])
def delete_group(group_id):
    group = Group.query.get(group_id)
    if not group:
        return jsonify({"error": "Group not found"}), 404

    db.session.delete(group)
    db.session.commit()
    return jsonify({"message": "Group deleted successfully"}), 200


@group_bp.route("/<int:id>", methods=["GET"])
def get_group_detail(id):
    group = db.session.get(Group, id)
    if not group:
        abort(404, description="group not found")
    return jsonify(group.to_dict())

@group_bp.route("/<int:group_id>", methods=["PUT"])
def update_group(group_id):
    data = request.get_json()
    
    group = Group.query.get(group_id)
    if not group:
        return jsonify({"error": "Group not found"}), 404
    
    for key, value in data.items():
        group[key] = value

    db.session.commit()
    return jsonify(group.to_dict()), 200



@group_bp.route('/<int:group_id>/status', methods=['POST'])
def change_group_status(group_id):
    data = request.json
    status = data.get('status')
    group = db.session.get(Group, group_id)

    if not group:
        abort(404, description="group not found")

    group.status = status
    db.session.commit()

    return jsonify(group.to_dict()), 201


# Tạo Message
@group_bp.route('/<int:group_id>/messages', methods=['POST'])
def create_message(group_id):
    data = request.json
    user_id = data.get('user_id')
    role = data.get('role')
    text = data.get('text')
    file_url = data.get('file_url')  # URL lưu file đã upload
    link = data.get('link')          # Link gửi kèm
    username=data.get('username')

    # Kiểm tra user có trong nhóm không
    member = GroupMember.query.filter_by(user_id=user_id, group_id=group_id).first()
    if not member:
        return jsonify({'error': 'User not a member of the group'}), 403

    # msg = Message(
    #     user_id=user_id,
    #     username=User.query.get(user_id).username,
    #     text=text,
    #     file_url=file_url,
    #     link=link,
    #     role=role
    # )
    # db.session.add(msg)
    # db.session.commit()
    
    # Phát message qua socket
    socketio.emit('admake/chat/message', {
        # 'id': msg.id,
        'group_id': group_id,
        'username': username,
        'text': text,
        'file_url': file_url,
        'link': link,
        'role': role,
    }, room=str(group_id))
    
    return jsonify({'message': 'Message sent'})

@group_bp.route('/<int:group_id>/messages', methods=['GET'])
def get_messages(group_id):
    group = db.session.get(Group, group_id)

    if not group:
        return jsonify({"error": "group not found"}), 404
    
    messages = [m.to_dict() for m in group.all_messages]
    
    print('GET',group_id, len(messages))

    return jsonify({'messages': messages})

@group_bp.route('/check-access/<int:group_id>/<string:desc>/', methods=['GET'])
def get_check_access(group_id, desc):
    group = db.session.get(Group, group_id)

    if not group:
        return jsonify({"error": "group not found"}), 404
    
    roleId = -1

    if desc[0].lower() == 'a':
        desc = desc[1:]
        roleId = 1

    if group.description != desc:
        return jsonify({"error": "group secription not match"}), 403
    
    result = group.to_dict()
    result["role"] = roleId

    return jsonify({"valid":True,"data":result})

