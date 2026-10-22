import sys
sys.path.append('/root/admake/backend')
from models import app, db, StockTransaction

with app.app_context():
    total = StockTransaction.query.count()
    not_deleted = StockTransaction.query.filter(StockTransaction.deletedAt.is_(None)).count()
    print(f"Total in DB: {total}")
    print(f"Not deleted in DB: {not_deleted}")
    
    items = StockTransaction.query.all()
    for t in items:
        print(f"ID: {t.id} | Code: {t.transaction_code} | Lead: {t.lead_id} | Status: {t.status} | DeletedAt: {t.deletedAt} | RefID: {t.reference_id} | RevID: {t.reversal_transaction_id}")
