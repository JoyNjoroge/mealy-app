from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.core.database import db
from app.models.restaurant import Meal, Menu, MenuItem
from app.models.user import User
from app.api.decorators import roles_required
from app.api.utils import ValidationError, send_email
import cloudinary.uploader
import os 

restaurants_bp = Blueprint('restaurants', __name__)

@restaurants_bp.route('/meals', methods=['GET'])
def get_meals():
    """
    Get all meals
    ---
    tags:
      - Meals
    responses:
      200:
        description: List of meals
    """
    meals = Meal.query.all()
    return jsonify([meal.to_dict() for meal in meals])

@restaurants_bp.route('/meals/<int:meal_id>', methods=['GET'])
def get_meal(meal_id):
    """
    Get a meal by ID
    ---
    tags:
      - Meals
    parameters:
      - in: path
        name: meal_id
        type: integer
        required: true
        description: The meal ID
    responses:
      200:
        description: Meal data
    """
    meal = Meal.query.get_or_404(meal_id)
    return jsonify(meal.to_dict())

@restaurants_bp.route('/meals', methods=['POST'])
@jwt_required()
@roles_required('caterer', 'admin')
def create_meal():
    """
    Create a new meal (caterer or admin)
    ---
    tags:
      - Meals
    consumes:
      - multipart/form-data
    parameters:
      - in: formData
        name: name
        type: string
        required: true
      - in: formData
        name: description
        type: string
      - in: formData
        name: price
        type: number
        required: true
      - in: formData
        name: caterer_id
        type: integer
      - in: formData
        name: image
        type: file
        required: false
    responses:
      201:
        description: Meal created
    """
    name = request.form.get('name')
    description = request.form.get('description')
    price = request.form.get('price')
    caterer_id = request.form.get('caterer_id')
    image_url = None

    if 'image' in request.files:
        image_file = request.files['image']
        upload_result = cloudinary.uploader.upload(image_file)
        image_url = upload_result.get('secure_url')

    meal = Meal(
        name=name,
        description=description,
        price=price,
        image_url=image_url,
        caterer_id=caterer_id
    )
    db.session.add(meal)
    db.session.commit()

    # Send email to caterer
    caterer = User.query.get(caterer_id)
    if caterer and caterer.email:
        send_email(
            caterer.email,
            "Meal Added Successfully",
            f"<h1>Meal Added!</h1><p>Your meal '{name}' has been added to the menu.</p>"
        )

    return jsonify(meal.to_dict()), 201

@restaurants_bp.route('/meals/<int:meal_id>', methods=['PUT'])
@jwt_required()
@roles_required('caterer', 'admin') 
def update_meal(meal_id):
    """
    Update an existing meal by ID (caterer or admin)
    ---
    tags:
      - Meals
    parameters:
      - in: path
        name: meal_id
        type: integer
        required: true
        description: The meal ID
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            name:
              type: string
            description:
              type: string
            price:
              type: number
            image_url:
              type: string
            # caterer_id is not expected in the request body for updates
            # as per frontend changes, but is retained for the meal object.
    responses:
      200:
        description: Meal updated
      404:
        description: Meal not found
      400:
        description: Invalid data provided
    """
    meal = Meal.query.get_or_404(meal_id)
    data = request.get_json() # Get JSON data from the request body

    if not data:
        return jsonify({'message': 'Invalid JSON data provided'}), 400

    # Update meal attributes if they are present in the request data
    if 'name' in data:
        meal.name = data['name']
    if 'description' in data:
        meal.description = data['description']
    if 'price' in data:
        try:
            meal.price = float(data['price'])
        except (ValueError, TypeError):
            return jsonify({'message': 'Price must be a valid number'}), 400
    if 'image_url' in data:
        meal.image_url = data['image_url']


    db.session.commit()
    return jsonify(meal.to_dict()), 200

@restaurants_bp.route('/meals/<int:meal_id>', methods=['DELETE'])
@jwt_required()
@roles_required('caterer', 'admin')
def delete_meal(meal_id):
    """
    Delete a meal by ID (caterer or admin)
    ---
    tags:
      - Meals
    parameters:
      - in: path
        name: meal_id
        type: integer
        required: true
        description: The meal ID
    responses:
      200:
        description: Meal deleted
    """
    meal = Meal.query.get_or_404(meal_id)
    db.session.delete(meal)
    db.session.commit()
    return jsonify({'message': 'Meal deleted'})

@restaurants_bp.route('/menus', methods=['GET'])
@jwt_required()
def get_menus():
    """
    Get all menus
    ---
    tags:
      - Menus
    responses:
      200:
        description: List of menus
    """
    menus = Menu.query.all()
    return jsonify([menu.to_dict() for menu in menus])

@restaurants_bp.route('/menus', methods=['POST'])
@jwt_required()
@roles_required('caterer', 'admin')
def create_menu():
    """
    Create a new menu with meals (caterer or admin)
    ---
    tags:
      - Menus
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            date:
              type: string
            caterer_id:
              type: integer
            meal_ids:
              type: array
              items:
                type: integer
    responses:
      201:
        description: Menu created with meals
    """
    data = request.get_json()
    
    # Check if menu for this date already exists
    existing_menu = Menu.query.filter_by(date=data['date']).first()
    if existing_menu:
        # Update existing menu
        menu = existing_menu
        
        # Check if there are any orders for this menu
        from app.models.order import Order
        existing_orders = Order.query.join(MenuItem).filter(MenuItem.menu_id == menu.id).first()
        
        if existing_orders:
            # If orders exist, we can't update the menu - return error
            return jsonify({'error': 'Cannot update menu - orders already exist for this date'}), 400
        
        # If no orders exist, we can safely delete existing menu items
        MenuItem.query.filter_by(menu_id=menu.id).delete()
        db.session.commit()
    else:
        # Create new menu
        menu = Menu(
            date=data['date'],
            caterer_id=data.get('caterer_id')
        )
        db.session.add(menu)
        db.session.commit()
    
    # Add menu items for selected meals
    meal_ids = data.get('meal_ids', [])
    for meal_id in meal_ids:
        menu_item = MenuItem(
            menu_id=menu.id,
            meal_id=meal_id
        )
        db.session.add(menu_item)
    
    db.session.commit()
    return jsonify(menu.to_dict()), 201

@restaurants_bp.route('/menus/<int:menu_id>', methods=['GET'])
def get_menu(menu_id):
    """
    Get a menu by ID
    ---
    tags:
      - Menus
    parameters:
      - in: path
        name: menu_id
        type: integer
        required: true
        description: The menu ID
    responses:
      200:
        description: Menu data
    """
    menu = Menu.query.get_or_404(menu_id)
    return jsonify(menu.to_dict())

@restaurants_bp.route('/menus/<int:menu_id>', methods=['PUT'])
@jwt_required()
@roles_required('caterer', 'admin')
def update_menu(menu_id):
    """
    Update a menu by ID (caterer or admin)
    ---
    tags:
      - Menus
    parameters:
      - in: path
        name: menu_id
        type: integer
        required: true
        description: The menu ID
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            date:
              type: string
    responses:
      200:
        description: Menu updated
    """
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
    """
    Delete a menu by ID (caterer or admin)
    ---
    tags:
      - Menus
    parameters:
      - in: path
        name: menu_id
        type: integer
        required: true
        description: The menu ID
    responses:
      200:
        description: Menu deleted
    """
    menu = Menu.query.get_or_404(menu_id)
    db.session.delete(menu)
    db.session.commit()
    return jsonify({'message': 'Menu deleted'})

@restaurants_bp.route('/menus/<int:menu_id>/items', methods=['GET'])
def get_menu_items(menu_id):
    """
    Get all menu items for a menu
    ---
    tags:
      - Menus
    parameters:
      - in: path
        name: menu_id
        type: integer
        required: true
        description: The menu ID
    responses:
      200:
        description: List of menu items
    """
    items = MenuItem.query.filter_by(menu_id=menu_id).all()
    return jsonify([item.to_dict() for item in items])

@restaurants_bp.route('/menus/<int:menu_id>/items', methods=['POST'])
@jwt_required()
@roles_required('caterer', 'admin')
def add_menu_item(menu_id):
    """
    Add a menu item to a menu (caterer or admin)
    ---
    tags:
      - Menus
    parameters:
      - in: path
        name: menu_id
        type: integer
        required: true
        description: The menu ID
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            meal_id:
              type: integer
    responses:
      201:
        description: Menu item added
    """
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
    """
    Remove a menu item by ID (caterer or admin)
    ---
    tags:
      - Menus
    parameters:
      - in: path
        name: item_id
        type: integer
        required: true
        description: The menu item ID
    responses:
      200:
        description: Menu item deleted
    """
    item = MenuItem.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return jsonify({'message': 'Menu item deleted'})

@restaurants_bp.route('/menu/today', methods=['GET'])
@jwt_required()
def get_menu_today():
    """
    Get today's menu with meals
    ---
    tags:
      - Menus
    responses:
      200:
        description: Today's menu with meals
      404:
        description: No menu for today
    """
    from datetime import date
    today = date.today()
    menu = Menu.query.filter_by(date=today).first()
    if not menu:
        return jsonify({'message': 'No menu for today'}), 404
    
    # Get menu items with their associated meals
    menu_items = MenuItem.query.filter_by(menu_id=menu.id).all()
    meals = []
    for item in menu_items:
        meal = Meal.query.get(item.meal_id)
        if meal:
            meal_dict = meal.to_dict()
            meal_dict['menu_item_id'] = item.id  # Add menu item ID to each meal
            meals.append(meal_dict)
    
    return jsonify({
        'id': menu.id,
        'date': str(menu.date),
        'caterer_id': menu.caterer_id,
        'meals': meals
    })

@restaurants_bp.route('/test-orders', methods=['GET'])
def test_orders():
    """
    Test endpoint to check if orders can be queried
    """
    try:
        from app.models.order import Order
        orders = Order.query.all()
        return jsonify({
            'message': 'Orders query successful',
            'count': len(orders),
            'orders': [{'id': order.id, 'total_price': order.total_price} for order in orders]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@restaurants_bp.route('/revenue/daily', methods=['GET'])
@jwt_required()
@roles_required('caterer', 'admin')
def get_daily_revenue():
    """
    Get daily revenue for a specific date
    ---
    tags:
      - Revenue
    parameters:
      - in: query
        name: date
        type: string
        format: date
        required: true
        description: The date to get revenue for (YYYY-MM-DD)
    responses:
      200:
        description: Daily revenue data
    """
    from datetime import datetime
    from app.models.order import Order
    
    date_str = request.args.get('date')
    if not date_str:
        return jsonify({'error': 'Date parameter is required'}), 400
    
    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    # Get orders for the specified date
    from sqlalchemy import func
    orders = Order.query.filter(
        func.date(Order.timestamp) == target_date
    ).all()
    
    # Calculate total revenue
    total_revenue = sum(order.total_price for order in orders if order.total_price)
    
    return jsonify({
        'date': date_str,
        'total': total_revenue,
        'order_count': len(orders)
    })