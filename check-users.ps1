$result = Invoke-RestMethod -Uri "http://localhost:3002/api/debug/users"
Write-Host "=== DATABASE USER CHECK ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Auth Users: $($result.summary.total_auth_users)" -ForegroundColor Yellow
Write-Host "Total Profiles: $($result.summary.total_profiles)" -ForegroundColor Yellow
Write-Host "Deleted Profiles: $($result.summary.deleted_profiles)" -ForegroundColor Red
Write-Host ""
Write-Host "=== AUTH USERS ===" -ForegroundColor Green
$result.auth_users | ForEach-Object {
    Write-Host "Email: $($_.email)"
    Write-Host "  Created: $($_.created_at)"
    Write-Host "  Last Sign In: $($_.last_sign_in_at)"
    Write-Host "  Banned: $($_.banned)"
    Write-Host ""
}
Write-Host "=== PROFILES ===" -ForegroundColor Green
$result.profiles | ForEach-Object {
    Write-Host "Email: $($_.email)"
    Write-Host "  Username: $($_.username)"
    Write-Host "  Created: $($_.created_at)"
    Write-Host ""
}
if ($result.deleted_profiles.Count -gt 0) {
    Write-Host "=== DELETED PROFILES ===" -ForegroundColor Red
    $result.deleted_profiles | ForEach-Object {
        Write-Host "Email: $($_.email)"
        Write-Host "  Username: $($_.username)"
        Write-Host "  Deleted At: $($_.deleted_at)"
        Write-Host ""
    }
}
