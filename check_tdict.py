from app import app
from models import User, db
ctx = app.app_context()
ctx.push()
u = User.query.get('202601300201242615046fa347')
print(f'User tdict: {u.tdict() if u else None}')
