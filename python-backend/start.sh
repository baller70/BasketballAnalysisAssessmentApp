#!/bin/bash
cd /home/ubuntu/basketball_app/python-backend
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
