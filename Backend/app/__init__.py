# app/__init__.py

from flask import Flask
from flask_migrate import Migrate
from flask_restful import Api
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flasgger import Swagger
import cloudinary
import os
from app.core.config import Config
from app.core.database import db

def create_app():
    """Application factory function"""
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    Swagger(app)
    db.init_app(app)
    migrate = Migrate(app, db)
    api = Api(app)
    jwt = JWTManager(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Configure Cloudinary
    cloudinary.config(
        cloud_name=Config.CLOUDINARY_CLOUD_NAME,
        api_key=Config.CLOUDINARY_API_KEY,
        api_secret=Config.CLOUDINARY_API_SECRET
    )

    # Import all models to ensure they are loaded when the app starts
    from app.models.user import User, UserRoles
    from app.models.restaurant import Meal, Menu, MenuItem
    from app.models.order import Order
    from app.models.delivery import Notification

    # Import and register blueprints/routes
    from app.api.auth import auth_bp
    from app.api.users import users_bp
    from app.api.restaurants import restaurants_bp
    from app.api.orders import orders_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(restaurants_bp, url_prefix='/api')
    app.register_blueprint(orders_bp, url_prefix='/api')

    # Root route
    @app.route('/')
    def index():
        """
        Root endpoint for the Mealy App API.
        """
        return {
            "message": "Welcome to the Mealy App API!",
            "status": "active"
        }

    # Error handlers
    from app.api.utils import UnauthorizedError, ValidationError

    @app.errorhandler(UnauthorizedError)
    def handle_unauthorized_error(error):
        response = {
            "error": error.message,
            "status_code": error.status_code
        }
        return response, error.status_code

    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        response = {
            "error": error.message,
            "status_code": error.status_code
        }
        return response, error.status_code

    return app
