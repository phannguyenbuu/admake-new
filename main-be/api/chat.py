from flask_socketio import SocketIO, join_room, leave_room, emit
from flask import Flask, request, jsonify
from models import Message, db, app, User, Workspace, Task

import datetime
from sqlalchemy.orm.attributes import flag_modified

socketio = SocketIO(app, cors_allowed_origins=["http://localhost:5173",
                                                "https://admake.vn",
                                                "https://quanly.admake.vn",
                                                "https://archbox.pw", 
                                                "https://dashboard.archbox.pw"],

                        max_http_buffer_size=100 * 1024 * 1024)  # 100MB

@socketio.on('connect')
def on_connect():
    print('------------------------------Client connected:', request.sid)

@socketio.on('admake/chat/join_group')
def on_join_group(data):
    workspace_id = str(data.get('workspace_id'))

    print('join', workspace_id)

    if workspace_id:
        join_room(workspace_id)
        print(f"Socket {request.sid} joined room {workspace_id}")
        socketio.emit('room_joined', {'workspace_id': workspace_id}, room=request.sid)

@socketio.on('admake/chat/leave_group')
def on_leave_group(data):
    workspace_id = str(data.get('workspace_id'))
    if workspace_id:
        leave_room(workspace_id)
        print(f"Socket {request.sid} left room {workspace_id}")
        socketio.emit('room_left', {'workspace_id': workspace_id}, room=request.sid)

@socketio.on('admake/chat/message')
def handle_message(data):
    print('Socketio Receive data', data)
    
    workspace_id = data['workspace_id']
    message_id = data['message_id']
    user_id = data['user_id']
    
    username = data['username']
    role = data['role']
    
    text = data.get('text')
    file_url = data.get('file_url')
    link = data.get('link')
    time = datetime.datetime.now()
    time_str = time.isoformat()

    type = data.get('type')

    if file_url != '':
        type = 'doc'
        ext = file_url.lower()

        if file_url.startswith('http') or file_url.startswith('www'):
            type = 'ink'
        elif any(ext.endswith(e) for e in ['.jpg', '.png', '.gif', '.webp']):
            type = 'img'

    # Lưu message mới
    print('Saving role', role)
    msg = Message(
                  type=type, 
                  workspace_id = workspace_id,
                  user_id=user_id, 
                  username=username,
                  text=text, 
                  message_id = message_id,
                  role=role,
                  file_url=file_url, 
                  updatedAt=time)
    
    db.session.add(msg)
    db.session.commit()
    
    emit('admake/chat/message', {
        'type':type,
        'message_id': message_id,
        'workspace_id': workspace_id,
        'text': text,
        'file_url': file_url,
        'user_id': user_id,
        'username': username,
        'link': link,
        'createdAt': time_str,
        'incoming': False,
        'role':role,
    }, room=str(workspace_id), skip_sid=request.sid)

    emit('admake/chat/message_ack', {
        'status': 'success',
        'message': 'Message received and stored successfully',
        'message_id': message_id
    }, room=request.sid)


@socketio.on('admake/chat/rate')
def handle_message_rate(data):
    print('Receive rate', data)
    message_id = data['message_id']
    rate = data['rate']
    workspace_id = data['workspace_id']

    msg = Message.query.filter(Message.message_id == message_id).first()
    
    if not msg:
        print("Message not found", message_id)
        return
    
    print('-message', msg, rate, msg.react)
    if not msg.react:
        msg.react = {}

    if rate:
        msg.react["rate"] = rate
        flag_modified(msg, "react")


    work = Workspace.query.filter(Workspace.id == workspace_id).first()
        
    if not work:
        print("Workspace not found", workspace_id)
        return
    
    tasks = Task.query.filter_by(workspace_id=work.id).all()
    print('tasks',work, len(tasks))

    for task in tasks:
        print('task', task.title)
        if task.status != "REWARD":
            task.status = "DONE"
            task.check_reward = True
    
    db.session.commit()

    emit('admake/chat/rate', {
        'rate':rate,
        'message_id': message_id,
        'workspace_id': workspace_id,
    }, room=str(workspace_id), skip_sid=request.sid)

    emit('admake/chat/rate_ack', {
        'status': 'success',
        'message': 'Message received and stored successfully',
        'message_id': message_id
    }, room=request.sid)


@socketio.on('admake/chat/delete')
def handle_message_delete(data):
    message_id = data.get('message_id')
    workspace_id = data.get('workspace_id')

    # Xóa message trong database
    msg = Message.query.filter(Message.message_id == message_id).first()
    if msg:
        db.session.delete(msg)
        db.session.commit()

        # Phát sự kiện đã xóa đến tất cả client trong phòng workspace_id, trừ sender
        emit('admake/chat/delete', {'message_id': message_id}, room=str(workspace_id), skip_sid=request.sid)
    else:
        print("Message not found to delete", message_id)

