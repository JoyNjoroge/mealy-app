import os
from flask import Flask
from flask_migrate import Migrate
from flask_restful import Api
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flasgger import Swagger
import cloudinary
from app.core.config import Config
from app.core.database import db
from app.models.user import User
from app.models.restaurant import Meal, Menu, MenuItem
from app.models.order import Order
from app.models.delivery import Notification
from flask.cli import with_appcontext
import click

# Initialize Flask app
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

# Import and register blueprints/routes
from app.api.auth import auth_bp
from app.api.users import users_bp
from app.api.restaurants import restaurants_bp
from app.api.orders import orders_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(users_bp, url_prefix='/api/users')
app.register_blueprint(restaurants_bp, url_prefix='/api')
app.register_blueprint(orders_bp, url_prefix='/api')

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000))) 