@echo off
echo Killing processes on port 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do (
    echo Killing process %%a
    taskkill /f /pid %%a >nul 2>&1
)
echo Starting ML service...
python main.py