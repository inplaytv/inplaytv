# Build Configuration for Console Log Removal

Add this to your `next.config.js` files in each app:

## apps/golf/next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config ...
  
  // Remove console logs in production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' 
      ? { exclude: ['error', 'warn'] } // Keep error and warn
      : false,
  },
}

module.exports = nextConfig
```

## apps/admin/next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config ...
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' 
      ? { exclude: ['error', 'warn'] }
      : false,
  },
}

module.exports = nextConfig
```

## apps/web/next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config ...
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' 
      ? { exclude: ['error', 'warn'] }
      : false,
  },
}

module.exports = nextConfig
```

## Benefits:
✅ Zero code changes needed
✅ Automatic removal during production build
✅ Keeps error and warn logs for monitoring
✅ Development logs still visible during development
✅ Works with Next.js 13+ built-in compiler

## How to use:
1. Add the config above to each next.config.js
2. Build for production: `npm run build`
3. Console logs automatically removed in production bundle
4. Development mode unchanged
