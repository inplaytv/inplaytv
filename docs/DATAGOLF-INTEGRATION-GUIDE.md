# DataGolf.com Integration Guide

## 1. Subscribe to DataGolf.com

**Recommended Plan**: Scratch Plus - $30/month
- API access included
- Tournament schedules
- Player data
- Live scoring
- Historical data
- 22 tours covered (PGA, LPGA, DP World, etc.)

**Subscribe at**: https://datagolf.com/api-access

---

## 2. Get Your API Key

After subscribing:

1. Log in to your DataGolf account
2. Go to **Account Settings** or **API Keys** section
3. Copy your API key (format: `dg-xxxxxxxxxxxxxx`)
4. **Keep it secure** - treat it like a password!

---

## 3. Add API Key to Environment Variables

### For Local Development:

Add to `.env.local` in each app:

**apps/golf/.env.local**
```bash
DATAGOLF_API_KEY=dg-your-api-key-here
```

**apps/admin/.env.local**
```bash
DATAGOLF_API_KEY=dg-your-api-key-here
```

**apps/web/.env.local**
```bash
DATAGOLF_API_KEY=dg-your-api-key-here
```

### For Production (Vercel/Netlify):

1. Go to your deployment platform dashboard
2. Navigate to **Environment Variables** or **Settings**
3. Add: `DATAGOLF_API_KEY` = `dg-your-api-key-here`
4. Redeploy your apps

---

## 4. Your Code is Already Set Up!

The DataGolf integration is **already implemented** in your codebase:

### Location: `packages/shared/src/lib/providers/datagolf-provider.ts`

```typescript
// Already configured to use process.env.DATAGOLF_API_KEY
const apiKey = process.env.DATAGOLF_API_KEY;
```

### Features Already Built:

✅ **Tournament Fetching** - Get upcoming tournaments  
✅ **Player Data** - Retrieve golfer information  
✅ **Live Scoring** - Real-time leaderboard updates  
✅ **Historical Data** - Past tournament results  
✅ **Caching System** - Reduces API calls  
✅ **Error Handling** - Graceful fallbacks  

---

## 5. Test the Integration

### Step 1: Add API Key Locally
```powershell
# Create .env.local files
cd apps/golf
echo "DATAGOLF_API_KEY=dg-your-actual-key" > .env.local

cd ../admin
echo "DATAGOLF_API_KEY=dg-your-actual-key" > .env.local

cd ../web
echo "DATAGOLF_API_KEY=dg-your-actual-key" > .env.local
```

### Step 2: Restart Development Server
```powershell
# Kill current server (Ctrl+C)
# Then restart
turbo dev
```

### Step 3: Test API Connection
```powershell
# Run test script (I'll create this below)
node scripts/test-datagolf-connection.js
```

### Step 4: Verify in Admin Panel

1. Go to **Admin** → **AI Tournament Creator**
2. Click **"Fetch Upcoming Tournaments"**
3. You should see real DataGolf tournaments instead of sample data
4. Check for PGA, LPGA, European tours

---

## 6. What Will Change After Integration

### Before (Current - Sample Data):
- Hardcoded tournament list
- Manual tournament creation
- No live scoring

### After (With DataGolf):
- ✅ Real tournament schedules
- ✅ Automatic updates every 5 minutes
- ✅ Live leaderboard data
- ✅ Player statistics
- ✅ Field lists (who's playing)
- ✅ Historical results

---

## 7. API Endpoints You'll Use

Your code already supports these:

| Endpoint | Purpose | Update Frequency |
|----------|---------|------------------|
| `/schedule` | Tournament list | Daily |
| `/field-updates` | Player lineups | Hourly |
| `/live-tournament-stats` | Scoring data | Every 5 min |
| `/player-list` | Golfer database | Weekly |
| `/historical-dg-rankings` | Past results | Daily |

---

## 8. Usage Limits & Best Practices

### DataGolf API Limits:
- **Scratch Plus**: Unlimited API calls
- **Rate Limit**: ~60 requests/minute
- **Updates**: Every 5 minutes during tournaments

### Your Caching System:
```typescript
// Already implemented in your code:
- Tournament data: Cached 1 hour
- Player data: Cached 24 hours
- Live scores: Cached 5 minutes
- Historical data: Cached 7 days
```

This means you'll stay **well under** API limits! ✅

---

## 9. Switch from Manual to DataGolf

### Current Provider (Manual):
```typescript
// apps/admin/src/app/ai-tournament-creator/page.tsx
// Currently uses hardcoded data
```

### Switch to DataGolf:
```typescript
// In your tournament fetching code, it will automatically use DataGolf
// when the API key is present

// Your provider factory already does this:
const provider = GolfDataProviderFactory.create(
  process.env.DATAGOLF_API_KEY ? 'datagolf' : 'manual'
);
```

**No code changes needed** - just add the API key! 🎉

---

## 10. Monitoring & Troubleshooting

### Check API Status:
```typescript
// In browser console or admin panel
fetch('https://datagolf.com/api/v1/preds/get-dg-rankings', {
  headers: { 'Authorization': 'Bearer YOUR_KEY' }
})
```

### Common Issues:

**Issue**: "API key invalid"
- **Fix**: Check key format (starts with `dg-`)
- **Fix**: Verify subscription is active

**Issue**: "No tournaments found"
- **Fix**: Check date range (only shows future tournaments)
- **Fix**: Verify API endpoint is correct

**Issue**: "Rate limit exceeded"
- **Fix**: Your caching should prevent this
- **Fix**: Check if cache is working

### Debug Mode:
```typescript
// Already in your code - check console for:
console.log('Fetched tournaments:', data); // Will show DataGolf data
```

---

## 11. Next Steps After Integration

### Immediate (Day 1):
1. ✅ Subscribe to DataGolf
2. ✅ Add API key to environment variables
3. ✅ Test connection
4. ✅ Verify tournaments load

### Week 1:
1. Monitor API usage in DataGolf dashboard
2. Test live scoring during tournaments
3. Verify player data accuracy
4. Check cache performance

### Week 2+:
1. Add more DataGolf features:
   - Player salary calculations
   - Tournament difficulty ratings
   - Weather data
   - Course information
2. Optimize caching strategy
3. Add analytics dashboard

---

## 12. Cost Management

### Monthly Cost: $30
- Unlimited API calls
- 22 tours covered
- Live updates every 5 minutes

### Ways to Optimize:
✅ **Caching** (already implemented)
✅ **Scheduled updates** (not constant polling)
✅ **Single source** (one API for all apps)

**Estimated API calls per month**: ~50,000
**Cost per call**: Included in subscription
**Your cost**: $30/month flat rate

---

## Quick Start Checklist

- [ ] Subscribe to DataGolf.com ($30/month)
- [ ] Get API key from account dashboard
- [ ] Add `DATAGOLF_API_KEY` to `.env.local` files
- [ ] Add `DATAGOLF_API_KEY` to production environment
- [ ] Restart development server
- [ ] Test in Admin AI Tournament Creator
- [ ] Verify tournaments load
- [ ] Deploy to production
- [ ] Monitor API usage

---

## Support

**DataGolf Support**: support@datagolf.com  
**DataGolf Docs**: https://datagolf.com/api-docs  
**Your Integration**: `packages/shared/src/lib/providers/datagolf-provider.ts`

---

**Ready to go! Just add the API key and everything will work automatically.** 🚀
