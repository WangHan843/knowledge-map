param([int]$Port = 8000, [switch]$SkipBuild, [string]$ListenAddress = '127.0.0.1')
$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $ProjectRoot
try {
    if (-not (Test-Path -LiteralPath '.venv\Scripts\python.exe')) { throw 'Run scripts\setup.ps1 first.' }
    if (-not $SkipBuild) {
        Push-Location frontend
        try {
            & npm.cmd run build:server
            if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed.' }
        } finally { Pop-Location }
    }
    if (-not (Test-Path -LiteralPath 'frontend\dist-server\index.html')) { throw 'Server frontend build not found. Run npm.cmd run build:server in frontend.' }
    Write-Host "Open http://localhost:$Port in your browser. Press Ctrl+C to stop."
    & .\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --host $ListenAddress --port $Port
    if ($LASTEXITCODE -ne 0) { throw 'Server stopped or could not start. Check whether the port is in use.' }
} finally { Pop-Location }
