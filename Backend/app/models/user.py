from flask_login import UserMixin
from sqlalchemy_serializer import SerializerMixin
from datetime import datetime
import enum
from app.core.database import db

class UserRoles(enum.Enum):
    customer = 'customer'
    caterer = 'caterer'
    admin = 'admin'

class User(db.Model, UserMixin, SerializerMixin):
    __tablename__ = 'users'
    serialize_rules = ('-orders', '-notifications', '-meals', '-menus')

    id = db.Column(db.Integer, primary_key=True)
    public_id = db.Column(db.String(50), unique=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(70), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(UserRoles), nullable=False, default=UserRoles.customer)

    orders = db.relationship('Order', backref='user', cascade='all, delete')
    notifications = db.relationship('Notification', backref='user', cascade='all, delete')
    meals = db.relationship('Meal', backref='caterer', cascade='all, delete')
    menus = db.relationship('Menu', backref='caterer', cascade='all, delete')

    def __repr__(self):
        return f'<User {self.email}>' 