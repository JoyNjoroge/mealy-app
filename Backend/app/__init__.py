from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from config import Config

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)

    # Optional: Redirect unauthorized users
    login_manager.login_view = 'auth_bp.login'

    # Register models here so Flask-Migrate can detect them
    from app import models

    # Import and register blueprints
    from app.routes.auth import auth_bp
    from app.routes.meals import meals_bp
    from app.routes.menus import menus_bp
    from app.routes.orders import orders_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.notifications import notifications_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(meals_bp, url_prefix='/api/meals')
    app.register_blueprint(menus_bp, url_prefix='/api/menus')
    app.register_blueprint(orders_bp, url_prefix='/api/orders')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')

    @app.route('/')
    def index():
        return jsonify({
            "message": "🍽️ Mealy API is running.",
            "status": "success"
        }), 200

    return app
