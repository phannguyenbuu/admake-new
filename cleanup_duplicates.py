import sys
sys.path.append('/root/admake/backend')
from models import app, db, InventoryItem

with app.app_context():
    # Find master codes from lead 243
    master_items = InventoryItem.query.filter(
        InventoryItem.deletedAt.is_(None),
        InventoryItem.lead_id == 243
    ).all()
    master_codes = [m.code for m in master_items if m.code]

    print(f"Master lead 243 has {len(master_items)} materials.")

    if master_codes:
        # Delete duplicate inventory items for other leads that share the same code
        deleted_count = InventoryItem.query.filter(
            InventoryItem.lead_id != 243,
            InventoryItem.code.in_(master_codes)
        ).delete(synchronize_session=False)

        db.session.commit()
        print(f"SUCCESS: Deleted {deleted_count} duplicate material records across all other leads!")
    else:
        print("No master items found in lead 243.")
