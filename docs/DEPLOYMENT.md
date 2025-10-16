# Monorepo Deployment to Vercel

This guide walks you through deploying the Fantasy Golf monorepo to Vercel, one project per app.

---

## Prerequisites

Before deploying, ensure you have:

- **Node.js 20+** installed
- **pnpm** package manager
- **Git** configured locally
- A **GitHub** account
- A **Supabase** project created with the following values available:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- A **Vercel** account (free tier works)

---

## Push to GitHub

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial deploy"
   git branch -M main
   ```

2. **Create a new repository on GitHub** (e.g., `fantasy-golf`)

3. **Link and push**:
   ```bash
   git remote add origin https://github.com/<your-user>/<your-repo>.git
   git push -u origin main
   ```

> **Important:** Ensure `.env.local` and `.env` files are **not committed**. Check that `.gitignore` includes them.

---

## Create Vercel Project for the Website

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **New Project**
3. **Import** your GitHub repository
4. Configure the project:
   - **Root Directory:** `apps/web`
   - **Framework Preset:** Next.js (auto-detected)
   - **Build Command:** (leave default)
   - **Output Directory:** (leave default)
5. Add **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` → your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → your Supabase anon key
6. Click **Deploy**

Your website will be live at a Vercel-provided URL (e.g., `your-project.vercel.app`).

---

## Map a Custom Domain

1. In the Vercel project settings, go to **Domains**
2. Add your domain (e.g., `www.yourdomain.com`)
3. **If using Vercel DNS:**
   - Vercel automatically configures DNS records
4. **If using external DNS:**
   - Add the CNAME record Vercel provides to your DNS provider
   - Point `www` to the Vercel target (e.g., `cname.vercel-dns.com`)
5. **Optional:** Redirect root domain (`yourdomain.com`) to `www.yourdomain.com`

---

## Share Auth Across Subdomains Later

When you add the game (`app.yourdomain.com`) and dashboard (`dashboard.yourdomain.com`):

1. Go to **Supabase Dashboard** → **Authentication** → **Settings**
2. Set **Cookie Domain** to `.yourdomain.com` (note the leading dot)
3. Enable **SameSite: Lax** and **Secure Cookies**

This allows authentication to work seamlessly across all subdomains.

---

## Preview Deployments

- Every **branch** and **pull request** automatically gets a unique Preview URL
- Merging to `main` updates the **Production** deployment
- Preview URLs allow you to test changes before going live

---

## Rollbacks

If a deployment breaks production:

1. Go to the Vercel project → **Deployments**
2. Find a previous working deployment
3. Click **Promote to Production**

Vercel instantly rolls back to that build.

---

## Add the Game and Dashboard Later

When you're ready to deploy `apps/app` and `apps/dashboard`:

### For the Game App (`apps/app`)
1. Create a **New Project** in Vercel
2. Import the **same GitHub repository**
3. Set **Root Directory** to `apps/app`
4. Add the same environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy
6. Add custom domain: `app.yourdomain.com`

### For the Dashboard (`apps/dashboard`)
1. Create a **New Project** in Vercel
2. Import the **same GitHub repository**
3. Set **Root Directory** to `apps/dashboard`
4. Add the same environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy
6. Add custom domain: `dashboard.yourdomain.com`

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│ GitHub Repository (fantasy-golf)                    │
│                                                     │
│  ├── apps/web                                       │
│  ├── apps/app                                       │
│  └── apps/dashboard                                 │
└─────────────────────────────────────────────────────┘
           │              │              │
           ▼              ▼              ▼
    ┌───────────┐  ┌───────────┐  ┌────────────┐
    │ Vercel    │  │ Vercel    │  │ Vercel     │
    │ Project A │  │ Project B │  │ Project C  │
    │           │  │           │  │            │
    │ apps/web  │  │ apps/app  │  │ apps/      │
    │           │  │           │  │ dashboard  │
    └───────────┘  └───────────┘  └────────────┘
           │              │              │
           ▼              ▼              ▼
   www.yourdomain.com  app.yourdomain.com  dashboard.yourdomain.com
```

Each Vercel project points to the same GitHub repo but builds from a different **Root Directory**.

---

## Summary

✅ Push code to GitHub  
✅ Create a Vercel project per app  
✅ Set Root Directory to the app folder  
✅ Add environment variables  
✅ Map custom domains  
✅ Share auth across subdomains via `.yourdomain.com` cookie domain  

Every commit to `main` triggers a production deployment. Preview deployments happen automatically on branches and pull requests.
