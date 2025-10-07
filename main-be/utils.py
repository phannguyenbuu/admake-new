import json
from models import db, app, User, Group,Workpoint, Customer, Material, parse_date, Role, Message, Task, Workspace, generate_datetime_id
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
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm.attributes import flag_modified

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
                deletedAt=parse_date(item.get("deletedAt")),
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
                deletedAt=parse_date(data.get("deletedAt")),
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



def show_collections_and_schema():
    # Thay connection string với thông tin PostgreSQL của bạn
    engine = create_engine("postgresql+psycopg2://postgres:mypassword@localhost:5432/admake_chat")
    inspector = inspect(engine)

    # Lấy tên tất cả các bảng trong database
    tables = inspector.get_table_names()
    print("Danh sách bảng trong database:")
    for table in tables:
        print(f"\nBảng: {table}")
        # Lấy thông tin schema (cột) của bảng đó
        columns = inspector.get_columns(table)
        for col in columns:
            print(f"  - Cột: {col['name']}, Kiểu: {col['type']}, Nullable: {col['nullable']}")

import sqlite3

def read_users_from_sqlite():
    conn = sqlite3.connect('main-be/instance/customers.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, fullName version FROM users")
    rows = cursor.fetchall()
    conn.close()
    return rows

def update_users_to_postgres():
    users = read_users_from_sqlite()
    print(users)

    with app.app_context():
        all_users = db.session.query(User).order_by(User.id).all()

        for i, user_data in enumerate(users):
            if i < len(all_users):
                user_pg = all_users[i]
                
                fullName = user_data[1]
                user_pg.fullName = fullName
        db.session.commit()

    print("Đã cập nhật dữ liệu lên PostgreSQL")


def read_roles_from_sqlite():
    conn = sqlite3.connect('main-be/instance/customers.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, permissions, name, version FROM roles")
    rows = cursor.fetchall()
    conn.close()
    return rows

def update_roles_to_postgres():
    roles = read_roles_from_sqlite()
    with app.app_context():
        for i, data in enumerate(roles):
            id, permissions, name, version = data[0], data[1], data[2], data[3]
            
            new_role = Role(id=id, name=name, permissions=permissions, version=version)
            db.session.add(new_role)
            db.session.commit()
    
    print("Đã cập nhật dữ liệu lên PostgreSQL")


def alter_columns():
    from sqlalchemy import create_engine, text

    # Khởi tạo engine kết nối SQLite file customer.db
    engine = create_engine('sqlite:///main-be/instance/customers.db')

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



def transfer_user_to_postgres():
    # Kết nối SQLite
    sqlite_engine = create_engine('sqlite:///main-be/instance/customers.db')
    
    metadata_sqlite = MetaData()
    metadata_sqlite.reflect(bind=sqlite_engine)
    users_sqlite = Table('users', metadata_sqlite, autoload_with=sqlite_engine)

    

    
    with sqlite_engine.connect() as sqlite_conn:
        cmd_1 = """
CREATE TABLE "user" (
                -id VARCHAR(50) PRIMARY KEY,
                -username VARCHAR(255) NOT NULL,
                -password VARCHAR(255) NOT NULL,
                status VARCHAR(50),
                role_id INTEGER,
                type VARCHAR(50),
                hashKey VARCHAR(255),
                fullName VARCHAR(255),
                level_salary INTEGER,
                phone VARCHAR(20),
                avatar VARCHAR(255),
                ---createdAt TIMESTAMP,
                ---updatedAt TIMESTAMP,
                deletedAt TIMESTAMP,
                version INTEGER
                -is_authenticated BOOLEAN DEFAULT FALSE,
                -is_active BOOLEAN DEFAULT FALSE,
                -is_anonymous BOOLEAN DEFAULT FALSE,
                -balanceAmount VARCHAR(80),
                -accountId VARCHAR(50),
                -firstName VARCHAR(80),
                -lastName VARCHAR(80),
                -icon VARCHAR,
                -companyName VARCHAR(80),
                -localeCode VARCHAR(80),
                -languageCode VARCHAR(80),
                -socialInfor JSON,
                -orderWebhook VARCHAR(255),
                -cryptoAddressList JSON,
                -selectedProvider JSON,
                -selectedServices JSON,
                
            );
    """

        cmd_2 = """
            
            CREATE TABLE customer (
                id VARCHAR(50) PRIMARY KEY,
                user_id VARCHAR(50) UNIQUE NOT NULL,
                taxCode VARCHAR(50),
                workInfo VARCHAR(255),
                workStart TIMESTAMP,
                workEnd TIMESTAMP,
                workAddress VARCHAR(255),
                workPrice INTEGER,
                CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES "user"(id)
            );
        """
        
        rows = sqlite_conn.execute(select(users_sqlite)).fetchall()
        print(f"Read {len(rows)} records from SQLite users")

        with sqlite_engine.connect() as conn:
            row_dict = conn.execute(users_sqlite.select())
            print(row_dict)
            for row in row_dict:
                id_value = row[0]  # thường là cột đầu tiên
                # name_value = row[1]  # cột thứ hai, tùy thứ tự cột DB
                # hoặc chuyển row thành dict:
                row_dict = dict(row._mapping)
                id_value = row_dict['id']
                # name_value = row_dict['name']

                new_user = User(
    id = id_value,
    username = row_dict.get('username'),
    password = row_dict.get('password'),
    status = row_dict.get('status'),
    role_id = row_dict.get('role_id'),
    type = row_dict.get('type'),
    hashKey = row_dict.get('hashKey'),
    fullName = row_dict.get('fullName'),
    level_salary = row_dict.get('level_salary'),
    phone = row_dict.get('phone'),
    avatar = row_dict.get('avatar'),
    is_authenticated = row_dict.get('is_authenticated'),
    is_active = row_dict.get('is_active'),
    is_anonymous = row_dict.get('is_anonymous'),
    balanceAmount = row_dict.get('balanceAmount'),
    accountId = row_dict.get('accountId'),
    firstName = row_dict.get('firstName'),
    lastName = row_dict.get('lastName'),
    icon = row_dict.get('icon'),
    companyName = row_dict.get('companyName'),
    localeCode = row_dict.get('localeCode'),
    languageCode = row_dict.get('languageCode'),
    socialInfor = row_dict.get('socialInfor'),
    orderWebhook = row_dict.get('orderWebhook'),
    cryptoAddressList = row_dict.get('cryptoAddressList'),
    selectedProvider = row_dict.get('selectedProvider'),
    selectedServices = row_dict.get('selectedServices'),
)


                db.session.add(new_user)
    db.session.commit()

        


def transfer_material_to_postgres():
    # Kết nối SQLite
    sqlite_engine = create_engine('sqlite:///main-be/instance/customers.db')
    metadata_sqlite = MetaData()
    metadata_sqlite.reflect(bind=sqlite_engine)
    materials_sqlite = Table('materials', metadata_sqlite, autoload_with=sqlite_engine)

    with sqlite_engine.connect() as conn:
        row_dict = conn.execute(materials_sqlite.select())
        print(row_dict)
        for row in row_dict:
            
            id_value = row[0]  # thường là cột đầu tiên
            name_value = row[1]  # cột thứ hai, tùy thứ tự cột DB
            # hoặc chuyển row thành dict:
            row_dict = dict(row._mapping)
            id_value = row_dict['id']
            name_value = row_dict['name']

            new_material = Material(
                id=id_value,
                name=name_value,
                quantity=row_dict['quantity'],
                unit=row_dict['unit'],
                price=row_dict['price'],
                description=row_dict['description'],
                supplier=row_dict['supplier']
            )

            db.session.add(new_material)
    db.session.commit()


def transfer_workspace_to_postgres():
    # Kết nối SQLite
    sqlite_engine = create_engine('sqlite:///main-be/instance/customers.db')
    metadata_sqlite = MetaData()
    metadata_sqlite.reflect(bind=sqlite_engine)
    workspaces_sqlite = Table('workspaces', metadata_sqlite, autoload_with=sqlite_engine)

    with sqlite_engine.connect() as conn:
        row_dict = conn.execute(workspaces_sqlite.select())
        for row in row_dict:
            
            id_value = row[0]  # thường là cột đầu tiên
            name_value = row[1]  # cột thứ hai, tùy thứ tự cột DB
            # hoặc chuyển row thành dict:
            row_dict = dict(row._mapping)
            id_value = row_dict['id']
            name_value = row_dict['name']

            print(row_dict)

            new_workspace = Workspace(
                id=id_value,
                name=name_value,
                description=row_dict['description'],
                documents=row_dict['documents'],
                images=row_dict['images'],
                chats=row_dict['chats'],
                rating_sum=row_dict['rating_sum'],
                rating_count=row_dict['rating_count'],
                state=row_dict['state'],
            )







            db.session.add(new_workspace)
    db.session.commit()



def transfer_task_to_postgres():
    # Kết nối SQLite
    sqlite_engine = create_engine('sqlite:///main-be/instance/customers.db')
    metadata_sqlite = MetaData()
    metadata_sqlite.reflect(bind=sqlite_engine)
    tasks_sqlite = Table('tasks', metadata_sqlite, autoload_with=sqlite_engine)

    with sqlite_engine.connect() as conn:
        row_dict = conn.execute(tasks_sqlite.select())
        for row in row_dict:
            
            id_value = row[0]  # thường là cột đầu tiên
            name_value = row[1]  # cột thứ hai, tùy thứ tự cột DB
            # hoặc chuyển row thành dict:
            row_dict = dict(row._mapping)
            id_value = row_dict['id']
            # name_value = row_dict['name']

            print(row_dict)

            new_task = Task(
                id=id_value,
                # name=name_value,
                title=row_dict['title'],
                description=row_dict['description'],
                status=row_dict['status'],
                type=row_dict['type'],
                reward=row_dict['reward'],
                assign_ids=row_dict['assign_ids'],
                workspace_id=row_dict['workspace_id'],
                customer_id=row_dict['customer_id'],
                materials=row_dict['materials'],
                create_by_id=row_dict['create_by_id'],
                end_time=row_dict['end_time'],
                start_time=row_dict['start_time'],
            )


            db.session.add(new_task)
    db.session.commit()


def transfer_message_to_postgres():
    # Kết nối SQLite
    sqlite_engine = create_engine('sqlite:///main-be/instance/customers.db')
    metadata_sqlite = MetaData()
    metadata_sqlite.reflect(bind=sqlite_engine)
    tasks_sqlite = Table('message', metadata_sqlite, autoload_with=sqlite_engine)

    with sqlite_engine.connect() as conn:
        row_dict = conn.execute(tasks_sqlite.select())
        for row in row_dict:
            
            id_value = row[0]  # thường là cột đầu tiên
            name_value = row[1]  # cột thứ hai, tùy thứ tự cột DB
            # hoặc chuyển row thành dict:
            row_dict = dict(row._mapping)
            id_value = row_dict['id']
            # name_value = row_dict['name']

            print(row_dict)

            new_message = Message(
                id=id_value,
                # name=name_value,
                message_id=row_dict['message_id'],
                group_id=row_dict['group_id'],
                user_id=row_dict['user_id'],
                text=row_dict['text'],
                file_url=row_dict['file_url'],
                
                is_favourite=row_dict['is_favourite'],
                react=row_dict['react'],
                type=row_dict['type'],
            )


            db.session.add(new_message)
    db.session.commit()


def transfer_role_to_postgres():
    # Kết nối SQLite
    sqlite_engine = create_engine('sqlite:///main-be/instance/customers.db')
    metadata_sqlite = MetaData()
    metadata_sqlite.reflect(bind=sqlite_engine)
    roles_sqlite = Table('roles', metadata_sqlite, autoload_with=sqlite_engine)

    with sqlite_engine.connect() as conn:
        row_dict = conn.execute(roles_sqlite.select())
        for row in row_dict:
            
            id_value = row[0]  # thường là cột đầu tiên
            name_value = row[1]  # cột thứ hai, tùy thứ tự cột DB
            # hoặc chuyển row thành dict:
            row_dict = dict(row._mapping)
            id_value = row_dict['id']
            # name_value = row_dict['name']

            print(row_dict)

            new_role = Role(
                id=id_value,
                # name=name_value,
                permissions=row_dict['permissions'],
                name=row_dict['name'],
            )

            db.session.add(new_role)
    db.session.commit()



def transfer_customer_to_postgres():
    # Kết nối SQLite
    sqlite_engine = create_engine('sqlite:///main-be/instance/customers.db')
    metadata_sqlite = MetaData()
    metadata_sqlite.reflect(bind=sqlite_engine)
    customers_sqlite = Table('customer', metadata_sqlite, autoload_with=sqlite_engine)

    with sqlite_engine.connect() as conn:
        row_dict = conn.execute(customers_sqlite.select())
        for row in row_dict:
            
            id_value = row[0]  # thường là cột đầu tiên
            name_value = row[1]  # cột thứ hai, tùy thứ tự cột DB
            # hoặc chuyển row thành dict:
            row_dict = dict(row._mapping)
            id_value = row_dict['id']
            # name_value = row_dict['name']

            print(row_dict)

            # Tạo user mới
            new_user = User(
                id=generate_datetime_id(),
                username=row_dict.get("username"),
                password=row_dict.get("password"),
                fullName=row_dict.get("fullName"),
                phone=row_dict.get("phone"),
                status="active",
                role_id=-1,   # giả sử bạn đặt role CUSTOMER
            )

            db.session.add(new_user)
            db.session.flush()  # để có id ngay mà không cần commit

            new_customer = Customer(
                id=generate_datetime_id(),
                user_id=new_user.id,   # gắn FK
                taxCode=row_dict.get("taxCode"),
                workInfo=row_dict.get("workInfo"),
                workStart=row_dict.get("workStart"),
                workEnd=row_dict.get("workEnd"),
                workAddress=row_dict.get("workAddress"),
                workPrice=row_dict.get("workPrice"),
            )

            db.session.add(new_customer)
    db.session.commit()

def delete_content():
    db.session.execute(text('''
        DELETE FROM message WHERE user_id IN (
    SELECT id FROM "user" WHERE "fullName" = 'Đình Cường Phan'
);
DELETE FROM "user" WHERE "fullName" = 'Đình Cường Phan';

'''))
    db.session.commit()

def alter_column_id_type():
    

    sql = text('ALTER TABLE "user" ALTER COLUMN id TYPE VARCHAR(24) USING id::VARCHAR(24);')
    with app.app_context():
        db.session.execute(sql)
        db.session.commit()
    print("Đã thay đổi kiểu cột id thành VARCHAR(24)")



def create_table(table):
    db.session.execute(text('''CREATE TABLE customer (
        id SERIAL PRIMARY KEY,
        user_id INT UNIQUE NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        address TEXT,
        phone VARCHAR(20),
        loyalty_points INT DEFAULT 0
    );'''))
    db.session.commit()


def add_new_columns(table, cols, col_type):
    for col in cols:
        # Kiểm tra xem cột đã tồn tại chưa
        check_sql = text(f"""
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = :table AND column_name = :col
        """)
        exists = db.session.execute(check_sql, {"table": table, "col": col}).scalar()
        
        if not exists:
            # Nếu chưa tồn tại thì thêm cột
            alter_sql = text(f'ALTER TABLE "{table}" ADD COLUMN "{col}" {col_type};')
            db.session.execute(alter_sql)
            print(f"Added column '{col}' to table '{table}'")
        else:
            print(f"Column '{col}' already exists in table '{table}', skipping.")

    db.session.commit()
    print(f"Done altering table {table}")





def print_table_record_counts():
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    print("Số bản ghi từng bảng trong database:")
    for table in tables:
        count = db.session.execute(text(f'SELECT COUNT(*) FROM "{table}"')).scalar()
        print(f"\n- Bảng {table}: {count} bản ghi")
        
        columns = inspector.get_columns(table)
        print("  Schema:")
        for col in columns:
            print(f"    - {col['name']} : {col['type']}")

def drop_tables_by_name():
    table_names = [
        "materials", "users", "roles", "workspaces",
        "tasks", "attendances", "locations",
        "work_assignments", "months_summary"
    ]

    for table_name in table_names:
        db.session.execute(text(f'DROP TABLE IF EXISTS "{table_name}" CASCADE;'))
        print(f"Dropped table {table_name} with CASCADE")
    db.session.commit()

def delete_all_records_from_tables():
    tables_to_clear = [
        "materials", "users", "roles", "workspaces",
        "tasks", "attendances", "locations",
        "work_assignments", "months_summary"
    ]
    
    with db.session.begin():  # bắt đầu transaction
        for table in tables_to_clear:
            # Dùng SQL toản bộ xóa dữ liệu, bao tên bảng trong ngoặc kép
            db.session.execute(text(f'DELETE FROM "{table}";'))
        db.session.commit()

def read_users_from_json(json_file):
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data  # data dạng list/dict tùy cấu trúc file

def update_users_with_accountId(json_file):
    users_data = read_users_from_json(json_file)
    with app.app_context():
        all_users = db.session.query(User).all()
        for i, user in enumerate(users_data):
            if i >= len(all_users):
                break
            all_users[i].accountId = user.get('accountId')
        db.session.commit()
    print("Đã gán accountId từ JSON làm id trong PostgreSQL theo thứ tự")


def change_value_type(table, keys, type='VARCHAR(50)'):
    for key in keys:
        db.session.execute(text(f'ALTER TABLE "{table}" ALTER COLUMN "{key}" TYPE {type} USING {key}::integer;'))
#     db.session.execute(text(
#         f'''
# CREATE SEQUENCE {table}_id_seq;
# ALTER TABLE "{table}" ALTER COLUMN id SET DEFAULT nextval('{table}_id_seq');
# ALTER SEQUENCE {table}_id_seq OWNED BY "{table}".id;
# '''))

    db.session.commit()

def create_customer_role():
    # Kiểm tra nếu role CUSTOMER đã tồn tại chưa
    existing_role = db.session.query(Role).filter_by(name='CUSTOMER').first()
    if not existing_role:
        customer_role = Role(id=-1, name='CUSTOMER', permissions=[])
        db.session.add(customer_role)
        db.session.commit()
        print("Tạo role CUSTOMER thành công")
    else:
        print("Role CUSTOMER đã tồn tại")

def show_table():
    result = db.session.execute(text(f'''SELECT conname, confrelid::regclass AS referenced_table
        FROM pg_constraint
        WHERE conrelid = 'customer'::regclass;'''))
    # db.session.commit()
    for row in result:
        print(f"Constraint: {row.conname}, References: {row.referenced_table}")

    # sql = text('ALTER TABLE customer DROP CONSTRAINT IF EXISTS customer_user_id_fkey;')
    # db.session.execute(sql)
    # db.session.commit()
    # print("Đã xóa constraint thừa.")

def renameColumn(table, fieldName = None, newName = None):
    from sqlalchemy.exc import ProgrammingError

    inspector = inspect(db.engine)
    
    
    columns = inspector.get_columns(table)
    for col in columns:
        print(f"Tên cột: {col['name']}, Kiểu: {col['type']}")

    columns = [col['name'] for col in inspector.get_columns(table)]
    print(','.join(columns))

    if fieldName and fieldName not in columns:
        print(f"Cột '{fieldName}' không tồn tại trong bảng '{table}'.")
        return
    try:
        db.session.execute(text(f'ALTER TABLE "{table}" RENAME COLUMN "{fieldName}" TO "{newName}";'))
        db.session.commit()
        print(f"Đã đổi tên cột '{fieldName}' thành '{newName}' trong bảng '{table}'.")
    except ProgrammingError as e:
        db.session.rollback()
        print(f"Lỗi khi đổi tên cột: {e}")

def transfer_data_to_postgres():
    # transfer_user_to_postgres()
    # transfer_customer_to_postgres()
    # transfer_material_to_postgres()
    # transfer_workspace_to_postgres()
    # transfer_task_to_postgres()

    # transfer_message_to_postgres()
    transfer_role_to_postgres()

import random

def fix_invalid_foreign_keys():
    # Lấy tất cả user_id hợp lệ
    valid_user_ids = [row[0] for row in db.session.execute(text('SELECT id FROM "user"')).fetchall()]
    # Lấy tất cả group_id hợp lệ
    valid_group_ids = [row[0] for row in db.session.execute(text('SELECT id FROM "group"')).fetchall()]

    # Cập nhật user_id không hợp lệ
    invalid_user_ids = db.session.execute(text('''
        SELECT DISTINCT user_id FROM message
        WHERE user_id NOT IN (SELECT id FROM "user")
    ''')).fetchall()

    for (invalid_user_id,) in invalid_user_ids:
        if valid_user_ids:
            new_user_id = random.choice(valid_user_ids)
            db.session.execute(text('''
                UPDATE message SET user_id = :new_user_id WHERE user_id = :invalid_user_id
            '''), {'new_user_id': new_user_id, 'invalid_user_id': invalid_user_id})

    # Cập nhật group_id không hợp lệ
    invalid_group_ids = db.session.execute(text('''
        SELECT DISTINCT group_id FROM message
        WHERE group_id NOT IN (SELECT id FROM "group")
    ''')).fetchall()
    
    for (invalid_group_id,) in invalid_group_ids:
        if valid_group_ids:
            new_group_id = random.choice(valid_group_ids)
            db.session.execute(text('''
                UPDATE message SET group_id = :new_group_id WHERE group_id = :invalid_group_id
            '''), {'new_group_id': new_group_id, 'invalid_group_id': invalid_group_id})

    db.session.commit()

def erase_table(table):
    db.session.query(table).delete()

    # Commit thay đổi vào DB
    db.session.commit()


def modify_workpoint():
    # Cách mới với Session.get()
    workpoint = db.session.get(Workpoint, "20251003004356040983f1f591")

    if "morning" in workpoint.checklist and "out" in workpoint.checklist["morning"]:
        del workpoint.checklist["morning"]["out"]

    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(workpoint, "checklist")

    db.session.commit()


def modify_material_id_type():
    db.session.execute(text('''
ALTER TABLE material
ALTER COLUMN id TYPE INTEGER USING id::integer;
                            '''))
    db.session.commit()

def create_table_workpoint():
    db.session.execute(text('''
    DROP TABLE IF EXISTS workpoint;

    CREATE TABLE workpoint (
        id VARCHAR(80) PRIMARY KEY,
        note VARCHAR(255),
        
        checklist JSON,

        "createdAt" TIMESTAMP,
        "updatedAt" TIMESTAMP,
        "deletedAt" TIMESTAMP,
        version INTEGER,
        user_id VARCHAR(80) REFERENCES "user"(id)
        );
    '''))
    db.session.commit()

def change_foreign_key():
    db.session.execute(text('''
    ALTER TABLE message ADD CONSTRAINT fk_message_user_id FOREIGN KEY (user_id) REFERENCES "user"(id);
    ALTER TABLE message ADD CONSTRAINT fk_message_group_id FOREIGN KEY (group_id) REFERENCES "group"(id);

    '''))
    db.session.commit()


def check_foreign_key():
    result = db.session.execute(text('''
SELECT
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
     AND ccu.table_schema = tc.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'admake_chat'
    AND (tc.table_name = 'customer' OR ccu.table_name = 'user');
'''))
    
    print(result.all())
    db.session.commit()

def set_user_customer_foreign():
    db.session.execute(text('''
    ALTER TABLE customer
ADD CONSTRAINT fk_customer_user
FOREIGN KEY (user_id) REFERENCES "user"(id);
'''))
    
    
    db.session.commit()


def delete_customer_user():
    db.session.execute(text('''
    DELETE FROM customer WHERE user_id IN (
    SELECT id FROM "user"
    WHERE "fullName" = 'Alice'
);
DELETE FROM "user"
WHERE "fullName" = 'Alice';
'''))
        
    db.session.commit()

def delete_null_task():
    db.session.execute(text('''
DELETE FROM task
WHERE start_time IS NULL;
                            '''))
    db.session.commit()

def set_group_generate_token():
    for i, group in enumerate(Group.query.all()):
        s = generate_datetime_id()
        # s = s[:5] + str(i) + group.name[::-1].lower() + s[5:]
        group.description = s
    db.session.commit()


def add_group_work_point():
    group = Group(
        description = generate_datetime_id(),
        id = 0,
        name = "WORKPOINT",
        status = "start")
    
    db.session.add(group)
    db.session.commit()

def modify_task_material():
    # Bước 1: Lấy tất cả bản ghi Task
    tasks = db.session.query(Task).all()

    # Bước 2: Lấy tất cả materialId dưới dạng set
    material_ids = set()
    for task in tasks:
        if task.materials:
            for mat in task.materials:
                material_ids.add(mat.get("materialId"))

    # Chuyển set sang list để có thể lấy index
    material_ids_list = list(material_ids)

    # Bước 3: Gán lại materialId thành index tương ứng
    for task in tasks:
        if task.materials:
            for mat in task.materials:
                if mat.get("materialId") in material_ids_list:
                    mat["materialId"] = material_ids_list.index(mat["materialId"])
            
            flag_modified(task, "materials")

    # Cuối cùng, thay đổi trong db nếu cần:
    # session.commit() nếu muốn lưu thay đổi
    db.session.commit()
  

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        # update_users_with_accountId('user.json')
        
        # show_collections_and_schema()
        # change_value_type('role', ['id'], 'SERIAL')
        # change_value_type('group', ['id'], 'SERIAL')

        # create_customer_role()
        # change_value_type('group', ['rate'], 'VARCHAR(10)')
        # renameColumn('group',"updateAt", "updatedAt")

        # for table in ['message','group_member']:
        #     renameColumn(table, "createAt", "createdAt")
        #     renameColumn(table, "create_at", "createdAt")
        #     renameColumn(table, "created_at", "createdAt")
        #     renameColumn(table, "updateAt", "updatedAt")
        #     renameColumn(table, "update_at", "updatedAt")
        #     renameColumn(table, "updated_at", "updatedAt")
        #     renameColumn(table, "deleted_at", "deletedAt")
        #     renameColumn(table, "delete_at", "deletedAt")
        #     add_new_columns(table,['deletedAt'],'TIMESTAMP')
        #     add_new_columns(table,['version'],'INTEGER')

        # add_new_columns('task',['salary_type'],'VARCHAR(10)')
        # add_new_columns('task',['amount'],'INTEGER')
        # add_new_columns('user',['level_salary','version'],'INTEGER')
        # add_new_columns('user',['deletedAt'],'TIMESTAMP')
        # renameColumn('user', "createAt", "createdAt")
        # renameColumn('user', "updateAt", "updatedAt")
        # all_records = Task.query.all()
        # print(len(all_records))
        # for record in all_records:
        #     print(record)

        # create_table('customer')
        # renameColumn('user')

        # show_table()

        add_new_columns('group',['address'],'VARCHAR(255)')
        # delete_content()

        # transfer_data_to_postgres()
        # set_group_generate_token()


        
        # fix_invalid_foreign_keys()
        # change_foreign_key()


#         db.session.execute(text(
#         f'''
#         DELETE FROM "group" WHERE name LIKE 'Alice%';

# '''))

#         db.session.commit()
        # add_group_work_point()
        # renameColumn('group','rate','status')
        # create_table_workpoint()
        # erase_table(Workpoint)
        # modify_workpoint()
        # set_user_customer_foreign()
        # check_foreign_key()
        # delete_customer_user()
        # delete_null_task()

        # modify_task_material()
        # modify_material_id_type()