import pytest
from app.models.order import Order
from app.models.restaurant import Meal, Menu, MenuItem
from app.models.user import User
from app.core.database import db
from datetime import date

def create_meal_and_menu(client, admin_token):
    meal_resp = client.post("/api/meals", json={
        "name": "OrderMeal",
        "description": "For order test",
        "price": 12.0,
        "image_url": "http://test.com/meal.jpg",
        "caterer_id": 1
    }, headers={"Authorization": f"Bearer {admin_token}"})
    meal_id = meal_resp.get_json()["id"]
    menu_resp = client.post("/api/menus", json={
        "date": str(date.today()),
        "caterer_id": 1
    }, headers={"Authorization": f"Bearer {admin_token}"})
    menu_id = menu_resp.get_json()["id"]
    item_resp = client.post(f"/api/menus/{menu_id}/items", json={"meal_id": meal_id}, headers={"Authorization": f"Bearer {admin_token}"})
    item_id = item_resp.get_json()["id"]
    return item_id

def test_create_order(client, admin_token, user_token):
    item_id = create_meal_and_menu(client, admin_token)
    response = client.post("/api/orders", json={"menu_item_id": item_id, "quantity": 2}, headers={"Authorization": f"Bearer {user_token}"})
    assert response.status_code == 201
    data = response.get_json()
    assert data["menu_item_id"] == item_id
    assert data["quantity"] == 2

def test_get_orders(client, admin_token):
    response = client.get("/api/orders", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    assert isinstance(response.get_json(), list)

def test_order_history(client, user_token, admin_token):
    item_id = create_meal_and_menu(client, admin_token)
    client.post("/api/orders", json={"menu_item_id": item_id, "quantity": 1}, headers={"Authorization": f"Bearer {user_token}"})
    response = client.get("/api/orders/history", headers={"Authorization": f"Bearer {user_token}"})
    assert response.status_code == 200
    assert isinstance(response.get_json(), list) 