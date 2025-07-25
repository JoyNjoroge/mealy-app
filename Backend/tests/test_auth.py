import pytest
from app.models.user import User
from app.core.database import db
from werkzeug.security import generate_password_hash

def test_register_success(client):
    response = client.post("/api/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "testpass",
        "role": "customer"
    })
    assert response.status_code == 201
    data = response.get_json()
    assert "user" in data
    assert data["user"]["email"] == "test@example.com"

def test_register_duplicate_email(client):
    client.post("/api/auth/register", json={
        "name": "Test User",
        "email": "dupe@example.com",
        "password": "testpass",
        "role": "customer"
    })
    response = client.post("/api/auth/register", json={
        "name": "Test User 2",
        "email": "dupe@example.com",
        "password": "testpass2",
        "role": "customer"
    })
    assert response.status_code in (400, 409)

def test_login_success(client):
    client.post("/api/auth/register", json={
        "name": "Test User",
        "email": "login@example.com",
        "password": "testpass",
        "role": "customer"
    })
    response = client.post("/api/auth/login", json={
        "email": "login@example.com",
        "password": "testpass"
    })
    assert response.status_code == 200
    data = response.get_json()
    assert "access_token" in data

def test_login_invalid_password(client):
    client.post("/api/auth/register", json={
        "name": "Test User",
        "email": "fail@example.com",
        "password": "rightpass",
        "role": "customer"
    })
    response = client.post("/api/auth/login", json={
        "email": "fail@example.com",
        "password": "wrongpass"
    })
    assert response.status_code == 401

def test_login_nonexistent_user(client):
    response = client.post("/api/auth/login", json={
        "email": "noone@example.com",
        "password": "nopass"
    })
    assert response.status_code == 401 