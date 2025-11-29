pnpm# Run Tournament DataGolf Fields Migration
# Adds event_id and tour columns to tournaments table

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TOURNAMENT DATAGOLF FIELDS MIGRATION" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Supabase connection
$supabaseUrl = "https://ojeckayyzbuxqojgvxzm.supabase.co"
$supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZWNrYXl5emJ1eHFvamd2eHptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjU3OTI2MywiZXhwIjoyMDQ4MTU1MjYzfQ.zzOKkKWJWvCEo5HbMXxS-aVmDpZv0Pt2Ou5hnPX-LZ8"

# Read SQL file
$sqlFile = "scripts/setup-tournament-datagolf-fields.sql"

if (-not (Test-Path $sqlFile)) {
    Write-Host "ERROR: SQL file not found: $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "Reading SQL migration file..." -ForegroundColor Yellow
$sql = Get-Content $sqlFile -Raw

Write-Host "Executing migration..." -ForegroundColor Yellow

# Execute SQL using Supabase REST API
$body = @{
    query = $sql
} | ConvertTo-Json

$headers = @{
    "apikey" = $supabaseKey
    "Authorization" = "Bearer $supabaseKey"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/exec_sql" -Method Post -Headers $headers -Body $body -ErrorAction Stop
    
    Write-Host "`n✅ Migration completed successfully!`n" -ForegroundColor Green
    
    # Show results
    Write-Host "Updated Tournaments:" -ForegroundColor Cyan
    Write-Host "===================" -ForegroundColor Cyan
    
    # Query updated tournaments
    $queryBody = @{
        query = "SELECT name, tour, event_id, status FROM tournaments WHERE event_id IS NOT NULL ORDER BY start_date DESC LIMIT 5"
    } | ConvertTo-Json
    
    $results = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/exec_sql" -Method Post -Headers $headers -Body $queryBody
    
    if ($results) {
        $results | Format-Table -AutoSize
    }
    
} catch {
    Write-Host "`n❌ Migration failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try alternative approach using psql if available
    Write-Host "`nTrying alternative method with psql..." -ForegroundColor Yellow
    Write-Host "You can manually run the SQL file in Supabase SQL Editor:" -ForegroundColor Yellow
    Write-Host "  1. Go to https://supabase.com/dashboard/project/ojeckayyzbuxqojgvxzm/sql" -ForegroundColor Yellow
    Write-Host "  2. Open the file: $sqlFile" -ForegroundColor Yellow
    Write-Host "  3. Execute the SQL" -ForegroundColor Yellow
}

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "==========" -ForegroundColor Cyan
Write-Host "1. When adding new tournaments in admin, fill in:" -ForegroundColor White
Write-Host "   - tour: pga, euro, lpga, etc." -ForegroundColor Gray
Write-Host "   - event_id: DataGolf event identifier" -ForegroundColor Gray
Write-Host "2. Live scores will use these fields automatically" -ForegroundColor White
Write-Host "3. No code changes needed for new tournaments!`n" -ForegroundColor White

