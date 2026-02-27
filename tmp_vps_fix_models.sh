python3 - <<'PY'
from pathlib import Path
p = Path('/root/admake/backend/models.py')
t = p.read_text(encoding='utf-8')
old = '''def get_query_page_users(lead_id, page, limit, search, role_id = 0):
    if lead_id == 0:
        return [], empty_pagination
    
    lead = db.session.get(LeadPayload, lead_id)
    if not lead:
        Pagination = namedtuple('Pagination', ['total', 'pages'])
        empty_pagination = Pagination(total=0, pages=0)
        return [], empty_pagination
'''
new = '''def get_query_page_users(lead_id, page, limit, search, role_id = 0):
    Pagination = namedtuple('Pagination', ['total', 'pages'])
    empty_pagination = Pagination(total=0, pages=0)

    if lead_id == 0:
        return [], empty_pagination

    lead = db.session.get(LeadPayload, lead_id)
    if not lead:
        return [], empty_pagination
'''
if old in t:
    t = t.replace(old, new)
    p.write_text(t, encoding='utf-8')
    print('patched models.py')
else:
    print('pattern not found; skip')
PY
pm2 restart admake-api
sleep 2
curl -i 'https://admake.vn/api/workpoint/page?lead=0&page=1&limit=10&search=&month=2026-02' -H 'Origin: https://quanly.admake.vn' | head -n 25