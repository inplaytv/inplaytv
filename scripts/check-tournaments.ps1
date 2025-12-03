# Check what tournaments exist in the database
$env:CRON_SECRET = "re7pJ9PekpbvlXqa2QObi6W+SlE9u+2kz8DxDOkyCgk="

# Direct Supabase query to see tournaments
$supabaseUrl = "https://qemosikbhrnstcormhuz.supabase.co"
$supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MjIxNDcsImV4cCI6MjA3NjA5ODE0N30.6-UaVE6E-Esn8mY4fhbvoQkdw3ZGK8IkwOPieF6gHkc"

$headers = @{
    'apikey' = $supabaseKey
    'Authorization' = "Bearer $supabaseKey"
}

Write-Host "Fetching tournaments from database..." -ForegroundColor Cyan

$response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/tournaments?status=eq.upcoming&order=start_date.asc" -Headers $headers

Write-Host "`nFound $($response.Count) upcoming tournaments:" -ForegroundColor Green

foreach ($t in $response) {
    Write-Host "`nTournament: $($t.name)" -ForegroundColor Yellow
    Write-Host "  ID: $($t.id)"
    Write-Host "  Start Date: $($t.start_date)"
    Write-Host "  Status: $($t.status)"
    Write-Host "  Slug: $($t.slug)"
}
