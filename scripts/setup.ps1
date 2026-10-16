param([string]$PythonVersion = '3.13')
$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $ProjectRoot
try {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Install Node.js 22.12+ or 24 LTS first.' }
    if (-not (Get-Command py -ErrorAction SilentlyContinue)) { throw 'Install Python 3.13 with the Windows py launcher first.' }
    if (-not (Test-Path -LiteralPath '.venv\Scripts\python.exe')) {
        & py "-$PythonVersion" -m venv .venv
        if ($LASTEXITCODE -ne 0) { throw 'Python virtual environment creation failed.' }
    }
    & .\.venv\Scripts\python.exe -m pip install -r backend\requirements-lock.txt
    if ($LASTEXITCODE -ne 0) { throw 'Python dependency installation failed.' }
    Push-Location frontend
    try {
        & npm.cmd ci
        if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }
        & npm.cmd run build
        if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed.' }
    } finally { Pop-Location }
    Write-Host 'Setup complete. Run: powershell -ExecutionPolicy Bypass -File .\scripts\start.ps1'
} finally { Pop-Location }
