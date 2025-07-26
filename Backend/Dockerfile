FROM python:3.10-slim

WORKDIR /app

# Install dependencies for psycopg2 and gunicorn
RUN apt-get update && apt-get install -y libpq-dev gcc netcat-openbsd

# Install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port that gunicorn will run on
EXPOSE 8000

# Start the Flask app using gunicorn (Render handles DB startup separately)
CMD ["gunicorn", "app.main:app", "-b", "0.0.0.0:8000"]
