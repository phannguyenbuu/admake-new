import sys
sys.path.append('/root/admake/backend')
from models import app, db

with app.app_context():
    print("Adding item_status column to inventory_items table...")
    db.session.execute(db.text("ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS item_status VARCHAR(50) DEFAULT 'dang_dung';"))
    db.session.commit()
    print("SUCCESS: Added item_status column to inventory_items table!")
