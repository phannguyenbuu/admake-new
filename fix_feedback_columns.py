import sys
sys.path.append('/root/admake/backend')
from models import app, db

with app.app_context():
    print("Checking and adding missing columns to feedback table...")
    db.session.execute(db.text('ALTER TABLE feedback ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP NULL;'))
    db.session.execute(db.text('ALTER TABLE feedback ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NULL;'))
    db.session.execute(db.text('ALTER TABLE feedback ADD COLUMN IF NOT EXISTS "version" INTEGER NULL;'))
    db.session.commit()
    print("SUCCESS: Added missing columns (deletedAt, updatedAt, version) to feedback table!")
