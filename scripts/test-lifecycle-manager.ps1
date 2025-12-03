# Test Tournament Lifecycle Manager APIs
# Run this after adding database columns and starting admin app

Write-Host "`n=== Testing Tournament Lifecycle Manager ===" -ForegroundColor Cyan
Write-Host "Make sure admin app is running on localhost:3002`n" -ForegroundColor Yellow

# Test 1: Fetch all tournaments
Write-Host "Test 1: Fetching all tournaments with stats..." -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3002/api/tournament-lifecycle" -Method GET
    $count = $response.tournaments.Count
    Write-Host "✓ SUCCESS: Found $count tournaments" -ForegroundColor Green
    
    # Show sample
    if ($count -gt 0) {
        $first = $response.tournaments[0]
        Write-Host "`nSample tournament:" -ForegroundColor Cyan
        Write-Host "  Name: $($first.name)" -ForegroundColor White
        Write-Host "  Status: $($first.status)" -ForegroundColor White
        Write-Host "  Golfers: $($first.golfer_count)" -ForegroundColor White
        Write-Host "  Competitions: $($first.competition_count)" -ForegroundColor White
        Write-Host "  Entries: $($first.entry_count)" -ForegroundColor White
    }
} catch {
    Write-Host "✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Get a tournament ID for testing
Write-Host "`n`nTest 2: Getting tournament ID for status test..." -ForegroundColor Green
try {
    $tournaments = (Invoke-RestMethod -Uri "http://localhost:3002/api/tournament-lifecycle" -Method GET).tournaments
    if ($tournaments.Count -gt 0) {
        $testTournament = $tournaments | Where-Object { $_.status -eq 'upcoming' } | Select-Object -First 1
        if ($null -eq $testTournament) {
            $testTournament = $tournaments[0]
        }
        
        Write-Host "✓ Using tournament: $($testTournament.name) (ID: $($testTournament.id))" -ForegroundColor Green
        
        # Test 3: Try status change validation (should fail if no golfers)
        Write-Host "`nTest 3: Testing status change validation..." -ForegroundColor Green
        try {
            $statusBody = @{
                status = "registration_open"
            } | ConvertTo-Json
            
            $statusResponse = Invoke-RestMethod `
                -Uri "http://localhost:3002/api/tournament-lifecycle/$($testTournament.id)/status" `
                -Method POST `
                -ContentType "application/json" `
                -Body $statusBody
            
            Write-Host "✓ Status changed successfully" -ForegroundColor Green
        } catch {
            $errorMsg = $_.ErrorDetails.Message | ConvertFrom-Json
            if ($errorMsg.error -like "*No golfers*") {
                Write-Host "✓ Validation working: $($errorMsg.error)" -ForegroundColor Yellow
            } else {
                Write-Host "✗ Unexpected error: $($errorMsg.error)" -ForegroundColor Red
            }
        }
        
        # Test 4: Try registration window (should validate dates)
        Write-Host "`nTest 4: Testing registration window validation..." -ForegroundColor Green
        try {
            $now = Get-Date
            $opensAt = $now.AddDays(1).ToString("o")
            $closesAt = $now.AddDays(-1).ToString("o") # Invalid: closes before opens
            
            $regBody = @{
                registration_opens_at = $opensAt
                registration_closes_at = $closesAt
            } | ConvertTo-Json
            
            $regResponse = Invoke-RestMethod `
                -Uri "http://localhost:3002/api/tournament-lifecycle/$($testTournament.id)/registration" `
                -Method POST `
                -ContentType "application/json" `
                -Body $regBody
            
            Write-Host "✗ Should have failed validation" -ForegroundColor Red
        } catch {
            $errorMsg = $_.ErrorDetails.Message | ConvertFrom-Json
            if ($errorMsg.error -like "*must be after*") {
                Write-Host "✓ Validation working: $($errorMsg.error)" -ForegroundColor Yellow
            } else {
                Write-Host "? Got error: $($errorMsg.error)" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "✗ No tournaments found to test with" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n`n=== Test Summary ===" -ForegroundColor Cyan
Write-Host "1. GET /api/tournament-lifecycle - Fetches tournaments with stats" -ForegroundColor White
Write-Host "2. POST /api/tournament-lifecycle/[id]/status - Changes status with validation" -ForegroundColor White
Write-Host "3. POST /api/tournament-lifecycle/[id]/registration - Sets registration windows" -ForegroundColor White
Write-Host "`nNext: Open http://localhost:3002/tournament-lifecycle to see the UI" -ForegroundColor Green
