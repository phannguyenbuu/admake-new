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
    workspace_id = data['workspace_id']
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


@socketio.on('admake/chat/rate')
def handle_message_rate(data):
    print('Receive rate', data)
    message_id = data['message_id']
    rate = data['rate']
    group_id = data['group_id']

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


    work = Workspace.query.filter(Workspace.version == group_id).first()
        
    if not work:
        print("Workspace not found", group_id)
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
        'group_id': group_id,
    }, room=str(group_id), skip_sid=request.sid)

    emit('admake/chat/rate_ack', {
        'status': 'success',
        'message': 'Message received and stored successfully',
        'message_id': message_id
    }, room=request.sid)



