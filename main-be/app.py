from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import json
import datetime
import os
from models import app, db, Customer
from dotenv import load_dotenv
from flask_cors import CORS

def dateStr(tm):
    return datetime.datetime.strptime(tm, '%Y-%m-%d').date() if tm else None

load_dotenv()  # load biến môi trường trong file .env vào process.env
VITE_API_HOST = os.getenv("VITE_API_HOST")

@app.route("/customers")
def all_customers():
    customers = Customer.query.all()
    # Giả sử model có phương thức to_dict() để trả về dict
    result = [customer.to_dict() for customer in customers]
    return jsonify(result)

@app.route("/customer")
def get_customers():
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)
    search = request.args.get("search", "", type=str)

    query = Customer.query

    if search:
        query = query.filter(Customer.full_name.ilike(f"%{search}%"))  # ví dụ filter theo tên

    pagination = query.paginate(page=page, per_page=limit, error_out=False)

    customers = [c.to_dict() for c in pagination.items]

    return jsonify({
        "data": customers,
        "pagination": {
            "count": pagination.total,
            "page": page,
            "per_page": limit,
            "pages": pagination.pages,
        }
    })


customers = []
next_id = 1  # giả lập id tự tăng

@app.route('/customer', methods=['POST'])
def create_customer():
    data = request.get_json()

    print('POST', data)
    
    # Tạo đối tượng Customer mới từ dữ liệu nhận được
    new_customer = Customer(
        fullName=data.get('fullName'),
        phone=data.get('phone'),
        workInfo=data.get('workInfo'),
        workAddress=data.get('workAddress'),
        workPrice=data.get('workPrice'),
        status=data.get('status'),
        workStart=dateStr(data.get('workStart')),
        workEnd=dateStr(data.get('workEnd'))
    )
    
    # Thêm vào session và commit để lưu vào db
    db.session.add(new_customer)
    db.session.commit()
    
    # Trả về đối tượng vừa tạo dưới dạng JSON (cần định nghĩa to_dict() trong model)
    return jsonify(new_customer.to_dict()), 201


@app.route('/customer/<int:id>', methods=['PUT'])
def update_customer(id):
    data = request.get_json()

    print('PUT', data)

    # Tìm customer theo id trong database
    customer = Customer.query.get(id)
    if not customer:
        return jsonify({"error": "Customer not found"}), 404

    # Cập nhật các trường dựa trên dữ liệu truyền vào
    for key, value in data.items():
        if hasattr(customer, key):
            setattr(customer, key, value)

    # Lưu thay đổi vào database
    db.session.commit()

    # Trả về bản ghi đã cập nhật
    return jsonify(customer.to_dict()), 200


if __name__ == "__main__":
    with app.app_context():
        customers = Customer.query.all()
        # load_customers()

    app.run(host="0.0.0.0", port=5006, debug=True)
