// System discriminators - DO NOT MODIFY without reviewing all usages
export const SYSTEM_IDS = {
  INPLAY: 'inplay',
  ONE_2_ONE: 'one2one', 
  CLUBHOUSE: 'clubhouse',
} as const;

export type SystemId = typeof SYSTEM_IDS[keyof typeof SYSTEM_IDS];

// Database table prefixes
export const SYSTEM_TABLES = {
  INPLAY: {
    competitions: 'tournament_competitions',
    entries: 'competition_entries',
    picks: 'competition_entry_picks',
  },
  ONE_2_ONE: {
    instances: 'competition_instances',
    entries: 'competition_entries', // Shared with InPlay
    picks: 'competition_entry_picks', // Shared with InPlay
  },
  CLUBHOUSE: {
    events: 'clubhouse_events',
    competitions: 'clubhouse_competitions',
    entries: 'clubhouse_entries',
    wallets: 'clubhouse_wallets',
    transactions: 'clubhouse_credit_transactions',
  },
} as const;

// Type guards
export function isClubhouseTable(tableName: string): boolean {
  return tableName.startsWith('clubhouse_');
}

export function isInPlayTable(tableName: string): boolean {
  return tableName.startsWith('tournament_') || 
         tableName === 'competition_entries' ||
         tableName === 'competition_entry_picks';
}

export function isOne2OneTable(tableName: string): boolean {
  return tableName === 'competition_instances' ||
         tableName === 'competition_entries' ||
         tableName === 'competition_entry_picks';
}

// Path guards
export function getSystemFromPath(path: string): SystemId | null {
  if (path.includes('/clubhouse/')) return SYSTEM_IDS.CLUBHOUSE;
  if (path.includes('/one-2-one/')) return SYSTEM_IDS.ONE_2_ONE;
  if (path.includes('/tournaments/')) return SYSTEM_IDS.INPLAY;
  return null;
}
