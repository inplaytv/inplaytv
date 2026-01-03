# Clubhouse System Setup and Test Script
# Run this to initialize the clubhouse database and verify everything works

Write-Host "🏌️ CLUBHOUSE SYSTEM SETUP & TEST SCRIPT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Load environment
$envPath = ".\apps\clubhouse-admin\.env.local"
if (-not (Test-Path $envPath)) {
    Write-Host "❌ ERROR: .env.local not found at $envPath" -ForegroundColor Red
    Write-Host "   Copy from apps/golf/.env.local or create new one" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Environment file found" -ForegroundColor Green
Write-Host ""

# Step 1: Check if schema already exists
Write-Host "🔍 STEP 1: Checking database schema..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   ⚠️  MANUAL VERIFICATION REQUIRED:" -ForegroundColor Yellow
Write-Host "   1. Open Supabase Dashboard → Table Editor" -ForegroundColor White
Write-Host "   2. Look for these tables:" -ForegroundColor White
Write-Host "      • clubhouse_events" -ForegroundColor Gray
Write-Host "      • clubhouse_competitions" -ForegroundColor Gray
Write-Host "      • clubhouse_wallets" -ForegroundColor Gray
Write-Host "      • clubhouse_credit_transactions" -ForegroundColor Gray
Write-Host "      • clubhouse_entries" -ForegroundColor Gray
Write-Host ""
Write-Host "   Do these tables exist? (Y/N): " -ForegroundColor Cyan -NoNewline
$tablesExist = Read-Host

if ($tablesExist -ne "Y" -and $tablesExist -ne "y") {
    Write-Host ""
    Write-Host "📝 STEP 2: Creating database schema..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   ⚠️  MANUAL STEP REQUIRED:" -ForegroundColor Yellow
    Write-Host "   1. Open Supabase Dashboard → SQL Editor" -ForegroundColor White
    Write-Host "   2. Click 'New Query'" -ForegroundColor White
    Write-Host "   3. Copy-paste contents of: scripts/clubhouse/01-create-schema.sql" -ForegroundColor White
    Write-Host "   4. Click 'Run' (takes 10-20 seconds)" -ForegroundColor White
    Write-Host "   5. Verify success message: '5 tables created, 3 functions created'" -ForegroundColor White
    Write-Host ""
    Write-Host "   Press ENTER once you've completed this step..." -ForegroundColor Cyan
    Read-Host
    
    Write-Host "✅ Schema should now be created" -ForegroundColor Green
} else {
    Write-Host "✅ Schema already exists. Skipping creation." -ForegroundColor Green
}

# Step 3: Check test user
Write-Host ""
Write-Host "👤 STEP 3: Test user setup..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   Do you have a test user account? (Y/N): " -ForegroundColor Cyan -NoNewline
$hasUser = Read-Host

if ($hasUser -ne "Y" -and $hasUser -ne "y") {
    Write-Host ""
    Write-Host "   📋 CREATE TEST USER:" -ForegroundColor Yellow
    Write-Host "   1. Start web app: cd apps/web && pnpm dev" -ForegroundColor White
    Write-Host "   2. Open: http://localhost:3000/signup" -ForegroundColor Cyan
    Write-Host "   3. Create account with test email" -ForegroundColor White
    Write-Host "   4. Return here when done" -ForegroundColor White
    Write-Host ""
    Write-Host "   Press ENTER to continue..." -ForegroundColor Cyan
    Read-Host
}

Write-Host ""
Write-Host "   Enter your test user email: " -ForegroundColor Cyan -NoNewline
$testEmail = Read-Host

Write-Host "   ✅ Test email recorded: $testEmail" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. START ADMIN APP:" -ForegroundColor White
Write-Host "   cd apps\clubhouse-admin" -ForegroundColor Gray
Write-Host "   pnpm dev" -ForegroundColor Gray
Write-Host "   Open: http://localhost:3002" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. CREATE TEST EVENT:" -ForegroundColor White
Write-Host "   → Click 'Create Event'" -ForegroundColor Gray
Write-Host "   → Name: Test Spring Championship" -ForegroundColor Gray
Write-Host "   → Slug: test-spring-2026" -ForegroundColor Gray
Write-Host "   → Set registration_opens_at to NOW" -ForegroundColor Gray
Write-Host "   → Set registration_closes_at to 2 hours from now" -ForegroundColor Gray
Write-Host "   → Set start_date to tomorrow" -ForegroundColor Gray
Write-Host "   → Verify event appears with status 'open'" -ForegroundColor Gray
Write-Host ""
Write-Host "3. GRANT TEST CREDITS:" -ForegroundColor White
Write-Host "   → Click 'Grant Credits'" -ForegroundColor Gray
Write-Host "   → Enter email: $testEmail" -ForegroundColor Cyan
Write-Host "   → Amount: 1000 credits" -ForegroundColor Gray
Write-Host "   → Reason: Testing setup" -ForegroundColor Gray
Write-Host "   → Verify success message shows new balance" -ForegroundColor Gray
Write-Host ""
Write-Host "4. EDIT EVENT (TEST AUTO-SYNC):" -ForegroundColor White
Write-Host "   → Go to 'Manage Events'" -ForegroundColor Gray
Write-Host "   → Click 'Edit' on test event" -ForegroundColor Gray
Write-Host "   → Change start_date to different time" -ForegroundColor Gray
Write-Host "   → Save changes" -ForegroundColor Gray
Write-Host "   → Check Supabase: clubhouse_competitions should auto-update" -ForegroundColor Gray
Write-Host ""
Write-Host "5. VERIFY DATABASE:" -ForegroundColor White
Write-Host "   Open Supabase → Table Editor" -ForegroundColor Gray
Write-Host "   Check clubhouse_events → Should see 1 event with status 'open'" -ForegroundColor Gray
Write-Host "   Check clubhouse_competitions → Should see 1 comp (auto-created)" -ForegroundColor Gray
Write-Host "   Check clubhouse_wallets → Should see 1 wallet with 1000 credits" -ForegroundColor Gray
Write-Host "   Check clubhouse_credit_transactions → Should see 1 grant transaction" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 TESTING CHECKLIST (from SYSTEMATIC-FIX-PLAN.md):" -ForegroundColor Yellow
Write-Host "   [ ] Create event → Status auto-calculates correctly" -ForegroundColor Gray
Write-Host "   [ ] Update event dates → Competitions auto-sync" -ForegroundColor Gray
Write-Host "   [ ] Grant credits → Wallet updates atomically" -ForegroundColor Gray
Write-Host "   [ ] View event list → All statuses displayed correctly" -ForegroundColor Gray
Write-Host "   [ ] Delete event → Cascades to comps (check in Supabase)" -ForegroundColor Gray
Write-Host ""
Write-Host "🐛 IF SOMETHING BREAKS:" -ForegroundColor Red
Write-Host "   1. Check browser console (F12) for errors" -ForegroundColor Gray
Write-Host "   2. Check PowerShell terminal for API errors" -ForegroundColor Gray
Write-Host "   3. Check Supabase Dashboard → Logs → API Logs" -ForegroundColor Gray
Write-Host "   4. Verify .env.local has correct SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 REFERENCE DOCS:" -ForegroundColor Yellow
Write-Host "   • CLUBHOUSE-SYSTEM-PLAN.md - Complete architecture" -ForegroundColor Gray
Write-Host "   • SYSTEMATIC-FIX-PLAN.md - Testing checklist" -ForegroundColor Gray
Write-Host "   • scripts/clubhouse/00-README.md - Database setup" -ForegroundColor Gray
Write-Host ""
Write-Host "Happy testing! 🎉" -ForegroundColor Green
Write-Host ""
