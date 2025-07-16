
from flask import Blueprint

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/auth/test')
def test_auth():
    return {"message": "Auth route working"}
