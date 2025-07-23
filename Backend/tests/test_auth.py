# tests/test_auth.py

def test_register_user(client):
    response = client.post("/api/auth/register", json={
        "name": "Jane Doe",
        "email": "jane@example.com",
        "password": "pass123",
        "role": "customer"
    })

    assert response.status_code == 201
    data = response.get_json()
    assert "user" in data
    assert data["user"]["email"] == "jane@example.com"

def test_login_user(client):
    # Register first
    client.post("/api/auth/register", json={
        "name": "Jane",
        "email": "jane2@example.com",
        "password": "pass123",
        "role": "customer"
    })

    # Login
    response = client.post("/api/auth/login", json={
        "email": "jane2@example.com",
        "password": "pass123"
    })

    assert response.status_code == 200
    data = response.get_json()
    assert "access_token" in data

def test_protected_route_requires_auth(client):
    response = client.get("/api/users")
    assert response.status_code == 401

def test_protected_route_with_admin_token(client, admin_token):
    response = client.get("/api/users", headers={
        "Authorization": f"Bearer {admin_token}"
    })
    assert response.status_code in [200, 204]

