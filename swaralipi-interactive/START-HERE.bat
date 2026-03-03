@echo off
title Swaralipi - Start Backend and Frontend
cd /d "%~dp0"

echo.
echo  Starting Backend and Frontend in two new windows...
echo  When both show "running", open in your browser:  http://localhost:5173
echo.
start "Swaralipi Backend (port 8000)" cmd /k "cd /d %~dp0backend && run.bat"
timeout /t 4 /nobreak >nul
start "Swaralipi Frontend (port 5173)" cmd /k "cd /d %~dp0frontend && run.bat"
echo.
echo  Two command windows opened. Wait for both to finish loading, then:
echo.
echo    -->  http://localhost:5173   (open in browser)
echo.
pause
