from sqlalchemy_serializer import SerializerMixin
from datetime import datetime
from app.core.database import db

class Order(db.Model, SerializerMixin):
    __tablename__ = 'orders'
    serialize_rules = ('-user', '-meal')

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    meal_id = db.Column(db.Integer, db.ForeignKey('meals.id'), nullable=False)  # Direct meal reference
    quantity = db.Column(db.Integer, nullable=False, default=1)
    total_price = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, completed, cancelled
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    special_instructions = db.Column(db.Text)

    # Remove user relationship since it's already defined in User model
    meal = db.relationship('Meal', backref='orders')

    def __repr__(self):
        return f'<Order {self.id}>' 