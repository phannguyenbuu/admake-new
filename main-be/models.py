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

from sqlalchemy import create_engine, MetaData, Table, select, insert
from sqlalchemy.sql import func, text
from psycopg2.extras import Json

app = Flask(__name__)
# base_dir = os.path.abspath(os.path.dirname(__file__))
# db_path = os.path.join(base_dir, "instance", "customers.db")

# app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
# app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

from dotenv import load_dotenv
load_dotenv()

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
db = SQLAlchemy(app)

CORS(app)


class BaseModel(db.Model):
    __abstract__ = True

    

    delete_at = db.Column(db.DateTime, nullable=True)
    createAt = db.Column(db.DateTime)
    updateAt = db.Column(db.DateTime)
    version = db.Column(db.Integer)



 


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

    # delete_at = db.Column(db.DateTime, nullable=True)
    # createAt = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    # updateAt = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            print(f"DEBUG: Column {column.name} value type: {type(value)}")
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

    id = db.Column(db.String(24), primary_key=True)    
    username = db.Column(db.String(255), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50))
    role_id = db.Column(db.String(24))  # lấy từ role.$oid
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
    accountId = db.Column(db.String(24), nullable=True)
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

    # delete_at = db.Column(db.DateTime, nullable=True)
    # createAt = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    # updateAt = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    # version = db.Column(db.Integer)

    def update_role(self):
        try:
            role_id_int = int(self.role_id)
        except (TypeError, ValueError):
            role_id_int = None

        if role_id_int:
            role = db.session.get(Role, role_id_int)
            if role:
                return role.to_dict()

    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            print(f"DEBUG: Column {column.name} value type: {type(value)}")
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value

        result["role"] = self.update_role()

        return result

    @staticmethod
    def parse(data):
        return User(
            id = generate_datetime_id(),
            # id=data.get("_id", {}).get("$oid"),
            username=data.get("username"),
            password=data.get("password"),
            status="active",
            role_id=data.get("role"),
            type=data.get("type"),
            hashKey=data.get("hashKey"),
            fullName=data.get("fullName"),
            level_salary=data.get("level_salary"),
            phone=data.get("phone"),
            avatar=data.get("avatar"),
            delete_at=parse_date(data.get("delete_at")),
            createAt=parse_date(data.get("createAt")),
            updateAt=parse_date(data.get("updateAt")),
            version=data.get("__v"),
        )
    
class Customer(User):
    __tablename__ = 'user'
    __table_args__ = {'extend_existing': True}

class Role(BaseModel):
    __tablename__ = 'role'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)  # lấy từ _id.$oid
    
    permissions = db.Column(JSON)  # lưu list permissions
    name = db.Column(db.String(255))
    # delete_at = db.Column(db.DateTime, nullable=True)
    # createAt = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    # updateAt = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    # version = db.Column(db.Integer)

    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            print(f"DEBUG: Column {column.name} value type: {type(value)}")
            if isinstance(value, (datetime.datetime, datetime.date)):
                value = value.isoformat()
            result[column.name] = value
        return result

    @staticmethod
    def parse(data):
        return Role(
            permissions=data.get("permissions"),
            name=data.get("name"),
            delete_at=data.get("delete_at"),
            createAt=parse_date(data.get("createAt")),
            updateAt=parse_date(data.get("updateAt")),
            version=data.get("__v"),
        )
    
class Workspace(BaseModel):
    __tablename__ = "workspace"
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.String(24), primary_key=True)  # _id.$oid
    
    name = db.Column(db.String(255))
    owner_id = db.Column(db.String(24))

    



    id = db.Column(db.Integer, primary_key=True)
    # groupId = db.Column(db.Integer, unique=True)
    # name = db.Column(db.String(120), nullable=True)
    description = db.Column(db.String(255))
    documents = db.Column(db.JSON, default=[])  # Lưu danh sách đường dẫn tài liệu
    images = db.Column(db.JSON, default=[])     # Lưu danh sách đường dẫn hình ảnh
    chats = db.Column(db.JSON, default=[])      # Lưu danh sách message ID lưu lại
    rating_sum = db.Column(db.Integer, default=0)
    rating_count = db.Column(db.Integer, default=0)



    state = db.Column(db.String(50))
    



    # deleted_at = db.Column(db.DateTime, nullable=True)
    # created_at = db.Column(db.DateTime)
    # updated_at = db.Column(db.DateTime)
    # version = db.Column(db.Integer)




    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            print(f"DEBUG: Column {column.name} value type: {type(value)}")
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
            created_at=parse_date(data.get("createAt")),
            updated_at=parse_date(data.get("updateAt")),
            deleted_at=parse_date(data.get("deletedAt")),
            version=data.get("__v"),
        )
    
class Task(BaseModel):
    __tablename__ = "task"

    id = db.Column(db.String(24), primary_key=True)  # _id.$oid
    # delete_at = db.Column(db.DateTime, nullable=True)
    title = db.Column(db.String(255))
    description = db.Column(db.Text)
    status = db.Column(db.String(50))
    type = db.Column(db.String(50))
    reward = db.Column(db.Integer)
    assign_ids = db.Column(db.JSON)  # lưu JSON string của list ObjectId
    workspace_id = db.Column(db.String(24))
    customer_id = db.Column(db.String(24))
    materials = db.Column(db.JSON)  # lưu JSON string của list dict {materialId, quantity}
    create_by_id = db.Column(db.String(24))
    # created_at = db.Column(db.DateTime)
    # updated_at = db.Column(db.DateTime)
    # version = db.Column(db.Integer)
    end_time = db.Column(db.DateTime)
    start_time = db.Column(db.DateTime)

    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            print(f"DEBUG: Column {column.name} value type: {type(value)}")
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

            delete_at=parse_date(data.get("delete_at")),
            created_at=parse_date(data.get("createAt")),
            updated_at=parse_date(data.get("updateAt")),
        )

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
