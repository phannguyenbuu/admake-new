from flask import Flask, request, jsonify, abort
from flask_sqlalchemy import SQLAlchemy
import json
import datetime
import os
import sys
from models import app, db, periodic_save_dump, User
from api.auth import login_user_form
from flask import render_template, request, redirect, url_for
from dotenv import load_dotenv
import threading



base_dir = os.path.abspath(os.path.dirname(__file__))
# print(base_dir)
sys.path.append(base_dir)


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
from api.lead_manage import lead_manage_bp
from api.fureal import fureal_bp
from api.notifys import notify_bp

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
app.register_blueprint(lead_manage_bp)
app.register_blueprint(fureal_bp)
app.register_blueprint(notify_bp)

from api.chat import socketio

@app.route('/login', methods=['GET'])
def login_page():
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login_submit():
    username = request.form.get('username')
    password = request.form.get('password')

    # Tương tự check user và password ở auth.py
    print(f"Login infor: {username}-{password}")

    if username and password:
        return login_user_form(username, password)
    else:
        print(f"Not found user {username}-{password}")
        return render_template('login.html', error="Sai thông tin đăng nhập")

load_dotenv()  # load biến môi trường trong file .env vào process.env
# VITE_API_HOST = os.getenv("VITE_API_HOST")

if __name__ == "__main__":
    t = threading.Thread(target=periodic_save_dump, daemon=True)
    t.start()

    port = int(os.environ.get('PORT', 6000))  # Lấy biến môi trường PORT hoặc mặc định 5000
    socketio.run(app, host='0.0.0.0', debug=True, port=port, allow_unsafe_werkzeug=True)

