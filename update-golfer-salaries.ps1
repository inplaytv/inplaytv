# ============================================================================
# Quick Apply: Golfer Salary Database Update
# ============================================================================

Write-Host ""
Write-Host "Updating Golfer Salaries in Database" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
$envPath = "apps\golf\.env.local"
if (-not (Test-Path $envPath)) {
    Write-Host "Error: $envPath not found" -ForegroundColor Red
    exit 1
}

Write-Host "Loading environment..." -ForegroundColor Yellow
$envLines = Get-Content $envPath
$supabaseUrl = ($envLines | Where-Object { $_ -match '^NEXT_PUBLIC_SUPABASE_URL=' }) -replace 'NEXT_PUBLIC_SUPABASE_URL=', ''
$serviceKey = ($envLines | Where-Object { $_ -match '^SUPABASE_SERVICE_ROLE_KEY=' }) -replace 'SUPABASE_SERVICE_ROLE_KEY=', ''

if (-not $supabaseUrl -or -not $serviceKey) {
    Write-Host "Error: Missing Supabase credentials" -ForegroundColor Red
    exit 1
}

$env:NEXT_PUBLIC_SUPABASE_URL = $supabaseUrl
$env:SUPABASE_SERVICE_ROLE_KEY = $serviceKey

Write-Host "Connected to Supabase" -ForegroundColor Green
Write-Host ""
Write-Host "Executing migration..." -ForegroundColor Yellow
Write-Host ""

# Create JavaScript migration
$jsContent = @'
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateSalaries() {
  console.log('Fetching golfers...');
  
  const { data: golfers, error: fetchError } = await supabase
    .from('golfers')
    .select('id, full_name, salary_pennies, world_ranking');
    
  if (fetchError) {
    console.error('Error:', fetchError);
    process.exit(1);
  }
  
  console.log(`Found ${golfers.length} golfers`);
  console.log('Recalculating salaries...');
  
  let updated = 0;
  for (const golfer of golfers) {
    let newSalary;
    const ranking = golfer.world_ranking || 999;
    
    if (ranking <= 10) {
      newSalary = 1200000 + Math.floor(Math.random() * 300000);
    } else if (ranking <= 50) {
      newSalary = 900000 + Math.floor(Math.random() * 299900);
    } else if (ranking <= 100) {
      newSalary = 700000 + Math.floor(Math.random() * 199900);
    } else {
      newSalary = 500000 + Math.floor(Math.random() * 199900);
    }
    
    const { error: updateError } = await supabase
      .from('golfers')
      .update({ salary_pennies: newSalary })
      .eq('id', golfer.id);
      
    if (!updateError) {
      updated++;
    }
  }
  
  console.log('');
  console.log(`SUCCESS: Updated ${updated} golfers`);
  console.log('');
  console.log('Salary Distribution:');
  
  const premium = golfers.filter(g => (g.world_ranking || 999) <= 10).length;
  const highValue = golfers.filter(g => {
    const r = g.world_ranking || 999;
    return r > 10 && r <= 50;
  }).length;
  const midTier = golfers.filter(g => {
    const r = g.world_ranking || 999;
    return r > 50 && r <= 100;
  }).length;
  const value = golfers.filter(g => (g.world_ranking || 999) > 100).length;
  
  console.log(`  Premium (12k-15k GBP): ${premium} golfers`);
  console.log(`  High-Value (9k-12k):   ${highValue} golfers`);
  console.log(`  Mid-Tier (7k-9k):      ${midTier} golfers`);
  console.log(`  Value (under 7k):      ${value} golfers`);
  console.log('');
  console.log('MIGRATION COMPLETE!');
  console.log('Salary Cap: 60,000 GBP (6,000,000 pennies)');
}

updateSalaries().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
'@

$tempFile = [System.IO.Path]::GetTempFileName() + ".js"
[System.IO.File]::WriteAllText($tempFile, $jsContent, [System.Text.Encoding]::UTF8)

try {
    node $tempFile
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "SUCCESS!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "What Changed:" -ForegroundColor Cyan
        Write-Host "  - Golfers: 100 GBP -> 5,000-15,000 GBP" -ForegroundColor White
        Write-Host "  - Budget: 60,000 GBP (DraftKings standard)" -ForegroundColor White
        Write-Host "  - Clubhouse Display: Fixed" -ForegroundColor White
        Write-Host ""
        Write-Host "Next Steps:" -ForegroundColor Cyan
        Write-Host "  1. Stop dev server (Ctrl+C)" -ForegroundColor White
        Write-Host "  2. Restart: pnpm dev:golf" -ForegroundColor White
        Write-Host "  3. Test: Build a team" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "Migration failed" -ForegroundColor Red
    }
} finally {
    Remove-Item $tempFile -ErrorAction SilentlyContinue
}
