
from models import db, User, Meal, Menu, MenuItem, Order, Notification
from datetime import datetime

def seed_data():
    # Clear existing data
    Notification.query.delete()
    Order.query.delete()
    MenuItem.query.delete()
    Menu.query.delete()
    Meal.query.delete()
    User.query.delete()
    db.session.commit()

    # Create Users
    user1 = User(username='alice', email='alice@example.com', password='password1', role='customer')
    user2 = User(username='bob', email='bob@example.com', password='password2', role='caterer')
    db.session.add_all([user1, user2])
    db.session.commit()

    # Create Meals
    meal1 = Meal(name='Burger', description='Beef burger with cheese', price=8.99, image_url=None)
    meal2 = Meal(name='Pizza', description='Margherita pizza', price=12.50, image_url=None)
    db.session.add_all([meal1, meal2])
    db.session.commit()

    # Create Menu
    menu1 = Menu(date=datetime.utcnow().date())
    db.session.add(menu1)
    db.session.commit()

    # Create MenuItems
    menu_item1 = MenuItem(menu_id=menu1.id, meal_id=meal1.id)
    menu_item2 = MenuItem(menu_id=menu1.id, meal_id=meal2.id)
    db.session.add_all([menu_item1, menu_item2])
    db.session.commit()

    # Create Orders
    order1 = Order(user_id=user1.id, menu_item_id=menu_item1.id, quantity=2, total_price=17.98)
    order2 = Order(user_id=user1.id, menu_item_id=menu_item2.id, quantity=1, total_price=12.50)
    db.session.add_all([order1, order2])
    db.session.commit()

    # Create Notifications
    notif1 = Notification(user_id=user1.id, message="Your order has been placed.", read=False)
    notif2 = Notification(user_id=user2.id, message="A new order has been received.", read=False)
    db.session.add_all([notif1, notif2])
    db.session.commit()