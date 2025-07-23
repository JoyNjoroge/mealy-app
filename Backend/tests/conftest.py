import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import pytest
from ..app import app as flask_app
from ..models import db, User
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash

@pytest.fixture(scope='module')
def app():
    flask_app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "SECRET_KEY": "test-secret-key",
        "JWT_SECRET_KEY": "test-jwt-secret",
        "PROPAGATE_EXCEPTIONS": True
    })


    with flask_app.app_context():
        db.create_all()
        yield flask_app
        db.drop_all()

@pytest.fixture(scope='module')
def client(app):
    return app.test_client()

@pytest.fixture
def admin_token(app):
    with app.app_context():
        admin = User(
            name="Admin",
            email="admin@example.com",
            password=generate_password_hash("adminpass"),
            role="admin"
        )
        db.session.add(admin)
        db.session.commit()
        return create_access_token(identity=admin.email)

@pytest.fixture
def user_token(app):
    with app.app_context():
        user = User(
            name="Customer",
            email="user@example.com",
            password=generate_password_hash("userpass"),
            role="customer"
        )
        db.session.add(user)
        db.session.commit()
        return create_access_token(identity=user.email)
