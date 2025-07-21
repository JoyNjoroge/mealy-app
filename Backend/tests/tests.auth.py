import unittest
import json
from app import app, db
from models import User

class RegisterTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app_context = app.app_context()
        self.app_context.push()

        # Recreate the database tables for each test
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_register_user_success(self):
        response = self.app.post('/api/register', json={
            'name': 'Joey',
            'email': 'joey@example.com',
            'password': 'securepass',
            'role': 'admin'
        })

        self.assertEqual(response.status_code, 201)pip --version

        data = json.loads(response.data)
        self.assertIn('access_token', data)
        self.assertEqual(data['user']['email'], 'joey@example.com')
        self.assertEqual(data['user']['role'], 'admin')

    def test_register_missing_field(self):
        response = self.app.post('/api/register', json={
            'email': 'incomplete@example.com',
            'password': 'pass',
            'role': 'admin'
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn('Missing required fields', response.get_data(as_text=True))

    def test_register_invalid_role(self):
        response = self.app.post('/api/register', json={
            'name': 'Jane',
            'email': 'jane@example.com',
            'password': 'pass',
            'role': 'invalidrole'
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid role', response.get_data(as_text=True))

    def test_register_duplicate_email(self):
        # First registration
        self.app.post('/api/register', json={
            'name': 'Joey',
            'email': 'duplicate@example.com',
            'password': 'pass',
            'role': 'admin'
        })
        # Second registration with same email
        response = self.app.post('/api/register', json={
            'name': 'Another Joey',
            'email': 'duplicate@example.com',
            'password': 'pass',
            'role': 'admin'
        })
        self.assertEqual(response.status_code, 409)
        self.assertIn('Email already registered', response.get_data(as_text=True))

if __name__ == '__main__':
    unittest.main()python3 -m unittest discover -s tests

