from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from sqlalchemy_serializer import SerializerMixin
from datetime import datetime
from flask_migrate import Migrate
from sqlalchemy import Enum

db = SQLAlchemy()
migrate = Migrate()

roles = ('customer', 'caterer', 'admin')


class User(db.Model, UserMixin, SerializerMixin):
    __tablename__ = 'users'
    serialize_rules = ('-orders.user', '-notifications.user', '-meals.caterer', '-menus.caterer')

    id = db.Column(db.Integer, primary_key=True)
    public_id = db.Column(db.String(50), unique=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(70), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(Enum(*roles, name='user_roles'), nullable=False)

    orders = db.relationship('Order', backref='user', cascade='all, delete')
    notifications = db.relationship('Notification', backref='user', cascade='all, delete')
    meals = db.relationship('Meal', backref='caterer', cascade='all, delete')
    menus = db.relationship('Menu', backref='caterer', cascade='all, delete')

    def __repr__(self):
        return f'<User {self.email}>'


class Meal(db.Model, SerializerMixin):
    __tablename__ = 'meals'
    serialize_rules = ('-menu_items.meal',)

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    image_url = db.Column(db.String(255))
    caterer_id = db.Column(db.Integer, db.ForeignKey('users.id'), index=True)

    menu_items = db.relationship('MenuItem', backref='meal', cascade='all, delete')

    def __repr__(self):
        return f'<Meal {self.name}>'


class Menu(db.Model, SerializerMixin):
    __tablename__ = 'menus'
    serialize_rules = ('-menu_items.menu',)

    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False, unique=True)
    caterer_id = db.Column(db.Integer, db.ForeignKey('users.id'), index=True)

    menu_items = db.relationship('MenuItem', backref='menu', cascade='all, delete')

    def __repr__(self):
        return f'<Menu {self.date}>'


class MenuItem(db.Model, SerializerMixin):
    __tablename__ = 'menu_items'
    serialize_rules = ('-orders.menu_item',)

    id = db.Column(db.Integer, primary_key=True)
    menu_id = db.Column(db.Integer, db.ForeignKey('menus.id'), nullable=False, index=True)
    meal_id = db.Column(db.Integer, db.ForeignKey('meals.id'), nullable=False, index=True)

    orders = db.relationship('Order', backref='menu_item', cascade='all, delete')

    def __repr__(self):
        return f'<MenuItem Menu={self.menu_id} Meal={self.meal_id}>'


class Order(db.Model, SerializerMixin):
    __tablename__ = 'orders'
    serialize_rules = ('-user.orders', '-menu_item.orders')

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_items.id'), nullable=False, index=True)
    quantity = db.Column(db.Integer, default=1, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default="pending")
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Order {self.id} User={self.user_id}>'


class Notification(db.Model, SerializerMixin):
    __tablename__ = 'notifications'
    serialize_rules = ('-user.notifications',)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    message = db.Column(db.Text, nullable=False)
    read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Notification to User {self.user_id}>'
