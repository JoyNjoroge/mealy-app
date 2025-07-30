#!/usr/bin/env python3
"""
Fix Menu Database Constraint
"""
from app.main import app
from app.core.database import db

def fix_menu_constraint():
    with app.app_context():
        print("🔧 Fixing menu database constraint...")
        
        try:
            # Drop the unique constraint on date
            with db.engine.connect() as conn:
                conn.execute(db.text("ALTER TABLE menus DROP CONSTRAINT IF EXISTS menus_date_key;"))
                conn.commit()
            print("✅ Dropped unique constraint on date")
            
            # Add composite unique constraint
            with db.engine.connect() as conn:
                conn.execute(db.text("ALTER TABLE menus ADD CONSTRAINT unique_menu_per_caterer_per_date UNIQUE (date, caterer_id);"))
                conn.commit()
            print("✅ Added composite unique constraint (date, caterer_id)")
            
            print("🎉 Menu constraint fixed successfully!")
            
        except Exception as e:
            print(f"❌ Error fixing constraint: {str(e)}")
            print("This might already be fixed or the constraint doesn't exist")

if __name__ == "__main__":
    fix_menu_constraint() 