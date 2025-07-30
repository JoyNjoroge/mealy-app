from sqlalchemy_serializer import SerializerMixin
from app.core.database import db

class Meal(db.Model, SerializerMixin):
    __tablename__ = 'meals'
    serialize_rules = ('-menu_items',)

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    image_url = db.Column(db.String(500))
    caterer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    available = db.Column(db.Boolean, default=True)  # New field for availability

    # Remove caterer relationship since it's already defined in User model
    menu_items = db.relationship('MenuItem', backref='meal', cascade='all, delete')

    def __repr__(self):
        return f'<Meal {self.name}>'

class Menu(db.Model, SerializerMixin):
    __tablename__ = 'menus'
    serialize_rules = ('-menu_items',)

    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    caterer_id = db.Column(db.Integer, db.ForeignKey('users.id'), index=True)
    
    # Composite unique constraint: one menu per date per caterer
    __table_args__ = (db.UniqueConstraint('date', 'caterer_id', name='unique_menu_per_caterer_per_date'),)

    menu_items = db.relationship('MenuItem', backref='menu', cascade='all, delete')

    def __repr__(self):
        return f'<Menu {self.date}>'

class MenuItem(db.Model, SerializerMixin):
    __tablename__ = 'menu_items'
    serialize_rules = ('-orders',)

    id = db.Column(db.Integer, primary_key=True)
    menu_id = db.Column(db.Integer, db.ForeignKey('menus.id'), nullable=False, index=True)
    meal_id = db.Column(db.Integer, db.ForeignKey('meals.id'), nullable=False, index=True)

    # Remove orders relationship since orders now reference meals directly
    def __repr__(self):
        return f'<MenuItem Menu={self.menu_id} Meal={self.meal_id}>' 