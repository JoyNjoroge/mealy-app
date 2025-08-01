#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Running Database Migrations..."
# FLASK_APP is set in render.yaml, so the flask command will find the app
flask db upgrade
echo "Migrations complete."

echo "Starting Gunicorn..."
# Render provides the PORT environment variable.
# The app entry point is app.main:app
gunicorn --bind 0.0.0.0:$PORT app.main:app
