@echo off
cd /d "%~dp0"
title Swaralipi Backend

echo [Swaralipi] Backend starting...
echo.

if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    echo Tip: Create a venv with "python -m venv venv" for isolation.
)

echo Installing dependencies...
pip install -r requirements.txt -q
if errorlevel 1 (
    echo Failed to install dependencies.
    pause
    exit /b 1
)

echo.
echo Backend running at: http://127.0.0.1:8000
echo API docs:          http://127.0.0.1:8000/docs
echo Press Ctrl+C to stop.
echo.

uvicorn main:app --host 0.0.0.0 --port 8000


