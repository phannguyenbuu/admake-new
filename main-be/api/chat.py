from flask_socketio import SocketIO, join_room, leave_room, emit
from flask import Flask, request, jsonify
from models import Message, db, app, User
import datetime

socketio = SocketIO(app, cors_allowed_origins=["http://localhost:5173",
                                                "https://admake.vn",
                                                "https://quanly.admake.vn",
                                                "https://archbox.pw", 
                                                "https://dashboard.archbox.pw"])

@socketio.on('connect')
def on_connect():
    print('------------------------------Client connected:', request.sid)

@socketio.on('admake/chat/join_group')
def on_join_group(data):
    group_id = str(data.get('group_id'))

    print('join', group_id)

    if group_id:
        join_room(group_id)
        print(f"Socket {request.sid} joined room {group_id}")
        socketio.emit('room_joined', {'group_id': group_id}, room=request.sid)

@socketio.on('admake/chat/leave_group')
def on_leave_group(data):
    group_id = str(data.get('group_id'))
    if group_id:
        leave_room(group_id)
        print(f"Socket {request.sid} left room {group_id}")
        socketio.emit('room_left', {'group_id': group_id}, room=request.sid)

@socketio.on('admake/chat/message')
def handle_message(data):
    first_user = User.query.first()
    if first_user is not None:
        user_id = first_user.id  # Lấy id của user đầu tiên
    else:
        user_id = None  # Hoặc giá trị mặc định phù hợp

    
    print('Receive data', data)
    group_id = data['group_id']
    message_id = data['message_id']
    # user_id = User.query.first() # data['user_id']
    username = data['username']
    role = data['role']
    # icon = data['icon']
    text = data.get('text')
    file_url = data.get('file_url')
    link = data.get('link')
    time = datetime.datetime.now()
    time_str = time.isoformat()

    type = 'msg'

    if file_url != '':
        type = 'doc'
        ext = file_url.lower()

        if file_url.startswith('http') or file_url.startswith('www'):
            type = 'ink'
        elif any(ext.endswith(e) for e in ['.jpg', '.png', '.gif', '.webp']):
            type = 'img'


    # Lưu message mới
    print('Saving role', role)
    msg = Message(group_id=group_id,type=type, user_id=user_id, text=text, 
                  message_id = message_id,role=role,
                  file_url=file_url, updatedAt=time)
    db.session.add(msg)
    db.session.commit()
    
    emit('admake/chat/message', {
        'type':type,
        'message_id': message_id,
        # 'icon': icon,
        'text': text,
        'file_url': file_url,
        'user_id': user_id,
        'username': username,
        'link': link,
        'group_id': group_id,
        'createdAt': time_str,
        'incoming': False,
        'role':role,
    }, room=str(group_id), skip_sid=request.sid)

    emit('admake/chat/message_ack', {
        'status': 'success',
        'message': 'Message received and stored successfully',
        'message_id': message_id
    }, room=request.sid)