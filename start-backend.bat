@echo off
echo Starting Echo Backend Server...
echo.

echo [1/2] Starting Memcached Server...
start "Memcached" cmd /k "cd new-backend && node start-memcached.js"

timeout /t 2 /nobreak > nul

echo [2/2] Starting Backend Server...
cd new-backend
npm install
npm run dev