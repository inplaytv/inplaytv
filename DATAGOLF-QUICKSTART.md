# DataGolf Quick Start 🏌️

## 1️⃣ Subscribe
https://datagolf.com/api-access
- **Plan**: Scratch Plus ($30/month)
- **Get API Key**: Account Dashboard → API Keys

---

## 2️⃣ Add API Key (Choose One Method)

### Method A: Automatic Setup (EASIEST) ⭐
```powershell
.\scripts\setup-datagolf-key.ps1 -ApiKey "dg-your-key-here"
```

### Method B: Manual Setup
Create `.env.local` in each app folder:

**apps/golf/.env.local**
```
DATAGOLF_API_KEY=dg-your-key-here
```

**apps/admin/.env.local**
```
DATAGOLF_API_KEY=dg-your-key-here
```

**apps/web/.env.local**
```
DATAGOLF_API_KEY=dg-your-key-here
```

---

## 3️⃣ Test Connection
```powershell
node scripts/test-datagolf-connection.js
```

Should see:
```
✅ ALL TESTS PASSED!
🎉 Your DataGolf integration is ready to use!
```

---

## 4️⃣ Restart Dev Server
```powershell
# Stop current server (Ctrl+C)
turbo dev
```

---

## 5️⃣ Verify in Admin
1. Open: http://localhost:3001/ai-tournament-creator
2. Click: **"Fetch Upcoming Tournaments"**
3. See: Real tournament data from DataGolf!

---

## 6️⃣ Deploy to Production

### Add to Vercel:
```bash
vercel env add DATAGOLF_API_KEY
# Enter your API key when prompted
vercel deploy --prod
```

### Add to Netlify:
1. Site Settings → Environment Variables
2. Add: `DATAGOLF_API_KEY` = `dg-your-key-here`
3. Redeploy site

---

## What You'll Get

✅ **Real tournament schedules** (PGA, LPGA, European)  
✅ **Live scoring updates** (every 5 minutes)  
✅ **Player data** (rankings, stats, history)  
✅ **Field lists** (who's playing in each tournament)  
✅ **Historical results** (past tournament data)  

---

## Troubleshooting

**"API key invalid"**
- Check format starts with `dg-`
- Verify subscription is active

**"No tournaments found"**
- Check you're subscribed
- Run test script to verify connection

**"Still seeing sample data"**
- Restart dev server
- Clear browser cache
- Check API key is in .env.local

---

## Scripts Available

| Script | Purpose |
|--------|---------|
| `setup-datagolf-key.ps1` | Add API key to all apps |
| `test-datagolf-connection.js` | Verify API works |

---

## Cost: $30/month
- Unlimited API calls ✅
- 22 tours covered ✅  
- Live data every 5 min ✅
- No hidden fees ✅

---

## Support
- **DataGolf**: support@datagolf.com
- **Docs**: https://datagolf.com/api-docs
- **Integration Guide**: `docs/DATAGOLF-INTEGRATION-GUIDE.md`

---

**Your code is already set up! Just add the API key.** 🚀
