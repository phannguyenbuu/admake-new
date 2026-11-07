"""Private Admake-hosted generation console and remote desktop authorization."""
from flask import Blueprint, abort, current_app, jsonify, make_response, render_template, request, Response
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
import requests
import hmac
import time
import threading
import hashlib
import os
from types import SimpleNamespace
from pathlib import Path
from models import User, db
from permission_utils import require_authenticated_user

genai_admin_bp = Blueprint('genai_admin', __name__, url_prefix='/lead-manage/genai')
COOKIE = 'admake_genai_admin'
_attempts = {}
_attempt_lock = threading.Lock()

def signer():
    return URLSafeTimedSerializer(Path('/etc/admake-genai-session.key').read_text().strip(), salt='admake-genai-console-v1')

def public_origin():
    # Nginx terminates TLS and overwrites X-Forwarded-Proto before Flask.
    scheme = request.headers.get('X-Forwarded-Proto', request.scheme)
    if scheme not in ('http', 'https'):
        abort(400)
    return f'{scheme}://{request.host}'

def allowed(user):
    return user and user.is_active is not False and user.role_id == -2 and user.lead_id == 243

def cookie_actor():
    try:
        uid = signer().loads(request.cookies.get(COOKIE, ''), max_age=28800)
        if isinstance(uid, dict) and uid.get('scope') == 'console-operator':
            return SimpleNamespace(id='console-operator')
        signer().loads(request.cookies.get(COOKIE, ''), max_age=3600)
        actor = db.session.get(User, str(uid))
    except (BadSignature, SignatureExpired):
        abort(401)
    if not allowed(actor): abort(403)
    return actor

@genai_admin_bp.get('/')
def shell():
    return render_template('genai_console.html')

@genai_admin_bp.post('/access')
def private_access():
    """Redeem a short-lived single-use operator link; no ERP access is granted."""
    token = (request.get_json(silent=True) or {}).get('ticket', '')
    if not isinstance(token, str) or len(token) > 2000: abort(401)
    try:
        payload = signer().loads(token, max_age=600)
    except (BadSignature, SignatureExpired):
        abort(401)
    if not isinstance(payload, dict) or payload.get('scope') != 'console-access': abort(401)
    digest = hashlib.sha256(token.encode()).hexdigest()
    ticket = Path('/var/lib/admake-genai/operator-tickets') / digest
    try:
        # Atomic consume prevents two browsers from redeeming the same link.
        os.rename(ticket, ticket.with_suffix('.used'))
    except OSError:
        abort(401)
    response = make_response(jsonify(ok=True))
    response.set_cookie(COOKIE, signer().dumps({'scope': 'console-operator'}), max_age=28800,
                        secure=True, httponly=True, samesite='Strict', path='/')
    response.headers['Cache-Control'] = 'no-store'
    return response

@genai_admin_bp.post('/session')
def session():
    if request.headers.get('Origin') != public_origin():
        abort(403)
    response = make_response(jsonify(ok=True))
    response.set_cookie(COOKIE, signer().dumps({'scope': 'console-operator'}), max_age=28800,
                        secure=True, httponly=True, samesite='Strict', path='/')
    response.headers['Cache-Control'] = 'no-store'
    return response

@genai_admin_bp.get('/auth')
def auth():
    cookie_actor()
    return '', 204

@genai_admin_bp.get('/access-status')
def access_status():
    from werkzeug.exceptions import HTTPException
    try:
        cookie_actor()
        connected = True
    except HTTPException:
        connected = False
    response = jsonify(connected=connected)
    response.headers['Cache-Control'] = 'no-store'
    return response

@genai_admin_bp.get('/api-auth')
def api_auth():
    """Service clients use a private server-side key, never the desktop cookie."""
    provided = request.headers.get('Authorization', '').removeprefix('Bearer ')
    try:
        expected = Path('/etc/admake-genai-api.key').read_text().strip()
    except OSError:
        abort(503)
    if not provided or not hmac.compare_digest(provided, expected): abort(401)
    return '', 204

@genai_admin_bp.route('/api/<path:path>', methods=['GET', 'POST'])
def proxy(path):
    cookie_actor()
    if request.method == 'POST' and request.headers.get('Origin') != public_origin():
        abort(403)
    allowed_get = path in ('status', 'workers', 'jobs', 'gallery', 'extension/tabs', 'extension/tab-results') or path.startswith('jobs/')
    allowed_post = path in ('jobs/create', 'jobs/edit-full', 'jobs/edit-inpaint', 'chatgpt/new_chat', 'workers/toggle_active')
    if not (allowed_get if request.method == 'GET' else allowed_post): abort(404)
    try:
        upstream = requests.request(request.method, 'http://127.0.0.1:6002/api/' + path,
            params=request.args, json=request.get_json(silent=True) if request.method == 'POST' else None, timeout=30)
    except requests.RequestException:
        return jsonify(error='Không kết nối được dịch vụ tạo ảnh Admake'), 502
    response = Response(upstream.content, status=upstream.status_code, content_type='application/json')
    response.headers['Cache-Control'] = 'no-store'
    return response
