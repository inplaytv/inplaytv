# 🏌️ Clubhouse Fantasy Golf System

A simplified, bulletproof fantasy golf platform for testing architectural improvements.

## 🎯 Purpose

Test fixes in a clean system before backporting to main InPlay platform. Addresses core issues:
- Status value inconsistency
- Silent HTTP failures  
- Non-atomic operations
- Missing database constraints
- Manual script dependency

## 🚀 Quick Start

```powershell
# 1. Install dependencies
pnpm install

# 2. Set up environment (copy .env.example to .env.local in both apps)
cd apps/clubhouse-admin
copy .env.example .env.local
# Add Supabase credentials

cd ../clubhouse
copy .env.example .env.local
# Add Supabase credentials

# 3. Initialize database
cd ../..
.\scripts\setup-clubhouse-db.ps1

# 4. Start servers
.\start-clubhouse.ps1
```

**Admin**: http://localhost:3004  
**User**: http://localhost:3005

## 📚 Documentation

- **[CLUBHOUSE-IMPLEMENTATION-COMPLETE.md](./CLUBHOUSE-IMPLEMENTATION-COMPLETE.md)** - What was built & why
- **[CLUBHOUSE-QUICK-START.md](./CLUBHOUSE-QUICK-START.md)** - Detailed setup & testing
- **[CLUBHOUSE-SETUP-CHECKLIST.md](./CLUBHOUSE-SETUP-CHECKLIST.md)** - Progress tracking
- **[CLUBHOUSE-SYSTEM-PLAN.md](./CLUBHOUSE-SYSTEM-PLAN.md)** - Architecture specification
- **[SYSTEMATIC-FIX-PLAN.md](./SYSTEMATIC-FIX-PLAN.md)** - Problem analysis & solutions

## ✨ Key Features

- **4 Simple Status Values**: upcoming → open → active → completed
- **Automatic Status Management**: Database triggers calculate from dates
- **Atomic Operations**: Entry + payment in one transaction
- **Database Constraints**: Invalid data impossible
- **Zero Manual Scripts**: Everything automated via triggers

## 🏗️ Architecture

```
packages/clubhouse-shared/  # Types, constants, utilities
apps/clubhouse-admin/       # Admin app (port 3004)
apps/clubhouse/             # User app (port 3005)
scripts/clubhouse-schema.sql # Database with triggers & RPC
```

## 📋 Current Status

✅ Infrastructure complete  
⏳ Environment setup needed  
⏳ Database initialization needed  
⏳ Development of UI pages in progress

## 🎓 Learning from Mistakes

Built after 2 weeks of circular bugs in production. Strategy:
1. Build clean → 2. Test thoroughly → 3. Backport proven fixes

No more "fix one thing, break another."
