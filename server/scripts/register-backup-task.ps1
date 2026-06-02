#Requires -Version 5.1
<#
Register a Windows Task Scheduler entry that runs backup-atlas-to-local.ps1
daily at $Hour:$Minute. Re-run safely — it removes any existing task with the
same name before re-creating. Runs as the current user with normal privileges
(no admin needed; backup only touches Atlas + localhost + user profile).
#>

[CmdletBinding()]
param(
    [string]$TaskName = 'GPSFDK-MongoBackup',
    [int]   $Hour     = 21,
    [int]   $Minute   = 0
)

$ErrorActionPreference = 'Stop'
$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackupPath = Join-Path $ScriptDir 'backup-atlas-to-local.ps1'

if (-not (Test-Path $BackupPath)) {
    throw "backup-atlas-to-local.ps1 not found next to register-backup-task.ps1"
}

if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "removed existing task $TaskName"
}

$action    = New-ScheduledTaskAction `
    -Execute 'powershell.exe' `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$BackupPath`""
$trigger   = New-ScheduledTaskTrigger -Daily -At ([datetime]"$Hour`:$Minute")
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
$settings  = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 2)

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Principal $principal `
    -Settings $settings `
    -Description "Daily Atlas -> local MongoDB backup for gpsfdkrefresh" | Out-Null

Write-Host "scheduled $TaskName at $Hour`:$($Minute.ToString('00')) daily"
