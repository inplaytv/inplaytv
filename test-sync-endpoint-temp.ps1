# Test the sync-scores endpoint
# Using the tournament ID from terminal history
$tournamentId = "Fetching tournaments from Supabase...  Found 5 tournaments:   - Hero World Challenge (ID: afa2df75-ee57-488a-aa13-5944b57f9e9c, Status: registration_open)   - The RSM Classic (ID: d9cdd4d8-75bc-401c-9472-c297bfa718ce, Status: completed)   - BMW Australian PGA Championship (ID: a52180df-9e00-4a93-a4c5-b29f00da3522, Status: live)   - Nedbank Golf Challenge in honour of Gary Player (ID: 88fbe29c-83c0-4be9-b03b-897d3fb2209f, Status: registration_open)   - Crown Australian Open (ID: f587d8e4-eef0-42c9-b008-6ffbd54e4e67, Status: registration_open)  First tournament ID: afa2df75-ee57-488a-aa13-5944b57f9e9c afa2df75-ee57-488a-aa13-5944b57f9e9c"
$baseUrl = "http://localhost:3002"

Write-Host "Testing with Tournament ID: $tournamentId" -ForegroundColor Yellow

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
