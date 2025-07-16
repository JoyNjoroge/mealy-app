from flask import Blueprint

meals_bp = Blueprint('meals_bp', __name__)

@meals_bp.route('/meals/test')
def test_meals():
    return {"message": "Meals route working"}
