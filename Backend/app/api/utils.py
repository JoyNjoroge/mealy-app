import os
from flask import jsonify
from email.mime.text import MIMEText
import smtplib

class ValidationError(Exception):
    def __init__(self, message="Validation error", payload=None):
        super().__init__()
        self.message = message
        self.status_code = 422
        self.payload = payload
    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        rv['status_code'] = self.status_code
        return rv

class UnauthorizedError(Exception):
    def __init__(self, message="Unauthorized access", payload=None):
        super().__init__()
        self.message = message
        self.status_code = 401
        self.payload = payload
    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        rv['status_code'] = self.status_code
        return rv

def send_email(to_email, subject, content):
    try:
        msg = MIMEText(content, 'html')
        msg['Subject'] = subject
        msg['From'] = os.getenv('MAIL_USERNAME')
        msg['To'] = to_email
        with smtplib.SMTP(os.getenv('MAIL_SERVER'), int(os.getenv('MAIL_PORT'))) as server:
            server.starttls()
            server.login(os.getenv('MAIL_USERNAME'), os.getenv('MAIL_PASSWORD'))
            server.send_message(msg)
    except Exception as e:
        print(f"Email send failed: {str(e)}") 