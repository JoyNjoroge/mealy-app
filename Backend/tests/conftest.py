import pytest
from app.main import app as flask_app
from app.core.database import db
from app.models.user import User
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash
from unittest.mock import patch

@pytest.fixture(scope='session')
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

@pytest.fixture(scope='function')
def client(app):
    return app.test_client()

@pytest.fixture(scope='function')
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

@pytest.fixture(scope='function')
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

@pytest.fixture(autouse=True)
def mock_external_services():
    with patch('app.api.utils.send_email') as mock_email, \
         patch('cloudinary.uploader.upload') as mock_cloudinary_upload:
        mock_email.return_value = None
        mock_cloudinary_upload.return_value = {'url': 'http://mocked.cloudinary/test.jpg'}
        yield
