#!/bin/bash
set -e

host="$1"
shift
cmd="$@"

echo "⏳ Waiting for PostgreSQL at $host..."

until pg_isready -h "$host" -p 5432; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

echo "✅ Postgres is up - executing command"
exec $cmd
