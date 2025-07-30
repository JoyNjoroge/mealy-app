#!/usr/bin/env python3

from app.main import app
from app.core.database import db
from app.models.restaurant import Meal, Menu, MenuItem
from app.models.order import Order
from app.models.user import User
from datetime import datetime, timedelta
from sqlalchemy import func

with app.app_context():
    try:
        user = User.query.filter_by(email='caterer@example.com').first()
        print('User found:', user.id if user else 'Not found')
        
        if user:
            # Test the exact query from the stats function
            all_orders = Order.query.join(Meal).filter(Meal.caterer_id == user.id).all()
            print('Orders found:', len(all_orders))
            
            # Test revenue calculation
            total_revenue = sum(order.total_price for order in all_orders if order.total_price and order.status == 'completed')
            print('Total revenue:', total_revenue)
            
            # Test meal count
            meal_count = Meal.query.filter_by(caterer_id=user.id).count()
            print('Meal count:', meal_count)
            
            # Test menu count
            try:
                menu_count = Menu.query.filter_by(caterer_id=user.id).count()
                print('Menu count:', menu_count)
            except Exception as e:
                print('Menu count error:', e)
                
        print('All tests passed!')
        
    except Exception as e:
        print('Error:', e)
        import traceback
        traceback.print_exc() 