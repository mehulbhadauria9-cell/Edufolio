# Edufolio Unified PowerShell Launcher
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "       Starting Edufolio Platform (Unified Server)    " -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# 1. Build frontend if dist doesn't exist
$distPath = Join-Path $PSScriptRoot "edufolio\dist"
if (-not (Test-Path $distPath)) {
    Write-Host "[1/2] Building frontend bundle..." -ForegroundColor Yellow
    Start-Process -FilePath "npm" -ArgumentList "run build" -WorkingDirectory "$PSScriptRoot/edufolio" -Wait -NoNewWindow
}

# 2. Start unified server on port 5000
Write-Host "[1/2] Starting Edufolio Unified Server on port 5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/server'; npm start"

Start-Sleep -Seconds 3

# 3. Open browser on single unified link
Write-Host "[2/2] Opening Edufolio on unified link..." -ForegroundColor Green
Start-Process "http://localhost:5000"

Write-Host "`nEdufolio is now running at http://localhost:5000" -ForegroundColor Green
Write-Host "Same link for Frontend and Backend API: http://localhost:5000" -ForegroundColor Cyan
