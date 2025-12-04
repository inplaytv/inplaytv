/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Automatically remove console.log in production (keep error/warn for monitoring)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' 
      ? { exclude: ['error', 'warn'] }
      : false,
  },
};

export default nextConfig;
