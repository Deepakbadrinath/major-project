@echo off
echo Starting FastAPI Backend for Smart Classroom of Kishkinda University...
cd /d "e:\major project"
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
pause
