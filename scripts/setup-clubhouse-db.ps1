# Clubhouse Database Setup Script

Write-Host "🏌️ Setting up Clubhouse database..." -ForegroundColor Cyan

# Load environment variables
$envPath = Join-Path $PSScriptRoot "..\apps\admin\.env.local"
if (-not (Test-Path $envPath)) {
    Write-Host "❌ Environment file not found: $envPath" -ForegroundColor Red
    exit 1
}

# Read environment variables
$env:DOTENV = Get-Content $envPath | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
    }
}

$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$supabaseKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "❌ Missing Supabase credentials in .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Loaded environment variables" -ForegroundColor Green

# Read SQL schema
$schemaPath = Join-Path $PSScriptRoot "clubhouse-schema.sql"
$schema = Get-Content $schemaPath -Raw

Write-Host "📄 Loaded schema file" -ForegroundColor Green

# Execute SQL using Supabase client
$code = @"
require('dotenv').config({path:'$($envPath.Replace('\','\\'))'});
const {createClient} = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const schema = fs.readFileSync('$($schemaPath.Replace('\','\\'))', 'utf-8');

(async () => {
  try {
    console.log('📝 Executing schema...');
    
    // Execute the schema
    const { data, error } = await supabase.rpc('exec_sql', { query: schema });
    
    if (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Schema executed successfully');
    
    // Verify tables were created
    const { data: tables } = await supabase
      .from('clubhouse_events')
      .select('count')
      .limit(1);
    
    console.log('✅ Tables verified');
    console.log('');
    console.log('🎉 Clubhouse database setup complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. cd apps/clubhouse-admin');
    console.log('2. pnpm dev');
    console.log('3. Create your first event');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
})();
"@

$code | node

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✨ Database setup complete!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Database setup failed" -ForegroundColor Red
    exit 1
}
