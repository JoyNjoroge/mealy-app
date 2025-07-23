import os
from flask import Flask, request, jsonify, make_response
from flask_migrate import Migrate
from flask_restful import Api, Resource
from flask_jwt_extended import (
    JWTManager, jwt_required, create_access_token,
    get_jwt_identity, get_jwt
)
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta, datetime
from dotenv import load_dotenv
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from sqlalchemy import or_, and_, func
import cloudinary
import cloudinary.uploader
import click
from functools import wraps
from http import HTTPStatus
from .models import db, User, Meal, Menu, MenuItem, Order, Notification
from flasgger import Swagger
from .seed import seed_data
import smtplib
from email.mime.text import MIMEText
# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
swagger = Swagger(app)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

# Initialize extensions
db.init_app(app)
migrate = Migrate(app, db)
api = Api(app)
jwt = JWTManager(app)


# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)



# Custom error classes
class MealAPIError(Exception):
    def __init__(self, message, status_code=400, payload=None):
        super().__init__()
        self.message = message
        self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        rv['status_code'] = self.status_code
        return rv

class NotFoundError(MealAPIError):
    def __init__(self, message="Resource not found", payload=None):
        super().__init__(message, 404, payload)

class UnauthorizedError(MealAPIError):
    def __init__(self, message="Unauthorized access", payload=None):
        super().__init__(message, 401, payload)

class ForbiddenError(MealAPIError):
    def __init__(self, message="Forbidden", payload=None):
        super().__init__(message, 403, payload)

class ValidationError(MealAPIError):
    def __init__(self, message="Validation error", payload=None):
        super().__init__(message, 422, payload)

@app.cli.command('seed')
def seed():
    with app.app_context():
        seed_data()
        print("Database seeded successfully.")

# Error handlers
@app.errorhandler(MealAPIError)
def handle_meal_api_error(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response

@app.errorhandler(404)
def not_found(error):
    return jsonify({"message": "Resource not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"message": "Internal server error"}), 500

# Role-based access control decorator
def roles_required(*roles):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            current_user = get_jwt_identity()
            user = User.query.filter_by(email=current_user).first()
            
            if not user:
                raise UnauthorizedError("User not found")
            
            if user.role.name not in roles:
                raise ForbiddenError("You don't have permission to access this resource")
            
            return fn(*args, **kwargs)
        return decorator
    return wrapper

# Utility functions

def send_email(to_email, subject, content):
    try:
        msg = MIMEText(content, 'html')
        msg['Subject'] = subject
        msg['From'] = os.getenv('MAIL_USERNAME')
        msg['To'] = to_email

        with smtplib.SMTP(os.getenv('MAIL_SERVER'), int(os.getenv('MAIL_PORT'))) as server:
            server.starttls()
            server.login(os.getenv('MAIL_USERNAME'), os.getenv('MAIL_PASSWORD'))
            server.send_message(msg)

    except Exception as e:
        app.logger.error(f"Email send failed: {str(e)}")
    print("EMAIL ENV:", os.getenv('MAIL_USERNAME'), os.getenv('MAIL_PASSWORD'))



def paginate(query, page, per_page):
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    return {
        'items': [item.to_dict() for item in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': paginated.page
    }

# Auth Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    """
Register a new user
---
tags:
  - Auth
parameters:
  - in: body
    name: body
    required: true
    schema:
      type: object
      properties:
        name:
          type: string
          description: string
        email:
          type: string
          description: string
        password:
          type: string
          description: string
        role:
          type: string
          description: string (customer, caterer, admin)
responses:
  201:
    description: User created successfully
  422:
    description: Validation error
"""
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        raise ValidationError("Email and password are required")
    
    if User.query.filter_by(email=data['email']).first():
        raise ValidationError("Email already exists")
    
    # ✅ Assign the hashed password
    hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
    
    try:
        user = User(
            name=data.get('name', ''),
            email=data['email'],
            password=hashed_password,
            role=data.get('role', 'customer')
        )
        db.session.add(user)
        db.session.commit()
        
        # Send welcome email
        send_email(
            user.email,
            "Welcome to Mealy",
            f"<h1>Welcome {user.name}</h1><p>Your account has been created successfully.</p>"
        )
        
        return jsonify({
            'message': 'User created successfully',
            'user': user.to_dict()
        }), HTTPStatus.CREATED

    except Exception as e:
        db.session.rollback()
        raise MealAPIError(str(e))


@app.route('/api/auth/login', methods=['POST'])
def login():
    """
Log in and get JWT token
---
tags:
  - Auth
parameters:
  - in: body
    name: body
    required: true
    schema:
      type: object
      properties:
        email:
          type: string
          description: string
        password:
          type: string
          description: string
responses:
  200:
    description: Login successful
  401:
    description: Invalid credentials
"""
    data = request.get_json()

    if not data or not data.get('email') or not data.get('password'):
        raise ValidationError("Email and password are required")
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not check_password_hash(user.password, data['password']):
        raise UnauthorizedError("Invalid credentials")
    
    access_token = create_access_token(identity=user.email, additional_claims={'role': user.role.name})
    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'user': user.to_dict()
    }), HTTPStatus.OK

# User Routes
@app.route('/api/users', methods=['GET'])
@jwt_required()
@roles_required('admin')
def get_users():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    users = User.query.order_by(User.id)
    return jsonify(paginate(users, page, per_page))

@app.route('/api/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    current_user_email = get_jwt_identity()
    current_user = User.query.filter_by(email=current_user_email).first()
    
    user = User.query.get_or_404(user_id)
    
    # Users can only view their own profile unless they're admin
    if current_user.id != user.id and current_user.role.name != 'admin':
        raise ForbiddenError()
    
    return jsonify(user.to_dict())

@app.route('/api/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """
Update a user's profile (self or admin only)
---
tags:
  - Users
security:
  - BearerAuth: []
parameters:
  - name: user_id
    in: path
    type: integer
    required: true
    description: The ID of the user to update
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        properties:
          name:
            type: string
          email:
            type: string
          password:
            type: string
          role:
            type: string
            description: Only admins can change the role
responses:
  200:
    description: User updated successfully
  403:
    description: Forbidden – You can only update your own profile (unless you're admin)
  404:
    description: User not found
  422:
    description: Validation error (e.g. email already exists)
"""
    current_user_email = get_jwt_identity()
    current_user = User.query.filter_by(email=current_user_email).first()
    
    user = User.query.get_or_404(user_id)
    
    # Users can only update their own profile unless they're admin
    if current_user.id != user.id and current_user.role.name != 'admin':
        raise ForbiddenError()
    
    data = request.get_json()
    
    try:
        if 'name' in data:
            user.name = data['name']
        if 'email' in data and data['email'] != user.email:
            if User.query.filter_by(email=data['email']).first():
                raise ValidationError("Email already exists")
            user.email = data['email']
        if 'password' in data:
            user.password = generate_password_hash(data['password'], method='sha256')
        if 'role' in data and current_user.role.name == 'admin':
            user.role = data['role']
        
        db.session.commit()
        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        raise MealAPIError(str(e))

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@roles_required('admin')
def delete_user(user_id):
    """
Delete a user by ID (admin only)
---
tags:
  - Users
parameters:
  - name: user_id
    in: path
    type: integer
    required: true
    description: The ID of the user to delete
responses:
  200:
    description: User deleted successfully
  404:
    description: User not found
  403:
    description: Forbidden – requires admin role
"""

    user = User.query.get_or_404(user_id)
    
    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'User deleted successfully'})
    except Exception as e:
        db.session.rollback()
        raise MealAPIError(str(e))

# Meal Routes
@app.route('/api/meals', methods=['GET'])
def get_meals():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '')
    
    query = Meal.query
    
    if search:
        query = query.filter(or_(
            Meal.name.ilike(f'%{search}%'),
            Meal.description.ilike(f'%{search}%')
        ))
    
    query = query.order_by(Meal.id)
    return jsonify(paginate(query, page, per_page))


@app.route('/api/meals/<int:meal_id>', methods=['GET'])
def get_meal(meal_id):
    """
Get all meals
---
tags:
  - Meals
parameters:
  - name: page
    in: query
    type: int
    required: false
    description: int
  - name: per_page
    in: query
    type: int
    required: false
    description: int
  - name: search
    in: query
    type: string
    required: false
    description: string
responses:
  200:
    description: List of meals
"""
    meal = Meal.query.get_or_404(meal_id)
    return jsonify(meal.to_dict())

@app.route('/api/meals', methods=['POST'])
@jwt_required()
@roles_required('caterer', 'admin') 
def create_meal():
    """
Create a new meal (requires caterer/admin)
---
tags:
  - Meals
consumes:
  - multipart/form-data
parameters:
  - name: name
    in: formData
    type: string
    required: true
    description: string
  - name: description
    in: formData
    type: string
    required: true
    description: string
  - name: price
    in: formData
    type: string
    required: true
    description: number
  - name: image
    in: formData
    type: file
    required: true
    description: file
responses:
  201:
    description: Meal created successfully
  422:
    description: Validation error
"""

    current_user_email = get_jwt_identity()
    current_user = User.query.filter_by(email=current_user_email).first()

    data = request.form.to_dict()
    image_file = request.files.get('image')

    if not data.get('name') or not data.get('price'):
        raise ValidationError("Name and price are required")

    if not image_file:
        raise ValidationError("Image is required")

    try:
        upload_result = cloudinary.uploader.upload(image_file)
        image_url = upload_result.get('secure_url')

        meal = Meal(
            name=data['name'],
            description=data.get('description', ''),
            price=float(data['price']),
            caterer_id=current_user.id,
            image_url=image_url
        )
        db.session.add(meal)
        db.session.commit()

        return jsonify({
            'message': 'Meal created successfully',
            'meal': meal.to_dict()
        }), HTTPStatus.CREATED

    except Exception as e:
        db.session.rollback()
        raise MealAPIError(str(e))


@app.route('/api/meals/<int:meal_id>', methods=['DELETE'])
@jwt_required()
@roles_required('caterer', 'admin')
def delete_meal(meal_id):
    """
Delete a meal by ID (admin or meal creator only)
---
tags:
  - Meals
security:
  - BearerAuth: []
parameters:
  - name: meal_id
    in: path
    type: integer
    required: true
    description: The ID of the meal to delete
responses:
  200:
    description: Meal deleted successfully
  403:
    description: Forbidden – only admin or the meal creator can delete
  404:
    description: Meal not found
"""

    current_user_email = get_jwt_identity()
    current_user = User.query.filter_by(email=current_user_email).first()
    
    meal = Meal.query.get_or_404(meal_id)
    
    # Only the meal creator or admin can delete
    if meal.caterer_id != current_user.id and current_user.role.name != 'admin':
        raise ForbiddenError()
    
    try:
        db.session.delete(meal)
        db.session.commit()
        return jsonify({'message': 'Meal deleted successfully'})
    except Exception as e:
        db.session.rollback()
        raise MealAPIError(str(e))

# Menu Routes
@app.route('/api/menus', methods=['GET'])
def get_menus():
    """
Get all menus
---
tags:
  - Menus
parameters:
  - name: date
    in: query
    type: string
    required: false
    description: string
responses:
  200:
    description: List of menus
"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    date = request.args.get('date')
    
    query = Menu.query
    
    if date:
        try:
            date_obj = datetime.strptime(date, '%Y-%m-%d').date()
            query = query.filter(Menu.date == date_obj)
        except ValueError:
            raise ValidationError("Invalid date format. Use YYYY-MM-DD")
    
    query = query.order_by(Menu.date.desc())
    return jsonify(paginate(query, page, per_page))

@app.route('/api/menus', methods=['POST'])
@jwt_required()
@roles_required('caterer', 'admin')
def create_menu():
    """
Create a new menu (caterer/admin)
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
          description: string (YYYY-MM-DD)
responses:
  201:
    description: Menu created
  422:
    description: Validation error
"""
    current_user_email = get_jwt_identity()
    current_user = User.query.filter_by(email=current_user_email).first()
    
    data = request.get_json()
    
    if not data or not data.get('date'):
        raise ValidationError("Date is required")
    
    try:
        date_obj = datetime.strptime(data['date'], '%Y-%m-%d').date()
    except ValueError:
        raise ValidationError("Invalid date format. Use YYYY-MM-DD")
    
    # Check if menu for this date already exists
    if Menu.query.filter_by(date=date_obj).first():
        raise ValidationError("Menu for this date already exists")
    
    try:
        menu = Menu(
            date=date_obj,
            caterer_id=current_user.id
        )
        db.session.add(menu)
        db.session.commit()
        
        return jsonify({
            'message': 'Menu created successfully',
            'menu': menu.to_dict()
        }), HTTPStatus.CREATED
    except Exception as e:
        db.session.rollback()
        raise MealAPIError(str(e))

@app.route('/api/menus/<int:menu_id>', methods=['GET'])
def get_menu(menu_id):
    menu = Menu.query.get_or_404(menu_id)
    return jsonify(menu.to_dict(rules=('menu_items', 'menu_items.meal')))

@app.route('/api/menus/<int:menu_id>', methods=['PUT'])
@jwt_required()
@roles_required('caterer', 'admin')
def update_menu(menu_id):
    """
Update a menu by ID (caterer or admin only)
---
tags:
  - Menus
security:
  - BearerAuth: []
parameters:
  - name: menu_id
    in: path
    type: integer
    required: true
    description: The ID of the menu to update
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        properties:
          date:
            type: string
            format: date
            description: New date for the menu (YYYY-MM-DD)
responses:
  200:
    description: Menu updated successfully
  403:
    description: Forbidden – You must be the menu creator or an admin
  404:
    description: Menu not found
  422:
    description: Validation error (e.g., date format or conflict)
"""
    current_user_email = get_jwt_identity()
    current_user = User.query.filter_by(email=current_user_email).first()
    
    menu = Menu.query.get_or_404(menu_id)
    
    # Only the menu creator or admin can update
    if menu.caterer_id != current_user.id and current_user.role.name != 'admin':
        raise ForbiddenError()
    
    data = request.get_json()
    
    try:
        if 'date' in data:
            date_obj = datetime.strptime(data['date'], '%Y-%m-%d').date()
            
            # Check if another menu exists with this new date
            existing = Menu.query.filter(and_(
                Menu.date == date_obj,
                Menu.id != menu.id
            )).first()
            
            if existing:
                raise ValidationError("Another menu already exists for this date")
            
            menu.date = date_obj
        
        db.session.commit()
        return jsonify({
            'message': 'Menu updated successfully',
            'menu': menu.to_dict()
        })
    except ValueError:
        raise ValidationError("Invalid date format. Use YYYY-MM-DD")
    except Exception as e:
        db.session.rollback()
        raise MealAPIError(str(e))

@app.route('/api/menus/<int:menu_id>', methods=['DELETE'])
@jwt_required()
@roles_required('caterer', 'admin')
def delete_menu(menu_id):
    """
Delete a menu by ID (admin or caterer only)
---
tags:
  - Menus
security:
  - BearerAuth: []
parameters:
  - name: menu_id
    in: path
    type: integer
    required: true
    description: The ID of the menu to delete
responses:
  200:
    description: Menu deleted successfully
  403:
    description: Forbidden – only admin or the menu creator can delete
  404:
    description: Menu not found
"""
    current_user_email = get_jwt_identity()
    current_user = User.query.filter_by(email=current_user_email).first()
    
    menu = Menu.query.get_or_404(menu_id)
    
    # Only the menu creator or admin can delete
    if menu.caterer_id != current_user.id and current_user.role.name != 'admin':
        raise ForbiddenError()
    
    try:
        db.session.delete(menu)
        db.session.commit()
        return jsonify({'message': 'Menu deleted successfully'})
    except Exception as e:
        db.session.rollback()
        raise MealAPIError(str(e))

# Menu Item Routes
@app.route('/api/menus/<int:menu_id>/items', methods=['GET'])
def get_menu_items(menu_id):
    menu = Menu.query.get_or_404(menu_id)
    return jsonify([item.to_dict(rules=('meal',)) for item in menu.menu_items])

@app.route('/api/menus/<int:menu_id>/items', methods=['POST'])
@jwt_required()
@roles_required('caterer', 'admin')
def add_menu_item(menu_id):
    current_user_email = get_jwt_identity()
    current_user = User.query.filter_by(email=current_user_email).first()
    
    menu = Menu.query.get_or_404(menu_id)
    
    # Only the menu creator or admin can add items
    if menu.caterer_id != current_user.id and current_user.role.name != 'admin':
        raise ForbiddenError()
    
    data = request.get_json()
    
    if not data or not data.get('meal_id'):
        raise ValidationError("Meal ID is required")
    
    meal = Meal.query.get_or_404(data['meal_id'])
    
    # Check if this meal is already in the menu
    if MenuItem.query.filter_by(menu_id=menu.id, meal_id=meal.id).first():
        raise ValidationError("This meal is already in the menu")
    
    try:
        menu_item = MenuItem(
            menu_id=menu.id,
            meal_id=meal.id
        )
        db.session.add(menu_item)
        db.session.commit()
        
        return jsonify({
            'message': 'Menu item added successfully',
            'menu_item': menu_item.to_dict(rules=('meal',))
        }), HTTPStatus.CREATED
    except Exception as e:
        db.session.rollback()
        raise MealAPIError(str(e))

@app.route('/api/menu-items/<int:item_id>', methods=['DELETE'])
@jwt_required()
@roles_required('caterer', 'admin')
def remove_menu_item(item_id):
    current_user_email = get_jwt_identity()
    current_user = User.query.filter_by(email=current_user_email).first()
    
    menu_item = MenuItem.query.get_or_404(item_id)
    menu = Menu.query.get_or_404(menu_item.menu_id)
    
    # Only the menu creator or admin can remove items
    if menu.caterer_id != current_user.id and current_user.role.name != 'admin':
        raise ForbiddenError()
    
    try:
        db.session.delete(menu_item)
        db.session.commit()
        return jsonify({'message': 'Menu item removed successfully'})
    except Exception as e:
        db.session.rollback()
        raise MealAPIError(str(e))

# Order Routes
@app.route('/api/orders', methods=['GET'])
@jwt_required()
def get_orders():
    """
Get all orders for the logged-in user
---
tags:
  - Orders
parameters:
  - name: page
    in: query
    type: int
    required: false
    description: int
  - name: per_page
    in: query
    type: int
    required: false
    description: int
  - name: status
    in: query
    type: string
    required: false
    description: string
responses:
  200:
    description: Paginated list of orders
"""
    current_user_email = get_jwt_identity()
    current_user = User.query.filter_by(email=current_user_email).first()
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status = request.args.get('status')
    
    query = Order.query
    
    # Customers can only see their own orders
    # Caterers can see orders for their menus
    # Admins can see all orders
    if current_user.role.name == 'customer':
        query = query.filter_by(user_id=current_user.id)
    elif current_user.role.name == 'caterer':
        # Get all menu items for menus created by this caterer
        menu_ids = [menu.id for menu in current_user.menus]
        menu_item_ids = [item.id for item in MenuItem.query.filter(MenuItem.menu_id.in_(menu_ids)).all()]
        query = query.filter(Order.menu_item_id.in_(menu_item_ids))
    
    if status:
        query = query.filter_by(status=status)
    
    query = query.order_by(Order.timestamp.desc())
    return jsonify(paginate(query, page, per_page))

@app.route('/api/orders', methods=['POST'])
@jwt_required()
@roles_required('customer')
def create_order():
    """
Create a new order (requires customer)
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
          type: string
          description: int
        quantity:
          type: string
          description: int
responses:
  201:
    description: Order created successfully
  403:
    description: Forbidden
  422:
    description: Validation error
"""
    current_user_email = get_jwt_identity()
    current_user = User.query.filter_by(email=current_user_email).first()
    
    data = request.get_json()
    
    if not data or not data.get('menu_item_id') or not data.get('quantity'):
        raise ValidationError("Menu item ID and quantity are required")
    
    menu_item = MenuItem.query.get_or_404(data['menu_item_id'])
    
    try:
        total_price = round(menu_item.meal.price * data['quantity'], 2)
        
        order = Order(
            user_id=current_user.id,
            menu_item_id=menu_item.id,
            quantity=data['quantity'],
            total_price=total_price,
            status='pending'
        )
        db.session.add(order)
        db.session.commit()
        
        # Create notification for the caterer
        caterer = User.query.get(menu_item.menu.caterer_id)
        if caterer:
            notification = Notification(
                user_id=caterer.id,
                message=f"New order received for {menu_item.meal.name}",
                read=False
            )
            db.session.add(notification)
            db.session.commit()
        
        return jsonify({
            'message': 'Order created successfully',
            'order': order.to_dict()
        }), HTTPStatus.CREATED
    except Exception as e:
        db.session.rollback()
        raise MealAPIError(str(e))

@app.route('/api/orders/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    current_user_email = get_jwt_identity()
    current_user = User.query.filter_by(email=current_user_email).first()
    
    order = Order.query.get_or_404(order_id)
    
    # Check if user has permission to view this order
    if current_user.role.name == 'customer' and order.user_id != current_user.id:
        raise ForbiddenError()
    elif current_user.role.name == 'caterer':
        menu_item = MenuItem.query.get(order.menu_item_id)
        if not menu_item or menu_item.menu.caterer_id != current_user.id:
            raise ForbiddenError()
    
    return jsonify(order.to_dict(rules=('menu_item', 'menu_item.meal', 'user')))

@app.route('/api/orders/<int:order_id>', methods=['PUT'])
@jwt_required()
def update_order(order_id):
    """
Update an order by ID (customer updates quantity, caterer/admin updates status)
---
tags:
  - Orders
security:
  - BearerAuth: []
parameters:
  - name: order_id
    in: path
    type: integer
    required: true
    description: The ID of the order to update
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        properties:
          quantity:
            type: integer
            description: New quantity for the order (customers only)
          status:
            type: string
            enum: [pending, completed, cancelled]
            description: Order status (caterer/admin only)
responses:
  200:
    description: Order updated successfully
  403:
    description: Forbidden – You don't have permission to update this order
  404:
    description: Order not found
  422:
    description: Validation or processing error
"""
    current_user_email = get_jwt_identity()
    current_user = User.query.filter_by(email=current_user_email).first()
    
    order = Order.query.get_or_404(order_id)
    
    # Check if user has permission to update this order
    if current_user.role.name == 'customer' and order.user_id != current_user.id:
        raise ForbiddenError()
    elif current_user.role.name == 'caterer':
        menu_item = MenuItem.query.get(order.menu_item_id)
        if not menu_item or menu_item.menu.caterer_id != current_user.id:
            raise ForbiddenError()
    
    data = request.get_json()
    
    try:
        if 'quantity' in data and current_user.role.name == 'customer':
            order.quantity = data['quantity']
            order.total_price = round(order.menu_item.meal.price * data['quantity'], 2)
        
        if 'status' in data and current_user.role.name in ['caterer', 'admin']:
            order.status = data['status']
            
            # Create notification for the customer when status changes
            if data['status'] in ['completed', 'cancelled']:
                notification = Notification(
                    user_id=order.user_id,
                    message=f"Your order for {order.menu_item.meal.name} has been {data['status']}",
                    read=False
                )
                db.session.add(notification)
        
        db.session.commit()
        return jsonify({
            'message': 'Order updated successfully',
            'order': order.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        raise MealAPIError(str(e))

@app.route('/api/orders/<int:order_id>', methods=['DELETE'])
@jwt_required()
@roles_required('admin')
def delete_order(order_id):
    """
Delete an order by ID (admin only)
---
tags:
  - Orders
security:
  - BearerAuth: []
parameters:
  - name: order_id
    in: path
    type: integer
    required: true
    description: The ID of the order to delete
responses:
  200:
    description: Order deleted successfully
  403:
    description: Forbidden – requires admin role
  404:
    description: Order not found
"""

    order = Order.query.get_or_404(order_id)
    
    try:
        db.session.delete(order)
        db.session.commit()
        return jsonify({'message': 'Order deleted successfully'})
    except Exception as e:
        db.session.rollback()
        raise MealAPIError(str(e))

# Notification Routes
@app.route('/api/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """
Get current user's notifications
---
tags:
  - Notifications
parameters:
  - name: page
    in: query
    type: int
    required: false
    description: int
  - name: per_page
    in: query
    type: int
    required: false
    description: int
  - name: read
    in: query
    type: bool
    required: false
    description: bool
responses:
  200:
    description: Paginated list of notifications
"""
    current_user_email = get_jwt_identity()
    current_user = User.query.filter_by(email=current_user_email).first()
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    read = request.args.get('read', type=str)
    
    query = Notification.query.filter_by(user_id=current_user.id)
    
    if read is not None:
        query = query.filter_by(read=read.lower() == 'true')
    
    query = query.order_by(Notification.created_at.desc())
    return jsonify(paginate(query, page, per_page))

@app.route('/api/notifications/<int:notification_id>', methods=['GET'])
@jwt_required()
def get_notification(notification_id):
    current_user_email = get_jwt_identity()
    current_user = User.query.filter_by(email=current_user_email).first()
    
    notification = Notification.query.get_or_404(notification_id)
    
    if notification.user_id != current_user.id:
        raise ForbiddenError()
    
    return jsonify(notification.to_dict())

@app.route('/api/notifications/<int:notification_id>', methods=['PUT'])
@jwt_required()
def mark_notification_as_read(notification_id):
    """
Mark a specific notification as read
---
tags:
  - Notifications
security:
  - BearerAuth: []
parameters:
  - name: notification_id
    in: path
    type: integer
    required: true
    description: The ID of the notification to mark as read
responses:
  200:
    description: Notification marked as read
  403:
    description: Forbidden – you can only mark your own notifications
  404:
    description: Notification not found
"""

    current_user_email = get_jwt_identity()
    current_user = User.query.filter_by(email=current_user_email).first()
    
    notification = Notification.query.get_or_404(notification_id)
    
    if notification.user_id != current_user.id:
        raise ForbiddenError()
    
    try:
        notification.read = True
        db.session.commit()
        return jsonify(notification.to_dict())
    except Exception as e:
        db.session.rollback()
        raise MealAPIError(str(e))

@app.route('/api/notifications/mark-all-read', methods=['PUT'])
@jwt_required()
def mark_all_notifications_as_read():
    """
Mark all unread notifications for the logged-in user as read
---
tags:
  - Notifications
security:
  - BearerAuth: []
responses:
  200:
    description: All notifications marked as read
  401:
    description: Unauthorized – login required
  500:
    description: Internal server error
"""
    current_user_email = get_jwt_identity()
    current_user = User.query.filter_by(email=current_user_email).first()
    
    try:
        Notification.query.filter_by(user_id=current_user.id, read=False).update({'read': True})
        db.session.commit()
        return jsonify({'message': 'All notifications marked as read'})
    except Exception as e:
        db.session.rollback()
        raise MealAPIError(str(e))

# CLI Commands
@app.cli.command("seed")
def seed():
    """Seed the database with sample data."""
    seed_data()
    click.echo("Database seeded successfully.")

@app.cli.command("create-admin")
def create_admin():
    """Create an admin user."""
    email = click.prompt("Enter admin email")
    password = click.prompt("Enter admin password", hide_input=True)
    
    if User.query.filter_by(email=email).first():
        click.echo("User with this email already exists.")
        return
    
    hashed_password = generate_password_hash(password, method='sha256')
    admin = User(
        name="Admin",
        email=email,
        password=hashed_password,
        role='admin'
    )
    db.session.add(admin)
    db.session.commit()
    click.echo(f"Admin user {email} created successfully.")

if __name__ == '__main__':
    app.run(debug=True)