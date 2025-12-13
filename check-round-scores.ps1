# Check tournament_golfer_scores table for round data
$tournamentId = "f091f409-8e88-437a-a97a-342b8f3c0ba0"

# Get the DATABASE_URL from .env.local
$envFile = "C:\inplaytv - New\apps\golf\.env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^DATABASE_URL=(.+)$") {
            $env:DATABASE_URL = $matches[1]
        }
    }
}

# Create a simple Node.js script to query the database
$script = @"
const { createClient } = require('@supabase/supabase-js');

async function checkScores() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('No DATABASE_URL found');
        return;
    }
    
    // Extract Supabase URL and anon key from connection string
    // This won't work directly - we need to use the Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase credentials');
        return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check table structure
    const { data: columns, error: colError } = await supabase
        .rpc('get_table_columns', { table_name: 'tournament_golfer_scores' })
        .select();
    
    console.log('Columns:', columns);
    
    // Check for data
    const { data, error } = await supabase
        .from('tournament_golfer_scores')
        .select('*')
        .eq('tournament_id', '$tournamentId')
        .limit(5);
    
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    console.log('Sample data:', JSON.stringify(data, null, 2));
}

checkScores();
"@

# Write and run the script
# Actually, let's just use a simpler PowerShell approach with Supabase REST API

Write-Host "Checking tournament_golfer_scores for tournament: $tournamentId" -ForegroundColor Cyan

# Load environment variables
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^NEXT_PUBLIC_SUPABASE_URL=(.+)$") {
            $supabaseUrl = $matches[1]
        }
        if ($_ -match "^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)$") {
            $supabaseKey = $matches[1]
        }
    }
}

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "ERROR: Could not find Supabase credentials in .env.local" -ForegroundColor Red
    exit 1
}

# Query the database via REST API
$headers = @{
    "apikey" = $supabaseKey
    "Authorization" = "Bearer $supabaseKey"
}

$url = "$supabaseUrl/rest/v1/tournament_golfer_scores?tournament_id=eq.$tournamentId&select=*&limit=5"

try {
    $response = Invoke-RestMethod -Uri $url -Headers $headers -Method Get
    Write-Host "`n✅ Found $($response.Count) records" -ForegroundColor Green
    Write-Host "`nSample data:" -ForegroundColor Yellow
    $response | ForEach-Object {
        Write-Host "`nGolfer ID: $($_.golfer_id)"
        Write-Host "Total Score: $($_.total_score)"
        Write-Host "R1: $($_.r1)"
        Write-Host "R2: $($_.r2)"
        Write-Host "R3: $($_.r3)"
        Write-Host "R4: $($_.r4)"
        Write-Host "Round 1: $($_.round_1)"
        Write-Host "Round 2: $($_.round_2)"
        Write-Host "Round 3: $($_.round_3)"
        Write-Host "Round 4: $($_.round_4)"
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
