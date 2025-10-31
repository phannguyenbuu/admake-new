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


app = Flask(__name__)
app.logger.setLevel(logging.DEBUG)
app.secret_key = 'admake-secret-token'

app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=15)
app.config['JWT_SECRET_KEY'] = 'admake-jwt-secret-key'
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'static')
app.config['MAX_CONTENT_LENGTH'] = 101 * 1024 * 1024

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
    
    lead_id = db.Column(db.Integer, db.ForeignKey('lead.id'))
    lead = db.relationship('LeadPayload', backref='materials')

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
        item = Material(**params)
        item.id = generate_datetime_id()
        db.session.add(item)
        db.session.commit()
        return item

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
    salary = db.Column(db.Integer)
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

    gender = db.Column(db.Integer)
    address = db.Column(db.String(255))
    citizenId = db.Column(db.String(80))
    email = db.Column(db.String(80))
    facebookAccount = db.Column(db.String(80))
    zaloAccount = db.Column(db.String(80))
    referrer = db.Column(db.String(80))

    taxCode = db.Column(db.String(50))

    workpoints = db.relationship('Workpoint', backref='user', lazy=True)
    lead_id = db.Column(db.Integer, db.ForeignKey('lead.id'))
    lead = db.relationship('LeadPayload', backref=db.backref('users', lazy='dynamic'))

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
    def create_item(params):
        allowed_keys = set(c.name for c in User.__table__.columns)
        filtered_params = {k: v for k, v in params.items() if k in allowed_keys}

        if params.get("role"):
            role = Role.query.filter_by(name=params.get("role")).first()
            if role:
                filtered_params["role_id"] = role.id

        if not "role_id" in filtered_params:
            filtered_params["role_id"] = 0

        filtered_params["id"] = generate_datetime_id()
        
        return User(**filtered_params)
    
    

    
class Customer(db.Model):
    __tablename__ = "customer"

    id = db.Column(db.String(50), primary_key=True)
    user_id = db.Column(db.String(50), db.ForeignKey("user.id"), unique=True, nullable=False)

    
    
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
    lead_id = db.Column(db.Integer, db.ForeignKey('lead.id'))
    lead = db.relationship('LeadPayload', backref='roles')

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
        item = Role(**params)
        item.id = generate_datetime_id()
        db.session.add(item)
        db.session.commit()
        return item
    
class Workspace(BaseModel):
    __tablename__ = "workspace"
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.String(50), primary_key=True)  # _id.$oid
    name = db.Column(db.String(255))
    address = db.Column(db.String(255))
    owner_id = db.Column(db.String(50))
    description = db.Column(db.String(255))
    documents = db.Column(db.JSON, default=[])  # Lưu danh sách đường dẫn tài liệu
    images = db.Column(db.JSON, default=[])     # Lưu danh sách đường dẫn hình ảnh
    chats = db.Column(db.JSON, default=[])      # Lưu danh sách message ID lưu lại
    rating_sum = db.Column(db.Integer, default=0)
    rating_count = db.Column(db.Integer, default=0)

    status = db.Column(db.String(50))
    
    lead_id = db.Column(db.Integer, db.ForeignKey('lead.id'))
    lead = db.relationship('LeadPayload', backref='workspaces')

    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            # print(f"DEBUG: Column {column.name} value type: {type(value)}")
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result
    
    def all_props(self):
        result = self.to_dict()
        user = db.session.get(User, self.owner_id)

        if user:
            for column in user.__table__.columns:
                value = getattr(user, column.name)
                # print(f"DEBUG: Column {column.name} value type: {type(value)}")
                if not isinstance(value, (datetime.datetime, datetime.date)):
                    result["user_" + column.name] = value
        return result

    @staticmethod
    def create_item(params):
        item = Workspace(**params)
        item.id = generate_datetime_id()
        db.session.add(item)
        db.session.commit()
        return item
    
    @staticmethod
    def get_by_id(workspace_id):
        return Workspace.query.filter(Workspace.version == workspace_id).first()
    
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
    assets = db.Column(db.JSON)  # lưu JSON string của list dict {materialId, quantity}
    create_by_id = db.Column(db.String(50))
    end_time = db.Column(db.Date)
    start_time = db.Column(db.Date)

    check_reward = db.Column(db.Boolean, default = False)
    lead_id = db.Column(db.Integer, db.ForeignKey('lead.id'))
    lead = db.relationship('LeadPayload', backref='tasks')

    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            # print(f"DEBUG: Column {column.name} value type: {type(value)}")
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value

        workspace = db.session.get(Workspace, self.workspace_id)
        if workspace:
            result['workspace'] = workspace.name

        return result

    @staticmethod
    def parse(data):
        return Task(
            id=generate_datetime_id(),
            workspace_id = data.get("workspace_id", ''),
            title= data.get("title", ''),
            description=data.get("description", ''),
            status=data.get("status", ''),
            type=data.get("type"),
            reward=data.get("reward"),
            assign_ids=data.get("assign_ids"),
            customer_id=data.get("customer_id", ''),
            end_time=data.get("end_time", None),
            start_time=data.get("start_time", None),
            amount = data.get("amount"),
            salary_type = data.get("salary_type", '')
        )
    @staticmethod
    def create_item(params):
        item = Task(**params)
        db.session.add(item)
        db.session.commit()
        return item

from sqlalchemy.exc import IntegrityError
class Message(BaseModel):
    __tablename__ = 'message'

    
    workspace_id = db.Column(db.Integer)
    message_id = db.Column(db.String(80), primary_key=True)
    # group_id = db.Column(db.Integer, nullable=True)
    user_id = db.Column(db.String(80), db.ForeignKey('user.id'), nullable=True)
    username =  db.Column(db.String(255))
    
    text = db.Column(db.String(500))
    file_url = db.Column(db.String(255), nullable=True)
    
    role = db.Column(db.Integer, default=0)
    is_favourite = db.Column(db.Boolean, default=False)

    react = db.Column(db.JSON)
    type = db.Column(db.String(10), nullable=True)
    
    user = db.relationship('User', foreign_keys=[user_id])
    lead_id = db.Column(db.Integer, db.ForeignKey('lead.id'))
    lead = db.relationship('LeadPayload', backref='messages')

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
        item = Message(**params)
        db.session.add(item)
        db.session.commit()
        return item

class Workpoint(BaseModel):
    __tablename__ = 'workpoint'
    id = db.Column(db.String(80), primary_key=True)
    note = db.Column(db.String(255))

    checklist = db.Column(db.JSON)
    user_id = db.Column(db.String(80), db.ForeignKey('user.id'), nullable=True)

    lead_id = db.Column(db.Integer, db.ForeignKey('lead.id'))
    lead = db.relationship('LeadPayload', backref='workpoints')

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

class Leave(BaseModel):
    __tablename__ = 'leave'
    id = db.Column(db.Integer, primary_key=True)
    reason = db.Column(db.String(255), nullable=False)
    end_time = db.Column(db.Date)
    start_time = db.Column(db.Date)
    morning = db.Column(db.Boolean, default = False)
    noon = db.Column(db.Boolean, default = False)
    user_id = db.Column(db.String(50))

    lead_id = db.Column(db.Integer, db.ForeignKey('lead.id'))
    lead = db.relationship('LeadPayload', backref='leaves')

    def __repr__(self):
        return f'<Leave {self.reason}>'
    
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
        item = Leave(**params)
        db.session.add(item)
        db.session.commit()
        return item
    
class UsingHistoryData(db.Model):
    __tablename__ = 'using'
    id = db.Column(db.Integer, primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey('lead.id'), nullable=False)
    start_time = db.Column(db.Date)
    end_time = db.Column(db.Date)
    balance_amount = db.Column(db.Float)

class LeadPayload(BaseModel):
    __tablename__ = 'lead'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    company = db.Column(db.String(120), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text)
    industry = db.Column(db.String(100), nullable=False)
    companySize = db.Column(db.String(50), nullable=False)
    balance_amount = db.Column(db.Float)

    expiredAt = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    history_using = db.relationship('UsingHistoryData', backref='lead', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Lead {self.name}>'
    
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
        item = LeadPayload(**params)
        db.session.add(item)
        db.session.commit()
        return item
    
def dateStr(tm):
    return datetime.datetime.strptime(tm, '%Y-%m-%d').date() if tm else None