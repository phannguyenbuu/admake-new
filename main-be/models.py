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
from flask import Blueprint, request, jsonify, abort
from sqlalchemy.orm.attributes import flag_modified
from collections import namedtuple
from sqlalchemy import desc, and_, func, select

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

CORS(app, supports_credentials=True, origins=['https://quanly.admake.vn','http://localhost:5173'])


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

    def tdict(self):
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
    bankAccount = db.Column(db.String(80))
    referrer = db.Column(db.String(80))

    taxCode = db.Column(db.String(50))

    workpoints = db.relationship('Workpoint', backref='user', lazy=True)
    lead_id = db.Column(db.Integer, db.ForeignKey('lead.id'))
    lead = db.relationship('LeadPayload', backref=db.backref('users', lazy='dynamic'))

    def update_role(self):
        role = db.session.get(Role, self.role_id)

        if role:
            return role.tdict()

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            # print(f"DEBUG: Column {column.name} value type: {type(value)}")
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value

        result["role"] = self.update_role()

        return result

    # @staticmethod
    # def create_item(params):
    #     allowed_keys = set(c.name for c in User.__table__.columns)
    #     filtered_params = {k: v for k, v in params.items() if k in allowed_keys}

    #     if params.get("role"):
    #         role = Role.query.filter_by(name=params.get("role")).first()
    #         if role:
    #             filtered_params["role_id"] = role.id

    #     if not "role_id" in filtered_params:
    #         filtered_params["role_id"] = 0

    #     filtered_params["id"] = generate_datetime_id()
        
    #     return User(**filtered_params)
    
    @staticmethod
    def create_item(params):
        allowed_keys = set(c.name for c in User.__table__.columns)
        filtered_params = {k: v for k, v in params.items() if k in allowed_keys}

        # Xử lý role
        if params.get("role"):
            role = Role.query.filter_by(name=params.get("role")).first()
            if role:
                filtered_params["role_id"] = role.id

        if "role_id" not in filtered_params:
            filtered_params["role_id"] = 0

        # Chuyển giá trị gender từ string sang số
        gender_map = {
            "female": 1,
            "male": 0,
            "other": 2
        }
        if "gender" in filtered_params and isinstance(filtered_params["gender"], str):
            filtered_params["gender"] = gender_map.get(filtered_params["gender"].lower(), filtered_params["gender"])

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

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            # print(f"DEBUG: Column {column.name} value type: {type(value)}")
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value

        result["role"] = "Khách hàng"

        if self.user:
            user_data = self.user.tdict()
            result.update(user_data) 

        return result

class Role(BaseModel):
    __tablename__ = 'role'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    permissions = db.Column(JSON)  # lưu list permissions
    name = db.Column(db.String(255))
    # lead_id = db.Column(db.Integer, db.ForeignKey('lead.id'))
    # lead = db.relationship('LeadPayload', backref='roles')

    def tdict(self):
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
        # item.id = generate_datetime_id()
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
    null_workspace = db.Column(db.Boolean, default=False)
    pinned = db.Column(db.Boolean, default=False)



    column_open_name = db.Column(db.String(255), default="Đơn hàng")
    column_in_progress_name = db.Column(db.String(255), default="Phân việc")
    column_done_name = db.Column(db.String(255), default="Thực hiện")
    column_reward_name = db.Column(db.String(255), default="Hoàn thiện")




    status = db.Column(db.String(50)) # FREE là cái thêm tự do
    
    lead_id = db.Column(db.Integer, db.ForeignKey('lead.id'))
    lead = db.relationship('LeadPayload', backref='workspaces')

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            # print(f"DEBUG: Column {column.name} value type: {type(value)}")
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result
    
    def all_props(self):
        result = self.tdict()
        user = db.session.get(User, self.owner_id)

        if user:
            for column in user.__table__.columns:
                if column.name != "id":
                    value = getattr(user, column.name)
                    # print(f"DEBUG: Column {column.name} value type: {type(value)}")
                    if not isinstance(value, (datetime.datetime, datetime.date)):
                        result[column.name] = value
        return result

    @staticmethod
    def create_item(params):
        item = Workspace(**params)
        item.id = generate_datetime_id()
        db.session.add(item)
        db.session.commit()
        return item
    
class Notify(BaseModel):
    __tablename__ = "notification"
    id = db.Column(db.String(50), primary_key=True)  # _id.$oid
    user_id = db.Column(db.String(50))
    text = db.Column(db.String(255))
    description = db.Column(db.Text)
    target = db.Column(db.String(50))
    type = db.Column(db.String(50))
    isDelete = db.Column(db.Boolean)

    lead_id = db.Column(db.Integer, db.ForeignKey('lead.id'))
    lead = db.relationship('LeadPayload', backref='notifies')

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
        
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result

    @staticmethod
    def create_item(params):
        item = Notify(**params)
        db.session.add(item)
        db.session.commit()
        return item

    
class Task(BaseModel):
    __tablename__ = "task"

    id = db.Column(db.String(50), primary_key=True)  # _id.$oid
    title = db.Column(db.String(255))
    description = db.Column(db.Text)
    status = db.Column(db.String(50))
    type = db.Column(db.String(50))
    rate = db.Column(db.Integer)
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

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
        
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value

        if self.assign_ids:
            ls = []
            for id in self.assign_ids:
                user = db.session.get(User, id)
                if user:
                    ls.append({"id":id,"name": user.fullName})

            result["assign_ids"] = ls

        if self.assets:
            ls = []
            for asset_id in self.assets:
                asset = db.session.get(Message, asset_id)

                if asset:
                    ls.append(asset.tdict())

            result["assets"] = ls

        workspace = db.session.get(Workspace, self.workspace_id)
        if workspace and not workspace.null_workspace:
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

    
    workspace_id = db.Column(db.String(50))
    message_id = db.Column(db.String(80), primary_key=True)
    task_id = db.Column(db.String(80), nullable=True)
    user_id = db.Column(db.String(80), db.ForeignKey('user.id'), nullable=True)
    username =  db.Column(db.String(255))
    
    text = db.Column(db.String(500))
    file_url = db.Column(db.String(255), nullable=True)
    thumb_url = db.Column(db.String(255), nullable=True)
    
    role = db.Column(db.Integer, default=0)
    is_favourite = db.Column(db.Boolean, default=False)

    react = db.Column(db.JSON)
    type = db.Column(db.String(10), nullable=True)
    
    user = db.relationship('User', foreign_keys=[user_id])
    lead_id = db.Column(db.Integer, db.ForeignKey('lead.id'))
    lead = db.relationship('LeadPayload', backref='messages')

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            # print(f"DEBUG: Column {column.name} value type: {type(value)}")
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        
        
        user = db.session.get(User, self.user_id)
        if user:
            result["username"] = user.fullName if user.fullName else user.username
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
    
    def tdict(self):
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

    def remove_checklist(self):
        keys_to_delete = [
            ("evening", "out"),
            ("evening", "in"),
            ("noon", "out"),
            ("noon", "in"),
            ("morning", "out"),
            ("morning", "in"),
        ]

        for period, time in keys_to_delete:
            if period in self.checklist and time in self.checklist[period]:
                del self.checklist[period][time]
                if 'workhour' in self.checklist:
                    del self.checklist['workhour']

                if not self.checklist[period]:
                    del self.checklist[period]
                break
        
        flag_modified(self, "checklist")
        db.session.commit()

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
    
    def tdict(self):
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
    fullName = db.Column(db.String(120), nullable=False)
    username = db.Column(db.String(50), nullable=False)
    password = db.Column(db.String(50), nullable=False)
    company = db.Column(db.String(120), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text)
    industry = db.Column(db.String(100), nullable=False)
    companySize = db.Column(db.String(50), nullable=False)
    expiredAt = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    balance_amount = db.Column(db.Float)

    column_open_name = db.Column(db.String(255), default="Đơn hàng")
    column_in_progress_name = db.Column(db.String(255), default="Phân việc")
    column_done_name = db.Column(db.String(255), default="Thực hiện")
    column_reward_name = db.Column(db.String(255), default="Hoàn thiện")

    # Quan hệ 1-n: một Lead có nhiều historyUsing
    history_using = db.relationship('UsingHistoryData', backref='lead', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Lead {self.name}>'
    
    def tdict(self):
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

def get_model_columns(model):
    """Lấy danh sách tên các cột từ 1 model"""
    return [c.name for c in model.__table__.columns]

def create_workspace_method(data, has_owner = True):
    # lead_id = data.get("lead", 0, type=int)
    lead_id = data.get("lead", 0)
    try:
        lead_id = int(lead_id)
    except (TypeError, ValueError):
        lead_id = 0
        
    # print("Create Workspace Lead_id", lead_id)
    

    if lead_id == 0:
        print('Zero lead')
        abort(404, description="Zero lead")

    lead = db.session.get(LeadPayload, lead_id)

    if not lead:
        print('Unkown lead')
        abort(404, description="Lead not found")

    # print("CreateData", data)

    # chia dữ liệu thành phần User và Customer
    
    new_user_id = None

    if has_owner:
        user_fields = get_model_columns(User)
        user_data = {k: v for k, v in data.items() if k in user_fields}

        new_user = User(
            id=generate_datetime_id(),   # ✅ bắt buộc gán id string
            lead_id = lead_id,
            **user_data,
            role_id=-1
        )
        db.session.add(new_user)
        db.session.flush()  # lấy id mà chưa commit

        new_user_id = new_user.id
    # customer_fields = get_model_columns(Workspace)
    # customer_data = {k: v for k, v in data.items() if k in customer_fields}

    # # ép kiểu ngày tháng nếu có
    # for key in ['workStart', 'workEnd']:
    #     if key in customer_data and isinstance(customer_data[key], str):
    #         customer_data[key] = dateStr(customer_data[key])

    # tạo Customer gắn với user_id
    new_workspace = Workspace(
        id=generate_datetime_id(),   # ✅ cũng cần id cho customer
        lead_id = lead_id,
        name = data.get("name",""),
        status = data.get("status",""),
        owner_id=new_user_id
    )
    db.session.add(new_workspace)
    db.session.commit()

    # print("Create_Result")
    # print(new_workspace.tdict())
    
    return jsonify(new_workspace.tdict()), 201

def get_lead_by_json(request):
    lead_id = request.get_json().get("lead", 0)

    try:
        lead_id = int(lead_id)
    except (TypeError, ValueError):
        lead_id = 0

    if lead_id == 0:
        print("Zero lead")
        abort(404, description="Zero lead")
        
    lead = db.session.get(LeadPayload, lead_id)
    return lead_id, lead

def get_lead_by_arg(request):
    lead_id = request.args.get("lead", 0, type=int)

    try:
        lead_id = int(lead_id)
    except (TypeError, ValueError):
        lead_id = 0

    if lead_id == 0:
        print("Zero lead")
        abort(404, description="Zero lead")
        
    lead = db.session.get(LeadPayload, lead_id)
    return lead_id, lead

class WorkpointSetting(db.Model):
    __tablename__ = 'workpoint_setting'
    id = db.Column(db.Integer, primary_key=True)
    morning_in_hour = db.Column(db.Integer, default = 7)  
    morning_in_minute = db.Column(db.Integer, default = 30)
    morning_out_hour = db.Column(db.Integer, default = 11)  
    morning_out_minute = db.Column(db.Integer, default = 30) 

    noon_in_hour = db.Column(db.Integer, default = 13) 
    noon_in_minute = db.Column(db.Integer, default = 30) 
    noon_out_hour = db.Column(db.Integer, default = 17) 
    noon_out_minute = db.Column(db.Integer, default = 30) 

    work_in_saturday_noon = db.Column(db.Boolean, default = False)
    work_in_sunday = db.Column(db.Boolean, default = False)
    
    multiply_in_night_overtime = db.Column(db.Float, default = 1.5) 
    multiply_in_sun_overtime = db.Column(db.Float, default = 2.0) 

    lead_id = db.Column(db.Integer, db.ForeignKey('lead.id'))
    lead = db.relationship('LeadPayload', backref='workpoint_setting')

    
    def __repr__(self):
        return f'<WorkpointSetting {self.name}>'
    
    def tdict(self):
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
        item = WorkpointSetting(**params)
        db.session.add(item)
        db.session.commit()
        return item


from paramiko import SSHClient, AutoAddPolicy
from scp import SCPClient
import time

def save_dump():
    # Kết nối SSH tới server Linux
    ssh = SSHClient()
    ssh.set_missing_host_key_policy(AutoAddPolicy())
    ssh.connect('148.230.100.33', username='root', password='@baoLong0511')

    now = datetime.datetime.now()
    timestamp = now.strftime("%y_%m_%d_%H_%M")

    remote_dump_path = f"/root/backup/admake_chat_{timestamp}.dump"
    print("Dump file remote:", remote_dump_path)

    # Thực thi lệnh pg_dump trên server Linux
    pg_dump_cmd = f"pg_dump -U postgres -d admake_chat -F c -f {remote_dump_path}"
    env_cmd = f"PGPASSWORD=myPass {pg_dump_cmd}"
    stdin, stdout, stderr = ssh.exec_command(env_cmd)

    # Đợi lệnh hoàn thành
    exit_status = stdout.channel.recv_exit_status()
    if exit_status == 0:
        print("Dump database thành công trên server.")
    else:
        error = stderr.read().decode()
        print("Lỗi khi dump database:", error)
        ssh.close()
        return

    # Tải file dump về local Windows
    local_folder = "./backup"
    os.makedirs(local_folder, exist_ok=True)
    local_dump_path = os.path.join(local_folder, f"admake_chat_{timestamp}.dump")

    scp = SCPClient(ssh.get_transport())
    scp.get(remote_dump_path, local_dump_path)
    print(f"Đã tải file dump về: {local_dump_path}")

    scp.close()
    ssh.close()

def periodic_save_dump(interval_minutes=30):
    while True:
        # Gọi hàm save_dump hoặc tác vụ của bạn ở đây
        save_dump()
        time.sleep(interval_minutes * 60)  # nghỉ theo khoảng thời gian quy định

def get_query_page_users(lead_id, page, limit, search, role_id = 0):
    if lead_id == 0:
        return [], empty_pagination
    
    lead = db.session.get(LeadPayload, lead_id)
    if not lead:
        Pagination = namedtuple('Pagination', ['total', 'pages'])
        empty_pagination = Pagination(total=0, pages=0)
        return [], empty_pagination
    
    if role_id == 0:
        query = lead.users.filter(
            and_(
                User.role_id > 0,
                User.role_id < 100,
            )
        )
    else:
        query = lead.users.filter(User.role_id == role_id)

    if search:
        query = query.filter(
            (User.username.ilike(f"%{search}%")) | 
            (User.fullName.ilike(f"%{search}%"))
        )

    split_length = func.array_length(func.regexp_split_to_array(User.fullName, ' '), 1)
    last_name = func.split_part(User.fullName, ' ', split_length)

    query = query.order_by(desc(User.updatedAt)).order_by(last_name, User.id)

    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    users = [c.tdict() for c in pagination.items]

    return users, pagination