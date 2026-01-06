# Full Supabase Database Backup Script
# Exports ALL tables from your Supabase database

param(
    [string]$OutputFile = "supabase-full-backup-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').sql"
)

Write-Host "`nLoading environment variables..." -ForegroundColor Cyan
$envFile = ".\apps\golf\.env.local"

if (-not (Test-Path $envFile)) {
    Write-Host "Error: .env.local not found" -ForegroundColor Red
    exit 1
}

$env:SUPABASE_URL = (Get-Content $envFile | Select-String "NEXT_PUBLIC_SUPABASE_URL=(.+)").Matches.Groups[1].Value
$env:SUPABASE_SERVICE_KEY = (Get-Content $envFile | Select-String "SUPABASE_SERVICE_ROLE_KEY=(.+)").Matches.Groups[1].Value

if (-not $env:SUPABASE_URL -or -not $env:SUPABASE_SERVICE_KEY) {
    Write-Host "Error: Could not load credentials" -ForegroundColor Red
    exit 1
}

$projectRef = ($env:SUPABASE_URL -replace 'https://|\.supabase\.co', '')
Write-Host "Project: $projectRef" -ForegroundColor Green

$headers = @{
    "apikey" = $env:SUPABASE_SERVICE_KEY
    "Authorization" = "Bearer $env:SUPABASE_SERVICE_KEY"
    "Content-Type" = "application/json"
}

# Get list of ALL tables by querying the REST API root
Write-Host "`nDiscovering all tables..." -ForegroundColor Cyan

# Common table names in your schema based on copilot instructions
$allTables = @(
    # Auth tables
    'profiles',
    'admins',
    
    # Tournament tables
    'tournaments',
    'tournament_golfers',
    'tournament_competitions',
    'competition_entries',
    'competition_entry_picks',
    
    # Golfer tables
    'golfers',
    'golfer_groups',
    'golfer_group_members',
    
    # Competition types
    'competition_types',
    
    # Wallet system
    'wallets',
    'wallet_transactions',
    'wallet_external_payments',
    
    # Clubhouse system
    'clubhouse_events',
    'clubhouse_competitions',
    'clubhouse_entries',
    'clubhouse_entry_picks',
    'clubhouse_golfers',
    'clubhouse_wallets',
    'clubhouse_wallet_transactions',
    
    # Notifications
    'notifications',
    'notification_preferences',
    
    # Email system
    'email_templates',
    'email_outbox',
    'email_inbox',
    'contacts',
    'email_activity',
    'waitlist_entries',
    
    # Site settings
    'site_settings'
)

$backupSql = @"
-- ============================================================================
-- FULL Supabase Database Backup
-- Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
-- Project: $projectRef
-- ============================================================================
-- This backup contains ALL tables from your Supabase database
-- ============================================================================

"@

$totalRows = 0
$exportedTables = 0

foreach ($table in $allTables) {
    try {
        Write-Host "Checking $table..." -ForegroundColor Gray -NoNewline
        
        $response = Invoke-RestMethod -Uri "$($env:SUPABASE_URL)/rest/v1/$table" -Headers $headers -Method Get -ErrorAction Stop
        
        if ($response.Count -gt 0) {
            Write-Host " $($response.Count) rows" -ForegroundColor Green
            $exportedTables++
            $totalRows += $response.Count
            
            $backupSql += "`n-- ============================================================================`n"
            $backupSql += "-- Table: $table ($($response.Count) rows)`n"
            $backupSql += "-- ============================================================================`n`n"
            
            foreach ($row in $response) {
                $columns = @()
                $values = @()
                
                foreach ($prop in $row.PSObject.Properties) {
                    $columns += """$($prop.Name)"""
                    
                    if ($null -eq $prop.Value) {
                        $values += "NULL"
                    } elseif ($prop.Value -is [string]) {
                        $escapedValue = $prop.Value -replace "'", "''"
                        $values += "'$escapedValue'"
                    } elseif ($prop.Value -is [bool]) {
                        $values += if ($prop.Value) { "true" } else { "false" }
                    } elseif ($prop.Value -is [array]) {
                        if ($prop.Value.Count -eq 0) {
                            $values += "ARRAY[]::integer[]"
                        } else {
                            $arrayStr = ($prop.Value | ForEach-Object { 
                                if ($_ -is [string]) { "'$($_)'" } else { $_ }
                            }) -join ','
                            $values += "ARRAY[$arrayStr]"
                        }
                    } elseif ($prop.Value -is [System.Management.Automation.PSCustomObject]) {
                        $jsonStr = ($prop.Value | ConvertTo-Json -Compress) -replace "'", "''"
                        $values += "'$jsonStr'::jsonb"
                    } else {
                        $values += $prop.Value
                    }
                }
                
                $backupSql += "INSERT INTO $table ($($columns -join ', ')) VALUES ($($values -join ', '));`n"
            }
            
            $backupSql += "`n"
        } else {
            Write-Host " empty" -ForegroundColor Yellow
        }
    } catch {
        Write-Host " not found/inaccessible" -ForegroundColor DarkGray
    }
}

# Save to file
$backupSql | Out-File -FilePath $OutputFile -Encoding UTF8

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Backup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Tables exported: $exportedTables" -ForegroundColor Cyan
Write-Host "Total rows: $totalRows" -ForegroundColor Cyan
Write-Host "File: $OutputFile" -ForegroundColor Cyan
Write-Host "Size: $([math]::Round((Get-Item $OutputFile).Length / 1KB, 2)) KB" -ForegroundColor Cyan
Write-Host "`nTo restore: Open Supabase SQL Editor and run this file" -ForegroundColor Yellow
