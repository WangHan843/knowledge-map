$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$PreviewPidFile = Join-Path $ProjectRoot 'output\server.pid'
if (-not (Test-Path -LiteralPath $PreviewPidFile)) { Write-Host 'No saved preview process. Use Ctrl+C in the server terminal.'; exit 0 }
$PreviewProcessId = [int](Get-Content -LiteralPath $PreviewPidFile)
$PreviewProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $PreviewProcessId"
if (-not $PreviewProcess) { Write-Host 'The saved preview process is already stopped.'; exit 0 }
$ExpectedExecutable = Join-Path $ProjectRoot '.venv\Scripts\python.exe'
if ($PreviewProcess.ExecutablePath -ne $ExpectedExecutable -or $PreviewProcess.CommandLine -notmatch 'uvicorn\s+app\.main:app') {
    throw 'The saved PID belongs to another process. Nothing was stopped.'
}
# Windows venv Python may have a child Python process. Stop only this verified tree.
function Stop-PreviewChildren([int]$ParentProcessId) {
    $PreviewChildren = Get-CimInstance Win32_Process -Filter "ParentProcessId = $ParentProcessId"
    foreach ($PreviewChild in $PreviewChildren) {
        Stop-PreviewChildren -ParentProcessId $PreviewChild.ProcessId
        Stop-Process -Id $PreviewChild.ProcessId -ErrorAction SilentlyContinue
    }
}
Stop-PreviewChildren -ParentProcessId $PreviewProcessId
Stop-Process -Id $PreviewProcessId -ErrorAction SilentlyContinue
Write-Host 'The local preview server is stopped.'
