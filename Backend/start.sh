#!/bin/bash
set -e

/wait-for-db.sh

# Start Gunicorn with Render's dynamic PORT
gunicorn app.main:app --bind 0.0.0.0:$PORT
