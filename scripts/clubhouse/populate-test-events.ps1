# Populate Clubhouse Test Events - CORRECT Registration Timing
# Registration closes 15 minutes before LAST round tee-off

param([string]$EnvFile = "apps\golf\.env.local")

Write-Host "Populating Clubhouse Test Events..." -ForegroundColor Cyan

# Load environment
Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process')
    }
}

$headers = @{
    "apikey" = $env:SUPABASE_SERVICE_ROLE_KEY
    "Authorization" = "Bearer $env:SUPABASE_SERVICE_ROLE_KEY"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

# Create 3 test events
$events = @(
    @{
        name = "Spring Masters Championship"
        slug = "spring-masters-championship"
        description = "Prestigious spring tournament"
        venue = "Augusta National Golf Club"
        location = "Augusta, GA, USA"
        prize_fund = 15000000
        start_date = "2026-01-09"
        end_date = "2026-01-12"
        round1_tee_time = "2026-01-09T07:00:00Z"
        round2_tee_time = "2026-01-10T07:00:00Z"
        round3_tee_time = "2026-01-11T07:00:00Z"
        round4_tee_time = "2026-01-12T07:00:00Z"
        registration_opens_at = "2026-01-04T00:00:00Z"
        registration_closes_at = "2026-01-12T06:45:00Z" # 15min before round4
        status = "open"
    },
    @{
        name = "Desert Classic Open"
        slug = "desert-classic-open"
        description = "Three-round desert tournament"
        venue = "TPC Scottsdale"
        location = "Scottsdale, AZ, USA"
        prize_fund = 8000000
        start_date = "2026-01-15"
        end_date = "2026-01-17"
        round1_tee_time = "2026-01-15T08:00:00Z"
        round2_tee_time = "2026-01-16T08:00:00Z"
        round3_tee_time = "2026-01-17T08:00:00Z"
        registration_opens_at = "2026-01-08T00:00:00Z"
        registration_closes_at = "2026-01-17T07:45:00Z" # 15min before round3
        status = "open"
    },
    @{
        name = "Coastal Links Championship"
        slug = "coastal-links-championship"
        description = "Traditional links golf"
        venue = "Pebble Beach Golf Links"
        location = "Pebble Beach, CA, USA"
        prize_fund = 12000000
        start_date = "2026-01-20"
        end_date = "2026-01-23"
        round1_tee_time = "2026-01-20T09:00:00Z"
        round2_tee_time = "2026-01-21T09:00:00Z"
        round3_tee_time = "2026-01-22T09:00:00Z"
        round4_tee_time = "2026-01-23T09:00:00Z"
        registration_opens_at = "2026-01-13T00:00:00Z"
        registration_closes_at = "2026-01-23T08:45:00Z" # 15min before round4
        status = "open"
    }
)

foreach ($event in $events) {
    Write-Host "Creating: $($event.name)" -ForegroundColor Yellow
    $body = $event | ConvertTo-Json
    try {
        $response = Invoke-RestMethod -Uri "$($env:NEXT_PUBLIC_SUPABASE_URL)/rest/v1/clubhouse_events" -Method POST -Headers $headers -Body $body
        Write-Host "  SUCCESS - Event ID: $($response.id)" -ForegroundColor Green
        
        # Create 5 competitions per event
        @("Full Course", "Beat The Cut", "Elite Challenge", "Daily Sprint", "Weekend Warrior") | ForEach-Object {
            $comp = @{
                event_id = $response.id
                name = $_
                entry_fee_credits = @(1000, 500, 2000, 250, 750)[(Get-Random -Maximum 5)]
                prize_pool_credits = 50000
                opens_at = $event.registration_opens_at
                closes_at = $event.registration_closes_at
                starts_at = $event.round1_tee_time
                ends_at = $event.round4_tee_time ?? $event.round3_tee_time
                status = $event.status
            } | ConvertTo-Json
            Invoke-RestMethod -Uri "$($env:NEXT_PUBLIC_SUPABASE_URL)/rest/v1/clubhouse_competitions" -Method POST -Headers $headers -Body $comp | Out-Null
        }
        Write-Host "  + Created 5 competitions" -ForegroundColor Gray
    } catch {
        Write-Host "  FAILED: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "DONE! View at http://localhost:3003/clubhouse/events" -ForegroundColor Green
