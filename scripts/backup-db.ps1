param([string]$Destination = '')
$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$SourceDatabase = if ($env:KNOWLEDGE_MAP_DB) { $env:KNOWLEDGE_MAP_DB } else { Join-Path $ProjectRoot 'backend\data\learning.sqlite3' }
if (-not (Test-Path -LiteralPath $SourceDatabase)) { throw 'Database not found. Start the application first.' }
if (-not $Destination) { $Destination = Join-Path $ProjectRoot ('output\backups\learning-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.sqlite3') }
if (Test-Path -LiteralPath $Destination) { throw 'Backup destination already exists. Choose a new file name.' }
$BackupScript = @'
import sqlite3, sys
from pathlib import Path
from contextlib import closing
source, destination = (Path(p).resolve() for p in sys.argv[1:])
destination.parent.mkdir(parents=True, exist_ok=True)
with closing(sqlite3.connect(source.as_uri() + '?mode=ro', uri=True)) as src:
    with closing(sqlite3.connect(destination)) as dest:
        src.backup(dest)
        assert dest.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
print('Verified SQLite backup: ' + str(destination))
'@
& (Join-Path $ProjectRoot '.venv\Scripts\python.exe') -c $BackupScript $SourceDatabase $Destination
if ($LASTEXITCODE -ne 0) { throw 'Database backup failed.' }
