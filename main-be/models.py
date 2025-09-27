from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import json
from datetime import datetime
import os
from flask_cors import CORS
import random
from sqlalchemy.types import JSON

app = Flask(__name__)
base_dir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(base_dir, "instance", "customers.db")

app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

CORS(app)

class Customer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    fullName = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    workInfo = db.Column(db.String(200))
    workStart = db.Column(db.DateTime)
    workEnd = db.Column(db.DateTime)
    workAddress = db.Column(db.String(200))
    workPrice = db.Column(db.Integer)
    status = db.Column(db.String(50))
    delete_at = db.Column(db.DateTime, nullable=True)
    createdAt = db.Column(db.DateTime)
    updatedAt = db.Column(db.DateTime)

    # def to_dict(self):
    #     return {
    #         "id": self.id,
    #         "fullName": self.fullName,
    #         "phone": self.phone,
    #         "workInfo": self.workInfo,
    #         "workStart": self.workStart.isoformat() if self.workStart else None,
    #         "workEnd": self.workEnd.isoformat() if self.workEnd else None,
    #         "workAddress": self.workAddress,
    #         "workPrice": self.workPrice,
    #         "status": self.status,
    #         "delete_at": self.delete_at.isoformat() if self.delete_at else None,
    #         "createdAt": self.createdAt.isoformat() if self.createdAt else None,
    #         "updatedAt": self.updatedAt.isoformat() if self.updatedAt else None,
    #     }
    
    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                value = value.isoformat()
            result[column.name] = value
        return result
    


class Material(db.Model):
    __tablename__ = 'materials'

    id = db.Column(db.Integer, primary_key=True)
    
    name = db.Column(db.String(255), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit = db.Column(db.String(50))
    price = db.Column(db.Float)
    image = db.Column(db.String(255))
    description = db.Column(db.Text)
    supplier = db.Column(db.String(255))
    version = db.Column(db.Integer)

    delete_at = db.Column(db.DateTime, nullable=True)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    updatedAt = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # def to_dict(self):
    #     return {
    #         "id": self.id,
    #         "delete_at": self.delete_at.isoformat() if self.delete_at else None,
    #         "name": self.name,
    #         "quantity": self.quantity,
    #         "unit": self.unit,
    #         "price": self.price,
    #         "image": self.image,
    #         "description": self.description,
    #         "supplier": self.supplier,
    #         "version": self.version,
    #         "createdAt": self.createdAt.isoformat() if self.createdAt else None,
    #         "updatedAt": self.updatedAt.isoformat() if self.updatedAt else None,
    #     }

    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                value = value.isoformat()
            result[column.name] = value
        return result
    

def generate_datetime_id():
    now = datetime.utcnow()
    timestamp_str = now.strftime("%Y%m%d%H%M%S%f")  # năm tháng ngày giờ phút giây micro giây
    random_str = ''.join(random.choices('0123456789abcdef', k=6))  # thêm 6 ký tự hex ngẫu nhiên
    return timestamp_str + random_str

class User(db.Model):
    __tablename__ = 'users'

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
    delete_at = db.Column(db.DateTime, nullable=True)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    updatedAt = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    version = db.Column(db.Integer)

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
            if isinstance(value, datetime):
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
            createdAt=parse_date(data.get("createdAt")),
            updatedAt=parse_date(data.get("updatedAt")),
            version=data.get("__v"),
        )
    

class Role(db.Model):
    __tablename__ = 'roles'

    id = db.Column(db.Integer, primary_key=True)  # lấy từ _id.$oid
    
    permissions = db.Column(JSON)  # lưu list permissions
    name = db.Column(db.String(255))
    delete_at = db.Column(db.DateTime, nullable=True)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    updatedAt = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    version = db.Column(db.Integer)

    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                value = value.isoformat()
            result[column.name] = value
        return result

    @staticmethod
    def parse(data):
        return Role(
            permissions=data.get("permissions"),
            name=data.get("name"),
            delete_at=data.get("delete_at"),
            createdAt=parse_date(data.get("createdAt")),
            updatedAt=parse_date(data.get("updatedAt")),
            version=data.get("__v"),
        )
    
class Workspace(db.Model):
    __tablename__ = "workspaces"

    id = db.Column(db.String(24), primary_key=True)  # _id.$oid
    deleted_at = db.Column(db.DateTime, nullable=True)
    name = db.Column(db.String(255))
    owner_id = db.Column(db.String(24))
    created_at = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime)
    version = db.Column(db.Integer)

    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, datetime):
                value = value.isoformat()
            result[column.name] = value
        return result

    @staticmethod
    def parse(data):
        return Workspace(
            id=data.get("_id", {}).get("$oid"),
            
            name=data.get("name"),
            owner_id=data.get("ownerId", {}).get("$oid"),
            created_at=parse_date(data.get("createdAt")),
            updated_at=parse_date(data.get("updatedAt")),
            deleted_at=parse_date(data.get("deletedAt")),
            version=data.get("__v"),
        )

    
class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.String(24), primary_key=True)  # _id.$oid
    delete_at = db.Column(db.DateTime, nullable=True)
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
    created_at = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime)
    version = db.Column(db.Integer)
    end_time = db.Column(db.DateTime)
    start_time = db.Column(db.DateTime)

    def to_dict(self):
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            if isinstance(value, datetime):
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
            created_at=parse_date(data.get("createdAt")),
            updated_at=parse_date(data.get("updatedAt")),
        )


def dateStr(tm):
    return datetime.strptime(tm, '%Y-%m-%d').date() if tm else None

def parse_date(d):
    # d có dạng {"$date": "2025-07-21T01:03:22.362Z"}
    if isinstance(d, dict) and "$date" in d:
        return datetime.fromisoformat(d["$date"].replace("Z", "+00:00"))
    return None

def load_customers():
    with open("json/customers.json", "r", encoding="utf-8") as f:
        data = json.load(f)
        for item in data:
            customer = Customer(
                fullName=item.get("fullName"),
                phone=item.get("phone"),
                workInfo=item.get("workInfo"),
                workStart=parse_date(item.get("workStart")),
                workEnd=parse_date(item.get("workEnd")),
                workAddress=item.get("workAddress"),
                workPrice=item.get("workPrice"),
                status=item.get("status"),
                delete_at=parse_date(item.get("delete_at")),
                createdAt=parse_date(item.get("createdAt")),
                updatedAt=parse_date(item.get("updatedAt")),
            )
            db.session.add(customer)
        db.session.commit()


def load_materials():
    with open("json/materials.json", "r", encoding="utf-8") as f:
        datas = json.load(f)

        for data in datas:
            mtl = Material(
                name=data.get('name'),
                quantity=data.get('quantity'),
                unit=data.get('unit'),
                price=data.get('price'),
                image=data.get('image'),
                description=data.get('description'),
                supplier=data.get('supplier'),
                version=data.get('__v'),
                delete_at=parse_date(data.get("delete_at")),
                createdAt=parse_date(data.get("createdAt")),
                updatedAt=parse_date(data.get("updatedAt")),
            )
            db.session.add(mtl)
        db.session.commit()


def load_users():
    with open("json/users.json", "r", encoding="utf-8") as f:
        data = json.load(f)

        for item in data:
            user = User.parse(item)
            db.session.add(user)

        print("Start commit")
        db.session.commit()

def load_roles():
    with open("json/roles.json", "r", encoding="utf-8") as f:
        data = json.load(f)

        for item in data:
            role = Role.parse(item)
            db.session.add(role)

        db.session.commit()

def load_tasks():
    with open("json/tasks.json", "r", encoding="utf-8") as f:
        data = json.load(f)

        for item in data:
            task = Task.parse(item)
            db.session.add(task)

        db.session.commit()

def load_work_spaces():
    with open("json/workspaces.json", "r", encoding="utf-8") as f:
        data = json.load(f)

        for item in data:
            work = Workspace.parse(item)
            db.session.add(work)

        db.session.commit()

def apply_role_for_user():
    role_ids = [
        "6879cd8e865fb3ae13aab099",
        "6879cd8e865fb3ae13aab098",
        "688923918d99dcb8816275c6",
        "689ded9749f0334c7af17ddd",
        "689e142749f0334c7af18aab",
        "68abcd4fa4e729c9cfc889c9",
        "68abcea3a4e729c9cfc88a55",
    ]

    for user in User.query.all():
        if user.role_id in role_ids:
            
            idx = role_ids.index(user.role_id)
            print('match', idx)
            user.role_id = str(idx)

    db.session.commit()


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        # Role.__table__.drop(db.engine)
        # load_roles()

        # apply_role_for_user()
        # load_tasks()
        # load_work_spaces()


        tasks_to_delete = Task.query.filter(Task.create_by_id == None).all()  # tìm những task không có create_by_id

        for task in tasks_to_delete:
            db.session.delete(task)

        db.session.commit()
