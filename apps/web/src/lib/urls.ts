/**
 * Get the golf app URL based on environment
 * - Production: https://golf.inplay.tv
 * - Local dev: http://localhost:3001
 */
export function getGolfAppUrl(): string {
  // Check if we're in development (localhost)
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3001';
  }
  
  // Production
  return 'https://golf.inplay.tv';
}
