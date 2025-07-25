from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.core.database import db
from app.models.order import Order
from app.models.user import User
from app.models.restaurant import MenuItem
from app.api.decorators import roles_required
from app.api.utils import ValidationError

orders_bp = Blueprint('orders', __name__)

@orders_bp.route('/orders', methods=['GET'])
@jwt_required()
def get_orders():
    orders = Order.query.all()
    return jsonify([order.to_dict() for order in orders])

@orders_bp.route('/orders', methods=['POST'])
@jwt_required()
@roles_required('customer')
def create_order():
    data = request.get_json()
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()
    item = MenuItem.query.get_or_404(data['menu_item_id'])
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
    return jsonify(order.to_dict()), 201

@orders_bp.route('/orders/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    order = Order.query.get_or_404(order_id)
    return jsonify(order.to_dict())

@orders_bp.route('/orders/<int:order_id>', methods=['PUT'])
@jwt_required()
def update_order(order_id):
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
    order = Order.query.get_or_404(order_id)
    db.session.delete(order)
    db.session.commit()
    return jsonify({'message': 'Order deleted'})

@orders_bp.route('/orders/history', methods=['GET'])
@jwt_required()
def get_order_history():
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()
    orders = Order.query.filter_by(user_id=user.id).all()
    return jsonify([order.to_dict() for order in orders]) 