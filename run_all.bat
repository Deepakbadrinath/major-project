@echo off
echo =========================================================================
echo   Smart Classroom of Kishkinda University — Starting Full Stack
echo =========================================================================
start "FastAPI Backend" cmd /c "e:\major project\run_backend.bat"
start "React Vite Frontend" cmd /c "e:\major project\run_frontend.bat"
echo Both services launched!
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo =========================================================================
timeout /t 5
start http://localhost:5173
