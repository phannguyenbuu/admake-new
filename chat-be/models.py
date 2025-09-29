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

from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView

from flask_cors import CORS
from sqlalchemy import text
import pytz
import hashlib
import random
import string
from sqlalchemy.exc import IntegrityError
import uuid
from sqlalchemy.dialects.postgresql import UUID
from flask_socketio import SocketIO, join_room, leave_room, emit

app = Flask(__name__)

from dotenv import load_dotenv
load_dotenv()

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')

db = SQLAlchemy(app)
socketio = SocketIO(app, cors_allowed_origins='*')

def generate_random_md5_password(length=10):
    # Tạo chuỗi ngẫu nhiên gồm chữ và số
    random_str = ''.join(random.choices(string.ascii_letters + string.digits, k=length))
    # Mã hóa MD5 chuỗi đó
    md5_hash = hashlib.md5(random_str.encode()).hexdigest()
    return md5_hash

def load_json(params, key):
    cryptoAddressList = params.get(key, None)

    if isinstance(cryptoAddressList, str):
        # Nếu nó là string thì mới parse
        cryptoAddressList_data = json.loads(cryptoAddressList) if cryptoAddressList else None
    else:
        # Nếu là list hoặc dict rồi thì không cần parse
        cryptoAddressList_data = cryptoAddressList

    return cryptoAddressList_data


def to_date(date_str):
    try:
        createdAt = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
    except ValueError:
        createdAt = None
    return createdAt
# Models
class User(db.Model):
    __tablename__ = 'user'

    is_authenticated = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=False)
    is_anonymous = db.Column(db.Boolean, default=False)

    id = db.Column(db.Integer, primary_key=True)
    accountId = db.Column(db.String(80), unique = True)
    balanceAmount = db.Column(db.String(80), nullable=True)
    username = db.Column(db.String(80), nullable=True)
    password = db.Column(db.String(80), nullable=True)
    firstName = db.Column(db.String(80), nullable=True)
    lastName = db.Column(db.String(80), nullable=True)
    icon = db.Column(db.String)
    companyName = db.Column(db.String(80), nullable=True)
    localeCode = db.Column(db.String(80), nullable=True)
    languageCode = db.Column(db.String(80), nullable=True)
    socialInfor = db.Column(db.JSON)
    orderWebhook = db.Column(db.String(255), nullable=True)
    cryptoAddressList = db.Column(db.JSON)
    selectedProvider = db.Column(db.JSON)
    selectedServices = db.Column(db.JSON)
    createdAt = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updatedAt = db.Column(db.DateTime(timezone=True), server_default=func.now())
    role = db.Column(db.String(20), default='user')

    def get_id(self):
        return self.accountId

    def get_unread_messages(self):
        # Lấy tất cả tin nhắn trong các nhóm mà user là thành viên và is_unread = True
        return Message.query.join(GroupMember, Message.group_id == GroupMember.group_id) \
            .filter(GroupMember.user_id == self.id, Message.is_unread == True) \
            .all()
    
    @staticmethod
    def create_item(params):
        teleInfo = json.loads(params.get('telegramInfo', '[]'))
        if teleInfo:
            teleInfo['type'] = 'instagram'

        firstName = params.get('firstName', '')
        lastName = params.get('lastName', '')
        
        user = User(
            accountId=str(params.get('accountId', '')),
            balanceAmount=params.get('balanceAmount', 1000),
            username=f'{firstName}_{lastName}',
            password= generate_random_md5_password(),
            firstName=firstName,
            lastName=lastName,
            companyName=params.get('companyName', ''),
            localeCode=params.get('localeCode', ''),
            languageCode=params.get('languageCode', ''),
            socialInfor=load_json(params,'socialInfor'),
            orderWebhook=params.get('orderWebhook', ''),
            cryptoAddressList=load_json(params,'cryptoAddressList'),
            selectedProvider=load_json(params,'selectedProvider'),
            selectedServices=load_json(params,'selectedServices'),

            createdAt=to_date(params.get('createdAt','')),
            updatedAt=to_date(params.get('updatedAt','')),
        )

        try:
            db.session.add(user)  # hoặc bulk insert
            db.session.commit()
        except IntegrityError as e:
            db.session.rollback()

            if 'user_accountId_key' in str(e.orig):
                print("Duplicate accountId, bỏ qua bản ghi này")
            else:
                raise  # lỗi khác thì raise tiếp
        return user

    @property
    def groups(self):
        return Group.query.join(GroupMember).filter(GroupMember.user_id == self.id).all()
        
class Group(db.Model):
    __tablename__ = 'group'

    id = db.Column(db.Integer, primary_key=True)
    groupId = db.Column(db.Integer, unique=True)
    name = db.Column(db.String(120), nullable=True)
    description = db.Column(db.String(255))
    documents = db.Column(db.JSON, default=[])  # Lưu danh sách đường dẫn tài liệu
    images = db.Column(db.JSON, default=[])     # Lưu danh sách đường dẫn hình ảnh
    chats = db.Column(db.JSON, default=[])      # Lưu danh sách message ID lưu lại
    rating_sum = db.Column(db.Integer, default=0)
    rating_count = db.Column(db.Integer, default=0)
    createdAt = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updatedAt = db.Column(db.DateTime(timezone=True), server_default=func.now())

    @staticmethod
    def create_item(params):
        group = Group(
            groupId=params.get('id', 0),
            name=params.get('name', 0),
            description=params.get('description', ''),

            documents=load_json(params,'documents'),
            images=load_json(params,'images'),
            chats=load_json(params,'chats'),

            rating_sum=params.get('rating_sum', 0),
            
            createdAt=to_date(params.get('createdAt','')),
            updatedAt=to_date(params.get('updatedAt','')),
        )

        db.session.add(group)
        db.session.commit()
        return group
    
    @property
    def rating(self):
        if self.rating_count == 0:
            return 0
        return round(self.rating_sum / self.rating_count, 2)
    
    @property
    def total_members(self):
        return GroupMember.query.filter_by(group_id=self.id).count()

    @property
    def total_messages(self):
        return Message.query.filter_by(group_id=self.id).count()
    
    @property
    def all_messages(self):
        return Message.query.filter_by(group_id=self.id).order_by(Message.createdAt).all()

    @property
    def total_unread_messages(self):
        return Message.query.filter_by(group_id=self.id, is_unread=True).count()

    @property
    def last_message(self):
        msgs = Message.query.filter_by(group_id=self.id)

        if msgs.count() > 0:
            last_msg = msgs.order_by(Message.createdAt.desc()).first()
            if last_msg:
                # Trả lại đoạn text hoặc thông tin bạn muốn hiển thị
                return f"{last_msg.createdAt}|{last_msg.text[:50]}"  # cắt ngắn 50 ký tự
        return ''

class GroupMember(db.Model):
    __tablename__ = 'group_member'

    id = db.Column(db.Integer, primary_key=True)
    
    group_id = db.Column(db.Integer, db.ForeignKey('group.groupId'), nullable=True)
    user_id = db.Column(db.String(80), db.ForeignKey('user.accountId'), nullable=True)

    role = db.Column(db.String(20), default='member')

    user = db.relationship('User', backref='group_members')
    group = db.relationship('Group', backref='group_members')

    @staticmethod
    def create_item(params):
        try:
            user_id = str(params.get('user_id',0))
            user_exists = User.query.filter_by(accountId=user_id).first()
            
            group_id = params.get('group_id', 0)
            group_exists = Group.query.filter_by(id=group_id).first()

            if user_exists and group_exists:
                gr = GroupMember(
                    user_id=user_id,
                    group_id=group_id,
                    role=params.get('role', ''),
                )
        
                db.session.add(gr)  # hoặc bulk insert
                db.session.commit()
                return gr
            else:
                print('No exist',user_id,group_id)
        except IntegrityError as e:
            db.session.rollback()
            # Kiểm tra có phải lỗi unique constraint vi phạm không
            if 'user_accountId_key' in str(e.orig):
                print("Duplicate accountId, bỏ qua bản ghi này")
                # Hoặc xử lý theo ý bạn, ví dụ bỏ qua, log lại,...
            else:
                raise  # lỗi khác thì raise tiếp


class Message(db.Model):
    __tablename__ = 'message'

    id = db.Column(db.Integer, primary_key=True)
    message_id = db.Column(db.String(80))
    group_id = db.Column(db.Integer, db.ForeignKey('group.groupId'), nullable=True)
    user_id = db.Column(db.String(80), db.ForeignKey('user.accountId'), nullable=True)
    # username = db.Column(db.String(80), db.ForeignKey('user.username'), nullable=True)

    text = db.Column(db.String(500))
    file_url = db.Column(db.String(255), nullable=True)
    createdAt = db.Column(db.DateTime(timezone=True), server_default=func.now())
    updatedAt = db.Column(db.DateTime(timezone=True), server_default=func.now())
    
    is_unread = db.Column(db.Boolean, default=False)
    # is_link = db.Column(db.Boolean, default=False)
    # is_doc = db.Column(db.Boolean, default=False)
    # is_reply = db.Column(db.Boolean, default=False)
    # is_img = db.Column(db.Boolean, default=False)
    # incoming = db.Column(db.Boolean, default=False)

    is_favourite = db.Column(db.Boolean, default=False)

    react = db.Column(db.JSON)
    type = db.Column(db.String(10), nullable=True)
    
    user = db.relationship('User', foreign_keys=[user_id])
    group = db.relationship('Group', foreign_keys=[group_id])

    @staticmethod
    def create_item(params):
        try:
            user_id = str(params.get('user_id',''))
            user_exists = User.query.filter_by(accountId=user_id).first()
            group_id = params.get('group_id', 0)
            group_exists = Group.query.filter_by(id=group_id).first()
            
            if user_exists and group_exists:
                # print(accountId, group.id)
                msg = Message(
                    group_id=group_id,
                    user_id=user_id,
                    text=params.get('text', ''),
                    # username=params.get('username', ''),
                    is_unread=params.get('is_unread', '') != 'SUCCESS',
                    
                    createdAt=to_date(params.get('createdAt','')),
                    updatedAt=to_date(params.get('updatedAt','')),
                )
                
                db.session.add(msg)
                db.session.commit()
                return msg
            else:
                print('No exist',user_id,group_id)
        except IntegrityError as e:
            db.session.rollback()
            # Kiểm tra có phải lỗi unique constraint vi phạm không
            if 'user_accountId_key' in str(e.orig):
                print("Duplicate accountId, bỏ qua bản ghi này")
                # Hoặc xử lý theo ý bạn, ví dụ bỏ qua, log lại,...
            else:
                raise  # lỗi khác thì raise tiếp



class Location(db.Model):
    __tablename__ = 'locations'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    gps_lat = db.Column(db.Float, nullable=False)
    gps_lng = db.Column(db.Float, nullable=False)
    type = db.Column(db.Enum('chi_nhanh', 'cong_trinh', name='location_type'), nullable=False)

class Attendance(db.Model):
    __tablename__ = 'attendances'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(80), db.ForeignKey('user.accountId'), nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=False)
    checkin_time = db.Column(db.DateTime, nullable=False)
    shift = db.Column(db.Enum('sang', 'chieu', 'tang_ca', name='shift_type'), nullable=False)
    photo_path = db.Column(db.String(500))
    gps_lat = db.Column(db.Float, nullable=False)
    gps_lng = db.Column(db.Float, nullable=False)
    support_fee = db.Column(db.Numeric(10, 2), default=0)

    user = db.relationship('User', backref='attendances')
    location = db.relationship('Location', backref='attendances')

class MonthSummary(db.Model):
    __tablename__ = 'months_summary'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(80), db.ForeignKey('user.accountId'), nullable=False)
    month_year = db.Column(db.String(7), nullable=False)  # ví dụ "2025-09"
    total_work_days = db.Column(db.Integer, default=0)
    total_support_fee = db.Column(db.Numeric(10, 2), default=0)
    total_shifts = db.Column(db.JSON)

    user = db.relationship('User', backref='month_summaries')


class WorkAssignment(db.Model):
    __tablename__ = 'work_assignments'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(80), db.ForeignKey('user.accountId'), nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'), nullable=False)
    assignment_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=True)
    end_time = db.Column(db.Time, nullable=True)
    deadline = db.Column(db.DateTime, nullable=True)
    description = db.Column(db.Text, nullable=True)
    expected_results = db.Column(db.Text, nullable=True)
    attendance_score = db.Column(db.Numeric(5, 2), nullable=True)  # điểm chuyên cần
    performance_score = db.Column(db.Numeric(5, 2), nullable=True) # điểm hiệu quả công việc

    user = db.relationship('User', backref='work_assignments')
    location = db.relationship('Location', backref='work_assignments')

import random

def toIntId(s):
    try:
        return int(s)
    except (ValueError, TypeError):
        return 0

def import_data_from_json():
    with db.engine.connect() as conn:
        conn.execute(text('DROP TABLE IF EXISTS "user" CASCADE'))
        conn.execute(text('DROP TABLE IF EXISTS "group" CASCADE'))
        conn.execute(text('DROP TABLE IF EXISTS "group_member" CASCADE'))
        conn.execute(text('DROP TABLE IF EXISTS "message" CASCADE'))
        conn.commit()

    db.create_all()

    with open('admake-chatbox-backend/static/exported_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 1. Chọn ngẫu nhiên 100 group_member trước (hoặc số bao nhiêu bạn muốn)
    sampled_group_members = random.sample(data["group_members"], k=1000)

    # 2. Lấy tập user_id và group_id từ group_member đó
    sampled_user_ids = set(gm['user_id'] for gm in sampled_group_members)
    sampled_group_ids = set(gm['group_id'] for gm in sampled_group_members)
    sampled_group_ids = set(list(sampled_group_ids)[:30])

    # 3. Lấy user liên quan
    sampled_users = [u for u in data["users"] if toIntId(u['accountId']) in sampled_user_ids]

    # 4. Lấy group liên quan
    sampled_groups = [g for g in data["groups"] if g['id'] in sampled_group_ids]

    # 5. Lấy messages liên quan user và group
    sampled_messages = [msg for msg in data["messages"]
                        if msg['user_id'] in sampled_user_ids and msg['group_id'] in sampled_group_ids]

    # Import theo thứ tự khoá ngoại
    for u in sampled_users:
        User.create_item(u)

    for g in sampled_groups:
        Group.create_item(g)

    for gm in sampled_group_members:
        GroupMember.create_item(gm)

    for msg in sampled_messages:
        Message.create_item(msg)

    db.session.commit()



if __name__ == "__main__":
    with app.app_context():
        import_data_from_json()

        print("Done")

