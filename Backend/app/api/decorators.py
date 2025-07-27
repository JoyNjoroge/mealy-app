from functools import wraps
from flask_jwt_extended import get_jwt_identity
from app.models.user import User
from app.api.utils import UnauthorizedError

def roles_required(*roles):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            current_user_email = get_jwt_identity()
            user = User.query.filter_by(email=current_user_email).first()
            if not user:
                raise UnauthorizedError("User not found")
            if user.role.name not in roles:
                return {'message': "You don't have permission to access this resource"}, 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper 