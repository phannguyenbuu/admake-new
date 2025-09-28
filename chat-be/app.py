import ssl
import requests
from flask_admin.contrib.sqla.filters import FilterEqual, BaseSQLAFilter
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, join_room, leave_room, emit
from sqlalchemy.sql import func
from datetime import datetime
from sqlalchemy import desc
from sqlalchemy.sql.expression import func
import json
import os
from sqlalchemy import inspect

from flask import Flask, request, jsonify, session
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash
from models import User  # Model User của bạn

from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView

from flask_cors import CORS
from flask_admin.form import Select2Widget
from wtforms.fields import SelectField
from flask_admin.contrib.sqla.filters import DateBetweenFilter

# from flask_migrate import Migrate
# pg_restore -U postgres -d admake_chat -v --clean admake_chat.dump
# pip install flask flask-socketio flask-cors flask-admin flask-login werkzeug sqlalchemy


from models import User,Message,Group,GroupMember,Location,Attendance,MonthSummary,WorkAssignment,app,db

# app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = 'your-secret-key'
# app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres@localhost:5432/admake_chat'

# scp admake_chat.dump user@vps_ip:/path/on/vps/

UPLOAD_FOLDER = 'static'  # đường dẫn trên VPS nơi lưu file
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# db = SQLAlchemy(app)
socketio = SocketIO(app, cors_allowed_origins='*')

class GroupAdmin(ModelView):
    column_list = ('id', 'name', 'groupId', 'description', 'total_members', 'total_messages', 'total_unread_messages', 'last_message')
    column_searchable_list = ['name', 'description']

    def _total_members(self, context, model, name):
        return model.total_members

    def _total_messages(self, context, model, name):
        return model.total_messages

    def _total_unread_messages(self, context, model, name):
        return model.total_unread_messages

    def _last_message(self, context, model, name):
        return model.last_message

    column_formatters = {
        'total_members': _total_members,
        'total_messages': _total_messages,
        'total_unread_messages': _total_unread_messages,
        'last_message': _last_message
    }


class GroupMemberAdmin(ModelView):
    column_list = ('id', 'user_accountId', 'user_firstName', 'user_lastName', 'group_groupId', 'group_name', 'role')

    column_labels = {
        'user_accountId': 'Account ID',
        'user_firstName': 'Firstname',
        'user_lastName': 'Lastname',
        'group_groupId': 'Group ID',
        'group_name': 'Group Name',
        'role': 'Role'
    }

    column_formatters = {
        'user_accountId': lambda v, c, m, p: m.user.accountId if m.user else '',
        'user_firstName': lambda v, c, m, p: m.user.firstName if m.user else '',
        'user_lastName': lambda v, c, m, p: m.user.lastName if m.user else '',
        'group_groupId': lambda v, c, m, p: m.group.groupId if m.group else '',
        'group_name': lambda v, c, m, p: m.group.name if m.group else ''
    }

    form_ajax_refs = {
        'user': {
            'fields': ['accountId', 'username'],
            'page_size': 10
        },
        'group': {
            'fields': ['groupId', 'name'],
            'page_size': 10
        }
    }



import uuid

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400

    original_filename = file.filename
    name, ext = os.path.splitext(original_filename)  # tách phần tên và phần mở rộng
    filename = original_filename
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

    if os.path.exists(filepath):
        # Tạo tên file mới dạng filename_{uuid}.ext
        filename = f"{name}_{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        print('New file name because an exist file', filename)

    file.save(filepath)
    return jsonify({'message': 'File uploaded successfully', 'filename': filename})

# CRUD APIs for User
@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.json
    user = User(username=data['username'])
    db.session.add(user)
    db.session.commit()
    return jsonify({'id': user.id, 'username': user.username})

@app.route('/api/users/<int:user_id>')
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify({'id': user.id, 'username': user.username})

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.json
    user.username = data.get('username', user.username)
    db.session.commit()
    return jsonify({'id': user.id, 'username': user.username})

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'Deleted'})

# CRUD APIs for Group
@app.route('/api/groups', methods=['POST'])
def create_group():
    data = request.json
    group = Group(
        name=data['name'],
        description=data.get('description'),
        documents=data.get('documents', []),
        images=data.get('images', [])
    )
    db.session.add(group)
    db.session.commit()
    return jsonify({'id': group.id, 'name': group.name})

@app.route('/api/groups/<int:group_id>')
def get_group(group_id):
    user_id = request.args.get('userId')
    if not user_id:
        print("Missing userId")
        return jsonify({"error": "Missing userId"}), 400
    


    response = requests.get("http://31.97.76.62:5273/role/")
    roles = response.json()



    

    
    group = Group.query.get_or_404(group_id)
    
    messages = group.all_messages

    messages_list = []
    for m in messages:
        user = User.query.filter_by(accountId=str(m.user_id)).first()
        
        role = [itm["name"] for itm in roles if str(itm["id"]) == user.role]

        if user:
            messages_list.append({
                'id': m.id,
                'message_id': m.message_id,
                'username': user.username,
                'icon': user.icon,
                'text': m.text,
                'time': m.createdAt.isoformat() if m.createdAt else None,
                'is_unread': m.is_unread,
                'type':m.type,
                'file_url':m.file_url,
                'incoming': user_id != m.user_id,
                'user_role': role,
                'user_id': m.user_id,
                'group_id': m.group_id,
            })

    return jsonify({
        'id': group.id,
        'name': group.name,
        'description': group.description,
        'documents': group.documents,
        'images': group.images,
        'rating': group.rating,
        'rating_count': group.rating_count,
        'messages': messages_list[-50:],
    })

@app.route('/api/groups', methods=['GET'])
def list_groups():
    user_id = request.args.get('userId')
    if not user_id:
        print("Missing userId")
        return jsonify({"error": "Missing userId"}), 400

    groups = Group.query.join(GroupMember).filter(GroupMember.user_id == user_id).all()

    print('ck_groups', user_id, len(groups))
    # groups = Group.query.all()
    # print('GR',len(groups))
    result = []
    for g in groups:
        s =  g.last_message
        result.append({
            'id': g.id,
            'name': g.name,
            'description': g.description,
            'documents': g.documents,
            'images': g.images,
            'time':s.split('|')[0],
            'rating': g.rating,
            'msg': s.split('|')[-1][10:] + '...',
            'rating_count': g.rating_count,
            'members': g.total_members,
            'unread': g.total_unread_messages,
        })
    return jsonify(result)





@app.route('/api/groups/<int:group_id>', methods=['PUT'])
def update_group(group_id):
    group = Group.query.get_or_404(group_id)
    data = request.json
    group.name = data.get('name', group.name)
    group.description = data.get('description', group.description)
    group.documents = data.get('documents', group.documents)
    group.images = data.get('images', group.images)
    db.session.commit()
    return jsonify({'message': 'Updated'})

@app.route('/api/groups/<int:group_id>', methods=['DELETE'])
def delete_group(group_id):
    group = Group.query.get_or_404(group_id)
    db.session.delete(group)
    db.session.commit()
    return jsonify({'message': 'Deleted'})

# Đánh giá 5 sao cho nhóm
@app.route('/api/groups/<int:group_id>/rate', methods=['POST'])
def rate_group(group_id):
    group = Group.query.get_or_404(group_id)
    data = request.json
    rate = data.get('rate')
    if not isinstance(rate, int) or rate < 1 or rate > 5:
        return jsonify({'error': 'Rate must be an integer between 1 and 5'}), 400
    group.rating_sum += rate
    group.rating_count += 1
    db.session.commit()
    return jsonify({'rating': group.rating, 'rating_count': group.rating_count})

# Tạo message (cũng có thể chứa file hoặc link)
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

# Xóa message (chỉ trưởng nhóm, phó nhóm hoặc chủ msg được phép)
# @app.route('/groups/<int:group_id>/messages/<int:msg_id>', methods=['DELETE'])
# def delete_message(group_id, msg_id):
#     user_id = request.args.get('user_id')
#     msg = Message.query.get_or_404(msg_id)
#     member = GroupMember.query.filter_by(user_id=user_id, group_id=group_id).first()
    
#     if not member:
#         return jsonify({'error': 'User not in group'}), 403

#     # Chỉ trường nhóm, phó nhóm hoặc người gửi tin nhắn được xóa
#     if member.role not in ['leader', 'deputy'] and msg.user_id != int(user_id):
#         return jsonify({'error': 'Not authorized to delete message'}), 403

#     db.session.delete(msg)
#     db.session.commit()
#     socketio.emit('message_deleted', {'id': msg_id, 'group_id': group_id}, room=str(group_id))
    
#     return jsonify({'message': 'Deleted'})

@app.route('/api/messages/<group_id>')
@login_required
def get_messages(group_id):
    messages = db.session.filter_by(group_id=group_id).order_by(Message.createdAt.asc()).all()
    return jsonify([m.to_dict() for m in messages])


@app.route('/api/message/<message_id>', methods=['DELETE'])
def delete_message(message_id):
    message = Message.query.filter_by(message_id=message_id).first()

    if not message:
        return jsonify({"error": "Message not found"}), 404

    # Nếu có xác thực user, kiểm tra quyền ở đây
    # user_id = get_current_user_id()
    # if message.user_id != user_id:
    #     return jsonify({"error": "Unauthorized"}), 403

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
    






login_manager = LoginManager()
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.filter_by(accountId=user_id).first()

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if user:
        print('Login:',username,password, user.password)
        # if user and check_password_hash(user.password, password):
        if user.password.startswith(password):
            print('Start login')
            login_user(user)  # tạo session cho user
            print("User:Checked", {"userId": user.accountId, "username": user.username, 
                                   "role": user.role, "icon": user.icon})
            return jsonify({"userId": user.accountId, "username": user.username, "role": user.role})
        return jsonify({"error": "Invalid credentials"}), 401
    else:
        print("Cannot find username", username)
        return jsonify({'status': 'fail', 'message': 'Invalid credentials'}), 401

@app.route('/api/auth/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully"})

@app.route('/api/auth/status')
def auth_status():
    if current_user.is_authenticated:
        return jsonify({"userId": current_user.accountId, "username": current_user.username})
    return jsonify({"userId": None}), 401

@app.route('/api/current_user')
def get_current_user():
    if current_user.is_authenticated:
        return {
            "user_id": current_user.accountId,
            "username": current_user.username,
            "email": current_user.email
        }
    else:
        return {"user_id": None}, 401





@socketio.on('join_group')
def on_join_group(data):
    group_id = str(data.get('group_id'))

    print('join', group_id)

    if group_id:
        join_room(group_id)
        print(f"Socket {request.sid} joined room {group_id}")
        socketio.emit('room_joined', {'group_id': group_id}, room=request.sid)

@socketio.on('leave_group')
def on_leave_group(data):
    group_id = str(data.get('group_id'))
    if group_id:
        leave_room(group_id)
        print(f"Socket {request.sid} left room {group_id}")
        socketio.emit('room_left', {'group_id': group_id}, room=request.sid)



@socketio.on('admake/chat/message')
def handle_message(data):
    
    print('Receive data', data)
    group_id = data['group_id']
    message_id = data['message_id']
    user_id = data['user_id']
    username = data['username']
    # icon = data['icon']
    text = data.get('text')
    file_url = data.get('file_url')
    link = data.get('link')
    time = datetime.now()
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
    msg = Message(group_id=group_id,type=type, user_id=user_id, text=text, 
                  message_id = message_id,
                  file_url=file_url, updatedAt=time)
    db.session.add(msg)
    db.session.commit()
    
    emit('message', {
        'type':type,
        'message_id': message_id,
        # 'icon': icon,
        'text': text,
        'file_url': file_url,
        'user_id': user_id,
        'username': username,
        'link': link,
        'group_id': group_id,
        'time': time_str,
        'incoming': False,
    }, room=str(group_id), skip_sid=request.sid)

    emit('message_ack', {
        'status': 'success',
        'message': 'Message received and stored successfully',
        'message_id': message_id
    }, room=request.sid)

def seed_database_user():
    with app.app_context():
        inspector = inspect(db.engine)
        table_name = User.__tablename__ if hasattr(User, '__tablename__') else 'user'

        # Kiểm tra bảng User có tồn tại không
        if inspector.has_table(table_name):
            # Nếu tồn tại thì xóa trống bảng User
            db.session.query(User).delete()
            db.session.commit()
        else:
            # Nếu chưa tồn tại thì tạo bảng
            db.create_all()

        file_path = os.path.join('static', 'users.json')

        # Đọc dữ liệu từ file JSON
        with open(file_path, 'r', encoding='utf-8') as f:
            users_data = json.load(f)

            total = len(users_data)

            for i, user in enumerate(users_data):
                User.create_item(user)
                print(i,'/', total)

class UserView(ModelView):
    column_searchable_list = ['accountId','username','firstName','lastName']
    form_args = {
        'BalanceAmount': { 'label': 'Lương tháng' }
    }

    form_labels = {
        'BalanceAmount': 'Lương tháng',
        'username': 'Nickname',
        'firstName': 'Họ & tên đệm',
        'lastName': 'Tên',
        'Icon': 'Hình ảnh',
        'Socialinfor': 'Thông tin liên lạc', #{phone_number,adress,email,facebook,zalo,...}
        'Orderwebhook': 'Webhook',
        'Cryptoaddresslist': 'Tài khoản ngân hàng',
        'Selectedservices': 'Chuyên môn',
        'Companyname':'Bộ phận',
        'Role':'Vai trò',
        'selectedProvider':'Dịch vụ'
    }




class MessageAdmin(ModelView):
    column_searchable_list = ['text']

class AttendanceView(ModelView):
    form_ajax_refs = {
        'user': {
            'fields': ['accountId'],
            'page_size': 10
        }
    }




class GroupInFilter(BaseSQLAFilter):
    def get_options(self, view):
        # Lấy tất cả nhóm từ DB và thêm option 'Tất cả nhóm'
        groups = Group.query.all()
        
        options = [("", "Tất cả nhóm")]
        options.extend([(str(g.groupId), g.name) for g in groups])

        # print(options)
        return options

    def apply(self, query, value, alias=None):
        if not value:
            return query  # Tất cả nhóm, không lọc
        return query.filter(self.column == value)

    def operation(self):
        return 'bằng'

class MessageView(ModelView):
    column_searchable_list = ['text']
    column_filters = [
        GroupInFilter(Message.group_id, 'Nhóm'),
        DateBetweenFilter(Message.createdAt, 'Ngày tạo'),
        DateBetweenFilter(Message.updatedAt, 'Ngày cập nhật')
    ]

    def get_filters(self):
        filters = super().get_filters()
        # Thay thế filter group_id mặc định bằng filter dropdown có tên nhóm
        for i, flt in enumerate(filters):
            if flt.column.name == 'group_id':
                filters[i] = GroupInFilter(column=flt.column, name='Nhóm')
        return filters

    def get_query(self):
        query = super().get_query()
        group_filter = session.get('group_filter')
        if group_filter:
            query = query.filter(Message.group_id == group_filter)
        return query
    
# ------------------------------------------
from flask import request, redirect, url_for



@app.route('/admin/filter-group-by-group')
def filter_group_by_group():
    group_id = request.args.get('group_id')
    # Xử lý lưu group_id vào session hoặc chuyển hướng sang view phù hợp
    # Ví dụ lưu trong session để lọc danh sách hiện tại:
    if group_id:
        session['group_filter'] = group_id
    else:
        session.pop('group_filter', None)
    # Chuyển hướng về trang danh sách main (ví dụ view message)
    return redirect(url_for('message.index_view'))


@app.route('/admin/filter-message-by-group')
def filter_message_by_group():
    group_id = request.args.get('group_id')
    # Xử lý lưu group_id vào session hoặc chuyển hướng sang view phù hợp
    # Ví dụ lưu trong session để lọc danh sách hiện tại:
    if group_id:
        session['group_filter'] = group_id
    else:
        session.pop('group_filter', None)
    # Chuyển hướng về trang danh sách main (ví dụ view message)
    return redirect(url_for('message.index_view'))

@app.route('/admin/filter-location-by-group')
def filter_location_by_group():
    group_id = request.args.get('group_id')
    # Xử lý lưu group_id vào session hoặc chuyển hướng sang view phù hợp
    # Ví dụ lưu trong session để lọc danh sách hiện tại:
    if group_id:
        session['group_filter'] = group_id
    else:
        session.pop('group_filter', None)
    # Chuyển hướng về trang danh sách main (ví dụ view message)
    return redirect(url_for('message.index_view'))


@app.route('/admin/filter-workassignment-by-group')
def filter_workassignment_by_group():
    group_id = request.args.get('group_id')
    # Xử lý lưu group_id vào session hoặc chuyển hướng sang view phù hợp
    # Ví dụ lưu trong session để lọc danh sách hiện tại:
    if group_id:
        session['group_filter'] = group_id
    else:
        session.pop('group_filter', None)
    # Chuyển hướng về trang danh sách main (ví dụ view message)
    return redirect(url_for('message.index_view'))

@app.route('/admin/filter-monthsummary-by-group')
def filter_monthsummary_by_group():
    group_id = request.args.get('group_id')
    # Xử lý lưu group_id vào session hoặc chuyển hướng sang view phù hợp
    # Ví dụ lưu trong session để lọc danh sách hiện tại:
    if group_id:
        session['group_filter'] = group_id
    else:
        session.pop('group_filter', None)
    # Chuyển hướng về trang danh sách main (ví dụ view message)
    return redirect(url_for('message.index_view'))



@app.context_processor
def inject_groups():
    groups = Group.query.all()
    return dict(groups=groups)

# @app.route('/admin/filter-url')
# def filter_by_group():
#     group_id = request.args.get('group_id')
    
class MyAdmin(Admin):
    def render(self, template, **kwargs):
        kwargs['groups'] = Group.query.all()
        return super().render(template, **kwargs)
    


# ------------------------------------------

admin = Admin(app)
admin.add_view(UserView(User, db.session, name='Quản lý nhân sự'))
admin.add_view(AttendanceView(Attendance, db.session, name='Chấm công'))

admin.add_view(GroupAdmin(Group, db.session, name="Danh sách công trình"))
admin.add_view(ModelView(WorkAssignment, db.session, name='Kế hoạch công việc'))

# admin.add_view(GroupMemberAdmin(GroupMember, db.session))
admin.add_view(ModelView(Location, db.session, name="Địa điểm công việc"))

admin.add_view(ModelView(MonthSummary, db.session, name="Tổng kết tháng"))
with app.app_context():
    admin.add_view(MessageView(Message, db.session, name="Tin nhắn"))

import random
if __name__ == '__main__':
    # context = ssl.SSLContext(ssl.PROTOCOL_TLS)
    # context.load_cert_chain('/etc/letsencrypt/live/archbox.pw/fullchain.pem',  # đường dẫn tới file chứng chỉ
    #                         '/etc/letsencrypt/live/archbox.pw/privkey.pem')
    
    socketio.run(app, host='0.0.0.0', port=5007, debug=True)
