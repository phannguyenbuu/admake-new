import sys
from models import app, db, InventoryItem, Warehouse, StockTransaction
from api.inventory import _build_transaction_payload

with app.app_context():
    # Find a valid item and warehouse for testing
    item = InventoryItem.query.filter(InventoryItem.is_active.is_(True)).first()
    warehouse = Warehouse.query.filter(Warehouse.status == 'active').first()
    
    if not item or not warehouse:
        print("Error: Could not find active inventory item or warehouse in local DB!")
        sys.exit(1)
        
    print(f"Testing with Item ID: {item.id} (Code: {item.code})")
    print(f"Testing with Warehouse ID: {warehouse.id} (Name: {warehouse.name})")
    
    # 1. Test saving draft with quantity = 0 (Expected: fails in original, should succeed after our fix)
    data_draft_zero = {
        "item_id": item.id,
        "warehouse_id": warehouse.id,
        "transaction_type": "purchase_receipt",
        "transaction_date": "2026-06-01",
        "quantity": 0,
        "unit_cost": 10000,
        "status": "draft"
    }
    
    try:
        payload = _build_transaction_payload(data_draft_zero, item.lead_id)
        print("Draft with Qty 0: Success! Payload:", payload)
    except Exception as e:
        print("Draft with Qty 0: Failed with error:", str(e))
        
    # 2. Test saving draft with quantity = 5 (Expected: should succeed)
    data_draft_qty = {
        "item_id": item.id,
        "warehouse_id": warehouse.id,
        "transaction_type": "purchase_receipt",
        "transaction_date": "2026-06-01",
        "quantity": 5,
        "unit_cost": 10000,
        "status": "draft"
    }
    
    try:
        payload = _build_transaction_payload(data_draft_qty, item.lead_id)
        print("Draft with Qty 5: Success! Payload:", payload)
    except Exception as e:
        print("Draft with Qty 5: Failed with error:", str(e))
