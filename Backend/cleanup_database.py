#!/usr/bin/env python3
"""
Cleanup Database - Remove old orders and menus to start fresh
"""
from app.main import app
from app.models.order import Order
from app.models.restaurant import Menu, MenuItem, Meal
from app.core.database import db

def cleanup_database():
    with app.app_context():
        print("🧹 Cleaning up database...")
        
        # Delete all orders
        orders_count = Order.query.count()
        Order.query.delete()
        print(f"✅ Deleted {orders_count} orders")
        
        # Delete all menu items
        menu_items_count = MenuItem.query.count()
        MenuItem.query.delete()
        print(f"✅ Deleted {menu_items_count} menu items")
        
        # Delete all menus
        menus_count = Menu.query.count()
        Menu.query.delete()
        print(f"✅ Deleted {menus_count} menus")
        
        # Commit changes
        db.session.commit()
        print("🎉 Database cleanup completed!")
        
        # Show remaining data
        remaining_meals = Meal.query.count()
        print(f"📊 Remaining meals: {remaining_meals}")

if __name__ == "__main__":
    cleanup_database() 