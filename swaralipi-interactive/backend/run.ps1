# Swaralipi Backend - PowerShell
Set-Location $PSScriptRoot
$Host.UI.RawWindowTitle = "Swaralipi Backend"

Write-Host "[Swaralipi] Backend starting..." -ForegroundColor Cyan
Write-Host ""

if (Test-Path "venv\Scripts\Activate.ps1") {
    & .\venv\Scripts\Activate.ps1
} else {
    Write-Host "Tip: Create a venv with 'python -m venv venv' for isolation."
}

Write-Host "Installing dependencies..."
pip install -r requirements.txt -q
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install dependencies." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Backend running at: http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "API docs:          http://127.0.0.1:8000/docs"
Write-Host "Press Ctrl+C to stop."
Write-Host ""

uvicorn main:app --host 0.0.0.0 --port 8000
