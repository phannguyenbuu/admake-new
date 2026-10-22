import sys
sys.path.append('/root/admake/backend')
from models import app
from api.inventory import sync_ad205_materials_to_all_leads

with app.app_context():
    count = sync_ad205_materials_to_all_leads()
    print(f"SUCCESS: Synced {count} materials from ad205 across all leads!")
