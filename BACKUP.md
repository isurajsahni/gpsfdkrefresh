# Database Backup & Restoration Guide

## Backup Overview

| Detail | Value |
|---|---|
| **Database** | MongoDB Atlas (`gpsfdk`) |
| **Backup location** | `C:\Users\isura\MongoBackups\` |
| **Local restore target** | `mongodb://localhost:27017/gpsfdk` |
| **Schedule** | Daily at 21:00 via Windows Task Scheduler (`GPSFDK-MongoBackup`) |
| **Retention** | Last 7 backups (older ones auto-pruned) |
| **Scripts** | `server/scripts/backup-atlas-to-local.ps1`, `server/scripts/register-backup-task.ps1` |

## Backup Folder Structure

```
C:\Users\isura\MongoBackups\
├── backup.log
├── 2026-06-02_1333\
│   └── gpsfdk\
│       ├── products.bson / products.metadata.json
│       ├── users.bson / users.metadata.json
│       ├── categories.bson / categories.metadata.json
│       ├── orders.bson / orders.metadata.json
│       ├── pageviews.bson / pageviews.metadata.json
│       ├── visitors.bson / visitors.metadata.json
│       ├── abandonedcarts.bson / abandonedcarts.metadata.json
│       ├── notfoundlogs.bson / notfoundlogs.metadata.json
│       ├── coupons.bson / couponusages.bson
│       ├── leads.bson / otps.bson / otpsessions.bson
│       └── prelude.json
└── 2026-06-03_2100\
    └── gpsfdk\
        └── (same structure)
```

## Prerequisites

1. **MongoDB Community Server** installed and `mongod` running on `localhost:27017`
2. **MongoDB Database Tools** installed (`mongorestore`, `mongodump` available on PATH or under `C:\Program Files\MongoDB`)
3. **PowerShell 5.1+**

## Restoration Methods

### Method 1: Restore the Latest Backup (Recommended)

This replaces the entire local `gpsfdk` database with the most recent backup.

```powershell
# Find the latest backup folder
$latest = Get-ChildItem -Path "$env:USERPROFILE\MongoBackups" -Directory |
    Where-Object { $_.Name -match '^\d{4}-\d{2}-\d{2}_\d{4}$' } |
    Sort-Object Name -Descending |
    Select-Object -First 1

# Restore (--drop removes existing collections before restoring)
mongorestore --uri="mongodb://localhost:27017" --drop --dir="$($latest.FullName)" --quiet

Write-Host "Restored from: $($latest.Name)"
```

### Method 2: Restore a Specific Backup

```powershell
# List all available backups
Get-ChildItem -Path "$env:USERPROFILE\MongoBackups" -Directory |
    Where-Object { $_.Name -match '^\d{4}-\d{2}-\d{2}_\d{4}$' } |
    Sort-Object Name -Descending |
    ForEach-Object { Write-Host $_.Name }

# Restore a specific backup by date
mongorestore --uri="mongodb://localhost:27017" --drop --dir="$env:USERPROFILE\MongoBackups\2026-06-03_2100" --quiet
```

### Method 3: Restore a Single Collection

```powershell
# Restore only the products collection from the latest backup
$latest = Get-ChildItem -Path "$env:USERPROFILE\MongoBackups" -Directory |
    Where-Object { $_.Name -match '^\d{4}-\d{2}-\d{2}_\d{4}$' } |
    Sort-Object Name -Descending |
    Select-Object -First 1

mongorestore --uri="mongodb://localhost:27017" `
    --db=gpsfdk `
    --collection=products `
    --drop `
    "$($latest.FullName)\gpsfdk\products.bson"
```

Replace `products` with any of these collection names:
`abandonedcarts`, `categories`, `coupons`, `couponusages`, `leads`, `notfoundlogs`, `orders`, `otps`, `otpsessions`, `pageviews`, `products`, `users`, `visitors`

### Method 4: Restore to Atlas (Remote)

```powershell
# Restore a local backup back to Atlas
$latest = Get-ChildItem -Path "$env:USERPROFILE\MongoBackups" -Directory |
    Where-Object { $_.Name -match '^\d{4}-\d{2}-\d{2}_\d{4}$' } |
    Sort-Object Name -Descending |
    Select-Object -First 1

# Read MONGO_URI from .env
$uri = (Select-String -Path "server\.env" -Pattern '^\s*MONGO_URI\s*=' | Select-Object -First 1).Line -replace '^\s*MONGO_URI\s*=\s*', ''

mongorestore --uri="$uri" --drop --dir="$($latest.FullName)" --quiet
```

> **Warning:** This overwrites the live Atlas database. Use with caution.

## Running a Manual Backup

```powershell
powershell -ExecutionPolicy Bypass -File server\scripts\backup-atlas-to-local.ps1
```

## Managing the Scheduled Backup

```powershell
# Register / re-register the daily 9 PM backup task
powershell -ExecutionPolicy Bypass -File server\scripts\register-backup-task.ps1

# Change schedule to a different time (e.g., 6 AM)
powershell -ExecutionPolicy Bypass -File server\scripts\register-backup-task.ps1 -Hour 6 -Minute 0

# Check if the task exists
Get-ScheduledTask -TaskName 'GPSFDK-MongoBackup'

# Run the scheduled task immediately
Start-ScheduledTask -TaskName 'GPSFDK-MongoBackup'

# Remove the scheduled task
Unregister-ScheduledTask -TaskName 'GPSFDK-MongoBackup' -Confirm:$false
```

## Checking Backup Logs

```powershell
Get-Content "$env:USERPROFILE\MongoBackups\backup.log"
```

## Troubleshooting

| Problem | Solution |
|---|---|
| `mongorestore` not found | Install [MongoDB Database Tools](https://www.mongodb.com/try/download/database-tools) and add to PATH |
| `mongod` not running | Start it: `net start MongoDB` or run `mongod` manually |
| Restore fails with auth error (Atlas) | Verify `MONGO_URI` in `server/.env` has correct credentials |
| Backup folder empty | Check `backup.log` for errors; ensure Atlas is reachable |
| Task Scheduler not running backup | Run `Get-ScheduledTask -TaskName 'GPSFDK-MongoBackup'` to check status; re-register if needed |
