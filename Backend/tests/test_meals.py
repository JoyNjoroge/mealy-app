import pytest
from app.models.restaurant import Meal, Menu, MenuItem
from app.core.database import db
from app.models.user import User
from datetime import date

def test_create_meal(client, admin_token):
    response = client.post("/api/meals", json={
        "name": "Pizza",
        "description": "Cheesy pizza",
        "price": 10.0,
        "image_url": "http://test.com/pizza.jpg",
        "caterer_id": 1
    }, headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 201
    data = response.get_json()
    assert data["name"] == "Pizza"

def test_get_meals(client):
    response = client.get("/api/meals")
    assert response.status_code == 200
    assert isinstance(response.get_json(), list)

def test_create_menu(client, admin_token):
    response = client.post("/api/menus", json={
        "date": str(date.today()),
        "caterer_id": 1
    }, headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 201
    data = response.get_json()
    assert "date" in data

def test_get_menus(client, admin_token):
    response = client.get("/api/menus", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    assert isinstance(response.get_json(), list)

def test_add_menu_item(client, admin_token):
    # Create meal and menu first
    meal_resp = client.post("/api/meals", json={
        "name": "Burger",
        "description": "Tasty burger",
        "price": 8.0,
        "image_url": "http://test.com/burger.jpg",
        "caterer_id": 1
    }, headers={"Authorization": f"Bearer {admin_token}"})
    meal_id = meal_resp.get_json()["id"]
    menu_resp = client.post("/api/menus", json={
        "date": str(date.today()),
        "caterer_id": 1
    }, headers={"Authorization": f"Bearer {admin_token}"})
    menu_id = menu_resp.get_json()["id"]
    response = client.post(f"/api/menus/{menu_id}/items", json={"meal_id": meal_id}, headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 201
    data = response.get_json()
    assert data["menu_id"] == menu_id
    assert data["meal_id"] == meal_id 