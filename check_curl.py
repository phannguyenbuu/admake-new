import requests
from app import app
from models import User
res = requests.get('http://127.0.0.1:6000/api/users/?page=1&limit=100', headers={'Authorization': 'test'}) # Wait, I don't have token.
