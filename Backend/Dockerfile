FROM python:3.10-slim

WORKDIR /app

COPY wait-for-db.sh /wait-for-db.sh
RUN chmod +x /wait-for-db.sh

COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    netcat-openbsd \
    postgresql-client

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
ENV PYTHONPATH="/app"

# Expose the dynamic Render port
EXPOSE $PORT

CMD ["./start.sh"]
