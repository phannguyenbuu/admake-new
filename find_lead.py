import sys
import os
sys.path.append('/root/admake/backend')
from models import app, db, User, LeadPayload

with app.app_context():
    users = User.query.filter(User.username.ilike('%205%')).all()
    print("USERS:", [(u.id, u.username, u.lead_id) for u in users])

    leads = LeadPayload.query.filter((LeadPayload.name.ilike('%205%')) | (LeadPayload.company.ilike('%205%'))).all()
    print("LEADS by 205:", [(l.id, l.name, l.company) for l in leads])

    # Also search lead by id if 205 is an ID
    l205 = db.session.get(LeadPayload, 205)
    if l205:
        print("LEAD ID 205:", (l205.id, l205.name, l205.company))
