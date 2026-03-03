# Swaralipi Frontend - PowerShell
Set-Location $PSScriptRoot
$Host.UI.RawWindowTitle = "Swaralipi Frontend"

Write-Host "[Swaralipi] Frontend starting..." -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies (first run may take a minute)..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install dependencies." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Dependencies already installed."
}

Write-Host ""
Write-Host "Starting Vite dev server..."
Write-Host "Frontend will be at: http://localhost:5173" -ForegroundColor Green
Write-Host "API requests proxied to: http://127.0.0.1:8000"
Write-Host "Press Ctrl+C to stop."
Write-Host ""

npm run dev
