from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.core.database import db
from app.models.restaurant import Meal, Menu, MenuItem
from app.models.user import User
from app.api.decorators import roles_required
from app.api.utils import ValidationError

restaurants_bp = Blueprint('restaurants', __name__)

@restaurants_bp.route('/meals', methods=['GET'])
def get_meals():
    meals = Meal.query.all()
    return jsonify([meal.to_dict() for meal in meals])

@restaurants_bp.route('/meals/<int:meal_id>', methods=['GET'])
def get_meal(meal_id):
    meal = Meal.query.get_or_404(meal_id)
    return jsonify(meal.to_dict())

@restaurants_bp.route('/meals', methods=['POST'])
@jwt_required()
@roles_required('caterer', 'admin')
def create_meal():
    data = request.get_json()
    meal = Meal(
        name=data['name'],
        description=data.get('description'),
        price=data['price'],
        image_url=data.get('image_url'),
        caterer_id=data.get('caterer_id')
    )
    db.session.add(meal)
    db.session.commit()
    return jsonify(meal.to_dict()), 201

@restaurants_bp.route('/meals/<int:meal_id>', methods=['DELETE'])
@jwt_required()
@roles_required('caterer', 'admin')
def delete_meal(meal_id):
    meal = Meal.query.get_or_404(meal_id)
    db.session.delete(meal)
    db.session.commit()
    return jsonify({'message': 'Meal deleted'})

@restaurants_bp.route('/menus', methods=['GET'])
@jwt_required()
def get_menus():
    menus = Menu.query.all()
    return jsonify([menu.to_dict() for menu in menus])

@restaurants_bp.route('/menus', methods=['POST'])
@jwt_required()
@roles_required('caterer', 'admin')
def create_menu():
    data = request.get_json()
    menu = Menu(
        date=data['date'],
        caterer_id=data.get('caterer_id')
    )
    db.session.add(menu)
    db.session.commit()
    return jsonify(menu.to_dict()), 201

@restaurants_bp.route('/menus/<int:menu_id>', methods=['GET'])
def get_menu(menu_id):
    menu = Menu.query.get_or_404(menu_id)
    return jsonify(menu.to_dict())

@restaurants_bp.route('/menus/<int:menu_id>', methods=['PUT'])
@jwt_required()
@roles_required('caterer', 'admin')
def update_menu(menu_id):
    menu = Menu.query.get_or_404(menu_id)
    data = request.get_json()
    if 'date' in data:
        menu.date = data['date']
    db.session.commit()
    return jsonify(menu.to_dict())

@restaurants_bp.route('/menus/<int:menu_id>', methods=['DELETE'])
@jwt_required()
@roles_required('caterer', 'admin')
def delete_menu(menu_id):
    menu = Menu.query.get_or_404(menu_id)
    db.session.delete(menu)
    db.session.commit()
    return jsonify({'message': 'Menu deleted'})

@restaurants_bp.route('/menus/<int:menu_id>/items', methods=['GET'])
def get_menu_items(menu_id):
    items = MenuItem.query.filter_by(menu_id=menu_id).all()
    return jsonify([item.to_dict() for item in items])

@restaurants_bp.route('/menus/<int:menu_id>/items', methods=['POST'])
@jwt_required()
@roles_required('caterer', 'admin')
def add_menu_item(menu_id):
    data = request.get_json()
    item = MenuItem(
        menu_id=menu_id,
        meal_id=data['meal_id']
    )
    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201

@restaurants_bp.route('/menu-items/<int:item_id>', methods=['DELETE'])
@jwt_required()
@roles_required('caterer', 'admin')
def remove_menu_item(item_id):
    item = MenuItem.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return jsonify({'message': 'Menu item deleted'})

@restaurants_bp.route('/menu/today', methods=['GET'])
@jwt_required()
def get_menu_today():
    from datetime import date
    today = date.today()
    menu = Menu.query.filter_by(date=today).first()
    if not menu:
        return jsonify({'message': 'No menu for today'}), 404
    return jsonify(menu.to_dict()) 