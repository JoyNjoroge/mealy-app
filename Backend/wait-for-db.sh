#!/bin/bash
set -e

# Extract host from DATABASE_URL
DB_HOST=$(echo $DATABASE_URL | sed -E 's/^.+@([^:/]+):[0-9]+\/.+$/\1/')

echo "⏳ Waiting for PostgreSQL at $DB_HOST..."

until pg_isready -h "$DB_HOST" -p 5432; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

echo "✅ Postgres is up!"
exec "$@"
