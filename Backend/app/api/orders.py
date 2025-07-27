from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.core.database import db
from app.models.order import Order
from app.models.user import User
from app.models.restaurant import MenuItem
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
            
        menu_item_id = data.get('menu_item_id')
        quantity = data.get('quantity', 1)
        
        if not menu_item_id:
            return jsonify({'error': 'menu_item_id is required'}), 400
            
        item = MenuItem.query.get(menu_item_id)
        if not item:
            return jsonify({'error': 'Menu item not found'}), 404
            
        total_price = item.meal.price * quantity
        
        order = Order(
            user_id=user.id,
            menu_item_id=item.id,
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
    Get all orders
    ---
    tags:
      - Orders
    responses:
      200:
        description: List of orders
    """
    orders = Order.query.all()
    return jsonify([order.to_dict() for order in orders])

@orders_bp.route('/orders', methods=['POST'])
@jwt_required()
@roles_required('customer')
def create_order():
    """
    Create a new order (customer only)
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
            menu_item_id:
              type: integer
            quantity:
              type: integer
    responses:
      201:
        description: Order created
    """
    data = request.get_json()
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()
    
    menu_item_id = data.get('menu_item_id')
    if not menu_item_id:
        return jsonify({'error': 'menu_item_id is required'}), 400
        
    item = MenuItem.query.get_or_404(menu_item_id)
    quantity = data.get('quantity', 1)
    total_price = item.meal.price * quantity
    order = Order(
        user_id=user.id,
        menu_item_id=item.id,
        quantity=quantity,
        total_price=total_price
    )
    db.session.add(order)
    db.session.commit()

    # Send email to customer
    # send_email(
    #     user.email,
    #     "Order Placed Successfully",
    #     f"<h1>Thank you for your order!</h1><p>Your order for {item.meal.name} (x{quantity}) has been placed.</p>"
    # )
    # Send email to caterer
    # caterer = item.meal.caterer
    # if caterer and caterer.email:
    #     send_email(
    #         caterer.email,
    #         "New Order Received",
    #         f"<h1>New Order!</h1><p>{user.name} placed an order for {item.meal.name} (x{quantity}).</p>"
    #     )

    return jsonify(order.to_dict()), 201

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
@roles_required('admin')
def delete_order(order_id):
    """
    Delete an order by ID (admin only)
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
    """
    order = Order.query.get_or_404(order_id)
    db.session.delete(order)
    db.session.commit()
    return jsonify({'message': 'Order deleted'})

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
        description: List of user's orders
    """
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()
    orders = Order.query.filter_by(user_id=user.id).all()
    return jsonify([order.to_dict() for order in orders]) 