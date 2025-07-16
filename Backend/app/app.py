from flask import Flask, request, jsonify, redirect, url_for, render_template, make_response
from flask_login import LoginManager, login_user, login_required, logout_user
from flask_cors import CORS
from .models import db, migrate, User, Order, Notification, Meal, Menu, MenuItem
from .seed import seed_data
import os
from dotenv import load_dotenv
import jwt
import uuid
from datetime import datetime, timezone, timedelta
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
import cloudinary
import cloudinary.uploader

load_dotenv()

app = Flask(__name__)
CORS(app)
login_manager = LoginManager()

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URI")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")

# Cloudinary config
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

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

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.cookies.get('jwt_token')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.filter_by(public_id=data['public_id']).first()
        except Exception:
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

@app.route('/')
def index():
    return "Welcome to the Mealy App Backend!"

# User CRUD
@app.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@app.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

@app.route('/users', methods=['POST'])
def create_user():
    data = request.json
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'User already exists.'}), 400
    hashed_password = generate_password_hash(data['password'])
    new_user = User(
        public_id=str(uuid.uuid4()),
        name=data['name'],
        email=data['email'],
        password=hashed_password,
        role=data.get('role', 'customer')
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify(new_user.to_dict()), 201

@app.route('/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.json
    user.name = data.get('name', user.name)
    user.email = data.get('email', user.email)
    if 'password' in data:
        user.password = generate_password_hash(data['password'])
    user.role = data.get('role', user.role)
    db.session.commit()
    return jsonify(user.to_dict())

@app.route('/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted'})

@app.route('/meals', methods=['GET'])
def get_meals():
    meals = Meal.query.all()
    return jsonify([meal.to_dict() for meal in meals])

@app.route('/meals/<int:meal_id>', methods=['GET'])
def get_meal(meal_id):
    meal = Meal.query.get_or_404(meal_id)
    return jsonify(meal.to_dict())

@app.route('/meals', methods=['POST'])
def create_meal():
    name = request.form.get('name')
    description = request.form.get('description')
    price = request.form.get('price')
    image = request.files.get('image')
    image_url = None
    if image:
        upload_result = cloudinary.uploader.upload(image)
        image_url = upload_result.get('secure_url')
    meal = Meal(
        name=name,
        description=description,
        price=float(price),
        image_url=image_url
    )
    db.session.add(meal)
    db.session.commit()
    return jsonify(meal.to_dict()), 201

@app.route('/meals/<int:meal_id>', methods=['PUT'])
def update_meal(meal_id):
    meal = Meal.query.get_or_404(meal_id)
    data = request.form
    meal.name = data.get('name', meal.name)
    meal.description = data.get('description', meal.description)
    meal.price = float(data.get('price', meal.price))
    image = request.files.get('image')
    if image:
        upload_result = cloudinary.uploader.upload(image)
        meal.image_url = upload_result.get('secure_url')
    db.session.commit()
    return jsonify(meal.to_dict())

@app.route('/meals/<int:meal_id>', methods=['DELETE'])
def delete_meal(meal_id):
    meal = Meal.query.get_or_404(meal_id)
    db.session.delete(meal)
    db.session.commit()
    return jsonify({'message': 'Meal deleted'})

# order
@app.route('/orders', methods=['GET'])
@token_required
def get_orders(current_user):
    orders = Order.query.filter_by(user_id=current_user.id).all()
    return jsonify([order.to_dict() for order in orders])

@app.route('/orders/<int:order_id>', methods=['GET'])
@token_required
def get_order(current_user, order_id):
    order = Order.query.filter_by(id=order_id, user_id=current_user.id).first_or_404()
    return jsonify(order.to_dict())

@app.route('/orders', methods=['POST'])
@token_required
def create_order(current_user):
    data = request.json
    new_order = Order(
        user_id=current_user.id,
        menu_item_id=data['menu_item_id'],
        quantity=data['quantity'],
        total_price=data['total_price']
    )
    db.session.add(new_order)
    db.session.commit()
    return jsonify(new_order.to_dict()), 201

@app.route('/orders/<int:order_id>', methods=['PUT'])
@token_required
def update_order(current_user, order_id):
    order = Order.query.filter_by(id=order_id, user_id=current_user.id).first_or_404()
    data = request.json
    order.quantity = data.get('quantity', order.quantity)
    order.total_price = data.get('total_price', order.total_price)
    db.session.commit()
    return jsonify(order.to_dict())

@app.route('/orders/<int:order_id>', methods=['DELETE'])
@token_required
def delete_order(current_user, order_id):
    order = Order.query.filter_by(id=order_id, user_id=current_user.id).first_or_404()
    db.session.delete(order)
    db.session.commit()
    return jsonify({'message': 'Order deleted'})

# Notifications
@app.route('/notifications', methods=['GET'])
@token_required
def get_notifications(current_user):
    notifications = Notification.query.filter_by(user_id=current_user.id).all()
    return jsonify([notification.to_dict() for notification in notifications])

@app.route('/notifications', methods=['POST'])
@token_required
def create_notification(current_user):
    data = request.json
    notif = Notification(
        user_id=current_user.id,
        message=data['message'],
        read=False
    )
    db.session.add(notif)
    db.session.commit()
    return jsonify(notif.to_dict()), 201

@app.route('/notifications/<int:notif_id>', methods=['PUT'])
@token_required
def update_notification(current_user, notif_id):
    notif = Notification.query.filter_by(id=notif_id, user_id=current_user.id).first_or_404()
    notif.read = request.json.get('read', notif.read)
    db.session.commit()
    return jsonify(notif.to_dict())

@app.route('/notifications/<int:notif_id>', methods=['DELETE'])
@token_required
def delete_notification(current_user, notif_id):
    notif = Notification.query.filter_by(id=notif_id, user_id=current_user.id).first_or_404()
    db.session.delete(notif)
    db.session.commit()
    return jsonify({'message': 'Notification deleted'})

# Menu
@app.route('/menus', methods=['GET'])
def get_menus():
    menus = Menu.query.all()
    return jsonify([menu.to_dict() for menu in menus])

@app.route('/menus/<int:menu_id>', methods=['GET'])
def get_menu(menu_id):
    menu = Menu.query.get_or_404(menu_id)
    return jsonify(menu.to_dict())

@app.route('/menus', methods=['POST'])
def create_menu():
    data = request.json
    menu = Menu(date=datetime.strptime(data['date'], "%Y-%m-%d").date())
    db.session.add(menu)
    db.session.commit()
    return jsonify(menu.to_dict()), 201

@app.route('/menus/<int:menu_id>', methods=['PUT'])
def update_menu(menu_id):
    menu = Menu.query.get_or_404(menu_id)
    data = request.json
    if 'date' in data:
        menu.date = datetime.strptime(data['date'], "%Y-%m-%d").date()
    db.session.commit()
    return jsonify(menu.to_dict())

@app.route('/menus/<int:menu_id>', methods=['DELETE'])
def delete_menu(menu_id):
    menu = Menu.query.get_or_404(menu_id)
    db.session.delete(menu)
    db.session.commit()
    return jsonify({'message': 'Menu deleted'})

# MenuItem
@app.route('/menuitems', methods=['GET'])
def get_menuitems():
    items = MenuItem.query.all()
    return jsonify([item.to_dict() for item in items])

@app.route('/menuitems/<int:item_id>', methods=['GET'])
def get_menuitem(item_id):
    item = MenuItem.query.get_or_404(item_id)
    return jsonify(item.to_dict())

@app.route('/menuitems', methods=['POST'])
def create_menuitem():
    data = request.json
    item = MenuItem(menu_id=data['menu_id'], meal_id=data['meal_id'])
    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201

@app.route('/menuitems/<int:item_id>', methods=['PUT'])
def update_menuitem(item_id):
    item = MenuItem.query.get_or_404(item_id)
    data = request.json
    item.menu_id = data.get('menu_id', item.menu_id)
    item.meal_id = data.get('meal_id', item.meal_id)
    db.session.commit()
    return jsonify(item.to_dict())

@app.route('/menuitems/<int:item_id>', methods=['DELETE'])
def delete_menuitem(item_id):
    item = MenuItem.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return jsonify({'message': 'MenuItem deleted'})

# Auth
@app.route('/signup', methods=['POST'])
def register():
    data = request.json
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'User already exists. Please login.'}), 400
    hashed_password = generate_password_hash(data['password'])
    new_user = User(public_id=str(uuid.uuid4()), name=data['name'], email=data['email'], password=hashed_password, role='customer')
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully.'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data['email']
    password = data['password']
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({'message': 'Invalid email or password'}), 401
    token = jwt.encode({'public_id': user.public_id, 'exp': datetime.now(timezone.utc) + timedelta(hours=1)},
                       app.config['SECRET_KEY'], algorithm="HS256")
    response = jsonify({'token': token})
    response.set_cookie('jwt_token', token)
    return response

@app.route("/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully."})

if __name__ == '__main__':
    app.run(debug=True)