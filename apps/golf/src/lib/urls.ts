/**
 * Get the website URL based on the current environment
 */
export function getWebsiteUrl(): string {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000';
  }
  return 'https://www.inplay.tv';
}
