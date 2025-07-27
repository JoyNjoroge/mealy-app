from sqlalchemy_serializer import SerializerMixin
from app.core.database import db

class Meal(db.Model, SerializerMixin):
    __tablename__ = 'meals'
    serialize_rules = ('-menu_items',)

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
    serialize_rules = ('-menu_items',)

    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False, unique=True)
    caterer_id = db.Column(db.Integer, db.ForeignKey('users.id'), index=True)

    menu_items = db.relationship('MenuItem', backref='menu', cascade='all, delete')

    def __repr__(self):
        return f'<Menu {self.date}>'

class MenuItem(db.Model, SerializerMixin):
    __tablename__ = 'menu_items'
    serialize_rules = ('-orders',)

    id = db.Column(db.Integer, primary_key=True)
    menu_id = db.Column(db.Integer, db.ForeignKey('menus.id'), nullable=False, index=True)
    meal_id = db.Column(db.Integer, db.ForeignKey('meals.id'), nullable=False, index=True)

    orders = db.relationship('Order', backref='menu_item', cascade='all, delete')

    def __repr__(self):
        return f'<MenuItem Menu={self.menu_id} Meal={self.meal_id}>' 