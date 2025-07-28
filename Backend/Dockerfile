FROM python:3.10-slim

WORKDIR /app

# Copy wait script and make it executable
COPY wait-for-db.sh /wait-for-db.sh
RUN chmod +x /wait-for-db.sh

# Install system dependencies for psycopg2 and netcat
RUN apt-get update && apt-get install -y libpq-dev gcc netcat-openbsd

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose the port (Render will override this with PORT env var)
EXPOSE 10000

# Start the app using gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:10000", "app:app"]
