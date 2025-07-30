from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.core.database import db
from app.models.order import Order
from app.models.user import User
from app.models.restaurant import MenuItem, Meal
from app.api.decorators import roles_required
from app.api.utils import ValidationError

orders_bp = Blueprint('orders', __name__)

@orders_bp.route('/orders/test', methods=['GET'])
def test_orders():
    return jsonify({'message': 'Orders blueprint is working'})

@orders_bp.route('/orders/create', methods=['POST'])
@jwt_required()
@roles_required('customer')
def create_order_simple():
    """
    Create a new order (simplified version)
    """
    try:
        data = request.get_json()
        current_user_email = get_jwt_identity()
        user = User.query.filter_by(email=current_user_email).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        meal_id = data.get('meal_id')
        quantity = data.get('quantity', 1)
        
        if not meal_id:
            return jsonify({'error': 'meal_id is required'}), 400
            
        meal = Meal.query.get(meal_id)
        if not meal:
            return jsonify({'error': 'Meal not found'}), 404
            
        if not meal.available:
            return jsonify({'error': 'Meal is not available'}), 400
            
        total_price = meal.price * quantity
        
        order = Order(
            user_id=user.id,
            meal_id=meal_id,
            quantity=quantity,
            total_price=total_price
        )
        
        db.session.add(order)
        db.session.commit()
        
        return jsonify({
            'message': 'Order created successfully',
            'order': order.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@orders_bp.route('/orders', methods=['GET'])
@jwt_required()
def get_orders():
    """
    Get all orders with detailed information (filtered by user role)
    ---
    tags:
      - Orders
    responses:
      200:
        description: List of orders with meal and user details
    """
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()
    
    if user.role == 'admin':
        # Admin can see all orders
        orders = Order.query.all()
    elif user.role == 'caterer':
        # Caterers can only see orders for their meals
        orders = Order.query.join(Meal).filter(Meal.caterer_id == user.id).all()
    else:
        # Customers can only see their own orders
        orders = Order.query.filter_by(user_id=user.id).all()
    
    orders_with_details = []
    
    for order in orders:
        order_dict = order.to_dict()
        # Add meal details
        if order.meal:
            order_dict['meal_name'] = order.meal.name
            order_dict['meal_price'] = order.meal.price
            order_dict['caterer_name'] = order.meal.caterer.name if order.meal.caterer else 'Unknown'
            order_dict['caterer_email'] = order.meal.caterer.email if order.meal.caterer else 'Unknown'
        else:
            order_dict['meal_name'] = 'Unknown Meal'
            order_dict['meal_price'] = 0
            order_dict['caterer_name'] = 'Unknown'
            order_dict['caterer_email'] = 'Unknown'
        
        # Add customer details
        if order.user:
            order_dict['customer_name'] = order.user.name
            order_dict['customer_email'] = order.user.email
        else:
            order_dict['customer_name'] = 'Unknown'
            order_dict['customer_email'] = 'Unknown'
        
        orders_with_details.append(order_dict)
    
    return jsonify(orders_with_details)

@orders_bp.route('/orders', methods=['POST'])
@jwt_required()
@roles_required('customer')
def create_order():
    """
    Create a new order (direct meal order)
    ---
    tags:
      - Orders
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            meal_id:
              type: integer
            quantity:
              type: integer
            special_instructions:
              type: string
    responses:
      201:
        description: Order created
    """
    try:
        data = request.get_json()
        current_user_email = get_jwt_identity()
        user = User.query.filter_by(email=current_user_email).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        meal_id = data.get('meal_id')
        quantity = data.get('quantity', 1)
        special_instructions = data.get('special_instructions', '')
        
        if not meal_id:
            return jsonify({'error': 'meal_id is required'}), 400
            
        meal = Meal.query.get(meal_id)
        if not meal:
            return jsonify({'error': 'Meal not found'}), 404
            
        if not meal.available:
            return jsonify({'error': 'Meal is not available'}), 400
            
        total_price = meal.price * quantity
        
        order = Order(
            user_id=user.id,
            meal_id=meal_id,
            quantity=quantity,
            total_price=total_price,
            special_instructions=special_instructions
        )
        
        db.session.add(order)
        db.session.commit()
        
        return jsonify({
            'message': 'Order created successfully',
            'order': order.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@orders_bp.route('/orders/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    """
    Get an order by ID
    ---
    tags:
      - Orders
    parameters:
      - in: path
        name: order_id
        type: integer
        required: true
        description: The order ID
    responses:
      200:
        description: Order data
    """
    order = Order.query.get_or_404(order_id)
    return jsonify(order.to_dict())

@orders_bp.route('/orders/<int:order_id>', methods=['PUT'])
@jwt_required()
def update_order(order_id):
    """
    Update an order by ID
    ---
    tags:
      - Orders
    parameters:
      - in: path
        name: order_id
        type: integer
        required: true
        description: The order ID
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            status:
              type: string
    responses:
      200:
        description: Order updated
    """
    order = Order.query.get_or_404(order_id)
    data = request.get_json()
    if 'status' in data:
        order.status = data['status']
    db.session.commit()
    return jsonify(order.to_dict())

@orders_bp.route('/orders/<int:order_id>', methods=['DELETE'])
@jwt_required()
def delete_order(order_id):
    """
    Delete an order by ID (customers can cancel their own orders, admins can delete any)
    ---
    tags:
      - Orders
    parameters:
      - in: path
        name: order_id
        type: integer
        required: true
        description: The order ID
    responses:
      200:
        description: Order deleted
      403:
        description: Not authorized to delete this order
    """
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()
    order = Order.query.get_or_404(order_id)
    
    # Check if user can delete this order
    # Customers can only delete their own orders
    # Admins can delete any order
    if user.role == 'admin' or order.user_id == user.id:
        db.session.delete(order)
        db.session.commit()
        return jsonify({'message': 'Order deleted'})
    else:
        return jsonify({'error': 'Not authorized to delete this order'}), 403

@orders_bp.route('/orders/<int:order_id>/complete', methods=['PUT'])
@jwt_required()
@roles_required('caterer', 'admin')
def complete_order(order_id):
    """
    Complete an order by ID (caterer only)
    ---
    tags:
      - Orders
    parameters:
      - in: path
        name: order_id
        type: integer
        required: true
        description: The order ID
    responses:
      200:
        description: Order completed
      403:
        description: Not authorized to complete this order
      404:
        description: Order not found
    """
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()
    order = Order.query.get_or_404(order_id)
    
    # Check if the order belongs to this caterer's meals
    if order.meal.caterer_id != user.id:
        return jsonify({'error': 'Not authorized to complete this order'}), 403
    
    # Update order status to completed
    order.status = 'completed'
    db.session.commit()
    
    return jsonify({
        'message': 'Order completed successfully',
        'order': order.to_dict()
    })

@orders_bp.route('/orders/<int:order_id>/cancel', methods=['PUT'])
@jwt_required()
@roles_required('customer')
def cancel_order(order_id):
    """
    Cancel an order by ID (customer only, can only cancel their own orders)
    ---
    tags:
      - Orders
    parameters:
      - in: path
        name: order_id
        type: integer
        required: true
        description: The order ID
    responses:
      200:
        description: Order cancelled
      403:
        description: Not authorized to cancel this order
    """
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()
    order = Order.query.get_or_404(order_id)
    
    # Check if this is the customer's own order
    if order.user_id == user.id:
        order.status = 'cancelled'
        db.session.commit()
        return jsonify(order.to_dict())
    else:
        return jsonify({'error': 'Not authorized to cancel this order'}), 403

@orders_bp.route('/orders/history', methods=['GET'])
@jwt_required()
def get_order_history():
    """
    Get order history for the current user
    ---
    tags:
      - Orders
    responses:
      200:
        description: List of user's orders with meal details
    """
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()
    orders = Order.query.filter_by(user_id=user.id).all()
    
    orders_with_details = []
    for order in orders:
        order_dict = order.to_dict()
        # Add meal details
        if order.meal:
            order_dict['meal_name'] = order.meal.name
            order_dict['meal_price'] = order.meal.price
            order_dict['caterer_name'] = order.meal.caterer.name if order.meal.caterer else 'Unknown'
            order_dict['caterer_email'] = order.meal.caterer.email if order.meal.caterer else 'Unknown'
        else:
            order_dict['meal_name'] = 'Unknown Meal'
            order_dict['meal_price'] = 0
            order_dict['caterer_name'] = 'Unknown'
            order_dict['caterer_email'] = 'Unknown'
        
        orders_with_details.append(order_dict)
    
    return jsonify(orders_with_details) 