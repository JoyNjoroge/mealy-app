from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
from http import HTTPStatus
from app.core.database import db
from app.models.user import User, UserRoles
from app.api.utils import ValidationError, UnauthorizedError, send_email

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
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
            email:
              type: string
            password:
              type: string
            role:
              type: string
    responses:
      201:
        description: User created successfully
      400:
        description: Invalid input
    """
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        raise ValidationError("Email and password are required")
    if User.query.filter_by(email=data['email']).first():
        raise ValidationError("Email already exists")
    hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
    
    # Handle role assignment properly
    role_str = data.get('role', 'customer')
    try:
        role = UserRoles(role_str)
    except ValueError:
        role = UserRoles.customer  # Default to customer if invalid role
    
    try:
        user = User(
            name=data.get('name', ''),
            email=data['email'],
            password=hashed_password,
            role=role
        )
        db.session.add(user)
        db.session.commit()
        # Temporarily disable email sending to avoid deployment issues
        # send_email(
        #     user.email,
        #     "Welcome to Mealy",
        #     f"<h1>Welcome {user.name}</h1><p>Your account has been created successfully.</p>"
        # )
        return jsonify({
            'message': 'User created successfully',
            'user': user.to_dict()
        }), HTTPStatus.CREATED
    except Exception as e:
        db.session.rollback()
        raise ValidationError(str(e))

@auth_bp.route('/login', methods=['POST'])
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
            password:
              type: string
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