'use client';
export const dynamic = 'force-dynamic';

import RequireAuth from '@/components/RequireAuth';
import ModernLeaderboard from './leaderboard-new';

export default function LeaderboardPage() {
  return (
    <RequireAuth>
      <ModernLeaderboard />
    </RequireAuth>
  );
}
