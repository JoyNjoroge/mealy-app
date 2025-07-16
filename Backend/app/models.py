from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from sqlalchemy_serializer import SerializerMixin
from datetime import datetime

from app import db


class User(UserMixin, db.Model, SerializerMixin):
    __tablename__ = 'users'

    serialize_rules = ('-password', '-orders.user', '-notifications.user')

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False, unique=True)
    email = db.Column(db.String(120), nullable=False, unique=True)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'customer' or 'caterer'

    
    orders = db.relationship('Order', backref='user', cascade='all, delete')
    notifications = db.relationship('Notification', backref='user', cascade='all, delete')
    meals = db.relationship('Meal', backref='caterer', cascade='all, delete')
    menus = db.relationship('Menu', backref='caterer', cascade='all, delete')


class Meal(db.Model, SerializerMixin):
    __tablename__ = 'meals'

    serialize_rules = ('-menu_items.meal',)

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Float, nullable=False)
    image_url = db.Column(db.String(255), nullable=True)

 
    menu_items = db.relationship('MenuItem', backref='meal', cascade='all, delete')


class Menu(db.Model, SerializerMixin):
    __tablename__ = 'menus'

    serialize_rules = ('-menu_items.menu',)

    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False, unique=True)

   
    menu_items = db.relationship('MenuItem', backref='menu', cascade='all, delete')


class MenuItem(db.Model, SerializerMixin):
    __tablename__ = 'menu_items'

    serialize_rules = ('-orders.menu_item',)

    id = db.Column(db.Integer, primary_key=True)
    menu_id = db.Column(db.Integer, db.ForeignKey('menus.id'), nullable=False)
    meal_id = db.Column(db.Integer, db.ForeignKey('meals.id'), nullable=False)


    orders = db.relationship('Order', backref='menu_item', cascade='all, delete')


class Order(db.Model, SerializerMixin):
    __tablename__ = 'orders'

    serialize_rules = ('-user.orders', '-menu_item.orders')

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_items.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)


class Notification(db.Model, SerializerMixin):
    __tablename__ = 'notifications'

    serialize_rules = ('-user.notifications',)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
