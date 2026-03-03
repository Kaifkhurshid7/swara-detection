@echo off
cd /d "%~dp0"
echo Starting Swaralipi Backend and Frontend...
echo.
start "Swaralipi Backend" cmd /k "cd /d %~dp0backend && call run.bat"
timeout /t 3 /nobreak >nul
start "Swaralipi Frontend" cmd /k "cd /d %~dp0frontend && call run.bat"
echo.
echo Two windows opened: Backend (port 8000) and Frontend (port 5173).
echo Open http://localhost:5173 in your browser when both are ready.
pause
