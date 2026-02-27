python3 - <<'PY'
from pathlib import Path
p = Path('/root/admake/backend/app.py')
t = p.read_text(encoding='utf-8')
if 'from flask_cors import CORS' not in t:
    t = t.replace('from dotenv import load_dotenv\n', 'from dotenv import load_dotenv\nfrom flask_cors import CORS\n')
if 'CORS(' not in t:
    block = '''\nCORS(\n    app,\n    resources={r"/api/*": {\n        "origins": [\n            "https://quanly.admake.vn",\n            "https://admake.vn",\n            "http://localhost:5173",\n            "http://localhost:3000",\n        ]\n    }},\n    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],\n    allow_headers=["Content-Type", "Authorization"],\n)\n'''
    t = t.replace('from api.chat import socketio\n', 'from api.chat import socketio\n' + block + '\n')
p.write_text(t, encoding='utf-8')
print('patched app.py')
PY
pm2 restart admake-api
sleep 2
pm2 describe admake-api
curl -i -X OPTIONS 'https://admake.vn/api/workpoint/page?lead=0&page=1&limit=10&search=&month=2026-02' -H 'Origin: https://quanly.admake.vn' -H 'Access-Control-Request-Method: GET' | head -n 20
