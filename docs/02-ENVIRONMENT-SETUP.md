# Environment Variables Reference

## Development (.env.local)

Location: `apps/web/.env.local`

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Future: API Keys (NOT NEEDED YET)
# SUPABASE_SERVICE_ROLE_KEY=    # Only for backend/admin operations
# STRIPE_SECRET_KEY=            # When adding payments
# STRIPE_WEBHOOK_SECRET=        # For payment webhooks
```

## Where to Find Values

### Supabase Values
1. Go to your Supabase project dashboard
2. Navigate to **Settings → API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

⚠️ **Do NOT use the `service_role` key in the frontend!** It bypasses all security.

## Environment Files by App

```
apps/web/.env.local          ← Main web app (YOU ARE HERE)
apps/app/.env.local          ← Game app (not created yet)
apps/dashboard/.env.local    ← Admin dashboard (not created yet)
```

## Production Setup (Future)

When deploying to Vercel:

1. Go to project settings in Vercel
2. Navigate to **Environment Variables**
3. Add each variable with appropriate scope:
   - `NEXT_PUBLIC_*` → Available in browser
   - Other keys → Server-side only

## Security Notes

✅ **Safe for frontend:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

❌ **NEVER expose in frontend:**
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- Database passwords
- Any webhook secrets

## Troubleshooting

### "Supabase client not initialized"
- Check `.env.local` exists in `apps/web/`
- Verify keys are correct (no extra spaces)
- Restart dev server after changing env vars

### "Invalid JWT"
- Anon key might be wrong
- Copy the entire key (very long string)
- Make sure you copied from correct project

### Environment changes not reflecting
- Stop dev server (Ctrl+C)
- Run `pnpm dev:web` again
- Clear browser cache if needed
