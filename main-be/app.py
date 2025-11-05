from flask import Flask, request, jsonify, abort
from flask_sqlalchemy import SQLAlchemy
import json
import datetime
import os
import sys
from models import app, db
from dotenv import load_dotenv
import threading
import time
from paramiko import SSHClient, AutoAddPolicy
from scp import SCPClient

base_dir = os.path.abspath(os.path.dirname(__file__))
print(base_dir)
sys.path.append(base_dir)

def save_dump():
    # Kết nối SSH tới server Linux
    ssh = SSHClient()
    ssh.set_missing_host_key_policy(AutoAddPolicy())
    ssh.connect('148.230.100.33', username='root', password='@baoLong0511')

    now = datetime.datetime.now()
    timestamp = now.strftime("%y_%m_%d_%H_%M")

    remote_dump_path = f"/root/admake_chat_{timestamp}.dump"
    print("Dump file remote:", remote_dump_path)

    # Thực thi lệnh pg_dump trên server Linux
    pg_dump_cmd = f"pg_dump -U postgres -d admake_chat -F c -f {remote_dump_path}"
    stdin, stdout, stderr = ssh.exec_command(pg_dump_cmd)

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

from api.customers import customer_bp
from api.materials import material_bp
from api.users import user_bp
from api.roles import role_bp
from api.settings import setting_bp
from api.tasks import task_bp
from api.works import workspace_bp
from api.groups import group_bp
from api.messages import message_bp
from api.auth import auth_bp
from api.workpoints import workpoint_bp
from api.supplier import supplier_bp
from api.leave import leave_bp
from api.leads import lead_bp

app.register_blueprint(customer_bp)
app.register_blueprint(material_bp)
app.register_blueprint(user_bp)
app.register_blueprint(role_bp)
app.register_blueprint(setting_bp)
app.register_blueprint(task_bp)
app.register_blueprint(workspace_bp)
app.register_blueprint(group_bp)
app.register_blueprint(message_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(workpoint_bp)
app.register_blueprint(supplier_bp)
app.register_blueprint(leave_bp)
app.register_blueprint(lead_bp)

from api.chat import socketio

load_dotenv()  # load biến môi trường trong file .env vào process.env
# VITE_API_HOST = os.getenv("VITE_API_HOST")

if __name__ == "__main__":
    t = threading.Thread(target=periodic_save_dump, daemon=True)
    t.start()
    
    port = int(os.environ.get('PORT', 5000))  # Lấy biến môi trường PORT hoặc mặc định 5000
    socketio.run(app, host='0.0.0.0', debug=True, port=port, allow_unsafe_werkzeug=True)

