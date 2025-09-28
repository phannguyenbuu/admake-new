import json
from models import db, app, User, Customer, Material, parse_date, Role, Task, Workspace
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

from sqlalchemy import create_engine, inspect

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
        pg_conn.execute(text("""
            ALTER TABLE "user"
            ALTER COLUMN id TYPE VARCHAR USING id::text,
            ALTER COLUMN "accountId" TYPE VARCHAR(80) USING "accountId"::text;
        """))
        
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
            row_dict = dict(row._mapping)
            print(row_dict['id'])

            insert_values.append({
                'id': row_dict['id'],
                'accountId': row_dict.get('accountId'),
                'balanceAmount': row_dict.get('balanceAmount'),
                'icon': row_dict.get('icon'),
                'companyName': row_dict.get('companyName'),
                'localeCode': row_dict.get('localeCode'),
                'languageCode': row_dict.get('languageCode'),
                'socialInfor': Json(row_dict.get('socialInfor')) if row_dict.get('socialInfor') else None,
                'orderWebhook': row_dict.get('orderWebhook'),
                'cryptoAddressList': Json(row_dict.get('cryptoAddressList')) if row_dict.get('cryptoAddressList') else None,
                'selectedProvider': Json(row_dict.get('selectedProvider')) if row_dict.get('selectedProvider') else None,
                'selectedServices': Json(row_dict.get('selectedServices')) if row_dict.get('selectedServices') else None,
                'createdAt': row_dict.get('createdAt') or datetime.datetime.utcnow(),
                'updatedAt': row_dict.get('updatedAt') or datetime.datetime.utcnow(),
                'role': row_dict.get('role') or 'user',
                'is_authenticated': row_dict.get('is_authenticated', False),
                'is_active': row_dict.get('is_active', False),
                'is_anonymous': row_dict.get('is_anonymous', False),
                'firstName': row_dict.get('firstName'),
                'lastName': row_dict.get('lastName'),
                'username': row_dict.get('username'),
            })

        # Thực hiện insert batch vào Postgres
        pg_conn.execute(insert(users_pg), insert_values)
        print(f"Inserted {len(insert_values)} records into PostgreSQL user table")



def transfer_material_to_postgres():
    # Kết nối SQLite
    sqlite_engine = create_engine('sqlite:///instance/customers.db')
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


def alter_column_id_type():
    

    sql = text('ALTER TABLE "user" ALTER COLUMN id TYPE VARCHAR(24) USING id::VARCHAR(24);')
    with app.app_context():
        db.session.execute(sql)
        db.session.commit()
    print("Đã thay đổi kiểu cột id thành VARCHAR(24)")




def add_new_columns():

    # db.session.execute(text('ALTER TABLE "user" ADD COLUMN status VARCHAR(50);'))
    # db.session.execute(text('ALTER TABLE "user" ADD COLUMN role_id VARCHAR(24);'))
    # db.session.execute(text('ALTER TABLE "user" ADD COLUMN type VARCHAR(50);'))
    # db.session.execute(text('ALTER TABLE "user" ADD COLUMN hashKey VARCHAR(255);'))
    # db.session.execute(text('ALTER TABLE "user" ADD COLUMN fullName VARCHAR(255);'))
    # db.session.execute(text('ALTER TABLE "user" ADD COLUMN version INTEGER;'))
    # db.session.execute(text('ALTER TABLE "user" ADD COLUMN phone VARCHAR(20);'))
    # db.session.execute(text('ALTER TABLE "user" ADD COLUMN avatar VARCHAR(255);'))
    # db.session.execute(text('ALTER TABLE "user" ADD COLUMN deletedAt TIMESTAMP;'))
    # deletedAt = db.Column(db.DateTime, nullable=True)

    # db.session.execute(text('ALTER TABLE "role" RENAME COLUMN "createdAt" TO "createdAt";'))
    # db.session.execute(text('ALTER TABLE "role" RENAME COLUMN "updatedAt" TO "updatedAt";'))

    db.session.execute(text('UPDATE "user" SET "fullName" = concat("firstName", \' \', "lastName");'))
    
    db.session.commit()
    print("Đã thêm các cột mới vào bảng role")




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


def change_value_type(table, keys):
    for key in keys:
        db.session.execute(text(f'ALTER TABLE "{table}" ALTER COLUMN "{key}" TYPE VARCHAR(50);'))
    db.session.commit()

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

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        # update_users_with_accountId('user.json')
        # transfer_material_to_postgres()
        # transfer_workspace_to_postgres()
        transfer_task_to_postgres()
        # show_collections_and_schema()
        # change_value_type()

    
        # change_value_type('task', ['id','workspace_id','customer_id','create_by_id'])
        # renameColumn('task')

        # for table in [ 'task']:
        #     renameColumn(table, "createAt", "createdAt")
        #     renameColumn(table, "create_at", "createdAt")
        #     renameColumn(table, "created_at", "createdAt")
        #     renameColumn(table, "updateAt", "updatedAt")
        #     renameColumn(table, "update_at", "updatedAt")
        #     renameColumn(table, "updated_at", "updatedAt")
        #     renameColumn(table, "deleted_at", "deletedAt")
        #     renameColumn(table, "delete_at", "deletedAt")

        all_records = Task.query.all()
        print(len(all_records))
        for record in all_records:
            print(record)
        
        