from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import json
# from datetime import datetime, date
import datetime
import os
from flask_cors import CORS
import random
from sqlalchemy.types import JSON
from sqlalchemy import inspect
import pytz
from sqlalchemy import create_engine, MetaData, Table, select, insert
from sqlalchemy.sql import func, text
from psycopg2.extras import Json
from datetime import timedelta
from flask import Flask, jsonify, request
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity
)
import logging
import re
from flask_cors import CORS

def cors_origin_regex(origin):
    if origin is None:
        return False

    # Kiểm tra origin có phải https và kết thúc với .archbox.pw
    allowed_pattern_archbox = re.compile(r"^https:\/\/([a-z0-9\-]+\.)*archbox\.pw$")
    allowed_pattern_admake = re.compile(r"^https:\/\/([a-z0-9\-]+\.)*admake\.vn$")
    localhost_pattern = re.compile(r"^http:\/\/localhost(:\d+)?$")

    return bool(
        allowed_pattern_archbox.match(origin) or
        allowed_pattern_admake.match(origin) or
        localhost_pattern.match(origin)
    )

def custom_cors_origin():
    origin = request.headers.get('Origin')
    if cors_origin_regex(origin):
        return origin
    return None

app = Flask(__name__)
app.logger.setLevel(logging.DEBUG)
app.secret_key = 'admake-secret-token'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=15)
app.config['JWT_SECRET_KEY'] = 'admake-jwt-secret-key'
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'static')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

from dotenv import load_dotenv
load_dotenv()

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
db = SQLAlchemy(app)

jwt = JWTManager(app)


CORS(app)


class BaseModel(db.Model):
    __abstract__ = True

    deletedAt = db.Column(db.DateTime, nullable=True)
    createdAt = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updatedAt = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    version = db.Column(db.Integer)

    def get_date(self):
        tz = pytz.timezone("Asia/Ho_Chi_Minh")  # múi giờ GMT+7
        # now = datetime.utcnow().replace(tzinfo=pytz.utc).astimezone(tz)
        return self.createdAt.replace(tzinfo=pytz.utc).astimezone(tz).date()


class Material(BaseModel):
    __tablename__ = 'material'

    id = db.Column(db.Integer, primary_key=True)
    
    name = db.Column(db.String(255), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit = db.Column(db.String(50))
    price = db.Column(db.Float)
    image = db.Column(db.String(255))
    description = db.Column(db.Text)
    supplier = db.Column(db.String(255))
    # version = db.Column(db.Integer)

    # deletedAt = db.Column(db.DateTime, nullable=True)
    # createdAt = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    # updatedAt = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            # print(f"DEBUG: Column {column.name} value type: {type(value)}")
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result
    

def generate_datetime_id():
    now = datetime.datetime.utcnow()
    timestamp_str = now.strftime("%Y%m%d%H%M%S%f")  # năm tháng ngày giờ phút giây micro giây
    random_str = ''.join(random.choices('0123456789abcdef', k=6))  # thêm 6 ký tự hex ngẫu nhiên
    return timestamp_str + random_str

class User(BaseModel):
    __tablename__ = 'user'

    id = db.Column(db.String(50), primary_key=True)    
    username = db.Column(db.String(255), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50))
    role_id = db.Column(db.Integer)
    type = db.Column(db.String(50))
    hashKey = db.Column(db.String(255))
    fullName = db.Column(db.String(255))
    level_salary = db.Column(db.Integer)
    phone = db.Column(db.String(20))
    avatar = db.Column(db.String(255))

    is_authenticated = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=False)
    is_anonymous = db.Column(db.Boolean, default=False)
    balanceAmount = db.Column(db.String(80), nullable=True)
    
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

    workpoints = db.relationship('Workpoint', backref='user', lazy=True)

    # customer = db.relationship("Customer", back_populates="user", uselist=False)

    # deletedAt = db.Column(db.DateTime, nullable=True)
    # createdAt = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    # updatedAt = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    # version = db.Column(db.Integer)

    def update_role(self):
        role = db.session.get(Role, self.role_id)

        if role:
            return role.to_dict()

    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            # print(f"DEBUG: Column {column.name} value type: {type(value)}")
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value

        result["role"] = self.update_role()

        return result

    @staticmethod
    def parse(data):
        role_id_value = data.get('role_id')
        if role_id_value in ('undefined', '', None):
            role_id_value = None
        return User(
            id = generate_datetime_id(),
            # id=data.get("_id", {}).get("$oid"),
            username=data.get("username"),
            password=data.get("password"),
            status="active",
            role_id=role_id_value,
            type=data.get("type"),
            hashKey=data.get("hashKey"),
            fullName=data.get("fullName"),
            level_salary=data.get("level_salary"),
            phone=data.get("phone"),
            avatar=data.get("avatar"),
            deletedAt=parse_date(data.get("deletedAt")),
            createdAt=parse_date(data.get("createdAt")),
            updatedAt=parse_date(data.get("updatedAt")),
            version=data.get("__v"),
        )
    
class Customer(db.Model):
    __tablename__ = "customer"

    id = db.Column(db.String(50), primary_key=True)
    user_id = db.Column(db.String(50), db.ForeignKey("user.id"), unique=True, nullable=False)

    taxCode = db.Column(db.String(50))
    
    workInfo  = db.Column(db.String(255))
    workStart = db.Column(db.DateTime, nullable=True)
    workEnd = db.Column(db.DateTime, nullable=True)
    workAddress = db.Column(db.String(255))
    workPrice = db.Column(db.Integer)
   
    user = db.relationship("User", backref="customer", uselist=False)

    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            # print(f"DEBUG: Column {column.name} value type: {type(value)}")
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value

        result["role"] = "Khách hàng"

        if self.user:
            user_data = self.user.to_dict()
            result.update(user_data) 

        return result



class Role(BaseModel):
    __tablename__ = 'role'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    permissions = db.Column(JSON)  # lưu list permissions
    name = db.Column(db.String(255))
    # deletedAt = db.Column(db.DateTime, nullable=True)
    # createdAt = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    # updatedAt = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    # version = db.Column(db.Integer)

    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            # print(f"DEBUG: Column {column.name} value type: {type(value)}")
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result

    @staticmethod
    def create_item(data):
        return Role(
            permissions=data.get("permissions"),
            name=data.get("name"),
            deletedAt=data.get("deletedAt"),
            createdAt=parse_date(data.get("createdAt")),
            updatedAt=parse_date(data.get("updatedAt")),
            version=data.get("__v"),
        )
    
class Workspace(BaseModel):
    __tablename__ = "workspace"
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.String(50), primary_key=True)  # _id.$oid
    name = db.Column(db.String(255))
    owner_id = db.Column(db.String(50))
    description = db.Column(db.String(255))
    documents = db.Column(db.JSON, default=[])  # Lưu danh sách đường dẫn tài liệu
    images = db.Column(db.JSON, default=[])     # Lưu danh sách đường dẫn hình ảnh
    chats = db.Column(db.JSON, default=[])      # Lưu danh sách message ID lưu lại
    rating_sum = db.Column(db.Integer, default=0)
    rating_count = db.Column(db.Integer, default=0)

    state = db.Column(db.String(50))
    
    

    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            # print(f"DEBUG: Column {column.name} value type: {type(value)}")
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result

    @staticmethod
    def parse(data):
        return Workspace(
            id=data.get("_id", {}).get("$oid"),
            
            name=data.get("name"),
            owner_id=data.get("ownerId", {}).get("$oid"),
            createdAt=parse_date(data.get("createdAt")),
            updatedAt=parse_date(data.get("updatedAt")),
            deletedAt=parse_date(data.get("deletedAt")),
            version=data.get("__v"),
        )
    
class Task(BaseModel):
    __tablename__ = "task"

    id = db.Column(db.String(50), primary_key=True)  # _id.$oid
    title = db.Column(db.String(255))
    description = db.Column(db.Text)
    status = db.Column(db.String(50))
    type = db.Column(db.String(50))
    reward = db.Column(db.Integer)
    amount = db.Column(db.Integer)
    salary_type = db.Column(db.String(10))
    assign_ids = db.Column(db.JSON)  # lưu JSON string của list ObjectId
    workspace_id = db.Column(db.String(50))
    customer_id = db.Column(db.String(50))
    materials = db.Column(db.JSON)  # lưu JSON string của list dict {materialId, quantity}
    create_by_id = db.Column(db.String(50))
    end_time = db.Column(db.DateTime)
    start_time = db.Column(db.DateTime)

    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            # print(f"DEBUG: Column {column.name} value type: {type(value)}")
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result

    @staticmethod
    def parse(data):
        def parse_oid_list(lst):
            # lst = list dict chứa {"$oid": "..."}
            if not lst:
                return []
            return [item.get("$oid") for item in lst]

        def parse_materials(lst):
            if not lst:
                return []
            # chuyển mỗi element giữ materialId và quantity, materialId lấy $oid
            out = []
            for item in lst:
                material_id = item.get("materialId", {}).get("$oid")
                quantity = item.get("quantity", 0)
                out.append({"materialId": material_id, "quantity": quantity})
            return out

        return Task(
            id=generate_datetime_id(),
            title=data.get("title"),
            description=data.get("description"),
            status=data.get("status"),
            type=data.get("type"),
            reward=data.get("reward"),
            assign_ids=data.get("assignIds"),
            workspace_id=data.get("workspaceId"),
            customer_id=data.get("customerId"),
            materials=data.get("materials"),
            create_by_id=data.get("createById"),
            
            version=data.get("__v"),
            end_time=parse_date(data.get("endTime")),
            start_time=parse_date(data.get("startTime")),

            deletedAt=parse_date(data.get("deletedAt")),
            createdAt=parse_date(data.get("createdAt")),
            updatedAt=parse_date(data.get("updatedAt")),
        )

class Group(BaseModel):
    __tablename__ = 'group'
    __table_args__ = {'quote': True}

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    # groupId = db.Column(db.Integer, unique=True)
    name = db.Column(db.String(120), nullable=True)
    description = db.Column(db.String(255))
    address = db.Column(db.String(255))
    documents = db.Column(db.JSON, default=[])  # Lưu danh sách đường dẫn tài liệu
    images = db.Column(db.JSON, default=[])     # Lưu danh sách đường dẫn hình ảnh
    chats = db.Column(db.JSON, default=[])      # Lưu danh sách message ID lưu lại
    rating_sum = db.Column(db.Integer, default=0)
    status = db.Column(db.String(10), default=0)
    # createdAt = db.Column(db.DateTime(timezone=True), server_default=func.now())
    # updatedAt = db.Column(db.DateTime(timezone=True), server_default=func.now())

    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            # print(f"DEBUG: Column {column.name} value type: {type(value)}")
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value

        result['members'] = self.total_members
                
        return result
    
    @staticmethod
    def create_item(params):
        description_value = params.get('description') or generate_datetime_id()

        group = Group(
            name=params.get('name', 0),
            description=description_value,
            address=params.get('address', 0),
            documents=[],
            images=[],
            chats=[],

            rating_sum=params.get('rating_sum', 0),
            
            # createdAt=to_date(params.get('createdAt','')),
            # updatedAt=to_date(params.get('updatedAt','')),
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
    
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'), nullable=True)
    user_id = db.Column(db.String(80), db.ForeignKey('user.id'), nullable=True)

    role = db.Column(db.String(20), default='member')

    user = db.relationship('User', backref='group_members')
    group = db.relationship('Group', backref='group_members')

    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            # print(f"DEBUG: Column {column.name} value type: {type(value)}")
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result

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

from sqlalchemy.exc import IntegrityError
class Message(BaseModel):
    __tablename__ = 'message'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    message_id = db.Column(db.String(80))
    group_id = db.Column(db.Integer, db.ForeignKey('group.id'), nullable=True)
    user_id = db.Column(db.String(80), db.ForeignKey('user.id'), nullable=True)
    
    text = db.Column(db.String(500))
    file_url = db.Column(db.String(255), nullable=True)
    
    role = db.Column(db.Integer, default=0)
    is_favourite = db.Column(db.Boolean, default=False)

    react = db.Column(db.JSON)
    type = db.Column(db.String(10), nullable=True)
    
    user = db.relationship('User', foreign_keys=[user_id])
    group = db.relationship('Group', foreign_keys=[group_id])

    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            # print(f"DEBUG: Column {column.name} value type: {type(value)}")
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        
        # result["role"] = self.user.role_id
        return result

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
                    file_url = params.get('file_url',''),
                    is_favourite = params.get('is_favourite', True),
                    react = params.get('react',''),
                    type = params.get('type',''),
                    id = params.get('id',''),
                    message_id = params.get('message_id',''),
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

class Workpoint(BaseModel):
    __tablename__ = 'workpoint'
    id = db.Column(db.String(80), primary_key=True)
    note = db.Column(db.String(255))

    checklist = db.Column(db.JSON)
    user_id = db.Column(db.String(80), db.ForeignKey('user.id'), nullable=True)

    def __repr__(self):
        return f'<Workpoint id={self.id} user_id={self.user_id}>'
    
    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            # print(f"DEBUG: Column {column.name} value type: {type(value)}")
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        
        # result["role"] = self.user.role_id
        return result
    
    def check_point(self, timeIndex, checkType, imgUrl):
        if self.checklist is None:
            self.checklist = {}

        if timeIndex not in self.checklist:
            self.checklist[timeIndex] = {}

        self.checklist[timeIndex][checkType] = {
            "time": datetime.datetime.utcnow().time().isoformat(),
            "img": imgUrl
        }

        db.session.add(self)  # Đánh dấu obj cần update
        db.session.commit()   # Lưu thay đổi


    @staticmethod
    def create_item(params):
        try:
            user_id = params.get('user_id','')
            user_exists = User.query.filter_by(accountId=user_id).first()
            
            if user_exists:
                # print(accountId, group.id)
                msg = Workpoint(
                    user_id=user_id,
                )
                
                db.session.add(msg)
                db.session.commit()
                return msg
            else:
                print('No exist',user_id)
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

def parse_date(d):
    # d có dạng {"$date": "2025-07-21T01:03:22.362Z"}
    if isinstance(d, dict) and "$date" in d:
        return datetime.datetime.fromisoformat(d["$date"].replace("Z", "+00:00"))
    return None

def dateStr(tm):
    return datetime.datetime.strptime(tm, '%Y-%m-%d').date() if tm else None

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        # users = read_users_from_sqlite()
        # update_users_to_postgres()
        # update_users_to_postgres()

    
        # print_table_record_counts()

    # alter_columns()
    # transfer_data_to_postgres()

    # show_collections()
