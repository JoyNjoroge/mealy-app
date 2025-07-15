from flask import Flask, request, jsonify
from models import db, migrate, login_manager, Admin, User, Order, Vendor
from seed import seed_data
from flask_cors import CORS
from flask_login import LoginManager
import os
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URI")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")

db.init_app(app)
migrate.init_app(app, db)
login_manager.init_app(app)

with app.app_context():
    db.create_all()

@app.cli.command('seed')
def seed():
    with app.app_context():
        seed_data()
        print("Database seeded successfully.")

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/')
def index():
    return "Welcome to the Mealy App Backend!"


# users crud
@app.route('/users', methods=['GET', 'POST'])
def users():
    if request.method == 'POST':
        data = request.get_json()
        new_user = User(username=data['username'], password=data['password'])
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "User created", "user": {"id": new_user.id, "username": new_user.username}}), 201

    users = User.query.all()
    return jsonify([{"id": u.id, "username": u.username} for u in users])


@app.route('/users/<int:user_id>', methods=['GET', 'PUT', 'DELETE'])
def user_detail(user_id):
    user = User.query.get_or_404(user_id)

    if request.method == 'GET':
        return jsonify({"id": user.id, "username": user.username})

    elif request.method == 'PUT':
        data = request.get_json()
        user.username = data.get('username', user.username)
        user.password = data.get('password', user.password)
        db.session.commit()
        return jsonify({"message": "User updated"})

    elif request.method == 'DELETE':
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "User deleted"})

@app.route('/vendors', methods=['GET', 'POST'])
def vendors():
    if request.method == 'POST':
        data = request.get_json()
        new_vendor = Vendor(name=data['name'])
        db.session.add(new_vendor)
        db.session.commit()
        return jsonify({"message": "Vendor created", "vendor": {"id": new_vendor.id, "name": new_vendor.name}}), 201

    vendors = Vendor.query.all()
    return jsonify([{"id": v.id, "name": v.name} for v in vendors])


@app.route('/vendors/<int:vendor_id>', methods=['GET', 'PUT', 'DELETE'])
def vendor_detail(vendor_id):
    vendor = Vendor.query.get_or_404(vendor_id)

    if request.method == 'GET':
        return jsonify({"id": vendor.id, "name": vendor.name})

    elif request.method == 'PUT':
        data = request.get_json()
        vendor.name = data.get('name', vendor.name)
        db.session.commit()
        return jsonify({"message": "Vendor updated"})

    elif request.method == 'DELETE':
        db.session.delete(vendor)
        db.session.commit()
        return jsonify({"message": "Vendor deleted"})

# orders crud
@app.route('/orders', methods=['GET', 'POST'])
def orders():
    if request.method == 'POST':
        data = request.get_json()
        new_order = Order(
            user_id=data['user_id'],
            vendor_id=data['vendor_id'],
            product_name=data['product_name'],
            quantity=data['quantity'],
            status=data.get('status', 'pending')
        )
        db.session.add(new_order)
        db.session.commit()
        return jsonify({"message": "Order created", "order": {
            "id": new_order.id,
            "product_name": new_order.product_name,
            "status": new_order.status
        }}), 201

    orders = Order.query.all()
    return jsonify([{
        "id": o.id,
        "product_name": o.product_name,
        "quantity": o.quantity,
        "status": o.status,
        "user_id": o.user_id,
        "vendor_id": o.vendor_id
    } for o in orders])


@app.route('/orders/<int:order_id>', methods=['GET', 'PUT', 'DELETE'])
def order_detail(order_id):
    order = Order.query.get_or_404(order_id)

    if request.method == 'GET':
        return jsonify({
            "id": order.id,
            "product_name": order.product_name,
            "quantity": order.quantity,
            "status": order.status,
            "user_id": order.user_id,
            "vendor_id": order.vendor_id
        })

    elif request.method == 'PUT':
        data = request.get_json()
        order.product_name = data.get('product_name', order.product_name)
        order.quantity = data.get('quantity', order.quantity)
        order.status = data.get('status', order.status)
        order.user_id = data.get('user_id', order.user_id)
        order.vendor_id = data.get('vendor_id', order.vendor_id)
        db.session.commit()
        return jsonify({"message": "Order updated"})

    elif request.method == 'DELETE':
        db.session.delete(order)
        db.session.commit()
        return jsonify({"message": "Order deleted"})

