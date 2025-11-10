@echo off
echo Starting Echo Couples Connection App...
echo.

echo [1/4] Starting Memcached Server...
start "Memcached" cmd /k "cd new-backend && node start-memcached.js"

timeout /t 2 /nobreak > nul

echo [2/4] Starting Backend Server...
start "Backend" cmd /k "cd new-backend && npm install && npm run dev"

timeout /t 3 /nobreak > nul

echo [3/4] Starting ML Service...
start "ML Service" cmd /k "cd ml-service && pip install -r requirements.txt && python main.py"

timeout /t 3 /nobreak > nul

echo [4/4] Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo All services are starting...
echo Backend: http://localhost:3000
echo ML Service: http://localhost:8000  
echo Frontend: http://localhost:5173
echo.
pause