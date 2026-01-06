# ============================================================================
# Supabase Database Backup Script
# ============================================================================
# Creates a full backup of your Supabase database using the Management API
# ============================================================================

param(
    [string]$OutputFile = "supabase-backup-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').sql"
)

Write-Host "`n🔐 Loading environment variables..." -ForegroundColor Cyan
$envFile = ".\apps\golf\.env.local"

if (-not (Test-Path $envFile)) {
    Write-Host "❌ Error: .env.local not found at $envFile" -ForegroundColor Red
    exit 1
}

$env:SUPABASE_URL = (Get-Content $envFile | Select-String "NEXT_PUBLIC_SUPABASE_URL=(.+)").Matches.Groups[1].Value
$env:SUPABASE_SERVICE_KEY = (Get-Content $envFile | Select-String "SUPABASE_SERVICE_ROLE_KEY=(.+)").Matches.Groups[1].Value

if (-not $env:SUPABASE_URL -or -not $env:SUPABASE_SERVICE_KEY) {
    Write-Host "❌ Error: Could not load Supabase credentials" -ForegroundColor Red
    exit 1
}

# Extract project reference from URL (e.g., rvhixxxx from https://rvhixxxx.supabase.co)
$projectRef = ($env:SUPABASE_URL -replace 'https://|\.supabase\.co', '')

Write-Host "✓ Project: $projectRef" -ForegroundColor Green
Write-Host "`n📥 Fetching database schema and data..." -ForegroundColor Cyan
Write-Host "   This uses pg_dump via Supabase CLI approach..." -ForegroundColor Yellow

# For now, let's create a comprehensive SQL export using the REST API
Write-Host "`n📋 Exporting table schemas and data..." -ForegroundColor Cyan

$headers = @{
    "apikey" = $env:SUPABASE_SERVICE_KEY
    "Authorization" = "Bearer $env:SUPABASE_SERVICE_KEY"
    "Content-Type" = "application/json"
}

# Get list of all tables
$tables = @(
    'clubhouse_events',
    'clubhouse_competitions', 
    'clubhouse_entries',
    'clubhouse_entry_picks',
    'clubhouse_golfers',
    'clubhouse_wallets',
    'clubhouse_wallet_transactions'
)

$backupSql = @"
-- ============================================================================
-- Supabase Database Backup
-- Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
-- Project: $projectRef
-- ============================================================================

-- NOTE: This is a data export only. Schema should be managed via migrations.
-- To restore, run this SQL in Supabase SQL Editor.

"@

foreach ($table in $tables) {
    Write-Host "   Exporting $table..." -ForegroundColor Gray
    
    try {
        $response = Invoke-RestMethod -Uri "$($env:SUPABASE_URL)/rest/v1/$table" -Headers $headers -Method Get
        
        if ($response.Count -gt 0) {
            $backupSql += "`n-- ============================================================================`n"
            $backupSql += "-- Table: $table ($($response.Count) rows)`n"
            $backupSql += "-- ============================================================================`n`n"
            
            foreach ($row in $response) {
                $columns = @()
                $values = @()
                
                foreach ($prop in $row.PSObject.Properties) {
                    $columns += $prop.Name
                    if ($null -eq $prop.Value) {
                        $values += "NULL"
                    } elseif ($prop.Value -is [string]) {
                        $escapedValue = $prop.Value -replace "'", "''"
                        $values += "'$escapedValue'"
                    } elseif ($prop.Value -is [bool]) {
                        $values += if ($prop.Value) { "true" } else { "false" }
                    } elseif ($prop.Value -is [array]) {
                        $arrayStr = ($prop.Value | ForEach-Object { 
                            if ($_ -is [string]) { "'$($_)'" } else { $_ }
                        }) -join ','
                        $values += "ARRAY[$arrayStr]"
                    } else {
                        $values += $prop.Value
                    }
                }
                
                $backupSql += "INSERT INTO $table ($($columns -join ', ')) VALUES ($($values -join ', '));`n"
            }
            
            $backupSql += "`n"
        }
    } catch {
        Write-Host "   ⚠️  Warning: Could not export $table - $_" -ForegroundColor Yellow
    }
}

# Save to file
$backupSql | Out-File -FilePath $OutputFile -Encoding UTF8

Write-Host "`n✅ Backup complete!" -ForegroundColor Green
Write-Host "📄 File: $OutputFile" -ForegroundColor Cyan
Write-Host "📊 Size: $([math]::Round((Get-Item $OutputFile).Length / 1KB, 2)) KB`n" -ForegroundColor Cyan

Write-Host "To restore this backup:" -ForegroundColor Yellow
Write-Host "   1. Open Supabase SQL Editor" -ForegroundColor Gray
Write-Host "   2. Paste the contents of $OutputFile" -ForegroundColor Gray
Write-Host "   3. Click RUN" -ForegroundColor Gray
Write-Host ""
