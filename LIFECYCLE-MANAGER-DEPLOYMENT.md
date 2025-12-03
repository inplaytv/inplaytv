# Tournament Lifecycle Manager - Deployment Checklist

## ✅ Pre-Deployment Verification

### 1. Database Migration
- [ ] Run migration script: `.\scripts\add-registration-windows.ps1`
- [ ] Or manually execute SQL in Supabase SQL Editor
- [ ] Verify columns added:
  ```sql
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'tournaments' 
  AND column_name IN ('registration_opens_at', 'registration_closes_at');
  ```
- [ ] Verify index created:
  ```sql
  SELECT indexname FROM pg_indexes 
  WHERE tablename = 'tournaments' 
  AND indexname = 'idx_tournaments_registration_windows';
  ```

### 2. Local Testing
- [ ] Admin app running: `cd apps/admin && pnpm dev`
- [ ] Run test script: `.\scripts\test-lifecycle-manager.ps1`
- [ ] Verify all 3 API endpoints respond correctly
- [ ] Open lifecycle manager UI: http://localhost:3002/tournament-lifecycle
- [ ] Check tournament cards display with stats
- [ ] Test status change modal
- [ ] Test registration window modal
- [ ] Verify auto-refresh works (30s interval)

### 3. Integration Testing
- [ ] Run golfer sync: `.\scripts\sync-now.ps1`
- [ ] Verify golfers still sync correctly
- [ ] Check salary calculation in team builder
- [ ] Confirm manual sync still works in admin
- [ ] Test existing admin features (tournaments, competitions, etc.)

## 🚀 Deployment Steps

### Step 1: Database
1. Go to Supabase dashboard: https://gozhtmfqiszwxnclvbkx.supabase.co
2. Navigate to SQL Editor
3. Execute migration SQL from `scripts/add-registration-windows.sql`
4. Verify columns and index created

### Step 2: Deploy Admin App
```powershell
# Commit changes
git add .
git commit -m "Add Tournament Lifecycle Manager with status transitions and registration windows"
git push

# Deploy to Vercel (if using Vercel)
# Or your deployment platform of choice
```

### Step 3: Environment Variables
Ensure these are set in production:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATAGOLF_API_KEY`
- `CRON_SECRET`

### Step 4: Cron Job Setup
Deploy automated golfer sync to production:
- **Vercel Cron**: Add to `vercel.json`
  ```json
  {
    "crons": [{
      "path": "/api/cron/sync-tournament-golfers",
      "schedule": "0 0 * * *"
    }]
  }
  ```
- **Or external cron service** (cron-job.org, EasyCron, etc.):
  - URL: `https://your-admin-domain.com/api/cron/sync-tournament-golfers`
  - Method: POST
  - Headers: `Authorization: Bearer YOUR_CRON_SECRET`
  - Schedule: Daily at midnight UTC

### Step 5: Verify Production
- [ ] Access lifecycle manager: https://your-admin-domain.com/tournament-lifecycle
- [ ] Test status changes
- [ ] Test registration windows
- [ ] Monitor for errors in logs
- [ ] Verify cron job runs successfully

## 📋 Post-Deployment

### Monitor These Metrics
- Tournaments synced daily (check cron logs)
- Golfer counts per tournament
- Status transitions (manual and future automated)
- Registration window usage
- API response times

### Watch For Issues
- Tournaments with 0 golfers approaching registration
- Tournaments with 0 competitions after registration opens
- Failed cron job runs
- Timezone calculation errors
- Date validation failures

### Weekly Tasks
- [ ] Review tournaments missing golfers
- [ ] Check tournaments without registration windows
- [ ] Verify all upcoming tournaments have competitions created
- [ ] Monitor entry counts

### Monthly Tasks
- [ ] Review completed tournaments for data cleanup
- [ ] Audit status transition logs (once audit trail added)
- [ ] Check for tournaments stuck in wrong status

## 🔧 Troubleshooting

### Issue: No tournaments showing in lifecycle manager
**Solution**: Check API endpoint responds:
```powershell
Invoke-RestMethod -Uri "http://localhost:3002/api/tournament-lifecycle"
```

### Issue: Status change fails with "No golfers assigned"
**Solution**: 
1. Run golfer sync: `.\scripts\sync-now.ps1`
2. Or manually sync in admin interface
3. Verify golfers appear in tournament_golfers table

### Issue: Registration window validation fails
**Solution**:
1. Check tournament timezone is set correctly
2. Verify dates are in correct format (ISO 8601)
3. Ensure close time is after open time
4. Confirm registration closes before tournament starts

### Issue: CSS not loading/looks broken
**Solution**:
1. Verify TournamentLifecycle.module.css exists
2. Check import in page.tsx matches filename exactly
3. Clear Next.js cache: `rm -rf .next && pnpm dev`

### Issue: Cron job not syncing golfers
**Solution**:
1. Check CRON_SECRET is set correctly
2. Verify DataGolf API key is valid
3. Check tournament statuses are 'upcoming' or 'registration_open'
4. Ensure tournament dates are within next 30 days
5. Review logs for specific errors

## 🎯 Success Criteria

### Immediate (Day 1)
- ✅ All API endpoints responding
- ✅ Lifecycle manager UI loads correctly
- ✅ Can view all tournaments with stats
- ✅ Status changes work with validation
- ✅ Registration windows can be set

### Short-term (Week 1)
- ✅ Daily golfer sync running automatically
- ✅ No tournaments reaching registration without golfers
- ✅ All registration-open tournaments have competitions
- ✅ Zero manual intervention needed for golfer sync

### Long-term (Month 1)
- ✅ Automated status transitions implemented
- ✅ Email notifications for important events
- ✅ Audit trail tracking all changes
- ✅ Dashboard widgets showing upcoming transitions
- ✅ Bulk operations for efficiency

## 📞 Rollback Plan

### If Issues Occur:
1. **Database changes are additive** (adding columns only)
   - Safe to leave in place, won't break existing functionality
   - If needed: `ALTER TABLE tournaments DROP COLUMN registration_opens_at, DROP COLUMN registration_closes_at;`

2. **New API endpoints are isolated**
   - No impact on existing endpoints
   - Can simply not use lifecycle manager page
   - Remove sidebar link if needed

3. **Cron job is separate**
   - Original manual sync still works
   - Can disable cron and use manual sync temporarily

4. **Full rollback**:
   ```bash
   git revert <commit-hash>
   git push
   # Redeploy admin app
   ```

## 📝 Notes
- All changes are backward compatible
- Existing systems untouched (salary, manual sync, admin features)
- Can deploy incrementally (DB → APIs → UI → Cron)
- No breaking changes to production data
- Safe to test in production with low risk

## ✅ Final Checklist Before Going Live
- [ ] Database migration successful
- [ ] All API endpoints tested
- [ ] Lifecycle manager UI working
- [ ] Golfer sync tested and working
- [ ] Existing admin features verified
- [ ] Environment variables set in production
- [ ] Cron job configured and tested
- [ ] Monitoring/logging set up
- [ ] Team trained on new interface
- [ ] Documentation complete
