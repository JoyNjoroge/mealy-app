#!/usr/bin/env python3
"""
Migration to update orders table to use meal_id instead of menu_item_id
"""
from app.main import app
from app.core.database import db
from sqlalchemy import text

def update_orders_table():
    with app.app_context():
        print("🔧 Updating orders table to use meal_id...")
        try:
            with db.engine.connect() as conn:
                # Check if meal_id column already exists
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'orders' AND column_name = 'meal_id'
                """))
                if result.fetchone():
                    print("✅ meal_id column already exists")
                else:
                    # Add meal_id column
                    conn.execute(text("ALTER TABLE orders ADD COLUMN meal_id INTEGER REFERENCES meals(id);"))
                    print("✅ Added meal_id column to orders table")
                
                # Check if special_instructions column exists
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'orders' AND column_name = 'special_instructions'
                """))
                if result.fetchone():
                    print("✅ special_instructions column already exists")
                else:
                    # Add special_instructions column
                    conn.execute(text("ALTER TABLE orders ADD COLUMN special_instructions TEXT;"))
                    print("✅ Added special_instructions column to orders table")
                
                # Check if menu_item_id column exists
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'orders' AND column_name = 'menu_item_id'
                """))
                if result.fetchone():
                    print("⚠️  menu_item_id column still exists - you may want to remove it later")
                else:
                    print("✅ menu_item_id column has been removed")
                
                conn.commit()
                
            print("🎉 Orders table migration completed successfully!")
        except Exception as e:
            print(f"❌ Error during migration: {str(e)}")

if __name__ == "__main__":
    update_orders_table() 