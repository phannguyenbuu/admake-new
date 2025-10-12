from flask import Flask, request, jsonify, abort
from flask_sqlalchemy import SQLAlchemy
import json
import datetime
import os
import sys
from models import app, db
from dotenv import load_dotenv

base_dir = os.path.abspath(os.path.dirname(__file__))
print(base_dir)
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
app.register_blueprint(lead_bp)

from api.chat import socketio

load_dotenv()  # load biến môi trường trong file .env vào process.env
# VITE_API_HOST = os.getenv("VITE_API_HOST")

if __name__ == "__main__":
    # with app.app_context():
        # customers = Customer.query.all()
        # load_customers()

    # app.run(host="0.0.0.0", port=5273, debug=True)
    socketio.run(app, host='0.0.0.0', port=5007, debug=True, allow_unsafe_werkzeug=True)

