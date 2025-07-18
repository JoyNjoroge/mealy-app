from .models import db, User, Meal, Menu, MenuItem, Order, Notification
from datetime import datetime
from werkzeug.security import generate_password_hash
from faker import Faker
import random

faker = Faker()

def seed_data():
    # Clear existing data
    Notification.query.delete()
    Order.query.delete()
    MenuItem.query.delete()
    Menu.query.delete()
    Meal.query.delete()
    User.query.delete()
    db.session.commit()

    roles = ['customer', 'caterer', 'admin']

    # Create Users
    users = []
    for _ in range(10):
        user = User(
            name=faker.name(),
            email=faker.unique.email(),
            role=random.choice(roles),
            password=generate_password_hash('password123')
        )
        users.append(user)
    db.session.add_all(users)
    db.session.commit()

    # Create Meals
    meal_names = ['Burger', 'Pizza', 'Salad', 'Pasta', 'Sushi', 'Tacos']
    meals = []
    for name in meal_names:
        meal = Meal(
            name=name,
            description=faker.sentence(),
            price=round(random.uniform(5.0, 20.0), 2),
            image_url=None
        )
        meals.append(meal)
    db.session.add_all(meals)
    db.session.commit()

    # Create Menu
    menu = Menu(date=datetime.utcnow().date())
    db.session.add(menu)
    db.session.commit()

    # Create Menu Items
    menu_items = []
    for meal in random.sample(meals, k=3):  # Pick 3 random meals
        menu_items.append(MenuItem(menu_id=menu.id, meal_id=meal.id))
    db.session.add_all(menu_items)
    db.session.commit()

    # Create Orders
    orders = []
    for _ in range(5):
        user = random.choice(users)
        item = random.choice(menu_items)
        quantity = random.randint(1, 3)
        total_price = round(item.meal.price * quantity, 2)
        orders.append(Order(user_id=user.id, menu_item_id=item.id, quantity=quantity, total_price=total_price))
    db.session.add_all(orders)
    db.session.commit()

    # Create Notifications
    notifs = []
    for user in users:
        message = f"{user.name}, your order has been processed!" if user.role == 'customer' else "You received a new order!"
        notifs.append(Notification(user_id=user.id, message=message, read=False))
    db.session.add_all(notifs)
    db.session.commit()

    print("✅ Fake seed data inserted.")
