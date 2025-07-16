from flask import Blueprint

orders_bp = Blueprint('orders_bp', __name__)

@orders_bp.route('/orders/test')
def test_orders():
    return {"message": "✅ Orders route working"}
