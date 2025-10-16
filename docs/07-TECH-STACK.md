# Technology Stack

Complete list of technologies, versions, and rationale.

## Core Framework

### Next.js 14.2
**Purpose:** React framework for web applications  
**Why:** Server-side rendering, App Router, great DX, Vercel deployment  
**Docs:** https://nextjs.org/docs

### React 18.3
**Purpose:** UI library  
**Why:** Industry standard, component-based, huge ecosystem  
**Docs:** https://react.dev

### TypeScript 5.3
**Purpose:** Type-safe JavaScript  
**Why:** Catch errors early, better IDE support, self-documenting code  
**Docs:** https://www.typescriptlang.org/docs

## Backend & Database

### Supabase
**Purpose:** Backend-as-a-Service  
**Why:** PostgreSQL + Auth + Storage + Realtime in one platform  
**Docs:** https://supabase.com/docs

**Components:**
- **PostgreSQL** - Relational database
- **Auth** - Magic link, OAuth, JWT
- **Storage** - File uploads (profile pics, etc.)
- **Realtime** - WebSocket updates for live scores
- **Edge Functions** - Serverless functions (future use)

**Packages:**
- `@supabase/supabase-js` - JavaScript client
- `@supabase/ssr` - Server-side rendering helpers

## Monorepo Tools

### pnpm 9.0
**Purpose:** Package manager  
**Why:** Fast, efficient, great workspace support  
**Docs:** https://pnpm.io

### Turborepo 2.5
**Purpose:** Monorepo build system  
**Why:** Caching, parallel builds, simple config  
**Docs:** https://turbo.build/repo/docs

## Development Tools

### ESLint 8.57
**Purpose:** Code linting  
**Why:** Enforce code quality, catch bugs  
**Config:** Extends Next.js recommended

### TypeScript Compiler
**Purpose:** Type checking  
**Why:** Catch type errors before runtime

## Not Using (But Could Add Later)

### ❌ Tailwind CSS
**Why not:** Keeping CSS minimal for now  
**When to add:** When design system is defined

### ❌ Jest / Vitest
**Why not:** Focus on features first  
**When to add:** Phase 8 (testing)

### ❌ Playwright / Cypress
**Why not:** Manual testing sufficient for now  
**When to add:** Before production launch

### ❌ Prettier
**Why not:** ESLint handles formatting  
**When to add:** When team grows

### ❌ Storybook
**Why not:** No component library yet  
**When to add:** When packages/ui is populated

## Future Additions

### Phase 5: Payments
- **Stripe** - Payment processing
- `@stripe/stripe-js` - Client SDK
- `stripe` - Server SDK

### Phase 6: Monitoring
- **Sentry** - Error tracking
- **Vercel Analytics** - Performance monitoring
- **PostHog** - Product analytics

### Phase 7: Engagement
- **SendGrid** - Transactional emails
- **Resend** - Email API (alternative)
- **OneSignal** - Push notifications

### Phase 8: Optimization
- **React Query** - Data fetching & caching
- **Zustand** - State management (if needed)
- **Sharp** - Image optimization

## Deployment

### Vercel
**Purpose:** Hosting platform  
**Why:** Built for Next.js, excellent DX, auto-scaling  
**Features:**
- Zero-config deployments
- Preview deployments for PRs
- Edge network CDN
- Serverless functions

### Supabase Cloud
**Purpose:** Database & backend hosting  
**Why:** Managed PostgreSQL, auto-backups, global CDN  

## Third-Party APIs (Future)

### PGA Tour API
**Purpose:** Live golf scores and player data  
**When:** Phase 4 (live scoring)

### DataGolf API
**Purpose:** Advanced golf statistics  
**When:** Phase 7 (analytics)

### Stripe API
**Purpose:** Payments and payouts  
**When:** Phase 5 (monetization)

## Development Environment

### Node.js
**Version:** 20+  
**Why:** LTS, stable, great performance

### VS Code (Recommended)
**Extensions:**
- ESLint
- TypeScript and JavaScript Language Features
- Prettier (optional)
- GitLens (optional)

### Git
**Version Control:** Standard git workflow

## Architecture Decisions

### Why Monorepo?
- Share code between apps
- Single source of truth
- Coordinated releases
- Simplified dependencies

### Why Next.js App Router?
- Server components by default
- File-based routing
- Built-in layouts
- Better SEO

### Why Supabase?
- Full backend stack
- No server management
- Real-time built-in
- PostgreSQL (not NoSQL)
- Cost-effective for MVP

### Why TypeScript?
- Type safety prevents bugs
- Better autocomplete
- Self-documenting
- Industry standard

### Why No Tailwind?
- Keeping it minimal
- Can add later easily
- Faster initial setup
- Less to learn for now

## Performance Considerations

### Current
- Server-side rendering (SSR)
- Static generation where possible
- Minimal JavaScript bundle

### Future Optimizations
- Image optimization (next/image)
- Code splitting (automatic in Next.js)
- API route caching
- Database query optimization
- CDN for static assets
- React Query for client-side caching

## Security Practices

### Current
- Environment variables for secrets
- Row Level Security (RLS) in database
- JWT authentication
- HTTPS everywhere (Vercel default)

### Future
- Content Security Policy (CSP)
- Rate limiting
- CSRF protection
- SQL injection prevention (parameterized queries)
- XSS prevention (React default)

## Costs (Estimated)

### Development (Free)
- ✅ Supabase Free Tier
- ✅ Vercel Hobby Plan
- ✅ GitHub Free

### Production (Paid)
- Supabase Pro: ~$25/month
- Vercel Pro: ~$20/month
- Stripe: 2.9% + $0.30 per transaction
- **Total:** ~$50/month + transaction fees

### Scale (High Volume)
- Supabase Team: $599/month
- Vercel Team: $20/user/month
- Additional bandwidth/compute as needed
