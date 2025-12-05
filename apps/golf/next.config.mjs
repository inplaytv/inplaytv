/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Automatically remove console.log in production (keep error/warn for monitoring)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' 
      ? { exclude: ['error', 'warn'] }
      : false,
  },

  // Tell Vercel to skip build if no relevant files changed
  // This prevents unnecessary builds but doesn't help with triggering builds
  // The real solution is in Vercel's "Ignored Build Step" setting
};

export default nextConfig;
