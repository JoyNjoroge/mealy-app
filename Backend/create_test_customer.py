#!/usr/bin/env python3
"""
Create Test Customer Account
"""
from app.main import app
from app.models.user import User
from app.core.database import db
from werkzeug.security import generate_password_hash

def create_test_customer():
    with app.app_context():
        print("👤 Creating test customer account...")
        
        # Check if customer already exists
        existing_customer = User.query.filter_by(email='test@customer.com').first()
        if existing_customer:
            print(f"✅ Customer already exists: {existing_customer.email}")
            return
        
        # Create new customer
        customer = User(
            email='test@customer.com',
            name='Test Customer',
            password=generate_password_hash('password123'),
            role='customer'
        )
        
        db.session.add(customer)
        db.session.commit()
        
        print("✅ Test customer created successfully!")
        print(f"Email: test@customer.com")
        print(f"Password: password123")

if __name__ == "__main__":
    create_test_customer() 