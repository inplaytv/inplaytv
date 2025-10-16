# Development Workflow

Daily development commands and best practices.

## Starting Development

```bash
# Start web app only
pnpm dev:web

# When you have multiple apps (future):
# pnpm dev              # Starts ALL apps
# turbo run dev --filter=web --filter=app
```

## Common Commands

### Development
```bash
pnpm dev:web          # Start Next.js dev server
pnpm build            # Build all apps
pnpm lint             # Run ESLint on all code
pnpm typecheck        # Type-check with TypeScript
```

### Package Management
```bash
# Add dependency to specific app
cd apps/web
pnpm add package-name

# Add to all workspaces
pnpm add -w package-name

# Add dev dependency
pnpm add -D package-name

# Remove dependency
pnpm remove package-name
```

### Working with Workspaces
```bash
# Run command in specific workspace
pnpm --filter web dev
pnpm --filter web build

# Run in all workspaces
pnpm -r build          # recursive
```

## File Structure

### Where to Add New Files

**Pages/Routes** → `apps/web/src/app/`
```
src/app/
├── page.tsx              # Home page (/)
├── tournaments/
│   └── page.tsx          # /tournaments
├── (auth)/
│   └── login/
│       └── page.tsx      # /login (grouped route)
└── account/
    └── page.tsx          # /account
```

**Components** → `apps/web/src/components/` (create this folder)
```bash
mkdir apps/web/src/components
```

**Utilities** → `apps/web/src/lib/`
```
src/lib/
├── supabaseClient.ts     # Supabase setup
├── utils.ts              # Helper functions
└── hooks/                # Custom React hooks
```

**Shared UI** → `packages/ui/`
When components are used across multiple apps

**Styles** → `apps/web/src/app/globals.css` or component-level

## Git Workflow

### First Commit
```bash
git add .
git commit -m "Initial monorepo setup with Next.js and Supabase"
```

### Daily Workflow
```bash
# Check status
git status

# Stage changes
git add .

# Commit with message
git commit -m "Add feature: tournament listing page"

# Push to remote (when you set one up)
git push origin main
```

### Recommended Commit Messages
```
feat: Add tournament selection page
fix: Resolve authentication redirect issue
docs: Update setup instructions
refactor: Simplify Supabase client setup
style: Format code with prettier
```

## Code Organization

### Component Pattern
```typescript
// apps/web/src/components/TournamentCard.tsx
"use client"; // Only if using hooks/state

interface TournamentCardProps {
  title: string;
  date: string;
}

export default function TournamentCard({ title, date }: TournamentCardProps) {
  return (
    <div>
      <h3>{title}</h3>
      <p>{date}</p>
    </div>
  );
}
```

### Custom Hook Pattern
```typescript
// apps/web/src/lib/hooks/useAuth.ts
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export function useAuth() {
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  return { user, supabase };
}
```

## Troubleshooting

### Dev Server Issues
```bash
# Kill the process
Ctrl + C

# Clear Next.js cache
rm -rf apps/web/.next

# Reinstall dependencies
rm -rf node_modules
pnpm install

# Restart server
pnpm dev:web
```

### TypeScript Errors
```bash
# Check for errors
pnpm typecheck

# Common fix: restart TS server in VS Code
# Command Palette (Ctrl+Shift+P) → "TypeScript: Restart TS Server"
```

### Module Not Found
```bash
# Check if dependency is installed
cat apps/web/package.json

# Reinstall dependencies
pnpm install

# Check import paths match tsconfig paths
```

## VS Code Tips

### Recommended Extensions
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense (if you add Tailwind later)

### Workspace Settings
Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Next Steps

1. **Add your first feature** - See `05-FEATURE-ROADMAP.md`
2. **Database setup** - See `06-DATABASE-SCHEMA.md`
3. **Deploy to production** - See `07-DEPLOYMENT.md` (when ready)
