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
    page = request.args.get('page', 1, type=int)  # Lấy số trang từ query param, mặc định 1
    per_page = 50  # Số bản ghi trên mỗi trang

    # Dùng paginate của SQLAlchemy để lấy đúng trang
    pagination = LeadPayload.query.order_by(LeadPayload.id).paginate(page=page, per_page=per_page, error_out=False)

    leads_data = [lead.tdict() for lead in pagination.items]  # Chỉ lấy bản ghi trong trang

    total_pages = pagination.pages  # Tổng số trang

    return render_template('admin_leads.html',
                           leads=leads_data,
                           page=page,
                           total_pages=total_pages)

base_dir = os.path.abspath(os.path.dirname(__file__))
# print(base_dir)
sys.path.append(base_dir)

load_dotenv()  # load biến môi trường trong file .env vào process.env
# VITE_API_HOST = os.getenv("VITE_API_HOST")

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))  # Lấy biến môi trường PORT hoặc mặc định 5000
    app.run(host='0.0.0.0', port=port, debug=True)

