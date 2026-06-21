import os
import sys

# Add directory to path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app import app
from models import db
from sqlalchemy import text

with app.app_context():
    print("Database connection test on production server...")
    try:
        # Check task table columns
        result = db.session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'task'"))
        columns = [row[0] for row in result]
        print("Existing task columns:", columns)
        
        # Add prepayment column if not exists
        if "prepayment" not in columns:
            print("Adding column 'prepayment' to table 'task'...")
            db.session.execute(text("ALTER TABLE task ADD COLUMN prepayment INTEGER DEFAULT 0;"))
            db.session.commit()
            print("Successfully added column 'prepayment' to table 'task'.")
        else:
            print("Column 'prepayment' already exists in 'task'.")
            
        # Check ar_invoices table columns
        result = db.session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'ar_invoices'"))
        ar_columns = [row[0] for row in result]
        print("Existing ar_invoices columns:", ar_columns)
        
        # Add task_id column if not exists
        if "task_id" not in ar_columns:
            print("Adding column 'task_id' to table 'ar_invoices'...")
            db.session.execute(text("ALTER TABLE ar_invoices ADD COLUMN task_id VARCHAR(50) REFERENCES task(id);"))
            db.session.commit()
            print("Successfully added column 'task_id' to table 'ar_invoices'.")
        else:
            print("Column 'task_id' already exists in 'ar_invoices'.")
            
    except Exception as e:
        print("Error during migration:", e)
        db.session.rollback()
