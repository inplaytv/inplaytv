# Vercel Deployment Setup

This monorepo contains three separate Next.js applications that need to be deployed independently on Vercel.

## Architecture

```
inplaytv/
├── apps/
│   ├── web/       → Main marketing website (localhost:3000)
│   ├── golf/      → Golf fantasy app (localhost:3001)
│   └── admin/     → Admin dashboard (localhost:3002)
```

## Vercel Projects Setup

You need to create **3 separate Vercel projects**, one for each app:

### 1. Web App (Marketing Site)

**Project Settings:**
- **Name:** `inplaytv-web` (or your choice)
- **Framework:** Next.js
- **Root Directory:** `apps/web`
- **Build Command:** (Uses vercel.json config)
- **Install Command:** (Uses vercel.json config)
- **Domain:** `inplaytv.com` or your main domain

**Environment Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 2. Golf App (Fantasy Platform)

**Project Settings:**
- **Name:** `inplaytv-golf` (or your choice)
- **Framework:** Next.js
- **Root Directory:** `apps/golf`
- **Build Command:** (Uses vercel.json config)
- **Install Command:** (Uses vercel.json config)
- **Domain:** `game.inplaytv.com` or subdomain

**Environment Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATAGOLF_API_KEY=...
STRIPE_SECRET_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
```

### 3. Admin App (Admin Dashboard)

**Project Settings:**
- **Name:** `inplaytv-admin` (or your choice)
- **Framework:** Next.js
- **Root Directory:** `apps/admin`
- **Build Command:** (Uses vercel.json config)
- **Install Command:** (Uses vercel.json config)
- **Domain:** `admin.inplaytv.com` or subdomain

**Environment Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATAGOLF_API_KEY=...
```

## How to Set Up on Vercel

### Option 1: Vercel Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository **three times** (once for each app)
3. For each import:
   - Select the repository
   - Configure the **Root Directory** (apps/web, apps/golf, or apps/admin)
   - Vercel will auto-detect the Next.js framework
   - Add environment variables
   - Deploy

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy Web
cd apps/web
vercel --prod

# Deploy Golf
cd ../golf
vercel --prod

# Deploy Admin
cd ../admin
vercel --prod
```

## Automatic Deployments

Once set up, all three projects will automatically deploy when you push to the main branch:

- **Web:** Triggers when changes in `apps/web/` or shared packages
- **Golf:** Triggers when changes in `apps/golf/` or shared packages  
- **Admin:** Triggers when changes in `apps/admin/` or shared packages

## Monorepo Configuration

Each app has a `vercel.json` that configures:

```json
{
  "buildCommand": "cd ../.. && pnpm run build --filter=<app>",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

This ensures:
- ✅ Dependencies are installed at the monorepo root
- ✅ Turborepo builds only the specific app
- ✅ Shared packages are included in the build

## Troubleshooting

### Build Fails with "Package not found"

Make sure `pnpm-workspace.yaml` and `turbo.json` are at the root level and accessible during build.

### Environment Variables Not Working

Each Vercel project needs its own environment variables. They are NOT shared between projects.

### Domain Configuration

Set up custom domains in each project's settings:
- Web: `inplaytv.com` + `www.inplaytv.com`
- Golf: `game.inplaytv.com` or `play.inplaytv.com`
- Admin: `admin.inplaytv.com`

## Current Deployment Status

Check deployment status at:
- Web: https://vercel.com/your-org/inplaytv-web
- Golf: https://vercel.com/your-org/inplaytv-golf
- Admin: https://vercel.com/your-org/inplaytv-admin

## Important Notes

1. **Each app is a separate Vercel project** - they deploy independently
2. **Git commits trigger all applicable deployments** - Vercel's smart detection knows which apps changed
3. **vercel.json files are configured** - Build commands reference the monorepo structure
4. **Turbo cache is NOT shared** between deployments (each build is isolated)

For more information, see:
- [Vercel Monorepo Documentation](https://vercel.com/docs/monorepos)
- [Turborepo with Vercel](https://turbo.build/repo/docs/handbook/deploying-with-docker)
