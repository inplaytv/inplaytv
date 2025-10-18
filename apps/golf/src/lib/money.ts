/**
 * Money formatting utilities
 * All currency is stored as integer pence in the database
 */

/**
 * Format pence to pounds string
 * @param cents - Amount in pence (e.g., 1234 = £12.34)
 * @returns Formatted string (e.g., "£12.34")
 */
export function formatPounds(cents: number): string {
  const pounds = cents / 100;
  return `£${pounds.toFixed(2)}`;
}

/**
 * Parse pounds string to pence
 * @param input - String like "12.34" or "12"
 * @returns Amount in pence
 */
export function parsePounds(input: string): number {
  const pounds = parseFloat(input);
  if (isNaN(pounds)) return 0;
  return Math.round(pounds * 100);
}
