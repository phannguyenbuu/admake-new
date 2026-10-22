import sys
from app import app
from models import User
from flask import jsonify

ctx = app.app_context()
ctx.push()
u = User.query.get('202601300201242615046fa347')
import json
print(json.dumps(u.tdict()))
