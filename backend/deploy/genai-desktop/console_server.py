"""Private desktop gateway; login credentials are entered only in remote Chrome."""
from pathlib import Path
import hmac
import threading
import time
import os
import subprocess
import requests
from flask import Flask, abort, jsonify, request, Response, send_file
from itsdangerous import URLSafeTimedSerializer, BadSignature

app = Flask(__name__)
state = Path('/var/lib/genai-desktop')
cookie = 'genai_desktop_session'
attempts = {}
lock = threading.Lock()

def signer():
    return URLSafeTimedSerializer((state / 'session.key').read_text().strip(), salt='genai-desktop-v1')

def authenticated():
    try:
        return signer().loads(request.cookies.get(cookie, ''), max_age=28800) == 'desktop-operator'
    except BadSignature:
        return False

def check_origin():
    scheme = request.headers.get('X-Forwarded-Proto', request.scheme)
    if scheme not in ('https', 'http') or request.headers.get('Origin') != f'{scheme}://{request.host}':
        abort(403)

@app.after_request
def no_cache(response):
    response.headers['Cache-Control'] = 'no-store'
    return response

@app.get('/vps-console/')
def shell():
    return send_file('/opt/genai-desktop/console.html')

@app.get('/vps-console/access-status')
def access_status():
    return jsonify(connected=authenticated())

@app.get('/vps-console/auth')
def auth():
    if not authenticated():
        abort(401)
    return '', 204

@app.post('/vps-console/session')
def session():
    check_origin()
    ip = request.headers.get('X-Real-IP', request.remote_addr)
    with lock:
        now = time.monotonic()
        for key in list(attempts):
            if now - attempts[key][0] > 300:
                del attempts[key]
        start, count = attempts.get(ip, (now, 0))
        if count >= 5:
            abort(429)
        attempts[ip] = (start, count + 1)
    value = (request.get_json(silent=True) or {}).get('connection_code')
    expected = (state / 'connect.key').read_text().strip()
    if not isinstance(value, str) or not hmac.compare_digest(value.strip().encode(), expected.encode()):
        abort(401)
    response = jsonify(ok=True)
    response.set_cookie(cookie, signer().dumps('desktop-operator'), max_age=28800,
                        secure=True, httponly=True, samesite='Strict', path='/')
    return response

def desktop_command(*args):
    return subprocess.run(args, env={**os.environ, 'DISPLAY': ':12'},
                          capture_output=True, text=True, timeout=8, check=True).stdout

def chrome_windows():
    windows = []
    for line in desktop_command('wmctrl', '-lx').splitlines():
        fields = line.split(None, 4)
        if len(fields) >= 4 and any(name in fields[2].lower() for name in ('chrome', 'chromium')):
            windows.append(fields[0])
    return windows

@app.post('/vps-console/windows/<action>')
def control_windows(action):
    if not authenticated():
        abort(401)
    check_origin()
    if action not in ('maximize-all', 'switch'):
        abort(404)
    try:
        windows = chrome_windows()
        if not windows:
            return jsonify(error='Chưa có cửa sổ Chrome trên VPS.'), 409
        if action == 'maximize-all':
            for window in windows:
                desktop_command('wmctrl', '-ir', window, '-b', 'remove,hidden,shaded')
                desktop_command('wmctrl', '-ia', window)
                desktop_command('wmctrl', '-ir', window, '-b', 'add,maximized_vert,maximized_horz')
        else:
            active = desktop_command('xprop', '-root', '_NET_ACTIVE_WINDOW').split()[-1]
            active_index = next((i for i, window in enumerate(windows)
                                 if int(window, 16) == int(active, 16)), -1)
            desktop_command('wmctrl', '-ia', windows[(active_index + 1) % len(windows)])
        return jsonify(ok=True, count=len(windows))
    except (subprocess.SubprocessError, OSError, ValueError):
        return jsonify(error='Chưa điều khiển được cửa sổ VPS. Vui lòng thử lại.'), 503

@app.route('/vps-console/api/<path:path>', methods=['GET', 'POST'])
def proxy(path):
    if not authenticated():
        abort(401)
    if request.method == 'POST':
        check_origin()
        allowed = path in ('jobs/create', 'jobs/edit-full', 'jobs/edit-inpaint',
                           'chatgpt/new_chat', 'workers/toggle_active')
    else:
        allowed = path in ('status', 'workers', 'jobs', 'gallery') or path.startswith('jobs/')
    if not allowed or '..' in path:
        abort(404)
    try:
        result = requests.request(request.method, 'http://127.0.0.1:5000/api/' + path,
                                  params=request.args,
                                  json=request.get_json(silent=True) if request.method == 'POST' else None,
                                  timeout=30)
    except requests.RequestException:
        return jsonify(error='Không kết nối được dịch vụ xử lý'), 502
    return Response(result.content, status=result.status_code, content_type='application/json')

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=6083, threaded=True)
