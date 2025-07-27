from sqlalchemy_serializer import SerializerMixin
from datetime import datetime
from app.core.database import db

class Order(db.Model, SerializerMixin):
    __tablename__ = 'orders'
    serialize_rules = ('-user', '-menu_item')

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_items.id'), nullable=False, index=True)
    quantity = db.Column(db.Integer, default=1, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default="pending")
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Order {self.id} User={self.user_id}>' 