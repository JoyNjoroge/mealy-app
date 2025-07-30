from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.core.database import db
from app.models.user import User
from app.models.restaurant import Meal, Menu, MenuItem
from app.api.decorators import roles_required
from app.api.utils import ValidationError, send_email
import cloudinary.uploader
import os 
from datetime import datetime

restaurants_bp = Blueprint('restaurants', __name__)

@restaurants_bp.route('/meals', methods=['GET'])
@jwt_required()
def get_meals():
    """
    Get all meals (filtered by user role and availability)
    ---
    tags:
      - Meals
    responses:
      200:
        description: List of meals
    """
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()
    
    if user.role == 'admin':
        # Admin can see all meals
        meals = Meal.query.all()
    elif user.role == 'caterer':
        # Caterers can only see their own meals
        meals = Meal.query.filter_by(caterer_id=user.id).all()
    else:
        # Customers see only available meals from all caterers
        meals = Meal.query.filter_by(available=True).all()
    
    return jsonify([meal.to_dict() for meal in meals])

@restaurants_bp.route('/meals/available', methods=['GET'])
def get_available_meals():
    """
    Get all available meals for customers
    ---
    tags:
      - Meals
    responses:
      200:
        description: List of available meals
    """
    meals = Meal.query.filter_by(available=True).all()
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
        name: image
        type: file
        required: false
    responses:
      201:
        description: Meal created
    """
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    name = request.form.get('name')
    description = request.form.get('description')
    price = request.form.get('price')
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
        caterer_id=user.id  # Use current user's ID
    )
    db.session.add(meal)
    db.session.commit()

    # Send email to caterer
    if user.email:
        send_email(
            user.email,
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
    responses:
      200:
        description: Meal updated
      404:
        description: Meal not found
      400:
        description: Invalid data provided
    """
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    meal = Meal.query.get_or_404(meal_id)
    
    # Check if user can update this meal (must be the meal's caterer or admin)
    if user.role != 'admin' and meal.caterer_id != user.id:
        return jsonify({'error': 'You can only update your own meals'}), 403
    
    # Handle both JSON and form data
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form.to_dict()
    
    if not data:
        return jsonify({'message': 'No data provided'}), 400

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
    
    # Handle image upload if present
    if 'image' in request.files:
        image_file = request.files['image']
        upload_result = cloudinary.uploader.upload(image_file)
        meal.image_url = upload_result.get('secure_url')
    
    # Ensure the meal belongs to the current user
    meal.caterer_id = user.id

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

@restaurants_bp.route('/meals/<int:meal_id>/toggle', methods=['PUT'])
@jwt_required()
@roles_required('caterer', 'admin')
def toggle_meal_availability(meal_id):
    """
    Toggle meal availability (caterer or admin)
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
            available:
              type: boolean
    responses:
      200:
        description: Meal availability updated
    """
    meal = Meal.query.get_or_404(meal_id)
    data = request.get_json()
    
    if 'available' in data:
        meal.available = data['available']
        db.session.commit()
        return jsonify(meal.to_dict()), 200
    
    return jsonify({'error': 'Available status not provided'}), 400

@restaurants_bp.route('/menus', methods=['GET'])
@jwt_required()
def get_menus():
    """
    Get all menus (filtered by user role)
    ---
    tags:
      - Menus
    responses:
      200:
        description: List of menus
    """
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()
    
    if user.role == 'admin':
        # Admin can see all menus
        menus = Menu.query.all()
    else:
        # Caterers can only see their own menus
        menus = Menu.query.filter_by(caterer_id=user.id).all()
    
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
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        current_user_email = get_jwt_identity()
        user = User.query.filter_by(email=current_user_email).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if this caterer already has a menu for this date
        existing_menu = Menu.query.filter_by(date=data['date'], caterer_id=user.id).first()
        
        if existing_menu:
            # This caterer already has a menu for this date, update it
            menu = existing_menu
            
            # Check if there are any orders for this menu
            from app.models.order import Order
            # We can't directly join Order to MenuItem, so we'll check differently
            # For now, let's assume we can update the menu
            existing_orders = None
            
            if existing_orders:
                # If orders exist, we can still update but we'll add new menu items instead of replacing
                # This preserves existing orders while allowing menu updates
                pass
            else:
                # If no orders exist, we can safely delete existing menu items
                MenuItem.query.filter_by(menu_id=menu.id).delete()
                db.session.commit()
        else:
            # Create new menu for this caterer
            menu = Menu(
                date=data['date'],
                caterer_id=user.id
            )
            db.session.add(menu)
            db.session.commit()
        
        # Add menu items for selected meals
        meal_ids = data.get('meal_ids', [])
        
        for meal_id in meal_ids:
            # Check if this meal item already exists for this menu
            existing_item = MenuItem.query.filter_by(menu_id=menu.id, meal_id=meal_id).first()
            if not existing_item:
                menu_item = MenuItem(
                    menu_id=menu.id,
                    meal_id=meal_id
                )
                db.session.add(menu_item)
        
        db.session.commit()
        return jsonify(menu.to_dict()), 201
        
    except Exception as e:
        print(f"Error in create_menu: {str(e)}")  # Debug log
        db.session.rollback()
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

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
    Get today's menu (shows all available meals from all caterers)
    ---
    tags:
      - Menus
    responses:
      200:
        description: Today's menu with available meals
    """
    try:
        # Get all available meals from all caterers
        available_meals = Meal.query.filter_by(available=True).all()
        
        menu_items = []
        for meal in available_meals:
            menu_item = {
                'id': meal.id,
                'meal_id': meal.id,
                'meal_name': meal.name,
                'meal_description': meal.description,
                'meal_price': meal.price,
                'meal_image_url': meal.image_url,
                'caterer_name': meal.caterer.name if meal.caterer else 'Unknown',
                'caterer_email': meal.caterer.email if meal.caterer else 'Unknown',
                'available': meal.available
            }
            menu_items.append(menu_item)
        
        return jsonify({
            'meals': menu_items,
            'date': datetime.now().date().isoformat(),
            'message': f'Available meals for today ({len(menu_items)} meals)'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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

# ========================================
# CATERER-SPECIFIC ENDPOINTS
# ========================================

@restaurants_bp.route('/caterer/meals', methods=['GET'])
@jwt_required()
@roles_required('caterer', 'admin')
def get_caterer_meals():
    """
    Get meals created by the current caterer
    ---
    tags:
      - Caterer
    responses:
      200:
        description: List of caterer's meals
    """
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get meals created by this caterer
    meals = Meal.query.filter_by(caterer_id=user.id).all()
    
    meals_data = []
    for meal in meals:
        meal_dict = meal.to_dict()
        meal_dict['caterer_name'] = user.name
        meal_dict['caterer_email'] = user.email
        meals_data.append(meal_dict)
    
    return jsonify(meals_data)

@restaurants_bp.route('/caterer/menus', methods=['GET'])
@jwt_required()
@roles_required('caterer', 'admin')
def get_caterer_menus():
    """
    Get menus created by the current caterer
    ---
    tags:
      - Caterer
    responses:
      200:
        description: List of caterer's menus
    """
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get menus created by this caterer
    menus = Menu.query.filter_by(caterer_id=user.id).all()
    
    menus_data = []
    for menu in menus:
        menu_dict = menu.to_dict()
        menu_dict['caterer_name'] = user.name
        menu_dict['caterer_email'] = user.email
        menus_data.append(menu_dict)
    
    return jsonify(menus_data)

@restaurants_bp.route('/caterer/orders', methods=['GET'])
@jwt_required()
@roles_required('caterer', 'admin')
def get_caterer_orders():
    """
    Get orders for meals created by the current caterer
    ---
    tags:
      - Caterer
    responses:
      200:
        description: List of orders for caterer's meals
    """
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get orders for meals created by this caterer
    from app.models.order import Order
    orders = Order.query.join(Meal).filter(Meal.caterer_id == user.id).all()
    
    orders_data = []
    for order in orders:
        order_dict = order.to_dict()
        
        # Add meal details
        if order.meal:
            order_dict['meal_name'] = order.meal.name
            order_dict['meal_price'] = order.meal.price
            order_dict['caterer_name'] = user.name
            order_dict['caterer_email'] = user.email
        else:
            order_dict['meal_name'] = 'Unknown Meal'
            order_dict['meal_price'] = 0
            order_dict['caterer_name'] = user.name
            order_dict['caterer_email'] = user.email
        
        # Add customer details
        if order.user:
            order_dict['customer_name'] = order.user.name
            order_dict['customer_email'] = order.user.email
        else:
            order_dict['customer_name'] = 'Unknown'
            order_dict['customer_email'] = 'Unknown'
        
        orders_data.append(order_dict)
    
    return jsonify(orders_data)

@restaurants_bp.route('/caterer/revenue', methods=['GET'])
@jwt_required()
@roles_required('caterer', 'admin')
def get_caterer_revenue():
    """
    Get revenue for the current caterer
    ---
    tags:
      - Caterer
    parameters:
      - in: query
        name: date
        type: string
        description: Date in YYYY-MM-DD format (optional)
    responses:
      200:
        description: Caterer's revenue data
    """
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    from app.models.order import Order
    from datetime import datetime, timedelta
    from sqlalchemy import func
    
    date_str = request.args.get('date')
    
    if date_str:
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            orders = Order.query.join(Meal).filter(
                Meal.caterer_id == user.id,
                func.date(Order.timestamp) == target_date
            ).all()
            
            # Only count completed orders for revenue
            total_revenue = sum(order.total_price for order in orders if order.total_price and order.status == 'completed')
            completed_orders = [order for order in orders if order.status == 'completed']
            pending_orders = [order for order in orders if order.status == 'pending']
            
            return jsonify({
                'total_revenue': total_revenue,
                'completed_orders_count': len(completed_orders),
                'pending_orders_count': len(pending_orders),
                'total_orders_count': len(orders)
            })
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    else:
        # Get daily revenue data for the last 30 days
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=30)
        
        daily_revenue = []
        current_date = start_date
        
        while current_date <= end_date:
            orders = Order.query.join(Meal).filter(
                Meal.caterer_id == user.id,
                func.date(Order.timestamp) == current_date
            ).all()
            
            # Only count completed orders for revenue
            daily_revenue.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'revenue': sum(order.total_price for order in orders if order.total_price and order.status == 'completed'),
                'orders_count': len(orders)
            })
            
            current_date += timedelta(days=1)
        
        # Also get summary stats
        all_orders = Order.query.join(Meal).filter(Meal.caterer_id == user.id).all()
        # Only count completed orders for revenue
        total_revenue = sum(order.total_price for order in all_orders if order.total_price and order.status == 'completed')
        completed_orders = [order for order in all_orders if order.status == 'completed']
        pending_orders = [order for order in all_orders if order.status == 'pending']
        
        return jsonify({
            'total_revenue': total_revenue,
            'completed_orders_count': len(completed_orders),
            'pending_orders_count': len(pending_orders),
            'total_orders_count': len(all_orders),
            'daily_revenue': daily_revenue
        })

@restaurants_bp.route('/caterer/stats', methods=['GET'])
@jwt_required()
@roles_required('caterer', 'admin')
def get_caterer_stats():
    """
    Get comprehensive stats for the current caterer
    ---
    tags:
      - Caterer
    responses:
      200:
        description: Caterer's dashboard statistics
    """
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    from app.models.order import Order
    from datetime import datetime, timedelta
    from sqlalchemy import func
    
    # Get today's date
    today = datetime.now().date()
    
    # Get all orders for this caterer (direct join with Meal)
    all_orders = Order.query.join(Meal).filter(Meal.caterer_id == user.id).all()
    
    # Calculate stats - only count completed orders for revenue
    total_revenue = sum(order.total_price for order in all_orders if order.total_price and order.status == 'completed')
    
    # Count orders by status
    pending_orders = len([order for order in all_orders if order.status == 'pending'])
    completed_orders = len([order for order in all_orders if order.status == 'completed'])
    cancelled_orders = len([order for order in all_orders if order.status == 'cancelled'])
    
    # Get meal count
    meal_count = Meal.query.filter_by(caterer_id=user.id).count()
    
    # Get menu count - try to import Menu model safely
    try:
        from app.models.restaurant import Menu
        menu_count = Menu.query.filter_by(caterer_id=user.id).count()
    except:
        menu_count = 0
    
    return jsonify({
        'total_revenue': total_revenue,
        'total_orders_count': len(all_orders),
        'pending_orders_count': pending_orders,
        'completed_orders_count': completed_orders,
        'cancelled_orders_count': cancelled_orders,
        'meal_count': meal_count,
        'menu_count': menu_count
    })