@echo off
echo Killing all Node.js and Python processes...

REM Kill all node processes
taskkill /F /IM node.exe 2>nul
taskkill /F /IM nodemon.exe 2>nul

REM Kill all python processes (be careful with this)
taskkill /F /IM python.exe 2>nul

REM Wait a moment
timeout /t 2 /nobreak >nul

echo All processes killed. You can now start the services.
pause