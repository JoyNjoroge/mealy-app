#!/usr/bin/env python3
"""
Database Check and Fix Script
"""
from app.main import app
from app.models.restaurant import Meal, Menu, MenuItem
from app.models.user import User
from app.core.database import db

def check_database():
    with app.app_context():
        print("=== DATABASE CHECK ===")
        
        # Check caterers
        print("\n=== CATERERS ===")
        caterers = User.query.filter_by(role='caterer').all()
        for caterer in caterers:
            print(f"ID: {caterer.id}, Name: {caterer.name}, Email: {caterer.email}")
        
        # Check meals
        print("\n=== MEALS ===")
        meals = Meal.query.all()
        for meal in meals:
            caterer_name = "None" if not meal.caterer else meal.caterer.name
            print(f"ID: {meal.id}, Name: {meal.name}, Caterer ID: {meal.caterer_id}, Caterer: {caterer_name}, Price: {meal.price}")
        
        # Check menus
        print("\n=== MENUS ===")
        menus = Menu.query.all()
        for menu in menus:
            caterer_name = "None" if not menu.caterer else menu.caterer.name
            print(f"ID: {menu.id}, Date: {menu.date}, Caterer ID: {menu.caterer_id}, Caterer: {caterer_name}")
        
        # Check menu items
        print("\n=== MENU ITEMS ===")
        menu_items = MenuItem.query.all()
        for item in menu_items:
            meal_name = item.meal.name if item.meal else "Unknown"
            print(f"ID: {item.id}, Menu ID: {item.menu_id}, Meal: {meal_name}, Price: {item.price}")

def fix_caterer_data():
    """Fix meals and menus to belong to the correct caterer"""
    with app.app_context():
        print("\n=== FIXING CATERER DATA ===")
        
        # Get the main caterer
        caterer = User.query.filter_by(email='caterer@example.com').first()
        if not caterer:
            print("❌ Caterer not found!")
            return
        
        print(f"✅ Found caterer: {caterer.name} (ID: {caterer.id})")
        
        # Fix meals - assign all meals to this caterer if they don't have a caterer
        meals_to_fix = Meal.query.filter_by(caterer_id=None).all()
        if meals_to_fix:
            print(f"🔧 Fixing {len(meals_to_fix)} meals without caterer...")
            for meal in meals_to_fix:
                meal.caterer_id = caterer.id
                print(f"  - Fixed meal: {meal.name}")
            db.session.commit()
            print("✅ Meals fixed!")
        else:
            print("✅ All meals already have caterers")
        
        # Fix menus - assign all menus to this caterer if they don't have a caterer
        menus_to_fix = Menu.query.filter_by(caterer_id=None).all()
        if menus_to_fix:
            print(f"🔧 Fixing {len(menus_to_fix)} menus without caterer...")
            for menu in menus_to_fix:
                menu.caterer_id = caterer.id
                print(f"  - Fixed menu: {menu.date}")
            db.session.commit()
            print("✅ Menus fixed!")
        else:
            print("✅ All menus already have caterers")
        
        # Show final state
        print("\n=== FINAL STATE ===")
        meals = Meal.query.filter_by(caterer_id=caterer.id).all()
        print(f"📊 Caterer {caterer.name} has {len(meals)} meals")
        for meal in meals:
            print(f"  - {meal.name} (KES {meal.price})")
        
        menus = Menu.query.filter_by(caterer_id=caterer.id).all()
        print(f"📊 Caterer {caterer.name} has {len(menus)} menus")
        for menu in menus:
            print(f"  - Menu for {menu.date}")

if __name__ == "__main__":
    check_database()
    fix_caterer_data()
    print("\n🎉 Database check and fix completed!") 