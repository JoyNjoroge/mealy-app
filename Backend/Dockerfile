FROM python:3.10-slim

WORKDIR /app

# Copy wait script and make it executable
COPY wait-for-db.sh /wait-for-db.sh
RUN chmod +x /wait-for-db.sh

# Install system dependencies for psycopg2, netcat, and PostgreSQL client
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    netcat-openbsd \
    postgresql-client

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

ENV PYTHONPATH="/app"
# Expose the port (Render will override this with PORT env var)
EXPOSE 10000

# Start the app using gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:10000", "app:app"]
