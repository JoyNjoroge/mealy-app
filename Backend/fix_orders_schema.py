#!/usr/bin/env python3
"""
Fix Orders Table Schema - Update to use meal_id instead of menu_item_id
"""
from app.main import app
from app.core.database import db
from sqlalchemy import text

def fix_orders_schema():
    with app.app_context():
        print("🔧 Fixing orders table schema...")
        try:
            with db.engine.connect() as conn:
                # Check if menu_item_id column exists and is NOT NULL
                result = conn.execute(text("""
                    SELECT column_name, is_nullable 
                    FROM information_schema.columns 
                    WHERE table_name = 'orders' AND column_name = 'menu_item_id'
                """))
                menu_item_col = result.fetchone()
                
                if menu_item_col:
                    print(f"Found menu_item_id column: {menu_item_col}")
                    
                    # Make menu_item_id nullable first
                    conn.execute(text("ALTER TABLE orders ALTER COLUMN menu_item_id DROP NOT NULL;"))
                    print("✅ Made menu_item_id nullable")
                    
                    # Check if meal_id column exists
                    result = conn.execute(text("""
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name = 'orders' AND column_name = 'meal_id'
                    """))
                    meal_id_exists = result.fetchone()
                    
                    if not meal_id_exists:
                        # Add meal_id column
                        conn.execute(text("ALTER TABLE orders ADD COLUMN meal_id INTEGER REFERENCES meals(id);"))
                        print("✅ Added meal_id column")
                    
                    # Make meal_id NOT NULL
                    conn.execute(text("ALTER TABLE orders ALTER COLUMN meal_id SET NOT NULL;"))
                    print("✅ Made meal_id NOT NULL")
                    
                    # Drop the old menu_item_id column
                    conn.execute(text("ALTER TABLE orders DROP COLUMN menu_item_id;"))
                    print("✅ Dropped menu_item_id column")
                    
                else:
                    print("✅ menu_item_id column already removed")
                
                # Check if special_instructions column exists
                result = conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'orders' AND column_name = 'special_instructions'
                """))
                if not result.fetchone():
                    conn.execute(text("ALTER TABLE orders ADD COLUMN special_instructions TEXT;"))
                    print("✅ Added special_instructions column")
                else:
                    print("✅ special_instructions column already exists")
                
                conn.commit()
                print("🎉 Orders table schema updated successfully!")
                
        except Exception as e:
            print(f"❌ Error during schema update: {str(e)}")
            db.session.rollback()

if __name__ == "__main__":
    fix_orders_schema() 