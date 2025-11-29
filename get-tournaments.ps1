# Query Supabase for tournaments
$supabaseUrl = "https://qemosikbhrnstcormhuz.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MjIxNDcsImV4cCI6MjA3NjA5ODE0N30.6-UaVE6E-Esn8mY4fhbvoQkdw3ZGK8IkwOPieF6gHkc"

$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $anonKey"
}

Write-Host "Fetching tournaments from Supabase..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/tournaments?select=id,name,status&limit=10" -Headers $headers
    
    Write-Host "`nFound $($response.Count) tournaments:" -ForegroundColor Green
    foreach ($tournament in $response) {
        Write-Host "  - $($tournament.name) (ID: $($tournament.id), Status: $($tournament.status))" -ForegroundColor White
    }
    
    if ($response.Count -gt 0) {
        Write-Host "`nFirst tournament ID: $($response[0].id)" -ForegroundColor Yellow
        return $response[0].id
    }
} catch {
    Write-Host "Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
