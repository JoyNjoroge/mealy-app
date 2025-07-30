#!/usr/bin/env python3
"""
Migration to add 'available' field to meals table
"""
from app.main import app
from app.core.database import db
from sqlalchemy import text

def add_availability_field():
    with app.app_context():
        print("🔧 Adding 'available' field to meals table...")
        try:
            # Add the available column
            with db.engine.connect() as conn:
                conn.execute(text("ALTER TABLE meals ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT TRUE;"))
                conn.commit()
            print("✅ Added 'available' field to meals table")
            
            # Update existing meals to be available by default
            with db.engine.connect() as conn:
                conn.execute(text("UPDATE meals SET available = TRUE WHERE available IS NULL;"))
                conn.commit()
            print("✅ Set all existing meals as available")
            
            print("🎉 Availability migration completed successfully!")
        except Exception as e:
            print(f"❌ Error during migration: {str(e)}")

if __name__ == "__main__":
    add_availability_field() 