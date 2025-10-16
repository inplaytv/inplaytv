# Fantasy Golf Monorepo

A lean monorepo for a fantasy golf project using **Next.js App Router**, **pnpm workspaces**, and **Turborepo**.

## 📚 Documentation

**All documentation is organized in the `/docs` folder:**

👉 **[Start Here: Documentation Index](./docs/README.md)**

### Quick Links
- [Project Status](./docs/00-PROJECT-STATUS.md) - Current state and progress
- [Setup Guide](./docs/01-SETUP-GUIDE.md) - Initial setup instructions
- [Development Workflow](./docs/04-DEVELOPMENT-WORKFLOW.md) - Daily commands
- [Feature Roadmap](./docs/05-FEATURE-ROADMAP.md) - Planned features

## Structure

```
.
├── apps/
│   └── web/              # Next.js app for marketing + auth
├── packages/
│   ├── ui/               # Shared UI components (stub)
│   └── config/           # Shared tsconfig + eslint bases
├── design/               # Static HTML mockups (reference only)
├── docs/                 # 📚 All documentation (START HERE)
├── package.json
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment (see docs/01-SETUP-GUIDE.md)
cp apps/web/.env.local.example apps/web/.env.local
# Add your Supabase credentials to .env.local

# 3. Run development server
pnpm dev:web
```

The app will start at [http://localhost:3000](http://localhost:3000).

## Available Commands

```bash
pnpm dev:web       # Start web app in development
pnpm build         # Build all apps and packages
pnpm lint          # Lint all code
pnpm typecheck     # Type-check TypeScript
```

## Need Help?

📖 **[Read the full documentation](./docs/README.md)** for:
- Setup instructions
- Environment configuration  
- Testing guide
- Development workflow
- Database schema
- Feature roadmap

## Tech Stack

- **Next.js 14+** with App Router
- **TypeScript 5.3**
- **Supabase** (PostgreSQL + Auth + Realtime)
- **pnpm** for package management
- **Turborepo** for monorepo orchestration

See [docs/07-TECH-STACK.md](./docs/07-TECH-STACK.md) for complete details.

## Current Status

✅ **Phase 1 Complete:** Monorepo + Web App + Auth  
🚧 **Phase 2 In Progress:** Core web content  
⏳ **Phase 3 Planned:** Database schema  
⏳ **Phase 4 Planned:** Game app  

See [docs/00-PROJECT-STATUS.md](./docs/00-PROJECT-STATUS.md) for details.

---

## Deploy

**Full deployment guide:** [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

### Run Locally
```bash
pnpm dev --filter web
```

### Deploy to Production
Each app in `apps/` is deployed as a **separate Vercel project**:
- `apps/web` → `www.yourdomain.com`
- `apps/app` → `app.yourdomain.com` (later)
- `apps/dashboard` → `dashboard.yourdomain.com` (later)

**Steps:**
1. Push code to GitHub
2. Create a Vercel project for each app
3. Set **Root Directory** to the app folder (e.g., `apps/web`)
4. Add environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
5. Map custom domains

See [docs/VERCEL_PROJECTS.md](./docs/VERCEL_PROJECTS.md) for project configuration details.
