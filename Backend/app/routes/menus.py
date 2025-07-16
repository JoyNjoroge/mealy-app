from flask import Blueprint

menus_bp = Blueprint('menus_bp', __name__)

@menus_bp.route('/menus/test')
def test_menus():
    return {"message": "✅ Menus route working"}
