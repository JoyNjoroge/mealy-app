#!/bin/bash
# Wait for DB
/wait-for-db.sh $DATABASE_URL

# Run migrations
alembic upgrade head

# Start app
gunicorn app.main:app --bind 0.0.0.0:$PORT
