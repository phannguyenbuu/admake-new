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
from sqlalchemy import desc, and_, func, select, Index
import uuid
from PIL import Image

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

CORS(
    app,
    supports_credentials=True,
    origins=[
        'https://quanly.admake.vn',
        'https://www.n-lux.com',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://127.0.0.1:5175',
        'http://localhost:5500',
    ],
)



def upload_a_file_to_vps(file):
    name, ext = os.path.splitext(file.filename)
    filename = file.filename
    upload_folder = app.config['UPLOAD_FOLDER']
    thumbs_folder = os.path.join(upload_folder, "thumbs")
    os.makedirs(thumbs_folder, exist_ok=True)

    filepath = os.path.join(upload_folder, filename)

    if os.path.exists(filepath):
        filename = f"{name}_{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(upload_folder, filename)
        print('New file name because file exists:', filename)

    file.save(filepath)

    # Kiểm tra xem file có phải ảnh không (dựa trên extension đơn giản, bạn có thể dùng thêm kiểm tra MIME nếu cần)
    image_exts = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    if ext.lower() in image_exts:
        try:
            img = Image.open(filepath)
            img.thumbnail((100, 70))
            
            # Nếu ảnh có alpha channel, chuyển sang RGBA để giữ alpha
            if img.mode not in ("RGBA", "LA"):
                img = img.convert("RGBA")
            
            thumb_filename = f"thumb_{filename}"
            thumb_filepath = os.path.join(thumbs_folder, thumb_filename)
            
            img.save(thumb_filepath, "PNG")  # Lưu định dạng PNG giữ alpha
            thumb_url = f"thumbs/{thumb_filename}"
        except Exception as e:
            print("Thumbnail creation failed:", e)
            thumb_url = None
    else:
        thumb_url = None


    return filename, filepath, thumb_url

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


class MaterialTransaction(BaseModel):
    __tablename__ = "material_transaction"

    id = db.Column(db.String(50), primary_key=True)
    material_id = db.Column(db.String(50), db.ForeignKey("material.id"), nullable=False)
    movement_type = db.Column(db.String(20), nullable=False)  # IN, OUT, ADJUST
    quantity = db.Column(db.Float, nullable=False)
    unit_cost = db.Column(db.Float, nullable=True)
    task_id = db.Column(db.String(50), nullable=True)
    note = db.Column(db.Text, nullable=True)

    lead_id = db.Column(db.Integer, db.ForeignKey("lead.id"), nullable=True)
    lead = db.relationship("LeadPayload", backref="material_transactions")

    material = db.relationship("Material", backref="transactions")

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result

def generate_datetime_id():
    now = datetime.datetime.utcnow()
    timestamp_str = now.strftime("%Y%m%d%H%M%S%f")  # năm tháng ngày giờ phút giây micro giây
    random_str = ''.join(random.choices('0123456789abcdef', k=6))  # thêm 6 ký tự hex ngẫu nhiên
    return timestamp_str + random_str

class UserCanView(BaseModel):
    __tablename__ = 'user_can_view'

    id = db.Column(db.String(50), primary_key=True)    
    user_id = db.Column(db.String(255), nullable=True)
    view_workpoint = db.Column(db.Boolean, default=False)
    view_user = db.Column(db.Boolean, default=False)
    view_supplier = db.Column(db.Boolean, default=False)
    view_customer = db.Column(db.Boolean, default=False)
    view_workspace = db.Column(db.Boolean, default=False)
    view_material = db.Column(db.Boolean, default=False)
    view_invoice = db.Column(db.Boolean, default=False)
    view_accountant = db.Column(db.Boolean, default=False)
    view_statistic = db.Column(db.Boolean, default=False)
    # ─── Kế toán sub-modules ─────────────────────────────────────────────────
    view_acc_payroll    = db.Column(db.Boolean, default=False)  # Bảng lương
    view_acc_cashflow   = db.Column(db.Boolean, default=False)  # Thu chi hàng ngày
    view_acc_ar         = db.Column(db.Boolean, default=False)  # Công nợ phải thu
    view_acc_ap         = db.Column(db.Boolean, default=False)  # Công nợ phải trả
    view_acc_docs       = db.Column(db.Boolean, default=False)  # Sổ chứng từ
    view_acc_ledger     = db.Column(db.Boolean, default=False)  # Sổ kế toán
    view_acc_tax        = db.Column(db.Boolean, default=False)  # Thuế
    view_acc_assets     = db.Column(db.Boolean, default=False)  # Tài sản cố định
    view_acc_records    = db.Column(db.Boolean, default=False)  # Hồ sơ
    view_acc_reports    = db.Column(db.Boolean, default=False)  # Báo cáo

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
            result["username"] = user.username
            result["password"] = user.password
        # result["role"] = self.user.role_id
        return result

    @staticmethod
    def create_item(params):
        item = UserCanView(**params)
        db.session.add(item)
        db.session.commit()
        return item
    

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
    allowance = db.Column(db.Integer, default=0)
    bhyt = db.Column(db.Integer, default=0)
    bhxh = db.Column(db.Integer, default=0)
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
    lead_id = db.Column(db.Integer, db.ForeignKey('lead.id'))
    lead = db.relationship('LeadPayload', backref='roles')

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
    icon = db.Column(db.Text)
    end_time = db.Column(db.Date)
    start_time = db.Column(db.Date)
    materials = db.Column(db.JSON, default=[])

    check_reward = db.Column(db.Boolean, default = False)
    lead_id = db.Column(db.Integer, db.ForeignKey('lead.id'))
    lead = db.relationship('LeadPayload', backref='tasks')

    isDelete = db.Column(db.Boolean, default = False)
    

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
                if isinstance(asset_id, str):
                    asset = db.session.get(Message, asset_id)

                    if asset:
                        ls.append(asset.tdict())

            result["assets"] = ls

        workspace = db.session.get(Workspace, self.workspace_id)
        if workspace and not workspace.null_workspace:
            result['workspace'] = workspace.name

        return result

    @staticmethod
    def create_item(data):
        ls = data.get("assets", [])
        assets = []

        for item in ls:
            item["message_id"] = generate_datetime_id()
            msg = Message.create_item(item)
            assets.append(msg.message_id)

        icon_payload = data.get("icon")
        icon_value = None
        if isinstance(icon_payload, list):
            normalized_icons = []
            for icon_item in icon_payload:
                if isinstance(icon_item, dict):
                    thumb_url = icon_item.get("thumb_url") or icon_item.get("file_url")
                    if thumb_url:
                        normalized_icons.append(thumb_url)
                elif isinstance(icon_item, str) and icon_item:
                    normalized_icons.append(icon_item)
            if normalized_icons:
                icon_value = json.dumps(normalized_icons)
        elif isinstance(icon_payload, str) and icon_payload:
            icon_value = icon_payload

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
            salary_type = data.get("salary_type", ''),
            assets = assets,
            icon = icon_value
        )
    # @staticmethod
    # def create_item(params):
    #     item = Task(**params)
    #     db.session.add(item)
    #     db.session.commit()
    #     return item

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


class AccountingDailyCash(BaseModel):
    __tablename__ = "accounting_daily_cash"

    id = db.Column(db.String(50), primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey("lead.id"), nullable=False)
    user_id = db.Column(db.String(80), db.ForeignKey("user.id"), nullable=True)

    txn_date = db.Column(db.Date, nullable=False)
    voucher_no = db.Column(db.String(80))
    direction = db.Column(db.String(20), default="expense")  # income | expense
    amount = db.Column(db.Float, default=0)

    description = db.Column(db.String(255))
    counterparty_name = db.Column(db.String(255))
    material_name = db.Column(db.String(255))
    unit = db.Column(db.String(50))
    quantity = db.Column(db.Float)
    status = db.Column(db.String(30), default="draft")
    payment_method = db.Column(db.String(30), default="cash")
    doc_ref = db.Column(db.String(80))
    source_type = db.Column(db.String(40), nullable=True)
    source_id = db.Column(db.String(80), nullable=True)
    account_code = db.Column(db.String(20), nullable=True)
    journal_entry_id = db.Column(db.String(50), nullable=True)
    note = db.Column(db.Text)
    attachments = db.Column(db.JSON, default=[])

    lead = db.relationship("LeadPayload", backref="daily_cash_rows")
    user = db.relationship("User", foreign_keys=[user_id])

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value

        if self.user:
            result["user_name"] = self.user.fullName or self.user.username
        else:
            result["user_name"] = ""
        return result

    @staticmethod
    def create_item(params):
        payload = dict(params or {})
        if not payload.get("id"):
            payload["id"] = generate_datetime_id()
        item = AccountingDailyCash(**payload)
        db.session.add(item)
        db.session.commit()
        return item


class AccountingDocument(BaseModel):
    __tablename__ = "accounting_document"

    id = db.Column(db.String(50), primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey("lead.id"), nullable=False)

    doc_no = db.Column(db.String(80))
    doc_type = db.Column(db.String(80), nullable=False)
    doc_date = db.Column(db.Date, nullable=False)
    signed_date = db.Column(db.Date, nullable=True)
    due_date = db.Column(db.Date, nullable=True)

    partner_name = db.Column(db.String(255))
    project_name = db.Column(db.String(255))
    material_name = db.Column(db.String(255))
    amount = db.Column(db.Float, default=0)  # total amount (backward compatible)
    subtotal_amount = db.Column(db.Float, default=0)
    tax_amount = db.Column(db.Float, default=0)
    payment_status = db.Column(db.String(30), default="unpaid")
    payment_method = db.Column(db.String(30), default="cash")
    currency = db.Column(db.String(10), default="VND")
    status = db.Column(db.String(30), default="draft")
    content = db.Column(db.Text)
    attachments = db.Column(db.JSON, default=[])
    tags = db.Column(db.JSON, default=[])

    lead = db.relationship("LeadPayload", backref="accounting_documents")

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
        payload = dict(params or {})
        if not payload.get("id"):
            payload["id"] = generate_datetime_id()
        item = AccountingDocument(**payload)
        db.session.add(item)
        db.session.commit()
        return item


class ChartOfAccount(BaseModel):
    __tablename__ = "chart_of_accounts"

    id = db.Column(db.String(50), primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey("lead.id"), nullable=True)
    code = db.Column(db.String(20), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    account_type = db.Column(db.String(30), nullable=False)
    parent_code = db.Column(db.String(20), nullable=True)
    allow_posting = db.Column(db.Boolean, default=True)
    status = db.Column(db.String(30), default="active")
    created_by = db.Column(db.String(50), nullable=True)
    updated_by = db.Column(db.String(50), nullable=True)

    lead = db.relationship("LeadPayload", backref="chart_of_accounts")

    __table_args__ = (
        Index("ix_chart_of_accounts_lead_code", "lead_id", "code", unique=True),
        Index("ix_chart_of_accounts_lead_type", "lead_id", "account_type"),
        Index("ix_chart_of_accounts_status", "status"),
    )

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result


class TaxCode(BaseModel):
    __tablename__ = "tax_codes"

    id = db.Column(db.String(50), primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey("lead.id"), nullable=True)
    code = db.Column(db.String(30), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    rate = db.Column(db.Float, default=0)
    direction = db.Column(db.String(20), default="both")
    status = db.Column(db.String(30), default="active")
    is_default = db.Column(db.Boolean, default=False)
    created_by = db.Column(db.String(50), nullable=True)
    updated_by = db.Column(db.String(50), nullable=True)

    lead = db.relationship("LeadPayload", backref="tax_codes")

    __table_args__ = (
        Index("ix_tax_codes_lead_code", "lead_id", "code", unique=True),
        Index("ix_tax_codes_direction", "direction"),
    )

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result


class AccountingPeriod(BaseModel):
    __tablename__ = "accounting_periods"

    id = db.Column(db.String(50), primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey("lead.id"), nullable=False)
    period_key = db.Column(db.String(7), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(30), default="open")
    closed_by = db.Column(db.String(50), nullable=True)
    created_by = db.Column(db.String(50), nullable=True)
    updated_by = db.Column(db.String(50), nullable=True)

    lead = db.relationship("LeadPayload", backref="accounting_periods")

    __table_args__ = (
        Index("ix_accounting_periods_lead_period", "lead_id", "period_key", unique=True),
        Index("ix_accounting_periods_lead_status", "lead_id", "status"),
    )

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result


class JournalEntry(BaseModel):
    __tablename__ = "journal_entries"

    id = db.Column(db.String(50), primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey("lead.id"), nullable=False)
    entry_no = db.Column(db.String(80), nullable=False)
    entry_date = db.Column(db.Date, nullable=False)
    doc_date = db.Column(db.Date, nullable=True)
    description = db.Column(db.Text, nullable=True)
    source_type = db.Column(db.String(40), nullable=True)
    source_id = db.Column(db.String(80), nullable=True)
    reference_no = db.Column(db.String(120), nullable=True)
    status = db.Column(db.String(30), default="draft")
    posted_at = db.Column(db.DateTime, nullable=True)
    reversed_entry_id = db.Column(db.String(50), db.ForeignKey("journal_entries.id"), nullable=True)
    created_by = db.Column(db.String(50), nullable=True)
    updated_by = db.Column(db.String(50), nullable=True)

    lead = db.relationship("LeadPayload", backref="journal_entries")
    reversed_entry = db.relationship("JournalEntry", remote_side=[id], uselist=False)

    __table_args__ = (
        Index("ix_journal_entries_lead_entry_no", "lead_id", "entry_no", unique=True),
        Index("ix_journal_entries_lead_date", "lead_id", "entry_date"),
        Index("ix_journal_entries_lead_status", "lead_id", "status"),
        Index("ix_journal_entries_source", "source_type", "source_id"),
    )

    def tdict(self, include_lines=False):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        if include_lines:
            result["lines"] = [line.tdict() for line in self.lines if not line.deletedAt]
        return result


class JournalEntryLine(BaseModel):
    __tablename__ = "journal_entry_lines"

    id = db.Column(db.String(50), primary_key=True)
    journal_entry_id = db.Column(
        db.String(50), db.ForeignKey("journal_entries.id", ondelete="CASCADE"), nullable=False
    )
    lead_id = db.Column(db.Integer, db.ForeignKey("lead.id"), nullable=False)
    line_no = db.Column(db.Integer, default=1)
    account_id = db.Column(db.String(50), db.ForeignKey("chart_of_accounts.id"), nullable=True)
    account_code = db.Column(db.String(20), nullable=False)
    account_name = db.Column(db.String(255), nullable=True)
    partner_type = db.Column(db.String(30), nullable=True)
    partner_id = db.Column(db.String(80), nullable=True)
    partner_name = db.Column(db.String(255), nullable=True)
    description = db.Column(db.String(255), nullable=True)
    debit = db.Column(db.Float, default=0)
    credit = db.Column(db.Float, default=0)

    journal_entry = db.relationship("JournalEntry", backref="lines")
    lead = db.relationship("LeadPayload", backref="journal_entry_lines")
    account = db.relationship("ChartOfAccount", backref="journal_entry_lines")

    __table_args__ = (
        Index("ix_journal_entry_lines_entry", "journal_entry_id"),
        Index("ix_journal_entry_lines_lead_account", "lead_id", "account_code"),
        Index("ix_journal_entry_lines_partner", "partner_type", "partner_id"),
    )

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result


class ARInvoice(BaseModel):
    __tablename__ = "ar_invoices"

    id = db.Column(db.String(50), primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey("lead.id"), nullable=False)
    code = db.Column(db.String(80), nullable=False)
    customer_id = db.Column(db.String(80), nullable=True)
    customer_name = db.Column(db.String(255), nullable=False)
    invoice_date = db.Column(db.Date, nullable=False)
    due_date = db.Column(db.Date, nullable=True)
    document_id = db.Column(db.String(50), db.ForeignKey("document_center_document.id"), nullable=True)
    tax_code_id = db.Column(db.String(50), db.ForeignKey("tax_codes.id"), nullable=True)
    base_amount = db.Column(db.Float, default=0)
    tax_rate = db.Column(db.Float, default=0)
    tax_amount = db.Column(db.Float, default=0)
    total_amount = db.Column(db.Float, default=0)
    paid_amount = db.Column(db.Float, default=0)
    balance_amount = db.Column(db.Float, default=0)
    currency = db.Column(db.String(10), default="VND")
    status = db.Column(db.String(30), default="draft")
    description = db.Column(db.Text, nullable=True)
    journal_entry_id = db.Column(db.String(50), db.ForeignKey("journal_entries.id"), nullable=True)
    confirmed_at = db.Column(db.DateTime, nullable=True)
    cancelled_at = db.Column(db.DateTime, nullable=True)
    created_by = db.Column(db.String(50), nullable=True)
    updated_by = db.Column(db.String(50), nullable=True)

    lead = db.relationship("LeadPayload", backref="ar_invoices")
    document = db.relationship("DocumentCenterDocument", backref="ar_invoices")
    tax_code = db.relationship("TaxCode", backref="ar_invoices")
    journal_entry = db.relationship("JournalEntry", foreign_keys=[journal_entry_id])

    __table_args__ = (
        Index("ix_ar_invoices_lead_code", "lead_id", "code", unique=True),
        Index("ix_ar_invoices_lead_date", "lead_id", "invoice_date"),
        Index("ix_ar_invoices_lead_due", "lead_id", "due_date"),
        Index("ix_ar_invoices_lead_status", "lead_id", "status"),
        Index("ix_ar_invoices_customer", "customer_id"),
    )

    def tdict(self, include_payments=False):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        if include_payments:
            result["payments"] = [item.tdict() for item in self.payments if not item.deletedAt]
        return result


class ARInvoicePayment(BaseModel):
    __tablename__ = "ar_invoice_payments"

    id = db.Column(db.String(50), primary_key=True)
    invoice_id = db.Column(db.String(50), db.ForeignKey("ar_invoices.id", ondelete="CASCADE"), nullable=False)
    lead_id = db.Column(db.Integer, db.ForeignKey("lead.id"), nullable=False)
    payment_date = db.Column(db.Date, nullable=False)
    amount = db.Column(db.Float, default=0)
    payment_method = db.Column(db.String(30), default="cash")
    payment_type = db.Column(db.String(30), default="phat_sinh")  # tam_ung | phat_sinh
    daily_cash_id = db.Column(db.String(50), db.ForeignKey("accounting_daily_cash.id"), nullable=True)
    journal_entry_id = db.Column(db.String(50), db.ForeignKey("journal_entries.id"), nullable=True)
    note = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.String(50), nullable=True)
    updated_by = db.Column(db.String(50), nullable=True)

    invoice = db.relationship("ARInvoice", backref="payments")
    lead = db.relationship("LeadPayload", backref="ar_invoice_payments")
    daily_cash = db.relationship("AccountingDailyCash", foreign_keys=[daily_cash_id])
    journal_entry = db.relationship("JournalEntry", foreign_keys=[journal_entry_id])

    __table_args__ = (
        Index("ix_ar_invoice_payments_invoice", "invoice_id"),
        Index("ix_ar_invoice_payments_cash", "daily_cash_id"),
    )

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result


class PayrollAdjustment(BaseModel):
    __tablename__ = "payroll_adjustments"

    id = db.Column(db.String(50), primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey("lead.id"), nullable=False)
    user_id = db.Column(db.String(50), db.ForeignKey("user.id"), nullable=False)
    adjustment_type = db.Column(db.String(30), nullable=False)
    entry_date = db.Column(db.Date, nullable=False)
    amount = db.Column(db.Float, default=0)
    note = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.String(50), nullable=True)
    updated_by = db.Column(db.String(50), nullable=True)

    lead = db.relationship("LeadPayload", backref="payroll_adjustments")
    user = db.relationship("User", backref="payroll_adjustments")

    __table_args__ = (
        Index("ix_payroll_adjustments_lead_user_date", "lead_id", "user_id", "entry_date"),
        Index("ix_payroll_adjustments_lead_type", "lead_id", "adjustment_type"),
    )

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        result["type"] = result.pop("adjustment_type", None)
        return result


class APBill(BaseModel):
    __tablename__ = "ap_bills"

    id = db.Column(db.String(50), primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey("lead.id"), nullable=False)
    code = db.Column(db.String(80), nullable=False)
    supplier_id = db.Column(db.String(80), nullable=True)
    supplier_name = db.Column(db.String(255), nullable=False)
    bill_date = db.Column(db.Date, nullable=False)
    due_date = db.Column(db.Date, nullable=True)
    document_id = db.Column(db.String(50), db.ForeignKey("document_center_document.id"), nullable=True)
    tax_code_id = db.Column(db.String(50), db.ForeignKey("tax_codes.id"), nullable=True)
    expense_account_code = db.Column(db.String(20), nullable=False, default="642")
    base_amount = db.Column(db.Float, default=0)
    tax_rate = db.Column(db.Float, default=0)
    tax_amount = db.Column(db.Float, default=0)
    total_amount = db.Column(db.Float, default=0)
    paid_amount = db.Column(db.Float, default=0)
    balance_amount = db.Column(db.Float, default=0)
    currency = db.Column(db.String(10), default="VND")
    status = db.Column(db.String(30), default="draft")
    description = db.Column(db.Text, nullable=True)
    journal_entry_id = db.Column(db.String(50), db.ForeignKey("journal_entries.id"), nullable=True)
    confirmed_at = db.Column(db.DateTime, nullable=True)
    cancelled_at = db.Column(db.DateTime, nullable=True)
    created_by = db.Column(db.String(50), nullable=True)
    updated_by = db.Column(db.String(50), nullable=True)

    lead = db.relationship("LeadPayload", backref="ap_bills")
    document = db.relationship("DocumentCenterDocument", backref="ap_bills")
    tax_code = db.relationship("TaxCode", backref="ap_bills")
    journal_entry = db.relationship("JournalEntry", foreign_keys=[journal_entry_id])

    __table_args__ = (
        Index("ix_ap_bills_lead_code", "lead_id", "code", unique=True),
        Index("ix_ap_bills_lead_date", "lead_id", "bill_date"),
        Index("ix_ap_bills_lead_due", "lead_id", "due_date"),
        Index("ix_ap_bills_lead_status", "lead_id", "status"),
        Index("ix_ap_bills_supplier", "supplier_id"),
    )

    def tdict(self, include_payments=False):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        if include_payments:
            result["payments"] = [item.tdict() for item in self.payments if not item.deletedAt]
        return result


class APBillPayment(BaseModel):
    __tablename__ = "ap_bill_payments"

    id = db.Column(db.String(50), primary_key=True)
    bill_id = db.Column(db.String(50), db.ForeignKey("ap_bills.id", ondelete="CASCADE"), nullable=False)
    lead_id = db.Column(db.Integer, db.ForeignKey("lead.id"), nullable=False)
    payment_date = db.Column(db.Date, nullable=False)
    amount = db.Column(db.Float, default=0)
    payment_method = db.Column(db.String(30), default="cash")
    daily_cash_id = db.Column(db.String(50), db.ForeignKey("accounting_daily_cash.id"), nullable=True)
    journal_entry_id = db.Column(db.String(50), db.ForeignKey("journal_entries.id"), nullable=True)
    note = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.String(50), nullable=True)
    updated_by = db.Column(db.String(50), nullable=True)

    bill = db.relationship("APBill", backref="payments")
    lead = db.relationship("LeadPayload", backref="ap_bill_payments")
    daily_cash = db.relationship("AccountingDailyCash", foreign_keys=[daily_cash_id])
    journal_entry = db.relationship("JournalEntry", foreign_keys=[journal_entry_id])

    __table_args__ = (
        Index("ix_ap_bill_payments_bill", "bill_id"),
        Index("ix_ap_bill_payments_cash", "daily_cash_id"),
    )

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result


class FixedAsset(BaseModel):
    __tablename__ = "fixed_assets"

    id = db.Column(db.String(50), primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey("lead.id"), nullable=False)
    code = db.Column(db.String(80), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    purchase_date = db.Column(db.Date, nullable=False)
    capitalized_date = db.Column(db.Date, nullable=True)
    cost = db.Column(db.Float, default=0)
    salvage_value = db.Column(db.Float, default=0)
    useful_life_months = db.Column(db.Integer, nullable=False)
    monthly_depreciation = db.Column(db.Float, default=0)
    accumulated_depreciation = db.Column(db.Float, default=0)
    department = db.Column(db.String(100), nullable=True)
    quantity = db.Column(db.Integer, default=1)
    asset_account_code = db.Column(db.String(20), default="211")
    accumulated_account_code = db.Column(db.String(20), default="214")
    expense_account_code = db.Column(db.String(20), default="642")
    status = db.Column(db.String(30), default="active")
    source_document_id = db.Column(db.String(50), db.ForeignKey("document_center_document.id"), nullable=True)
    created_by = db.Column(db.String(50), nullable=True)
    updated_by = db.Column(db.String(50), nullable=True)

    lead = db.relationship("LeadPayload", backref="fixed_assets")
    source_document = db.relationship("DocumentCenterDocument", backref="fixed_assets")

    __table_args__ = (
        Index("ix_fixed_assets_lead_code", "lead_id", "code", unique=True),
        Index("ix_fixed_assets_lead_status", "lead_id", "status"),
        Index("ix_fixed_assets_lead_department", "lead_id", "department"),
    )

    def tdict(self, include_depreciations=False):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        if include_depreciations:
            result["depreciations"] = [item.tdict() for item in self.depreciations if not item.deletedAt]
        return result


class FixedAssetDepreciation(BaseModel):
    __tablename__ = "fixed_asset_depreciations"

    id = db.Column(db.String(50), primary_key=True)
    asset_id = db.Column(db.String(50), db.ForeignKey("fixed_assets.id", ondelete="CASCADE"), nullable=False)
    lead_id = db.Column(db.Integer, db.ForeignKey("lead.id"), nullable=False)
    period_key = db.Column(db.String(7), nullable=False)
    depreciation_date = db.Column(db.Date, nullable=False)
    amount = db.Column(db.Float, default=0)
    status = db.Column(db.String(30), default="draft")
    journal_entry_id = db.Column(db.String(50), db.ForeignKey("journal_entries.id"), nullable=True)
    created_by = db.Column(db.String(50), nullable=True)
    updated_by = db.Column(db.String(50), nullable=True)

    asset = db.relationship("FixedAsset", backref="depreciations")
    lead = db.relationship("LeadPayload", backref="fixed_asset_depreciations")
    journal_entry = db.relationship("JournalEntry", foreign_keys=[journal_entry_id])

    __table_args__ = (
        Index("ix_fixed_asset_depreciations_asset_period", "asset_id", "period_key", unique=True),
        Index("ix_fixed_asset_depreciations_lead_period", "lead_id", "period_key"),
    )

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result


class AccountingRecord(BaseModel):
    """Hồ sơ kế toán: hợp đồng, báo giá, biên bản, thanh lý..."""
    __tablename__ = "accounting_records"

    id          = db.Column(db.String(50), primary_key=True)
    lead_id     = db.Column(db.Integer, db.ForeignKey("lead.id"), nullable=False)
    sub_tab     = db.Column(db.String(30), nullable=False, default="hop-dong")
    # hop-dong | nghiem-thu | thanh-toan
    name        = db.Column(db.String(255), nullable=False)
    file_type   = db.Column(db.String(20), nullable=True)   # doc, docx, pdf, xlsx...
    folder      = db.Column(db.String(255), nullable=True)
    content     = db.Column(db.Text, nullable=True)          # richtext HTML
    created_by  = db.Column(db.String(50), nullable=True)
    updated_by  = db.Column(db.String(50), nullable=True)

    lead = db.relationship("LeadPayload", backref="accounting_records")

    __table_args__ = (
        Index("ix_accounting_records_lead_tab", "lead_id", "sub_tab"),
    )

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result


FA_EVENT_TYPES = ["purchase", "maintenance", "responsible"]

class FixedAssetEvent(BaseModel):
    """Sub-rows for a fixed asset: purchase info, maintenance, responsible person."""
    __tablename__ = "fixed_asset_events"

    id = db.Column(db.String(50), primary_key=True)
    asset_id = db.Column(db.String(50), db.ForeignKey("fixed_assets.id", ondelete="CASCADE"), nullable=False)
    lead_id = db.Column(db.Integer, db.ForeignKey("lead.id"), nullable=False)
    event_type = db.Column(db.String(30), nullable=False)  # purchase | maintenance | responsible
    event_date = db.Column(db.Date, nullable=True)          # ngày mua / ngày bảo trì
    person_name = db.Column(db.String(255), nullable=True)  # người mua / người bảo trì / người chịu trách nhiệm
    person_phone = db.Column(db.String(30), nullable=True)  # SĐT liên hệ
    note = db.Column(db.Text, nullable=True)                # ghi chú thêm
    created_by = db.Column(db.String(50), nullable=True)
    updated_by = db.Column(db.String(50), nullable=True)

    asset = db.relationship("FixedAsset", backref="events")
    lead = db.relationship("LeadPayload", backref="fixed_asset_events")

    __table_args__ = (
        Index("ix_fa_events_asset", "asset_id"),
        Index("ix_fa_events_lead", "lead_id"),
    )

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result


class AccountingLink(BaseModel):
    __tablename__ = "accounting_links"

    id = db.Column(db.String(50), primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey("lead.id"), nullable=False)
    source_type = db.Column(db.String(40), nullable=False)
    source_id = db.Column(db.String(80), nullable=False)
    target_type = db.Column(db.String(40), nullable=False)
    target_id = db.Column(db.String(80), nullable=False)
    note = db.Column(db.String(255), nullable=True)
    created_by = db.Column(db.String(50), nullable=True)
    updated_by = db.Column(db.String(50), nullable=True)

    lead = db.relationship("LeadPayload", backref="accounting_links")

    __table_args__ = (
        Index("ix_accounting_links_source", "lead_id", "source_type", "source_id"),
        Index("ix_accounting_links_target", "lead_id", "target_type", "target_id"),
        Index("ix_accounting_links_unique", "lead_id", "source_type", "source_id", "target_type", "target_id", unique=True),
    )

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result


class ItemCategory(BaseModel):
    __tablename__ = "item_categories"

    id = db.Column(db.String(50), primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey("lead.id"), nullable=False)
    code = db.Column(db.String(80), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(30), default="active")
    created_by = db.Column(db.String(50), nullable=True)
    updated_by = db.Column(db.String(50), nullable=True)

    lead = db.relationship("LeadPayload", backref="item_categories")

    __table_args__ = (
        Index("ix_item_categories_lead_code", "lead_id", "code", unique=True),
        Index("ix_item_categories_lead_status", "lead_id", "status"),
    )

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result


class Warehouse(BaseModel):
    __tablename__ = "warehouses"

    id = db.Column(db.String(50), primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey("lead.id"), nullable=False)
    code = db.Column(db.String(80), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    location = db.Column(db.String(255), nullable=True)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(30), default="active")
    is_default = db.Column(db.Boolean, default=False)
    created_by = db.Column(db.String(50), nullable=True)
    updated_by = db.Column(db.String(50), nullable=True)

    lead = db.relationship("LeadPayload", backref="warehouses")

    __table_args__ = (
        Index("ix_warehouses_lead_code", "lead_id", "code", unique=True),
        Index("ix_warehouses_lead_status", "lead_id", "status"),
    )

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result


class InventoryItem(BaseModel):
    __tablename__ = "inventory_items"

    id = db.Column(db.String(50), primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey("lead.id"), nullable=False)
    code = db.Column(db.String(80), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    sku = db.Column(db.String(120), nullable=True)
    category_id = db.Column(db.String(50), db.ForeignKey("item_categories.id"), nullable=True)
    item_type = db.Column(db.String(30), nullable=False, default="raw_material")
    unit = db.Column(db.String(50), nullable=False, default="cái")
    default_supplier_id = db.Column(db.String(80), nullable=True)
    default_supplier_name = db.Column(db.String(255), nullable=True)
    default_warehouse_id = db.Column(db.String(50), db.ForeignKey("warehouses.id"), nullable=True)
    standard_cost = db.Column(db.Float, default=0)
    average_cost = db.Column(db.Float, default=0)
    min_stock_level = db.Column(db.Float, default=0)
    is_active = db.Column(db.Boolean, default=True)
    note = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.String(50), nullable=True)
    updated_by = db.Column(db.String(50), nullable=True)

    lead = db.relationship("LeadPayload", backref="inventory_items")
    category = db.relationship("ItemCategory", backref="items")
    default_warehouse = db.relationship("Warehouse", foreign_keys=[default_warehouse_id])

    __table_args__ = (
        Index("ix_inventory_items_lead_code", "lead_id", "code", unique=True),
        Index("ix_inventory_items_lead_sku", "lead_id", "sku", unique=True),
        Index("ix_inventory_items_lead_category", "lead_id", "category_id"),
        Index("ix_inventory_items_lead_active", "lead_id", "is_active"),
    )

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        if self.category:
            result["category_name"] = self.category.name
        if self.default_warehouse:
            result["default_warehouse_name"] = self.default_warehouse.name
        return result


class StockAdjustmentReason(BaseModel):
    __tablename__ = "stock_adjustment_reasons"

    id = db.Column(db.String(50), primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey("lead.id"), nullable=False)
    code = db.Column(db.String(80), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    effect_type = db.Column(db.String(20), nullable=False, default="decrease")
    accounting_mapping = db.Column(db.JSON, default={})
    status = db.Column(db.String(30), default="active")
    created_by = db.Column(db.String(50), nullable=True)
    updated_by = db.Column(db.String(50), nullable=True)

    lead = db.relationship("LeadPayload", backref="stock_adjustment_reasons")

    __table_args__ = (
        Index("ix_stock_adjustment_reasons_lead_code", "lead_id", "code", unique=True),
        Index("ix_stock_adjustment_reasons_lead_status", "lead_id", "status"),
    )

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result


class InventoryAccountMapping(BaseModel):
    __tablename__ = "inventory_account_mappings"

    id = db.Column(db.String(50), primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey("lead.id"), nullable=False)
    item_type = db.Column(db.String(30), nullable=True)
    category_id = db.Column(db.String(50), db.ForeignKey("item_categories.id"), nullable=True)
    inventory_account_code = db.Column(db.String(20), nullable=False)
    cogs_account_code = db.Column(db.String(20), nullable=True)
    expense_account_code = db.Column(db.String(20), nullable=True)
    adjustment_gain_account_code = db.Column(db.String(20), nullable=True)
    adjustment_loss_account_code = db.Column(db.String(20), nullable=True)
    ap_account_code = db.Column(db.String(20), nullable=True, default="331")
    cash_account_code = db.Column(db.String(20), nullable=True, default="111")
    vat_account_code = db.Column(db.String(20), nullable=True, default="133")
    wip_account_code = db.Column(db.String(20), nullable=True)
    status = db.Column(db.String(30), default="active")
    created_by = db.Column(db.String(50), nullable=True)
    updated_by = db.Column(db.String(50), nullable=True)

    lead = db.relationship("LeadPayload", backref="inventory_account_mappings")
    category = db.relationship("ItemCategory", backref="inventory_account_mappings")

    __table_args__ = (
        Index("ix_inventory_account_mappings_lead_type", "lead_id", "item_type"),
        Index("ix_inventory_account_mappings_lead_category", "lead_id", "category_id"),
    )

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result


class InventoryBalance(BaseModel):
    __tablename__ = "inventory_balances"

    id = db.Column(db.String(50), primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey("lead.id"), nullable=False)
    item_id = db.Column(db.String(50), db.ForeignKey("inventory_items.id"), nullable=False)
    warehouse_id = db.Column(db.String(50), db.ForeignKey("warehouses.id"), nullable=False)
    quantity_on_hand = db.Column(db.Float, default=0)
    average_cost = db.Column(db.Float, default=0)
    inventory_value = db.Column(db.Float, default=0)
    created_by = db.Column(db.String(50), nullable=True)
    updated_by = db.Column(db.String(50), nullable=True)

    lead = db.relationship("LeadPayload", backref="inventory_balances")
    item = db.relationship("InventoryItem", backref="balances")
    warehouse = db.relationship("Warehouse", backref="balances")

    __table_args__ = (
        Index("ix_inventory_balances_item_warehouse", "item_id", "warehouse_id", unique=True),
        Index("ix_inventory_balances_lead_item", "lead_id", "item_id"),
        Index("ix_inventory_balances_lead_warehouse", "lead_id", "warehouse_id"),
    )

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result


class StockTransaction(BaseModel):
    __tablename__ = "stock_transactions"

    id = db.Column(db.String(50), primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey("lead.id"), nullable=False)
    transaction_code = db.Column(db.String(80), nullable=False)
    transaction_date = db.Column(db.Date, nullable=False)
    transaction_type = db.Column(db.String(40), nullable=False)
    status = db.Column(db.String(30), default="draft")
    warehouse_id = db.Column(db.String(50), db.ForeignKey("warehouses.id"), nullable=False)
    destination_warehouse_id = db.Column(db.String(50), db.ForeignKey("warehouses.id"), nullable=True)
    item_id = db.Column(db.String(50), db.ForeignKey("inventory_items.id"), nullable=False)
    quantity = db.Column(db.Float, nullable=False, default=0)
    unit_cost = db.Column(db.Float, default=0)
    total_cost = db.Column(db.Float, default=0)
    direction = db.Column(db.String(10), nullable=False)
    balance_after = db.Column(db.Float, nullable=True)
    partner_id = db.Column(db.String(80), nullable=True)
    partner_name = db.Column(db.String(255), nullable=True)
    task_id = db.Column(db.String(80), nullable=True)
    project_id = db.Column(db.String(80), nullable=True)
    note = db.Column(db.Text, nullable=True)
    reference_type = db.Column(db.String(40), nullable=True)
    reference_id = db.Column(db.String(80), nullable=True)
    reference_code = db.Column(db.String(120), nullable=True)
    source_type = db.Column(db.String(40), nullable=True)
    source_id = db.Column(db.String(80), nullable=True)
    adjustment_reason_id = db.Column(db.String(50), db.ForeignKey("stock_adjustment_reasons.id"), nullable=True)
    accounting_entry_id = db.Column(db.String(50), db.ForeignKey("journal_entries.id"), nullable=True)
    reversal_transaction_id = db.Column(db.String(50), db.ForeignKey("stock_transactions.id"), nullable=True)
    confirmed_at = db.Column(db.DateTime, nullable=True)
    cancelled_at = db.Column(db.DateTime, nullable=True)
    created_by = db.Column(db.String(50), nullable=True)
    approved_by = db.Column(db.String(50), nullable=True)
    updated_by = db.Column(db.String(50), nullable=True)

    lead = db.relationship("LeadPayload", backref="stock_transactions")
    item = db.relationship("InventoryItem", backref="transactions")
    warehouse = db.relationship("Warehouse", foreign_keys=[warehouse_id], backref="stock_transactions")
    destination_warehouse = db.relationship("Warehouse", foreign_keys=[destination_warehouse_id])
    adjustment_reason = db.relationship("StockAdjustmentReason", backref="transactions")
    accounting_entry = db.relationship("JournalEntry", foreign_keys=[accounting_entry_id])
    reversal_transaction = db.relationship("StockTransaction", remote_side=[id], uselist=False)

    __table_args__ = (
        Index("ix_stock_transactions_lead_code", "lead_id", "transaction_code", unique=True),
        Index("ix_stock_transactions_lead_date", "lead_id", "transaction_date"),
        Index("ix_stock_transactions_lead_status", "lead_id", "status"),
        Index("ix_stock_transactions_item_warehouse", "item_id", "warehouse_id"),
        Index("ix_stock_transactions_reference", "reference_type", "reference_id"),
        Index("ix_stock_transactions_source", "source_type", "source_id"),
    )

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        if self.item:
            result["item_name"] = self.item.name
            result["item_code"] = self.item.code
            result["unit"] = self.item.unit
        if self.warehouse:
            result["warehouse_name"] = self.warehouse.name
        if self.destination_warehouse:
            result["destination_warehouse_name"] = self.destination_warehouse.name
        return result


class DocumentCenterDocument(BaseModel):
    __tablename__ = "document_center_document"

    id = db.Column(db.String(50), primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey("lead.id"), nullable=False)

    code = db.Column(db.String(120), nullable=False)
    type = db.Column(db.String(60), nullable=False)
    docDate = db.Column(db.Date, nullable=False)

    partnerId = db.Column(db.String(80), nullable=True)
    partnerName = db.Column(db.String(255), nullable=True)
    projectId = db.Column(db.String(80), nullable=True)
    projectName = db.Column(db.String(255), nullable=True)
    taskId = db.Column(db.String(80), nullable=True)

    amount = db.Column(db.Float, default=0)
    currency = db.Column(db.String(10), default="VND")
    status = db.Column(db.String(30), default="draft")

    description = db.Column(db.Text, nullable=True)
    note = db.Column(db.Text, nullable=True)
    tags = db.Column(db.JSON, default=[])

    createdBy = db.Column(db.String(80), nullable=True)
    approvedBy = db.Column(db.String(80), nullable=True)

    legacy_document_id = db.Column(db.String(50), nullable=True)

    lead = db.relationship("LeadPayload", backref="document_center_documents")

    __table_args__ = (
        Index("ix_doc_center_doc_lead_docDate", "lead_id", "docDate"),
        Index("ix_doc_center_doc_lead_type", "lead_id", "type"),
        Index("ix_doc_center_doc_lead_status", "lead_id", "status"),
        Index("ix_doc_center_doc_lead_partnerId", "lead_id", "partnerId"),
        Index("ix_doc_center_doc_lead_projectId", "lead_id", "projectId"),
        Index("ix_doc_center_doc_lead_code", "lead_id", "code", unique=True),
    )

    def tdict(self, include_attachments=False, include_links=False, include_audit=False):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value

        if include_attachments:
            result["attachments"] = [a.tdict() for a in self.attachments if not a.deletedAt]
        if include_links:
            result["links"] = [x.tdict() for x in self.links if not x.deletedAt]
        if include_audit:
            result["auditLog"] = [x.tdict() for x in self.audit_logs if not x.deletedAt]
        return result

    @staticmethod
    def create_item(params):
        payload = dict(params or {})
        if not payload.get("id"):
            payload["id"] = generate_datetime_id()
        item = DocumentCenterDocument(**payload)
        db.session.add(item)
        db.session.commit()
        return item


class DocumentCenterAttachment(BaseModel):
    __tablename__ = "document_center_attachment"

    id = db.Column(db.String(50), primary_key=True)
    document_id = db.Column(
        db.String(50), db.ForeignKey("document_center_document.id", ondelete="CASCADE"), nullable=True
    )
    filename = db.Column(db.String(255), nullable=False)
    mimeType = db.Column(db.String(120), nullable=True)
    size = db.Column(db.BigInteger, nullable=True)
    storageKey = db.Column(db.String(255), nullable=True)
    url = db.Column(db.String(255), nullable=True)
    uploadedBy = db.Column(db.String(80), nullable=True)
    uploadedAt = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    document = db.relationship("DocumentCenterDocument", backref="attachments")

    __table_args__ = (
        Index("ix_doc_center_attachment_document", "document_id"),
    )

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result


class DocumentCenterLink(BaseModel):
    __tablename__ = "document_center_link"

    id = db.Column(db.String(50), primary_key=True)
    document_id = db.Column(
        db.String(50), db.ForeignKey("document_center_document.id", ondelete="CASCADE"), nullable=False
    )
    linked_document_id = db.Column(db.String(50), nullable=True)
    link_type = db.Column(db.String(80), nullable=True)
    note = db.Column(db.String(255), nullable=True)

    document = db.relationship("DocumentCenterDocument", backref="links")

    __table_args__ = (
        Index("ix_doc_center_link_document", "document_id"),
        Index("ix_doc_center_link_linked_document", "linked_document_id"),
    )

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result


class DocumentCenterAuditLog(BaseModel):
    __tablename__ = "document_center_audit_log"

    id = db.Column(db.String(50), primary_key=True)
    document_id = db.Column(
        db.String(50), db.ForeignKey("document_center_document.id", ondelete="CASCADE"), nullable=False
    )
    action = db.Column(db.String(50), nullable=False)
    from_status = db.Column(db.String(30), nullable=True)
    to_status = db.Column(db.String(30), nullable=True)
    actor_id = db.Column(db.String(80), nullable=True)
    actor_name = db.Column(db.String(255), nullable=True)
    payload = db.Column(db.JSON, default={})
    actedAt = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    document = db.relationship("DocumentCenterDocument", backref="audit_logs")

    __table_args__ = (
        Index("ix_doc_center_audit_document", "document_id"),
        Index("ix_doc_center_audit_actedAt", "actedAt"),
    )

    def tdict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result

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
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(120), nullable=True)
    
    user_id = db.Column(db.String(50), nullable=True)
    
    company = db.Column(db.String(120), nullable=True)
    address = db.Column(db.String(255), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    description = db.Column(db.Text)
    industry = db.Column(db.String(100), nullable=True)
    companySize = db.Column(db.String(50), nullable=True)
    expiredAt = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    balance_amount = db.Column(db.Float)
    level = db.Column(db.Integer, default=0)

    isInvited = db.Column(db.Boolean, default = False)
    isActivated = db.Column(db.Boolean, default = False)

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
                value = value.date().isoformat() if isinstance(value, datetime.datetime) else value.isoformat()

            result[column.name] = value

        user = db.session.get(User, self.user_id)
        if user:
            result["username"] = user.username
            result["password"] = user.password
            result["fullName"] = user.fullName
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
    
    def clone(self):
        # Tạo thể hiện mới của lớp
        new_obj = WorkpointSetting()
        # Sao chép tất cả các trường ngoại trừ trường bắt đầu bằng '_' và 'id'
        for attr, value in self.__dict__.items():
            if not attr.startswith('_') and attr != 'id':
                setattr(new_obj, attr, value)
        return new_obj

    @staticmethod
    def create_item(params):
        item = WorkpointSetting(**params)
        db.session.add(item)
        db.session.commit()
        return item
    




import time
import subprocess

def save_dump():
    now = datetime.datetime.now()
    timestamp = now.strftime("%y_%m_%d_%H_%M")

    local_folder = "/root/backup"
    os.makedirs(local_folder, exist_ok=True)
    local_dump_path = os.path.join(local_folder, f"admake_chat_{timestamp}.dump")
    print("Dump file local:", local_dump_path)

    env = os.environ.copy()
    env["PGPASSWORD"] = "myPass"
    try:
        subprocess.run(
            ["pg_dump", "-U", "postgres", "-d", "admake_chat", "-F", "c", "-f", local_dump_path],
            check=True,
            capture_output=True,
            text=True,
            env=env,
        )
        print("Dump database success on VPS.")
    except subprocess.CalledProcessError as e:
        print("Dump database failed:", e.stderr or e)
        return

    # Upload dump to Google Drive via rclone
    drive_dump_path = f"drive:backup/admake_chat_{timestamp}.dump"
    try:
        subprocess.run(
            ["rclone", "copyto", local_dump_path, drive_dump_path],
            check=True,
            capture_output=True,
            text=True,
        )
        print(f"Uploaded dump to Drive: {drive_dump_path}")
    except subprocess.CalledProcessError as e:
        print("Upload dump to Drive failed:", e.stderr or e)

    # Static sync disabled for now.

def periodic_save_dump(interval_minutes=15, sleep_fn=None):
    if sleep_fn is None:
        sleep_fn = time.sleep
    while True:
        # Gọi hàm save_dump hoặc tác vụ của bạn ở đây
        try:
            save_dump()
        except Exception as e:
            print("Periodic dump failed:", e)
        sleep_fn(interval_minutes * 60)  # nghỉ theo khoảng thời gian quy định

def test_sync_backup_to_drive(dry_run=True):
    src = "/root/backup"
    dst = "drive:backup"
    cmd = ["rclone", "sync", src, dst, "-v", "--stats=10s"]
    if dry_run:
        cmd.append("--dry-run")
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(f"Sync backup to Drive OK (dry_run={dry_run})")
    except subprocess.CalledProcessError as e:
        print("Sync backup to Drive failed:", e.stderr or e)

def get_query_page_users(lead_id, page, limit, search, role_id = 0):
    Pagination = namedtuple('Pagination', ['total', 'pages'])
    empty_pagination = Pagination(total=0, pages=0)

    if not lead_id or lead_id == 0:
        return [], empty_pagination
    
    lead = db.session.get(LeadPayload, lead_id)
    if not lead:
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
