#!/usr/bin/env python3
"""
Check Users in Database
"""
from app.main import app
from app.models.user import User
from app.core.database import db

def check_users():
    with app.app_context():
        print("👥 Checking users in database...")
        users = User.query.all()
        
        for user in users:
            print(f"ID: {user.id}, Email: {user.email}, Name: {user.name}, Role: {user.role}")
        
        print(f"\n📊 Total users: {len(users)}")

if __name__ == "__main__":
    check_users() 