# InPlay TV – Monorepo Deployment to Vercel

---

## 1. Overview

This repository uses a **monorepo structure** containing three Next.js applications:

- **`apps/web`** – Public marketing website
- **`apps/app`** – Game client (to be created later)
- **`apps/dashboard`** – Admin portal (to be created later)

All three apps are built with Next.js and share the same GitHub repository but are deployed as **separate Vercel Projects**.

Each app connects to the same Supabase database instance.

**Deployment order:**
1. Website (`apps/web`) is deployed first
2. Game and Dashboard are deployed later when ready

**Domain structure:**
- Website → `www.yourdomain.com`
- Game → `app.yourdomain.com`
- Dashboard → `dashboard.yourdomain.com`

**Shared authentication:**
- Supabase Auth cookie domain will be set to `.yourdomain.com`
- This ensures single sign-in works seamlessly across all subdomains

---

## 2. Prerequisites

Before deploying, ensure you have:

- **Node.js 20+** and **pnpm** installed
- **Git** installed and configured
- A **GitHub account**
- A **Supabase project** created with the following values available:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- A **Vercel account** (free tier works)

---

## 3. Push Code to GitHub

Run the following commands to push your code to GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
```

> **⚠️ Important:** Never commit `.env.local` files or Supabase keys. Ensure your `.gitignore` file includes these patterns.

---

## 4. Deploy Website to Vercel

Deploy the **`apps/web`** application first.

### Step 1: Create New Vercel Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Find your GitHub repository and click **"Import"**

### Step 2: Configure Project Settings

- **Root Directory:** Click "Edit" and select **`apps/web`** ✅
- **Framework Preset:** Next.js (auto-detected) ✅
- **Build Command:** Leave as default
- **Output Directory:** Leave as default

### Step 3: Add Environment Variables

Click **"Environment Variables"** and add:

| Variable Name | Value |
|---------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key |

### Step 4: Deploy

Click **"Deploy"** and wait 2-3 minutes.

Your website will be live at a Vercel-provided URL (e.g., `inplaytv.vercel.app`).

---

## 5. Add Custom Domain (Optional)

Once your site is deployed, you can map a custom domain.

### Steps:

1. In the Vercel project, go to **Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `www.yourdomain.com`)
4. **If using Vercel DNS:**
   - Vercel automatically creates the required DNS records
5. **If using external DNS provider:**
   - Add the CNAME record Vercel provides
   - Point `www` to the Vercel target (e.g., `cname.vercel-dns.com`)
6. **Optional:** Redirect root domain (`yourdomain.com`) to `www.yourdomain.com`

DNS propagation typically takes 5-60 minutes.

---

## 6. Configure Shared Authentication (When Using Custom Domains)

Once you have custom domains set up and are ready to deploy multiple apps, configure Supabase to share authentication across all subdomains.

### Steps:

1. Go to **Supabase Dashboard** → **Authentication** → **Settings**
2. Scroll to **"Cookie Domain"**
3. Set the value to **`.yourdomain.com`** (note the leading dot)
4. Enable **SameSite: Lax**
5. Enable **Secure Cookies: On**

This allows users to stay authenticated when navigating between:
- `www.yourdomain.com` (Website)
- `app.yourdomain.com` (Game)
- `dashboard.yourdomain.com` (Dashboard)

**Important:** Only do this once you have a custom domain. Do not use `.vercel.app` as a cookie domain.

---

## 7. Automatic Preview Deployments

Vercel automatically creates preview deployments for every:
- **Git branch** you push
- **Pull request** you create

### How it works:

- Each preview gets a unique URL (e.g., `inplaytv-git-feature-branch.vercel.app`)
- Previews allow you to test changes before merging to `main`
- Merging to `main` updates the **Production** deployment
- Preview URLs are listed in the **Deployments** tab

---

## 8. Rollbacks

If a deployment breaks production, you can instantly rollback.

### Steps:

1. Go to the Vercel project → **Deployments** tab
2. Find a previous working deployment
3. Click the **"︙"** menu → **"Promote to Production"**

Vercel instantly rolls back to that build with zero downtime.

---

## 9. Deploy Game and Dashboard (Later)

When you're ready to deploy the **`apps/app`** (Game) and **`apps/dashboard`** (Admin Portal), follow the same process.

### For the Game App (`apps/app`):

1. In Vercel, click **"Add New..."** → **"Project"**
2. Import the **same GitHub repository** (`inplaytv/inplaytv`)
3. Configure settings:
   - **Root Directory:** `apps/app` ✅
   - **Framework:** Next.js (auto-detected)
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **"Deploy"**
6. Add custom domain: **`app.yourdomain.com`**

### For the Dashboard (`apps/dashboard`):

1. In Vercel, click **"Add New..."** → **"Project"**
2. Import the **same GitHub repository** (`inplaytv/inplaytv`)
3. Configure settings:
   - **Root Directory:** `apps/dashboard` ✅
   - **Framework:** Next.js (auto-detected)
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **"Deploy"**
6. Add custom domain: **`dashboard.yourdomain.com`**

**Result:** Three separate Vercel projects, all deploying from the same GitHub repository, each building from its own `apps/*` folder.

---

## 10. Deployment Architecture

The diagram below shows how the monorepo deploys to multiple Vercel projects:

```
┌──────────────────────────────────────────────────────┐
│  GitHub Repository: inplaytv/inplaytv               │
│                                                      │
│  ├── apps/web        (Marketing website)            │
│  ├── apps/app        (Game client)                  │
│  └── apps/dashboard  (Admin portal)                 │
└──────────────────────────────────────────────────────┘
           │                │                │
           │                │                │
           ▼                ▼                ▼
    ┌───────────┐    ┌───────────┐    ┌────────────┐
    │  Vercel   │    │  Vercel   │    │  Vercel    │
    │ Project 1 │    │ Project 2 │    │ Project 3  │
    │           │    │           │    │            │
    │ Root Dir: │    │ Root Dir: │    │ Root Dir:  │
    │ apps/web  │    │ apps/app  │    │ apps/      │
    │           │    │           │    │ dashboard  │
    └───────────┘    └───────────┘    └────────────┘
           │                │                │
           ▼                ▼                ▼
   www.yourdomain.com  app.yourdomain.com  dashboard.yourdomain.com
```

**Key points:**
- One GitHub repository
- Three separate Vercel projects
- Each project builds from a different **Root Directory**
- All projects share the same Supabase database
- Shared auth via `.yourdomain.com` cookie domain

---

## Summary Checklist

✅ **Code on GitHub**  
✅ **Vercel project created for `apps/web`**  
✅ **Root Directory set to `apps/web`**  
✅ **Environment variables added**  
✅ **Custom domain mapped** (optional)  
✅ **Supabase cookie domain set to `.yourdomain.com`** (when using custom domains)  
✅ **Preview deployments automatic** on every branch/PR  
✅ **Production deploys on merge to `main`**  

---

## Need Help?

- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **Supabase Auth Docs:** [supabase.com/docs/guides/auth](https://supabase.com/docs/guides/auth)
- **Monorepo Guide:** [vercel.com/docs/monorepos](https://vercel.com/docs/monorepos)
