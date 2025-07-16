from flask import Blueprint

notifications_bp = Blueprint('notifications_bp', __name__)

@notifications_bp.route('/notifications/test')
def test_notifications():
    return {"message": "✅ Notifications route working"}
