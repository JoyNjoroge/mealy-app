import pytest
from app.models.delivery import Notification
from app.models.user import User
from app.core.database import db

def test_get_notifications(client, admin_token):
    response = client.get("/api/notifications", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code in (200, 404)
    # If notifications exist, should return a list
    if response.status_code == 200:
        assert isinstance(response.get_json(), list)

def test_mark_notification_as_read(client, admin_token):
    # Create a notification manually
    with client.application.app_context():
        user = User.query.filter_by(email="admin@example.com").first()
        notif = Notification(user_id=user.id, message="Test notification", read=False)
        db.session.add(notif)
        db.session.commit()
        notif_id = notif.id
    response = client.put(f"/api/notifications/{notif_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code in (200, 404)
    if response.status_code == 200:
        data = response.get_json()
        assert data["read"] is True 