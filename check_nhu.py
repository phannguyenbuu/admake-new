from app import app
from models import User, db
ctx = app.app_context()
ctx.push()
u = User.query.filter_by(username='ad205_1').first()
print(f'User: {u.fullName if u else None}, id: {u.id if u else None}, is_active: {u.is_active if u else None}')
