import sys
sys.path.append('/root/admake/backend')
from models import app, db, MaterialSupplier

with app.app_context():
    sup = MaterialSupplier.query.filter(
        MaterialSupplier.deletedAt.is_(None),
        MaterialSupplier.name.ilike('%B-One Decor%')
    ).first()

    if sup:
        result = db.session.execute(
            db.text("UPDATE inventory_items SET default_supplier_id = :sup_id, default_supplier_name = :sup_name, supplier_link = :sup_link WHERE \"deletedAt\" IS NULL"),
            {"sup_id": sup.id, "sup_name": sup.name, "sup_link": sup.website_link}
        )
        db.session.commit()
        print(f"FORCE UPDATED ALL {result.rowcount} ITEMS ACROSS ALL LEADS TO B-ONE DECOR!")
