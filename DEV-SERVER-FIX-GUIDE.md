# Dev Server Troubleshooting Guide

## 🚨 Exit Code 1 Error - Permanent Fix

### Quick Fix (Use This Every Time)

```powershell
pnpm fix
```

This runs a comprehensive diagnostic and fix script that:
- ✅ Kills all Node processes
- ✅ Frees up ports 3000, 3002, 3003
- ✅ Clears Turbo cache
- ✅ Clears Next.js cache
- ✅ Checks TypeScript errors
- ✅ Verifies environment files
- ✅ Checks node_modules health

### Safe Start (Recommended)

```powershell
pnpm dev:safe
```

Automatically cleans up before starting dev server.

### Manual Commands

| Command | Description |
|---------|-------------|
| `pnpm fix` | Run full diagnostic and fix all issues |
| `pnpm dev:safe` | Auto-cleanup + start dev server |
| `pnpm restart` | Fix + restart (combines fix and dev) |
| `pnpm kill:ports` | Just kill Node processes |
| `pnpm restart:golf` | Kill + start golf app only |
| `pnpm dev:golf` | Start golf app only (no cleanup) |

## Common Causes of Exit Code 1

### 1. Port Already in Use ⚠️
**Symptoms:** "Port 3003 is already in use"

**Fix:**
```powershell
pnpm kill:ports
pnpm dev:golf
```

### 2. Corrupted Cache 🗑️
**Symptoms:** Build errors, "Module not found"

**Fix:**
```powershell
# Clear all caches
rm -rf .turbo
rm -rf apps/web/.next
rm -rf apps/golf/.next
rm -rf apps/admin/.next

# Or just run:
pnpm fix
```

### 3. TypeScript Errors 🔴
**Symptoms:** "Type error" messages

**Fix:**
```powershell
# Check errors
pnpm typecheck

# Fix the errors in your code, then restart
pnpm dev
```

### 4. Node Process Hanging 🔄
**Symptoms:** Turbo starts but apps don't load

**Fix:**
```powershell
# Force kill all Node
Get-Process | Where-Object { $_.ProcessName -like '*node*' } | Stop-Process -Force

# Restart
pnpm dev:golf
```

### 5. Corrupted node_modules 📦
**Symptoms:** "Cannot find module", random errors

**Fix:**
```powershell
# Full reinstall
rm -rf node_modules
rm -rf apps/*/node_modules
rm pnpm-lock.yaml

pnpm install
pnpm dev
```

## Best Practices

### ✅ DO:
- Use `pnpm dev:safe` to start (auto-cleanup)
- Run `pnpm fix` when errors occur
- Start single apps when testing (`pnpm dev:golf`)
- Check TypeScript errors before committing

### ❌ DON'T:
- Leave dev servers running overnight
- Run multiple dev commands simultaneously
- Force quit terminal without stopping servers
- Edit files while TypeScript is compiling

## Emergency Reset

If all else fails:

```powershell
# Nuclear option - complete reset
pnpm kill:ports
rm -rf .turbo
rm -rf apps/*/.next
rm -rf node_modules
rm -rf apps/*/node_modules
rm pnpm-lock.yaml

# Reinstall
pnpm install

# Start fresh
pnpm dev:safe
```

## Preventing Exit Code 1

1. **Always use safe mode**: `pnpm dev:safe` instead of `pnpm dev`
2. **Clean before switching branches**: `pnpm fix` before `git checkout`
3. **Fix TypeScript errors immediately**: Don't let them accumulate
4. **Restart after package changes**: After `pnpm install`, always restart dev server
5. **Use single app mode when possible**: `pnpm dev:golf` uses less resources

## Scripts Reference

Created two new scripts:

### `fix-dev-server.ps1`
Comprehensive diagnostic tool that checks and fixes:
- Process conflicts
- Port availability
- Cache corruption
- TypeScript errors
- Environment files
- node_modules health

### `dev-safe.ps1`
Quick cleanup + start script for daily use

## Troubleshooting Checklist

When you get Exit Code 1:

- [ ] Run `pnpm fix`
- [ ] Check terminal output for specific error
- [ ] Verify all `.env.local` files exist
- [ ] Check if ports are free: `netstat -ano | findstr :3003`
- [ ] Verify Node version: `node --version` (should be 20+)
- [ ] Check disk space (Next.js needs space for builds)
- [ ] Restart VS Code if in integrated terminal
- [ ] Check for Windows Updates (sometimes breaks Node)

## Still Having Issues?

1. Copy terminal error output
2. Run: `pnpm fix` and check what it reports
3. Check: `pnpm typecheck` output
4. Verify: All `.env.local` files have correct values
5. Test: Run single app `pnpm dev:golf` instead of all apps

---

**TL;DR: Just run `pnpm dev:safe` instead of `pnpm dev` every time!**
