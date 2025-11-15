from flask import Flask, request, jsonify, abort
from flask_sqlalchemy import SQLAlchemy
import json
import datetime
import os
import sys
from models import app, db, LeadPayload
from dotenv import load_dotenv

from flask import render_template

@app.route('/admin/leads/')
def admin_leads():
    leads = LeadPayload.query.order_by(LeadPayload.id).all()
  # Lấy toàn bộ lead từ db
    leads_data = [lead.tdict() for lead in leads]  # Chuyển đối tượng thành dict để render dễ dàng
    return render_template('admin_leads.html', leads=leads_data)

base_dir = os.path.abspath(os.path.dirname(__file__))
print(base_dir)
sys.path.append(base_dir)

load_dotenv()  # load biến môi trường trong file .env vào process.env
# VITE_API_HOST = os.getenv("VITE_API_HOST")

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))  # Lấy biến môi trường PORT hoặc mặc định 5000
    app.run(host='0.0.0.0', port=port, debug=True)

