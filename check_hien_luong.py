from app import app
from models import User, db
ctx = app.app_context()
ctx.push()
users = User.query.filter_by(fullName='PHAN TRỊNH HIỀN LƯƠNG').all()
for u in users:
    print(f'User: {u.fullName}, id: {u.id}, is_active: {u.is_active}')
