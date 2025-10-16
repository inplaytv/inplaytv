# Vercel Projects Configuration

This document outlines the Vercel project setup for each app in the monorepo.

---

## Projects Table

| App              | Root Directory    | Production Domain          | Required Environment Variables                            |
|------------------|-------------------|----------------------------|----------------------------------------------------------|
| Website          | `apps/web`        | `www.yourdomain.com`       | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Game (later)     | `apps/app`        | `app.yourdomain.com`       | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Dashboard (later)| `apps/dashboard`  | `dashboard.yourdomain.com` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

---

## Checklist: Create a New Vercel Project

Use this checklist for each app you deploy:

- [ ] Go to [vercel.com](https://vercel.com) and click **New Project**
- [ ] **Import** your GitHub repository
- [ ] Set **Root Directory** to the app folder (e.g., `apps/web`)
- [ ] Confirm **Framework Preset** is auto-detected (Next.js)
- [ ] Add **Environment Variables**:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Click **Deploy**
- [ ] Wait for deployment to complete
- [ ] Go to **Domains** and add your custom domain (e.g., `www.yourdomain.com`)
- [ ] Configure DNS (CNAME or Vercel DNS)
- [ ] Verify production domain is live

---

## Notes

- Each app in `apps/` gets its **own Vercel project**
- All projects import the **same GitHub repository**
- Different **Root Directory** per project builds the correct app
- Environment variables must be added **per project**
- Preview deployments are automatic for every branch/PR

---

## Shared Authentication

To share authentication across all subdomains:

1. Go to **Supabase Dashboard** → **Authentication** → **Settings**
2. Set **Cookie Domain** to `.yourdomain.com` (note the leading dot)
3. Enable **SameSite: Lax** and **Secure Cookies: On**

This allows users to stay logged in across `www`, `app`, and `dashboard` subdomains.
