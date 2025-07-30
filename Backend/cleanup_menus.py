#!/usr/bin/env python3
"""
Cleanup Old and Incorrect Menus
"""
from app.main import app
from app.models.restaurant import Menu, MenuItem
from app.models.user import User
from app.core.database import db
from datetime import datetime, date

def cleanup_menus():
    with app.app_context():
        print("🧹 Cleaning up old and incorrect menus...")
        
        # Get current date
        today = date.today()
        print(f"📅 Today's date: {today}")
        
        # Find all menus
        all_menus = Menu.query.all()
        print(f"📊 Total menus in database: {len(all_menus)}")
        
        for menu in all_menus:
            print(f"  - Menu ID: {menu.id}, Date: {menu.date}, Caterer ID: {menu.caterer_id}")
        
        # Find menus with dates before 2025 (old menus)
        old_menus = Menu.query.filter(Menu.date < date(2025, 1, 1)).all()
        
        if old_menus:
            print(f"\n❌ Found {len(old_menus)} menus with old dates:")
            for menu in old_menus:
                print(f"  - Menu ID: {menu.id}, Date: {menu.date}, Caterer ID: {menu.caterer_id}")
                # Delete menu items first
                MenuItem.query.filter_by(menu_id=menu.id).delete()
                # Delete the menu
                db.session.delete(menu)
            db.session.commit()
            print("✅ Deleted menus with old dates")
        else:
            print("✅ No menus with old dates found")
        
        # Find menus from other caterers (not the main caterer with ID 26)
        other_caterer_menus = Menu.query.filter(Menu.caterer_id != 26).all()
        
        if other_caterer_menus:
            print(f"\n❌ Found {len(other_caterer_menus)} menus from other caterers:")
            for menu in other_caterer_menus:
                print(f"  - Menu ID: {menu.id}, Date: {menu.date}, Caterer ID: {menu.caterer_id}")
                # Delete menu items first
                MenuItem.query.filter_by(menu_id=menu.id).delete()
                # Delete the menu
                db.session.delete(menu)
            db.session.commit()
            print("✅ Deleted menus from other caterers")
        else:
            print("✅ No menus from other caterers found")
        
        # Show final state
        remaining_menus = Menu.query.all()
        print(f"\n📊 Remaining menus: {len(remaining_menus)}")
        for menu in remaining_menus:
            caterer_name = menu.caterer.name if menu.caterer else "Unknown"
            print(f"  - Menu ID: {menu.id}, Date: {menu.date}, Caterer: {caterer_name}")

if __name__ == "__main__":
    cleanup_menus() 