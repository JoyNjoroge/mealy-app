import os
from dotenv import load_dotenv
from datetime import timedelta

load_dotenv()

class Config:
    # Use SQLite as fallback for free tier deployments
    DATABASE_URL = os.getenv('DATABASE_URL') or os.getenv('DATABASE_URI')
    if DATABASE_URL and DATABASE_URL.startswith('postgres://'):
        DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
    
    SQLALCHEMY_DATABASE_URI = DATABASE_URL or 'sqlite:///mealy_app.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv('SECRET_KEY', 'supersecretkey')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME', 'dfpymjqvg')
    CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY', '615376453362685')
    CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET', 'CI32wsYeJt7Mdfn6lc2vUWQG9Ec')
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', 'gakiimbaeh@gmail.com')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', 'olov gktq yyly xizf')
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true' 