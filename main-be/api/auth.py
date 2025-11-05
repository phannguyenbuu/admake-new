from flask import Blueprint, request, jsonify, abort
from models import db, User, dateStr, app
from flask import Flask, request, jsonify, session
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
import datetime
from sqlalchemy import desc
from flask import Flask, jsonify, request
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity
)


from models import User, jwt

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

login_manager = LoginManager()
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.filter_by(id=user_id).first()

@auth_bp.route('/login', methods=['POST'])
def login():
    check_admake_database_exists()

    data = request.get_json()
    print(data)
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if user:
        print('Login:', username, password, user.lead_id) 
        # if user and check_password_hash(user.password, password):
        if user.password == password:
            print('Start login')
            login_user(user)  # tạo session cho user
            session.permanent = True

            additional_claims = {"lead_id": user.lead_id}
            access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims, expires_delta=datetime.timedelta(days=15))

            
            # access_token = create_access_token(identity={'user_id':user.id, 'lead_id': user.lead_id}, 
            #                                    expires_delta=datetime.timedelta(days=15))

            result = {
                    'access_token': access_token,
                    "id": user.id, 
                    "username": user.username, 
                    "role_id": user.role_id,
                    "role": user.update_role(),
                    "lead_id": user.lead_id
                }
            
            print('JWT', result)
            return jsonify(result), 200
        
        return jsonify({"error": "Invalid credentials no user"}), 401
    else:
        print("Cannot find username", username)
        return jsonify({'status': 'fail', 'message': 'Invalid credentials wrong password'}), 401

@auth_bp.route('/logout', methods=['POST'])
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully"})

@auth_bp.route('/status')
def auth_status():
    if current_user.is_authenticated:
        return jsonify({"userId": current_user.id, "username": current_user.username})
    return jsonify({"userId": None}), 401

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    from flask_jwt_extended import get_jwt
    current_user_id = get_jwt_identity()

    print(f"JWT identity extracted: {current_user_id}")

    user = User.query.get(current_user_id)
    if not user:
        print(f"User {current_user_id} not found in database.")
        return jsonify({'error': 'User not found'}), 404

    claims = get_jwt()  # trả về dictionary các claims trong token
    lead_id = claims.get('lead_id')

    print(f"User found: {user.username} (ID: {user.id}) - Lead: {lead_id} - Role: {user.role_id} - role: {user.update_role()}")
    return jsonify({
        'userId': user.id,
        'username': user.username,
        'role_id': user.role_id,
        "role": user.update_role(),
        'icon': user.icon,
        'lead_id': lead_id
    })


@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    app.logger.warning(f"Expired token: {jwt_payload}")
    return jsonify({"message": "Token has expired"}), 401


@jwt.invalid_token_loader
def invalid_token_callback(error):
    app.logger.warning(f"Invalid token error: {error}")
    return jsonify({"message": "Invalid token"}), 401


@jwt.unauthorized_loader
def missing_token_callback(error):
    app.logger.warning(f"Missing token error: {error}")
    return jsonify({"message": "Request missing token"}), 401
























from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from dotenv import load_dotenv
from urllib.parse import urlparse
import os
import subprocess


def create_admake_chat_database(db_name="admake_chat", db_user="postgres"):
    try:
        # Dùng lệnh createdb của postgresql
        subprocess.run(
            ["createdb", "-U", db_user, db_name],
            check=True
            # env=env
        )
        print(f"Database '{db_name}' đã được tạo thành công.")
    except subprocess.CalledProcessError as e:
        print(f"Lỗi khi tạo database '{db_name}': {e}")

# Gọi hàm tạo db


def restore_database_from_latest_dump(db_name="admake_chat", db_user="postgres", dump_dir="/root/backup"):
    create_admake_chat_database()

    # Lấy danh sách file .dump trong thư mục
    dump_files = [f for f in os.listdir(dump_dir) if f.endswith(".dump")]
    if not dump_files:
        print("Không tìm thấy file dump nào trong thư mục", dump_dir)
        return False
    
    # Lấy file mới nhất dựa vào thời gian sửa đổi
    latest_dump = max(dump_files, key=lambda f: os.path.getmtime(os.path.join(dump_dir, f)))
    latest_dump_path = os.path.join(dump_dir, latest_dump)
    print("File dump mới nhất:", latest_dump_path)

    # Câu lệnh restore pg_restore
    cmd = [
        "pg_restore",
        "--clean",
        "--if-exists",
        f"--dbname={db_name}",
        "-U", db_user,
        latest_dump_path,
    ]

    # env = os.environ.copy()
    # env['PGPASSWORD'] = 'myPass'

    try:
        # Chạy lệnh restore, cần user có quyền hoặc thực thi dưới user postgres
        subprocess.run(cmd, check=True)
        print(f"Restore database '{db_name}' từ file {latest_dump} thành công.")
        return True
    except subprocess.CalledProcessError as e:
        print("Lỗi khi restore database:", e)
        return False



def check_admake_database_exists():
    load_dotenv()

    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("Cảnh báo: Biến môi trường DATABASE_URL chưa được thiết lập!")
        return False

    # Phân tích URL để lấy database default (postgres) để connect
    parsed_url = urlparse(database_url)
    # Thay database trong URL thành 'postgres' để connect kiểm tra
    db_default_url = database_url.replace(parsed_url.path, "/postgres", 1)

    # Lấy tên database muốn kiểm tra từ URL gốc
    db_name = parsed_url.path.lstrip("/")

    print("URL kết nối kiểm tra:", db_default_url)
    # engine = create_engine(db_default_url)


    engine = create_engine(db_default_url)
    try:
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :dbname"), {"dbname": db_name}
            )
            exists = result.scalar() is not None
            if not exists:
                print(f"Cảnh báo: Database '{db_name}' không tồn tại. Đang restore từ file dump")
                restore_database_from_latest_dump()
            return exists
    except OperationalError as e:
        print(f"Lỗi kết nối tới server: {e}")
        return False
    
