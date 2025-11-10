@echo off
echo Starting Echo services...

REM Kill any existing processes first
call kill-processes.bat

REM Start backend in new window
echo Starting Backend on port 3000...
start "Echo Backend" cmd /k "cd new-backend && npm run dev"

REM Wait a moment
timeout /t 3 /nobreak >nul

REM Start ML service in new window  
echo Starting ML Service on port 8001...
start "Echo ML Service" cmd /k "cd ml-service && python main.py"

REM Wait a moment
timeout /t 3 /nobreak >nul

REM Start frontend in new window
echo Starting Frontend on port 5173...
start "Echo Frontend" cmd /k "cd frontend && npm run dev"

echo All services started!
echo Backend: http://localhost:3000
echo ML Service: http://localhost:8001  
echo Frontend: http://localhost:5173
pause