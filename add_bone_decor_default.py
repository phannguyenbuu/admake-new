import sys
sys.path.append('/root/admake/backend')
from models import app, db, MaterialSupplier, InventoryItem, generate_datetime_id

with app.app_context():
    # 1. Check if B-One Decor supplier exists or create it
    sup = MaterialSupplier.query.filter(
        MaterialSupplier.deletedAt.is_(None),
        MaterialSupplier.name.ilike('%B-One Decor%')
    ).first()

    if not sup:
        sup = MaterialSupplier(
            id=f"sup_{generate_datetime_id()}",
            name="Cty Quảng cáo Nội thất B-One Decor",
            website_link="https://admake.vn",
            phone="0877.884477",
            address="167/2 Nguyễn Du, TP. BMT, Đắk Lắk",
            note="Bảng hiệu, Alu, Đèn LED, Keo 502, Hộp đèn..."
        )
        db.session.add(sup)
        db.session.commit()
        print(f"CREATED B-One Decor supplier with ID: {sup.id}")
    else:
        sup.name = "Cty Quảng cáo Nội thất B-One Decor"
        sup.website_link = "https://admake.vn"
        sup.phone = "0877.884477"
        sup.address = "167/2 Nguyễn Du, TP. BMT, Đắk Lắk"
        db.session.commit()
        print(f"UPDATED B-One Decor supplier with ID: {sup.id}")

    # 2. Set B-One Decor as default supplier for ALL items across ALL leads
    updated_items = InventoryItem.query.filter(
        InventoryItem.deletedAt.is_(None)
    ).update({
        "default_supplier_id": sup.id,
        "default_supplier_name": sup.name,
        "supplier_link": sup.website_link
    }, synchronize_session=False)

    db.session.commit()
    print(f"SUCCESSFULLY SET '{sup.name}' as default supplier for ALL {updated_items} items across all leads!")
