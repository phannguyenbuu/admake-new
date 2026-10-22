from app import app
from models import User, db
ctx = app.app_context()
ctx.push()
u = db.session.get(User, '202601300201242615046fa347')
print(f'User: {u.fullName if u else None}, is_active: {u.is_active if u else None}, deletedAt: {u.deletedAt if u else None}')
