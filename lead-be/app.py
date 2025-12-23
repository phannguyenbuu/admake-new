from flask import Flask, request, jsonify, abort
from flask_sqlalchemy import SQLAlchemy
import json
import datetime
import os
import sys
from models import app, db, LeadPayload, User
from dotenv import load_dotenv
from sqlalchemy.orm import aliased
from sqlalchemy import not_, exists, func, cast, Integer
from flask import render_template


@app.route('/admin/leads/')
def admin_leads():
    page = request.args.get('page', 1, type=int)
    per_page = 50  
    
    users = User.query.filter(
        User.role_id == -2,
        User.fullName.isnot(None),
        User.fullName != '',
        ~User.fullName.startswith('Lead')
    ).order_by(
        func.coalesce(
            cast(
                func.nullif(
                    func.regexp_replace(
                        func.substring(User.username, 2), 
                        r'[^0-9]', '', 'g'
                    ), 
                    ''
                ), 
                Integer
            ), 
            0
        )
    ).all()

    print('Users', len(users))

    pagination = LeadPayload.query.order_by(LeadPayload.id).paginate(page=page, per_page=per_page, error_out=False)

    leads_data = []
    for lead in pagination.items:
        lead_dict = lead.tdict()
        # ✅ FIX: dùng user_id thay vì userid
        lead_dict['user_id_str'] = str(lead.user_id) if lead.user_id else None
        leads_data.append(lead_dict)

    total_pages = pagination.pages

    return render_template('admin_leads.html',
                          total_users=len(users),
                          users=[{'fullName':'None','id':u.id, 'username':u.username, 'password':u.password} for u in users],
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

