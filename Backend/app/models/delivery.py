from sqlalchemy_serializer import SerializerMixin
from datetime import datetime
from app.core.database import db

class Notification(db.Model, SerializerMixin):
    __tablename__ = 'notifications'
    serialize_rules = ('-user',)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    message = db.Column(db.Text, nullable=False)
    read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Notification to User {self.user_id}>' 