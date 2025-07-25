import pytest
from app.models.user import User
from app.core.database import db

def test_get_users_admin(client, admin_token):
    response = client.get("/api/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    data = response.get_json()
    assert "items" in data

def test_get_users_forbidden(client, user_token):
    response = client.get("/api/users", headers={"Authorization": f"Bearer {user_token}"})
    assert response.status_code == 403 or response.status_code == 401

def test_get_user_self(client, user_token):
    # Register a user and get their id
    client.post("/api/auth/register", json={
        "name": "Self User",
        "email": "self@example.com",
        "password": "testpass",
        "role": "customer"
    })
    user = User.query.filter_by(email="self@example.com").first()
    response = client.get(f"/api/users/{user.id}", headers={"Authorization": f"Bearer {user_token}"})
    assert response.status_code == 200
    data = response.get_json()
    assert data["email"] == "self@example.com"

def test_update_user(client, admin_token):
    client.post("/api/auth/register", json={
        "name": "Update User",
        "email": "update@example.com",
        "password": "testpass",
        "role": "customer"
    })
    user = User.query.filter_by(email="update@example.com").first()
    response = client.put(f"/api/users/{user.id}", json={"name": "Updated Name"}, headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    data = response.get_json()
    assert data["name"] == "Updated Name"

def test_delete_user(client, admin_token):
    client.post("/api/auth/register", json={
        "name": "Delete User",
        "email": "delete@example.com",
        "password": "testpass",
        "role": "customer"
    })
    user = User.query.filter_by(email="delete@example.com").first()
    response = client.delete(f"/api/users/{user.id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    data = response.get_json()
    assert data["message"] == "User deleted" 