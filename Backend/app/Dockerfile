# Use base Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install PostgreSQL dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy app code
COPY . .

# Install Python dependencies
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Expose Flask default port
EXPOSE 5000

# Set env variables
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0

# Run app
CMD ["flask", "run"]
