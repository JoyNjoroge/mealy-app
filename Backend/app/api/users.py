from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.core.database import db
from app.models.user import User
from app.api.utils import ValidationError, UnauthorizedError, send_email
from app.api.decorators import roles_required
from werkzeug.security import generate_password_hash

users_bp = Blueprint('users', __name__)

@users_bp.route('', methods=['GET'])
@jwt_required()
@roles_required('admin')
def get_users():
    """
    Get all users (admin only)
    ---
    tags:
      - Users
    parameters:
      - in: query
        name: page
        type: integer
      - in: query
        name: per_page
        type: integer
    responses:
      200:
        description: List of users
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    users = User.query.order_by(User.id)
    paginated = users.paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'items': [user.to_dict() for user in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': paginated.page
    })

@users_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    """
    Get a user by ID
    ---
    tags:
      - Users
    parameters:
      - in: path
        name: user_id
        type: integer
        required: true
        description: The user ID
    responses:
      200:
        description: User data
      403:
        description: Forbidden
    """
    current_user_email = get_jwt_identity()
    current_user = User.query.filter_by(email=current_user_email).first()
    user = User.query.get_or_404(user_id)
    if current_user.id != user.id and current_user.role.name != 'admin':
        return jsonify({'message': "You don't have permission to perform this action"}), 403
    return jsonify(user.to_dict())

@users_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """
    Update a user by ID
    ---
    tags:
      - Users
    parameters:
      - in: path
        name: user_id
        type: integer
        required: true
        description: The user ID
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
            role:
              type: string
            password:
              type: string
    responses:
      200:
        description: Updated user
    """
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    if 'name' in data:
        user.name = data['name']
    if 'email' in data:
        user.email = data['email']
    if 'role' in data:
        user.role = data['role']
    if 'password' in data:
        user.password = generate_password_hash(data['password'])
        send_email(
            user.email,
            "Password Changed",
            f"<h1>Password Changed</h1><p>Your password has been changed. If you did not do this, please contact support immediately.</p>"
        )
    db.session.commit()
    return jsonify(user.to_dict())

@users_bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
@roles_required('admin')
def delete_user(user_id):
    """
    Delete a user by ID (admin only)
    ---
    tags:
      - Users
    parameters:
      - in: path
        name: user_id
        type: integer
        required: true
        description: The user ID
    responses:
      200:
        description: User deleted
    """
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted'}) 