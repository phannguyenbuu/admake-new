from flask import Blueprint, request, jsonify, abort
from models import db, User, dateStr, app
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
import datetime

user_bp = Blueprint('user', __name__, url_prefix='/api/user')

@user_bp.route("/", methods=["GET"])
def get_users():
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)
    search = request.args.get("search", "", type=str)

    query = User.query.filter(User.role_id != "CUSTOMER")

    if search:
        query = query.filter(
            (User.username.ilike(f"%{search}%")) | 
            (User.fullName.ilike(f"%{search}%"))
        )


    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    users = [c.to_dict() for c in pagination.items]

    return jsonify({
        "data": users,
        "total": pagination.total,
        "pagination": {
            "total": pagination.total,
            "page": page,
            "per_page": limit,
            "pages": pagination.pages,
        }
    })

@user_bp.route("/", methods=["POST"])
def create_user():
    data = request.get_json()
    print('USER', data)
    new_user = User.parse(data)
        
    db.session.add(new_user)
    db.session.commit()
    return jsonify(new_user.to_dict()), 201

@user_bp.route("/<string:id>", methods=["GET"])
def get_user_detail(id):
    user = db.session.get(User, id)
    if not user:
        abort(404, description="user not found")
    return jsonify(user.to_dict())

@user_bp.route("/<string:id>", methods=["PUT"])
def update_user(id):
    data = request.get_json()
    print(data)
    user = db.session.get(User, id)
    if not user:
        return jsonify({"error": "user not found"}), 404
    for key, value in data.items():
        if key == 'role':
            setattr(user, 'role_id', value)
        elif hasattr(user, key):
            if key in ['workStart', 'workEnd'] and isinstance(value, str):
                value = dateStr(value)

            setattr(user, key, value)
        
    db.session.commit()
    return jsonify(user.to_dict()), 

login_manager = LoginManager()
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.filter_by(accountId=user_id).first()

@user_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if user:
        print('Login:',username,password, user.password)
        # if user and check_password_hash(user.password, password):
        if user.password.startswith(password):
            print('Start login')
            login_user(user)  # tạo session cho user
            print("User:Checked", {"userId": user.accountId, "username": user.username, 
                                   "role": user.role, "icon": user.icon})
            return jsonify({"userId": user.accountId, "username": user.username, "role": user.role})
        return jsonify({"error": "Invalid credentials"}), 401
    else:
        print("Cannot find username", username)
        return jsonify({'status': 'fail', 'message': 'Invalid credentials'}), 401

@user_bp.route('/api/auth/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully"})

@user_bp.route('/api/auth/status')
def auth_status():
    if current_user.is_authenticated:
        return jsonify({"userId": current_user.accountId, "username": current_user.username})
    return jsonify({"userId": None}), 401

@user_bp.route('/api/current_user')
def get_current_user():
    if current_user.is_authenticated:
        return {
            "user_id": current_user.accountId,
            "username": current_user.username,
            "email": current_user.email
        }
    else:
        return {"user_id": None}, 401


