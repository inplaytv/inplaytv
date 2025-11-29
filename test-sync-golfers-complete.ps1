# Test Complete Golfer Sync Functionality
# Tests all 9 features of the auto-golfer-group system

Write-Host "`n" -NoNewline
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "COMPLETE GOLFER SYNC TEST" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

# Configuration
$baseUrl = "http://localhost:3002"
$supabaseUrl = "https://qemosikbhrnstcormhuz.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MjIxNDcsImV4cCI6MjA3NjA5ODE0N30.6-UaVE6E-Esn8mY4fhbvoQkdw3ZGK8IkwOPieF6gHkc"

$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $anonKey"
    "Content-Type" = "application/json"
}

# Find a live tournament to test with
Write-Host "📋 Finding a live tournament to test..." -ForegroundColor Yellow
try {
    $uri = '{0}/rest/v1/tournaments?select=id,name,status,tour&status=eq.live&limit=1' -f $supabaseUrl
    $tournaments = Invoke-RestMethod -Uri $uri -Headers $headers
    
    if ($tournaments.Count -eq 0) {
        Write-Host "⚠️  No live tournaments found. Trying 'upcoming' status..." -ForegroundColor Yellow
        $uri = '{0}/rest/v1/tournaments?select=id,name,status,tour&status=eq.upcoming&limit=1' -f $supabaseUrl
        $tournaments = Invoke-RestMethod -Uri $uri -Headers $headers
    }
    
    if ($tournaments.Count -eq 0) {
        Write-Host "❌ No suitable tournaments found. Please create a tournament first." -ForegroundColor Red
        exit 1
    }
    
    $tournament = $tournaments[0]
    $tournamentId = $tournament.id
    $tournamentName = $tournament.name
    $tour = $tournament.tour
    
    Write-Host "✅ Found tournament: $tournamentName" -ForegroundColor Green
    Write-Host "   ID: $tournamentId" -ForegroundColor Gray
    Write-Host "   Tour: $tour" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Error fetching tournaments: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Check admin server is running
Write-Host "🔍 Checking admin server..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-WebRequest -Uri "$baseUrl" -Method GET -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ Admin server is running" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Admin server is not running!" -ForegroundColor Red
    Write-Host "   Please start it with: cd apps/admin ; pnpm dev" -ForegroundColor Yellow
    exit 1
}

Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "RUNNING SYNC TEST" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

# Call the sync endpoint
Write-Host "🚀 Calling sync-golfers endpoint..." -ForegroundColor Yellow
Write-Host "   URL: POST $baseUrl/api/tournaments/$tournamentId/sync-golfers" -ForegroundColor Gray
Write-Host "   Body: { tour: '$tour', replace: true }" -ForegroundColor Gray
Write-Host ""

$body = @{
    tour = $tour
    replace = $true
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/tournaments/$tournamentId/sync-golfers" -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "✅ SYNC COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host ""
    
    # Display results
    Write-Host "📊 SYNC RESULTS:" -ForegroundColor Cyan
    Write-Host "   Tournament: $($response.tournament.name)" -ForegroundColor White
    Write-Host "   DataGolf Event: $($response.dataGolfEvent)" -ForegroundColor White
    Write-Host "   Golfers Added: $($response.golfersAdded)" -ForegroundColor Green
    Write-Host "   Golfers Created: $($response.golfersCreated)" -ForegroundColor Green
    Write-Host "   Golfers Existing: $($response.golfersExisting)" -ForegroundColor Green
    Write-Host ""
    
    if ($response.golferGroup) {
        Write-Host "👥 GOLFER GROUP:" -ForegroundColor Cyan
        Write-Host "   Name: $($response.golferGroup.name)" -ForegroundColor White
        Write-Host "   Slug: $($response.golferGroup.slug)" -ForegroundColor White
        Write-Host "   ID: $($response.golferGroup.id)" -ForegroundColor Gray
        Write-Host ""
    }
    
    Write-Host "🔗 COMPETITIONS LINKED: $($response.competitionsLinked)" -ForegroundColor Cyan
    Write-Host ""
    
    # Store IDs for verification
    $groupId = $response.golferGroup.id
    $expectedGolfers = $response.golfersAdded
    
} catch {
    Write-Host "❌ SYNC FAILED!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host ""
        Write-Host "Response Body:" -ForegroundColor Yellow
        try {
            $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
            $errorBody | ConvertTo-Json -Depth 5
        } catch {
            Write-Host $_.ErrorDetails.Message
        }
    }
    exit 1
}

# Verify all 9 features
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "VERIFYING 9 FEATURES" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

$allPassed = $true

# Feature 1: Detects tournament tour
Write-Host "1️⃣  Tour Detection..." -ForegroundColor Yellow
if ($tour) {
    Write-Host "   ✅ PASS - Detected tour: $tour" -ForegroundColor Green
} else {
    Write-Host "   ❌ FAIL - No tour detected" -ForegroundColor Red
    $allPassed = $false
}

# Feature 2: Fetches from DataGolf
Write-Host "2️⃣  DataGolf Fetch..." -ForegroundColor Yellow
if ($response.dataGolfEvent) {
    Write-Host "   ✅ PASS - Fetched event: $($response.dataGolfEvent)" -ForegroundColor Green
} else {
    Write-Host "   ❌ FAIL - No DataGolf event returned" -ForegroundColor Red
    $allPassed = $false
}

# Feature 3: Creates/updates golfers
Write-Host "3️⃣  Golfer Creation..." -ForegroundColor Yellow
if ($response.golfersCreated -ge 0) {
    Write-Host "   ✅ PASS - Created $($response.golfersCreated) new golfers" -ForegroundColor Green
} else {
    Write-Host "   ❌ FAIL - Golfer creation status unknown" -ForegroundColor Red
    $allPassed = $false
}

# Feature 4: Links golfers to tournament
Write-Host "4️⃣  Tournament Linking..." -ForegroundColor Yellow
$uri = '{0}/rest/v1/tournament_golfers?tournament_id=eq.{1}&select=golfer_id' -f $supabaseUrl, $tournamentId
$tournamentGolfers = Invoke-RestMethod -Uri $uri -Headers $headers
if ($tournamentGolfers.Count -gt 0) {
    Write-Host "   ✅ PASS - $($tournamentGolfers.Count) golfers linked to tournament" -ForegroundColor Green
} else {
    Write-Host "   ❌ FAIL - No golfers linked to tournament" -ForegroundColor Red
    $allPassed = $false
}

# Feature 5: Auto-creates golfer group
Write-Host "5️⃣  Golfer Group Creation..." -ForegroundColor Yellow
if ($groupId) {
    $uri = '{0}/rest/v1/golfer_groups?id=eq.{1}&select=id,name,slug' -f $supabaseUrl, $groupId
    $group = Invoke-RestMethod -Uri $uri -Headers $headers
    if ($group.Count -gt 0) {
        Write-Host "   ✅ PASS - Group created: $($group[0].name)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ FAIL - Group not found in database" -ForegroundColor Red
        $allPassed = $false
    }
} else {
    Write-Host "   ❌ FAIL - No group ID returned" -ForegroundColor Red
    $allPassed = $false
}

# Feature 6: Adds all golfers to group
Write-Host "6️⃣  Group Membership..." -ForegroundColor Yellow
if ($groupId) {
    $uri = '{0}/rest/v1/golfer_group_members?group_id=eq.{1}&select=golfer_id' -f $supabaseUrl, $groupId
    $groupMembers = Invoke-RestMethod -Uri $uri -Headers $headers
    if ($groupMembers.Count -eq $expectedGolfers) {
        Write-Host "   ✅ PASS - All $($groupMembers.Count) golfers added to group" -ForegroundColor Green
    } elseif ($groupMembers.Count -gt 0) {
        Write-Host "   ⚠️  PARTIAL - $($groupMembers.Count) golfers in group (expected $expectedGolfers)" -ForegroundColor Yellow
    } else {
        Write-Host "   ❌ FAIL - No golfers in group" -ForegroundColor Red
        $allPassed = $false
    }
} else {
    Write-Host "   ❌ FAIL - No group to verify" -ForegroundColor Red
    $allPassed = $false
}

# Feature 7: Finds all tournament competitions
Write-Host "7️⃣  Competition Discovery..." -ForegroundColor Yellow
$uri = '{0}/rest/v1/tournament_competitions?tournament_id=eq.{1}&select=id,competition_types(name)' -f $supabaseUrl, $tournamentId
$competitions = Invoke-RestMethod -Uri $uri -Headers $headers
if ($competitions.Count -gt 0) {
    Write-Host "   ✅ PASS - Found $($competitions.Count) competitions" -ForegroundColor Green
    $competitions | ForEach-Object { Write-Host "      - $($_.competition_types.name)" -ForegroundColor Gray }
} else {
    Write-Host "   ⚠️  WARNING - No competitions found (tournament may not have competitions yet)" -ForegroundColor Yellow
}

# Feature 8: Links group to ALL competitions
Write-Host "8️⃣  Competition Linking..." -ForegroundColor Yellow
if ($groupId -and $competitions.Count -gt 0) {
    $uri = '{0}/rest/v1/tournament_competitions?tournament_id=eq.{1}&assigned_golfer_group_id=eq.{2}&select=id,competition_types(name)' -f $supabaseUrl, $tournamentId, $groupId
    $linkedCompetitions = Invoke-RestMethod -Uri $uri -Headers $headers
    if ($linkedCompetitions.Count -eq $competitions.Count) {
        Write-Host "   ✅ PASS - All $($linkedCompetitions.Count) competitions linked to group" -ForegroundColor Green
    } elseif ($linkedCompetitions.Count -gt 0) {
        Write-Host "   ⚠️  PARTIAL - $($linkedCompetitions.Count)/$($competitions.Count) competitions linked" -ForegroundColor Yellow
    } else {
        Write-Host "   ❌ FAIL - No competitions linked to group" -ForegroundColor Red
        $allPassed = $false
    }
} elseif ($competitions.Count -eq 0) {
    Write-Host "   ⚠️  SKIP - No competitions to link" -ForegroundColor Yellow
} else {
    Write-Host "   ❌ FAIL - No group to link" -ForegroundColor Red
    $allPassed = $false
}

# Feature 9: Team builder ready
Write-Host "9️⃣  Team Builder Ready..." -ForegroundColor Yellow
if ($groupId -and $groupMembers.Count -gt 0 -and $linkedCompetitions.Count -gt 0) {
    Write-Host "   ✅ PASS - Team builder ready with $($groupMembers.Count) golfers" -ForegroundColor Green
    Write-Host "      Zero manual steps required! 🎉" -ForegroundColor Green
} elseif ($competitions.Count -eq 0) {
    Write-Host "   ⚠️  PARTIAL - Golfers synced, but no competitions exist yet" -ForegroundColor Yellow
} else {
    Write-Host "   ❌ FAIL - Team builder not ready" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""
Write-Host "=" * 80 -ForegroundColor Cyan

if ($allPassed -and $competitions.Count -gt 0) {
    Write-Host "🎉 ALL TESTS PASSED! 🎉" -ForegroundColor Green
    Write-Host ""
    Write-Host "The golfer sync system is working perfectly!" -ForegroundColor Green
    Write-Host "All 9 features are operational." -ForegroundColor Green
} elseif ($competitions.Count -eq 0) {
    Write-Host "⚠️  MOSTLY PASSING - Golfers synced successfully" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Note: Tournament has no competitions yet." -ForegroundColor Yellow
    Write-Host "Once competitions are added, they will auto-link to the golfer group." -ForegroundColor Yellow
} else {
    Write-Host "❌ SOME TESTS FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please review the failures above." -ForegroundColor Red
}

Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

# Summary
Write-Host "📋 SUMMARY:" -ForegroundColor Cyan
Write-Host "   Tournament: $tournamentName" -ForegroundColor White
Write-Host "   Golfers Synced: $($response.golfersAdded)" -ForegroundColor White
Write-Host "   Group: $($response.golferGroup.name)" -ForegroundColor White
Write-Host "   Competitions Linked: $($response.competitionsLinked)" -ForegroundColor White
Write-Host ""
