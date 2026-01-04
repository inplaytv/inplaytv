# Test Clubhouse DataGolf Integration (Option A)
# Validates tournament linking workflow

Write-Host "=== Clubhouse DataGolf Integration Test ===" -ForegroundColor Cyan
Write-Host ""

# Load environment
$envPath = Join-Path $PSScriptRoot "..\..\apps\golf\.env.local"
if (!(Test-Path $envPath)) {
    Write-Host "ERROR: Environment file not found: $envPath" -ForegroundColor Red
    exit 1
}

Get-Content $envPath | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2])
    }
}

$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$supabaseKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (!$supabaseUrl -or !$supabaseKey) {
    Write-Host "ERROR: Missing Supabase credentials" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Environment loaded" -ForegroundColor Green
Write-Host ""

# Test 1: Check database column exists
Write-Host "Test 1: Verify linked_tournament_id column exists" -ForegroundColor Yellow

$sqlCheck = @"
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clubhouse_events'
AND column_name = 'linked_tournament_id';
"@

$headers = @{
    'apikey' = $supabaseKey
    'Authorization' = "Bearer $supabaseKey"
    'Content-Type' = 'application/json'
    'Prefer' = 'return=representation'
}

try {
    $response = Invoke-RestMethod `
        -Uri "$supabaseUrl/rest/v1/rpc/exec_sql" `
        -Method Post `
        -Headers $headers `
        -Body (@{ query = $sqlCheck } | ConvertTo-Json)
    
    if ($response) {
        Write-Host "   ✅ Column exists" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Column NOT found - run migration first!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ⚠️ Could not verify column (may still exist)" -ForegroundColor Yellow
}

Write-Host ""

# Test 2: Check for active tournaments
Write-Host "Test 2: Find active InPlay tournaments" -ForegroundColor Yellow

try {
    $tournamentsUri = "$supabaseUrl/rest/v1/tournaments?select=id,name,slug,status&status=in.(upcoming,registration_open,in_progress)"
    $tournamentsResponse = Invoke-RestMethod `
        -Uri $tournamentsUri `
        -Method Get `
        -Headers $headers
    
    if ($tournamentsResponse.Count -gt 0) {
        Write-Host "   ✅ Found $($tournamentsResponse.Count) active tournaments:" -ForegroundColor Green
        $tournamentsResponse | Select-Object -First 5 | ForEach-Object {
            Write-Host "      • $($_.name) ($($_.status))" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ⚠️ No active tournaments found (may need to create one)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Error fetching tournaments: $_" -ForegroundColor Red
}

Write-Host ""

# Test 3: Check for linked clubhouse events
Write-Host "Test 3: Find Clubhouse events with tournament links" -ForegroundColor Yellow

try {
    $linkedEventsUri = "$supabaseUrl/rest/v1/clubhouse_events?select=id,name,linked_tournament_id&linked_tournament_id=not.is.null"
    $linkedEventsResponse = Invoke-RestMethod `
        -Uri $linkedEventsUri `
        -Method Get `
        -Headers $headers
    
    if ($linkedEventsResponse.Count -gt 0) {
        Write-Host "   Found $($linkedEventsResponse.Count) linked events:" -ForegroundColor Green
        $linkedEventsResponse | ForEach-Object {
            Write-Host "      - $($_.name) -> Tournament ID: $($_.linked_tournament_id)" -ForegroundColor Gray
        }
    } else {
        Write-Host "   No linked events yet (this is normal before linking)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   Error fetching linked events: $_" -ForegroundColor Red
}

Write-Host ""

# Test 4: Check clubhouse competitions with golfer groups  
Write-Host "Test 4: Verify Clubhouse competitions can receive golfer groups" -ForegroundColor Yellow

try {
    $compsResponse = Invoke-RestMethod `
        -Uri "$supabaseUrl/rest/v1/clubhouse_competitions" `
        -Method Get `
        -Headers $headers `
        -Body @{
            select = 'id,name,assigned_golfer_group_id'
            assigned_golfer_group_id = 'not.is.null'
            limit = '5'
        }
    
    if ($compsResponse.Count -gt 0) {
        Write-Host "   Found $($compsResponse.Count) competitions with assigned groups:" -ForegroundColor Green
        $compsResponse | ForEach-Object {
            Write-Host "      - $($_.name) -> Group ID: $($_.assigned_golfer_group_id)" -ForegroundColor Gray
        }
    } else {
        Write-Host "   No competitions with groups yet" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   Error fetching competitions: $_" -ForegroundColor Red
}

Write-Host ""

Write-Host "=== Test Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. If column missing: Run .\scripts\clubhouse\apply-tournament-linking-migration.ps1" -ForegroundColor White
Write-Host "2. Create or edit Clubhouse event in admin" -ForegroundColor White
Write-Host "3. Select InPlay tournament from dropdown" -ForegroundColor White
Write-Host "4. Run tournament sync: Admin -> Tournament -> Sync Golfers from DataGolf" -ForegroundColor White
Write-Host "5. Check console output for clubhouse linking messages" -ForegroundColor White
Write-Host "6. Verify team builder shows correct golfers" -ForegroundColor White
Write-Host ""
Write-Host "Testing complete! ✅" -ForegroundColor Green
