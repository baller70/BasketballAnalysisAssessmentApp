#!/bin/bash
# Development server script

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Run the server with auto-reload
echo "Starting development server on http://localhost:8000"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

