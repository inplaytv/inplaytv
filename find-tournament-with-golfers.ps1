# Find tournaments with golfers attached
$supabaseUrl = "https://qemosikbhrnstcormhuz.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MjIxNDcsImV4cCI6MjA3NjA5ODE0N30.6-UaVE6E-Esn8mY4fhbvoQkdw3ZGK8IkwOPieF6gHkc"

$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $anonKey"
}

Write-Host "`n=== Checking which tournaments have golfers ===" -ForegroundColor Cyan

try {
    # Get all tournaments
    $tournaments = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/tournaments?select=id,name,status&order=start_date.desc&limit=10" -Headers $headers
    
    foreach ($tournament in $tournaments) {
        # Count golfers for this tournament
        $golferCount = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/tournament_golfers?tournament_id=eq.$($tournament.id)&select=id" -Headers $headers
        
        $count = $golferCount.Count
        $color = if ($count -gt 0) { "Green" } else { "Yellow" }
        
        Write-Host "`n$($tournament.name)" -ForegroundColor White
        Write-Host "  ID: $($tournament.id)" -ForegroundColor Gray
        Write-Host "  Status: $($tournament.status)" -ForegroundColor Gray
        Write-Host "  Golfers: $count" -ForegroundColor $color
        
        if ($count -gt 0) {
            Write-Host "  >>> This tournament has golfers and can be used for testing!" -ForegroundColor Green
        }
    }
    
    Write-Host "`n=== Recommendation ===" -ForegroundColor Cyan
    Write-Host "Use a tournament with golfers for testing the scoring sync endpoint" -ForegroundColor Yellow
    Write-Host "To test with BMW, you'll need to run the sync-golfers endpoint first" -ForegroundColor Yellow
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
