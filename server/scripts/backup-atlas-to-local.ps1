#Requires -Version 5.1
<#
Atlas -> local MongoDB backup.

Reads MONGO_URI from server/.env, runs mongodump into a dated folder under
$BackupRoot, then mongorestore --drop into the local mongod at localhost:27017.
Keeps the last $Keep dated dumps and prunes the rest.

Run manually:  powershell -ExecutionPolicy Bypass -File backup-atlas-to-local.ps1
Scheduled:     registered via Task Scheduler (see register-backup-task.ps1)
#>

[CmdletBinding()]
param(
    [string]$BackupRoot = "$env:USERPROFILE\MongoBackups",
    [string]$LocalUri   = "mongodb://localhost:27017",
    [int]   $Keep       = 7
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$EnvFile   = Join-Path (Split-Path -Parent $ScriptDir) '.env'
$LogFile   = Join-Path $BackupRoot 'backup.log'

function Write-Log {
    param([string]$Message)
    $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
    Write-Host $line
    Add-Content -Path $LogFile -Value $line -Encoding utf8
}

function Find-Tool {
    param([string]$Name)
    $cmd = Get-Command $Name -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $candidates = Get-ChildItem -Path 'C:\Program Files\MongoDB' -Filter "$Name.exe" -Recurse -ErrorAction SilentlyContinue
    if ($candidates) { return ($candidates | Sort-Object FullName -Descending | Select-Object -First 1).FullName }
    throw "Could not find $Name.exe on PATH or under C:\Program Files\MongoDB"
}

if (-not (Test-Path $BackupRoot)) {
    New-Item -ItemType Directory -Path $BackupRoot | Out-Null
}

Write-Log "=== backup run starting ==="

if (-not (Test-Path $EnvFile)) {
    Write-Log "ERROR: .env not found at $EnvFile"
    exit 1
}

$mongoUriLine = Select-String -Path $EnvFile -Pattern '^\s*MONGO_URI\s*=' -CaseSensitive:$false | Select-Object -First 1
if (-not $mongoUriLine) {
    Write-Log "ERROR: MONGO_URI not set in $EnvFile"
    exit 1
}
$AtlasUri = ($mongoUriLine.Line -replace '^\s*MONGO_URI\s*=\s*', '').Trim('"').Trim("'")
if ([string]::IsNullOrWhiteSpace($AtlasUri)) {
    Write-Log "ERROR: MONGO_URI is empty"
    exit 1
}

$mongodump    = Find-Tool 'mongodump'
$mongorestore = Find-Tool 'mongorestore'

$stamp   = Get-Date -Format 'yyyy-MM-dd_HHmm'
$dumpDir = Join-Path $BackupRoot $stamp
New-Item -ItemType Directory -Path $dumpDir | Out-Null

Write-Log "dumping Atlas -> $dumpDir"
& $mongodump --uri="$AtlasUri" --out="$dumpDir" --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Log "ERROR: mongodump exited with code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Log "restoring $dumpDir -> $LocalUri (drop existing)"
& $mongorestore --uri="$LocalUri" --drop --dir="$dumpDir" --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Log "ERROR: mongorestore exited with code $LASTEXITCODE"
    exit $LASTEXITCODE
}

$old = Get-ChildItem -Path $BackupRoot -Directory |
    Where-Object { $_.Name -match '^\d{4}-\d{2}-\d{2}_\d{4}$' } |
    Sort-Object Name -Descending |
    Select-Object -Skip $Keep
foreach ($d in $old) {
    Write-Log "pruning old dump $($d.FullName)"
    Remove-Item -Recurse -Force $d.FullName
}

Write-Log "=== backup run complete ==="
