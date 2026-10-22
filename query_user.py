from app import app
from models import User, LeadPayload
ctx = app.app_context()
ctx.push()
users = User.query.filter(User.fullName.ilike('%như%')).all()
for u in users:
    lead = LeadPayload.query.get(u.lead_id) if u.lead_id else None
    company = lead.company if lead else 'None'
    name = lead.name if lead else 'None'
    print(f'Lead ID: {u.lead_id}, Company: {company}, Name: {name}, Fullname: {u.fullName}, Username: {u.username}, Pass: {u.password}, Active: {u.is_active}')
