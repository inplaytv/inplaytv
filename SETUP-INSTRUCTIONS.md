# InPlayTV Setup Instructions

## Current Status

✅ **Installed:**
- Node.js v22.21.1
- pnpm 9.0.0  
- turbo 2.5.8 (global)

❌ **Issue:** Network connection resets (ECONNRESET) when downloading npm packages

## Network Issue

You're experiencing `ECONNRESET` errors which indicate:
- Firewall/antivirus blocking npm registry
- Network timeout issues
- Corporate proxy interference
- ISP throttling

## Solutions to Try

### Option 1: Use NPM Registry Mirror (Recommended)
```powershell
# Set npm registry to a mirror (Cloudflare)
pnpm config set registry https://registry.npmmirror.com
pnpm install
```

### Option 2: Increase Timeouts & Reduce Concurrency
```powershell
# Already configured in install.ps1
.\install.ps1
```

### Option 3: Disable Antivirus/Firewall Temporarily
1. Temporarily disable Windows Defender or antivirus
2. Run: `pnpm install`
3. Re-enable after installation

### Option 4: Use Mobile Hotspot
If on corporate/restricted network:
1. Connect to mobile hotspot
2. Run: `pnpm install`
3. Switch back to regular network after

### Option 5: Manual Package Cache
```powershell
# Download from a working machine and copy node_modules folder
# Or use offline installation
```

## Once Installation Works

### Run Development Servers

**Refresh PATH in PowerShell:**
```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

**Start Development:**
```powershell
# Run all apps
pnpm dev

# Or run specific app
pnpm dev:golf      # Golf app (port 3003)
pnpm dev:admin     # Admin app (port 3002)  
pnpm dev:web       # Marketing site (port 3000)
```

**Helper Script (use this for convenience):**
```powershell
# Created: dev.ps1
.\dev.ps1 dev:golf
```

## Troubleshooting

### PATH Not Found Errors
Always run this first in new PowerShell windows:
```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

### Port Already in Use
```powershell
pnpm kill:ports
# Or manually
Get-Process node | Stop-Process -Force
```

### Clean Reinstall
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item pnpm-lock.yaml
pnpm install
```

## Next Steps

1. Try Option 1 (registry mirror) first
2. If that fails, try Option 3 or 4
3. Once installed successfully, run `pnpm dev:golf` to test
4. Let me know if you need help with any specific errors

## Created Scripts

- **install.ps1** - Installation with retry logic
- **dev.ps1** - Helper to run pnpm commands with correct PATH
