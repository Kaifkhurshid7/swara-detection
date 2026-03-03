@echo off
cd /d "%~dp0"
title Swaralipi Frontend

echo [Swaralipi] Frontend starting...
echo.

if not exist "node_modules" (
    echo Installing dependencies, first run may take a minute...
    call npm install
    if errorlevel 1 (
        echo Failed to install dependencies.
        pause
        exit /b 1
    )
) else (
    echo Dependencies already installed.
)

echo.
echo Starting Vite dev server...
echo Frontend will open at: http://localhost:5173
echo API requests are proxied to backend at http://127.0.0.1:8000
echo Press Ctrl+C to stop.
echo.

call npm run dev

pause
