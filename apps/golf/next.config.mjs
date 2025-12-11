/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Automatically remove console.log in production (keep error/warn for monitoring)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' 
      ? { exclude: ['error', 'warn'] }
      : false,
  },

  // Empty turbopack config to silence the warning
  turbopack: {},

  // Webpack optimization for development
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Reduce file watching overhead
      config.watchOptions = {
        poll: 1000, // Check for changes every second
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.next', '**/.git'],
      };
    }
    return config;
  },

  // Tell Vercel to skip build if no relevant files changed
  // This prevents unnecessary builds but doesn't help with triggering builds
  // The real solution is in Vercel's "Ignored Build Step" setting
};

export default nextConfig;
