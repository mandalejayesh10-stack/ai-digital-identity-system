@echo off
echo ===================================================
echo   AI Digital Identity System - Hackathon Launcher
echo ===================================================
echo.

echo [1/2] Launching FastAPI Backend...
start "Aegis ID - Backend Engine" cmd /k "cd backend && echo Setting up Python Environment... && py -3.11 -m venv venv && call venv\Scripts\activate && echo Installing Python dependencies... && pip install -r requirements.txt && echo Starting FastAPI server... && uvicorn app.main:app --reload --port 8000"

echo.
echo [2/2] Launching Next.js Frontend...
start "Aegis ID - Frontend Dashboard" cmd /k "cd frontend && echo Installing Node dependencies... && npm install && echo Starting Next.js development server... && npm run dev"

echo.
echo ===================================================
echo   System Boot Triggered!
echo   - Backend: http://localhost:8000/docs
echo   - Frontend: http://localhost:3000
echo ===================================================
pause
