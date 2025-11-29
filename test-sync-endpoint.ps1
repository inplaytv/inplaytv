# Test the sync-scores endpoint
# Using The RSM Classic (completed tournament with golfers)
$tournamentId = "d9cdd4d8-75bc-401c-9472-c297bfa718ce"
$baseUrl = "http://localhost:3002"

Write-Host "Testing with Tournament ID: $tournamentId" -ForegroundColor Yellow
Write-Host "Tournament: The RSM Classic (Status: completed, has golfers)" -ForegroundColor Yellow

Write-Host "`n=== Testing GET /api/admin/tournaments/[id]/sync-scores ===" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/tournaments/$tournamentId/sync-scores" -Method GET
    Write-Host "`nGET Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "`nGET Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}

Write-Host "`n`n=== Testing POST /api/admin/tournaments/[id]/sync-scores ===" -ForegroundColor Cyan

try {
    $headers = @{
        "Content-Type" = "application/json"
    }
    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/tournaments/$tournamentId/sync-scores" -Method POST -Headers $headers
    Write-Host "`nPOST Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "`nPOST Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}
