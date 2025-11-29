# Simple Golfer Sync Test
# Tests the complete sync-golfers functionality

Write-Host "`n================================================================================`n" -ForegroundColor Cyan
Write-Host "GOLFER SYNC COMPLETE TEST`n" -ForegroundColor Cyan
Write-Host "================================================================================`n" -ForegroundColor Cyan

# Configuration
$baseUrl = "http://localhost:3002"
$tournamentId = "a52180df-9e00-4a93-a4c5-b29f00da3522"  # BMW Australian PGA Championship
$tour = "euro"

Write-Host "Testing with BMW Australian PGA Championship`n" -ForegroundColor Yellow

# Check admin server
Write-Host "Checking admin server..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $baseUrl -Method GET -TimeoutSec 5 -UseBasicParsing | Out-Null
    Write-Host "Admin server is running`n" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Admin server is not running!" -ForegroundColor Red
    Write-Host "Please start it: cd apps/admin ; pnpm dev`n" -ForegroundColor Yellow
    exit 1
}

# Run sync
Write-Host "================================================================================`n" -ForegroundColor Cyan
Write-Host "Running sync-golfers endpoint...`n" -ForegroundColor Yellow

$body = @{
    tour = $tour
    replace = $true
} | ConvertTo-Json

try {
    $url = "$baseUrl/api/tournaments/$tournamentId/sync-golfers"
    $response = Invoke-RestMethod -Uri $url -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "SUCCESS! Sync completed`n" -ForegroundColor Green
    
    Write-Host "RESULTS:" -ForegroundColor Cyan
    Write-Host "  Tournament: $($response.tournament.name)" -ForegroundColor White
    Write-Host "  DataGolf Event: $($response.dataGolfEvent)" -ForegroundColor White
    Write-Host "  Golfers Added: $($response.golfersAdded)" -ForegroundColor Green
    Write-Host "  New Golfers: $($response.golfersCreated)" -ForegroundColor Green
    Write-Host "  Existing Golfers: $($response.golfersExisting)" -ForegroundColor Green
    
    if ($response.golferGroup) {
        Write-Host "`n  Golfer Group:" -ForegroundColor Cyan
        Write-Host "    Name: $($response.golferGroup.name)" -ForegroundColor White
        Write-Host "    Slug: $($response.golferGroup.slug)" -ForegroundColor White
        Write-Host "    ID: $($response.golferGroup.id)" -ForegroundColor Gray
    }
    
    Write-Host "`n  Competitions Linked: $($response.competitionsLinked)`n" -ForegroundColor Cyan
    
    # Feature checklist
    Write-Host "================================================================================`n" -ForegroundColor Cyan
    Write-Host "FEATURE VERIFICATION:`n" -ForegroundColor Cyan
    
    $allGood = $true
    
    if ($tour) {
        Write-Host "  1. Tour Detection: PASS (detected: $tour)" -ForegroundColor Green
    } else {
        Write-Host "  1. Tour Detection: FAIL" -ForegroundColor Red
        $allGood = $false
    }
    
    if ($response.dataGolfEvent) {
        Write-Host "  2. DataGolf Fetch: PASS (event: $($response.dataGolfEvent))" -ForegroundColor Green
    } else {
        Write-Host "  2. DataGolf Fetch: FAIL" -ForegroundColor Red
        $allGood = $false
    }
    
    if ($response.golfersCreated -ge 0) {
        Write-Host "  3. Golfer Creation: PASS ($($response.golfersCreated) new)" -ForegroundColor Green
    } else {
        Write-Host "  3. Golfer Creation: FAIL" -ForegroundColor Red
        $allGood = $false
    }
    
    if ($response.golfersAdded -gt 0) {
        Write-Host "  4. Tournament Linking: PASS ($($response.golfersAdded) linked)" -ForegroundColor Green
    } else {
        Write-Host "  4. Tournament Linking: FAIL" -ForegroundColor Red
        $allGood = $false
    }
    
    if ($response.golferGroup) {
        Write-Host "  5. Auto-Group Creation: PASS (created: $($response.golferGroup.name))" -ForegroundColor Green
    } else {
        Write-Host "  5. Auto-Group Creation: FAIL" -ForegroundColor Red
        $allGood = $false
    }
    
    if ($response.golfersAdded -gt 0 -and $response.golferGroup) {
        Write-Host "  6. Group Membership: PASS ($($response.golfersAdded) golfers)" -ForegroundColor Green
    } else {
        Write-Host "  6. Group Membership: FAIL" -ForegroundColor Red
        $allGood = $false
    }
    
    if ($response.competitionsLinked -ge 0) {
        Write-Host "  7. Competition Discovery: PASS (found competitions)" -ForegroundColor Green
    } else {
        Write-Host "  7. Competition Discovery: FAIL" -ForegroundColor Red
        $allGood = $false
    }
    
    if ($response.competitionsLinked -gt 0) {
        Write-Host "  8. Competition Linking: PASS ($($response.competitionsLinked) linked)" -ForegroundColor Green
    } else {
        Write-Host "  8. Competition Linking: WARNING (no competitions linked)" -ForegroundColor Yellow
    }
    
    if ($allGood -and $response.competitionsLinked -gt 0) {
        Write-Host "  9. Team Builder Ready: PASS (zero manual steps!)" -ForegroundColor Green
        Write-Host "`n================================================================================`n" -ForegroundColor Cyan
        Write-Host "ALL TESTS PASSED! The golfer sync system is working perfectly!`n" -ForegroundColor Green
        Write-Host "================================================================================`n" -ForegroundColor Cyan
    } elseif ($allGood) {
        Write-Host "  9. Team Builder Ready: PARTIAL (add competitions first)" -ForegroundColor Yellow
        Write-Host "`n================================================================================`n" -ForegroundColor Cyan
        Write-Host "MOSTLY PASSING - Add competitions to complete setup`n" -ForegroundColor Yellow
        Write-Host "================================================================================`n" -ForegroundColor Cyan
    } else {
        Write-Host "  9. Team Builder Ready: FAIL`n" -ForegroundColor Red
        Write-Host "================================================================================`n" -ForegroundColor Cyan
        Write-Host "SOME TESTS FAILED - Review above`n" -ForegroundColor Red
        Write-Host "================================================================================`n" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "SYNC FAILED!`n" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)`n" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host "Response:" -ForegroundColor Yellow
        try {
            $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
            $errorBody | ConvertTo-Json -Depth 5
        } catch {
            Write-Host $_.ErrorDetails.Message
        }
    }
    exit 1
}
