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
            
            access_token = create_access_token(identity={'user_id':user.id, 'lead_id': user.lead_id}, 
                                               expires_delta=datetime.timedelta(days=15))

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
    current_user_id = get_jwt_identity()
    app.logger.debug(f"JWT identity extracted: {current_user_id}")

    user = User.query.get(current_user_id)
    if not user:
        app.logger.warning(f"User {current_user_id} not found in database.")
        return jsonify({'error': 'User not found'}), 404

    app.logger.info(f"User found: {user.username} (ID: {user.id})")
    return jsonify({
        'userId': user.id,
        'username': user.username,
        'role_id': user.role_id,
        "role": user.update_role(),
        'icon': user.icon,
        'lead_id': user.lead_id
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
