from flask import Blueprint

dashboard_bp = Blueprint('dashboard_bp', __name__)

@dashboard_bp.route('/dashboard/test')
def test_dashboard():
    return {"message": "✅ Dashboard route working"}
