from flask import Blueprint, request, jsonify, abort
from models import db, app, Workspace, Message,User, dateStr, generate_datetime_id
from api.chat import socketio
from sqlalchemy import desc
from api.works import create_workspace

group_bp = Blueprint('group', __name__, url_prefix='/api/group')

@group_bp.route("/", methods=["GET"])
def get_groups():
    groups = Workspace.query.order_by(desc(Workspace.createdAt)).all()
    return jsonify([c.to_dict() for c in groups])

# @group_bp.route("/member/", methods=["GET"])
# def get_group_members():
#     group_members = [c.to_dict() for c in WorkspaceMember.query.all()]
#     return jsonify(group_members)

@group_bp.route("/", methods=["POST"])
def create_group():
    data = request.get_json()
    new_workspace = create_workspace(data)

    return jsonify(new_workspace.to_dict()), 201




@group_bp.route("/<int:id>", methods=["GET"])
def get_group_detail(workspace_id):
    workspace = Workspace.get_by_id(workspace_id)
    if not workspace:
        abort(404, description="group not found")
    return jsonify(workspace.to_dict())

@group_bp.route("/<int:workspace_id>", methods=["PUT"])
def update_group(workspace_id):
    data = request.get_json()
    
    group = Workspace.query.get(workspace_id)
    if not group:
        return jsonify({"error": "Workspace not found"}), 404
    
    for key, value in data.items():
        group[key] = value

    db.session.commit()
    return jsonify(group.to_dict()), 200

@group_bp.route('/<int:workspace_id>/status', methods=['PUT'])
def change_group_status(workspace_id):
    data = request.json
    status = data.get('status')
    workspace = Workspace.get_by_id(workspace_id)

    if not workspace:
        abort(404, description="group not found")

    workspace.status = status
    db.session.commit()

    return jsonify(workspace.to_dict()), 201


# Tạo Message
@group_bp.route('/<int:workspace_id>/messages', methods=['POST'])
def create_message(workspace_id):
    data = request.json
    # user_id = data.get('user_id')
    role = data.get('role')
    text = data.get('text')
    file_url = data.get('file_url')  # URL lưu file đã upload
    link = data.get('link')          # Link gửi kèm
    username=data.get('username')

    # Kiểm tra user có trong nhóm không
    # member = WorkspaceMember.query.filter_by(user_id=user_id, workspace_id=workspace_id)
    # if not member:
    #     return jsonify({'error': 'User not a member of the group'}), 403

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
        'workspace_id': workspace_id,
        'username': username,
        'text': text,
        'file_url': file_url,
        'link': link,
        'role': role,
    }, room=str(workspace_id))
    
    return jsonify({'message': 'Message sent'})

@group_bp.route('/<int:workspace_id>/messages', methods=['GET'])
def get_messages(workspace_id):
    workspace = Workspace.get_by_id(workspace_id)

    if not workspace:
        return jsonify({"error": "workspace not found"}), 404
    
    all_messages = Message.query.filter_by(workspace_id=workspace_id).order_by(Message.createdAt).all()
    messages = [m.to_dict() for m in all_messages]
    
    print('GET',workspace_id, len(messages))

    return jsonify({'messages': messages})

@group_bp.route('/check-access/<int:workspace_id>/<string:desc>/', methods=['GET'])
def get_check_access(workspace_id, desc):
    workspace = Workspace.get_by_id(workspace_id)

    if not workspace:
        return jsonify({"error": "group not found"}), 404
    
    role = -1

    if desc[0].lower() == 'a':
        desc = desc[1:]
        role = 1

    if workspace.id != desc:
        return jsonify({"error": "group secription not match"}), 403
    
    result = workspace.to_dict()
    result["role"] = role

    return jsonify({"valid":True,"data":result})

