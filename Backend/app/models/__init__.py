# This file marks the models directory as a Python package.

# Import all models to ensure they are loaded when the app starts
from .user import User, UserRoles
from .restaurant import Meal, Menu, MenuItem
from .order import Order
from .delivery import Notification
