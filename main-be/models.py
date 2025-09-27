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
    
    name = db.Column(db.String(255))
    owner_id = db.Column(db.String(24))

    



    # id = db.Column(db.Integer, primary_key=True)
    # groupId = db.Column(db.Integer, unique=True)
    # name = db.Column(db.String(120), nullable=True)
    description = db.Column(db.String(255))
    documents = db.Column(db.JSON, default=[])  # Lưu danh sách đường dẫn tài liệu
    images = db.Column(db.JSON, default=[])     # Lưu danh sách đường dẫn hình ảnh
    chats = db.Column(db.JSON, default=[])      # Lưu danh sách message ID lưu lại
    rating_sum = db.Column(db.Integer, default=0)
    rating_count = db.Column(db.Integer, default=0)



    state = db.Column(db.String(50))
    



    deleted_at = db.Column(db.DateTime, nullable=True)
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



def alter_columns():
    from sqlalchemy import create_engine, text

    # Khởi tạo engine kết nối SQLite file customer.db
    engine = create_engine('sqlite:///instance/customers.db')

    # Danh sách các lệnh ALTER TABLE để thêm các cột mới
    # alter_commands = [
    #     'ALTER TABLE workspaces ADD COLUMN description VARCHAR(255);',
    #     'ALTER TABLE workspaces ADD COLUMN documents JSON DEFAULT \'[]\';',
    #     'ALTER TABLE workspaces ADD COLUMN images JSON DEFAULT \'[]\';',
    #     'ALTER TABLE workspaces ADD COLUMN chats JSON DEFAULT \'[]\';',
    #     'ALTER TABLE workspaces ADD COLUMN rating_sum INTEGER DEFAULT 0;',
    #     'ALTER TABLE workspaces ADD COLUMN rating_count INTEGER DEFAULT 0;',
    #     'ALTER TABLE workspaces ADD COLUMN state VARCHAR(50);',
    # ]

    # cmd = "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"


    alter_commands = [
        "ALTER TABLE users ADD COLUMN is_authenticated BOOLEAN DEFAULT 0;",
        "ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 0;",
        "ALTER TABLE users ADD COLUMN is_anonymous BOOLEAN DEFAULT 0;",
        "ALTER TABLE users ADD COLUMN balanceAmount VARCHAR(80);",
        "ALTER TABLE users ADD COLUMN firstName VARCHAR(80);",
        "ALTER TABLE users ADD COLUMN lastName VARCHAR(80);",
        "ALTER TABLE users ADD COLUMN icon TEXT;",
        "ALTER TABLE users ADD COLUMN companyName VARCHAR(80);",
        "ALTER TABLE users ADD COLUMN localeCode VARCHAR(80);",
        "ALTER TABLE users ADD COLUMN languageCode VARCHAR(80);",
        "ALTER TABLE users ADD COLUMN socialInfor TEXT;",  # SQLite không có JSON native, dùng TEXT
        "ALTER TABLE users ADD COLUMN orderWebhook VARCHAR(255);",
        "ALTER TABLE users ADD COLUMN cryptoAddressList TEXT;",  # dùng TEXT để lưu JSON string
        "ALTER TABLE users ADD COLUMN selectedProvider TEXT;",
        "ALTER TABLE users ADD COLUMN selectedServices TEXT;",
    ]
    

    with engine.connect() as conn:
        # result = conn.execute(text(cmd))
        # tables = [row[0] for row in result]
        
        # print("Tables in database:")
        # for table in tables:
        #     print(table)

        for cmd in alter_commands:
            try:
                conn.execute(text(cmd))
                print(f"Executed: {cmd}")
            except Exception as e:
                print(f"Error executing {cmd}: {e}")


from sqlalchemy import create_engine, MetaData, Table, select, insert
from sqlalchemy.sql import func, text
from psycopg2.extras import Json
import datetime

def transfer_data_to_postgres():
    # Kết nối SQLite
    sqlite_engine = create_engine('sqlite:///instance/customers.db')
    metadata_sqlite = MetaData()
    metadata_sqlite.reflect(bind=sqlite_engine)
    users_sqlite = Table('users', metadata_sqlite, autoload_with=sqlite_engine)

    # Kết nối Postgres
    pg_engine = create_engine('postgresql+psycopg2://postgres@localhost/admake_chat')
    metadata_pg = MetaData()
    metadata_pg.reflect(bind=pg_engine)
    users_pg = Table('user', metadata_pg, autoload_with=pg_engine)

    with sqlite_engine.connect() as sqlite_conn, pg_engine.connect() as pg_conn:
        pg_conn.execute(text("DELETE FROM message;"))
        pg_conn.execute(text("DELETE FROM group_member;"))

        # Đọc tất cả records từ SQLite
        rows = sqlite_conn.execute(select(users_sqlite)).fetchall()
        print(f"Read {len(rows)} records from SQLite users")

        # Xóa trắng bảng user trong Postgres
        pg_conn.execute(users_pg.delete())
        print("Deleted all records from PostgreSQL user table")

        # Chuẩn bị dữ liệu insert với mapping trường
        insert_values = []
        for row in rows:
            insert_values.append({
                'id': row['id'],
                'accountId': row.get('accountId'),
                'balanceAmount': row.get('balanceAmount'),
                'icon': row.get('icon'),
                'companyName': row.get('companyName'),
                'localeCode': row.get('localeCode'),
                'languageCode': row.get('languageCode'),
                'socialInfor': Json(row.get('socialInfor')) if row.get('socialInfor') else None,
                'orderWebhook': row.get('orderWebhook'),
                'cryptoAddressList': Json(row.get('cryptoAddressList')) if row.get('cryptoAddressList') else None,
                'selectedProvider': Json(row.get('selectedProvider')) if row.get('selectedProvider') else None,
                'selectedServices': Json(row.get('selectedServices')) if row.get('selectedServices') else None,
                'createAt': row.get('createAt') or datetime.datetime.utcnow(),
                'updateAt': row.get('updateAt') or datetime.datetime.utcnow(),
                'role': row.get('role') or 'user',
                'is_authenticated': row.get('is_authenticated', False),
                'is_active': row.get('is_active', False),
                'is_anonymous': row.get('is_anonymous', False),
                'firstName': row.get('firstName'),
                'lastName': row.get('lastName'),
                'username': row.get('username'),
            })

        # Thực hiện insert batch vào Postgres
        pg_conn.execute(insert(users_pg), insert_values)
        print(f"Inserted {len(insert_values)} records into PostgreSQL user table")

if __name__ == "__main__":
    
    # alter_columns()
    transfer_data_to_postgres()
