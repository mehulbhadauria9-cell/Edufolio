@echo off
title Edufolio Unified Launcher
echo ======================================================
echo           Starting Edufolio Platform (Unified)
echo ======================================================

if not exist edufolio\dist (
    echo [1/2] Building frontend bundle...
    cmd /c "cd edufolio && npm run build"
)

echo [1/2] Starting Edufolio Unified Server on port 5000...
start "Edufolio Unified Server" cmd /k "cd server && npm start"

timeout /t 3 /nobreak >nul

echo [2/2] Opening Edufolio in your default browser...
start http://localhost:5000

echo.
echo ======================================================
echo Edufolio Unified Server is running!
echo Same Link for Frontend and Backend: http://localhost:5000
echo ======================================================
pause
