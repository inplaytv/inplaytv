import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Mock leaderboard data for testing
export async function GET() {
  const mockData = {
    tournament: "The Masters 2024",
    round: 4,
    updated_at: new Date().toISOString(),
    leaderboard: [
      {
        position: 1,
        player_name: "Scottie Scheffler",
        country: "USA",
        score: -18,
        today: -3,
        thru: "F",
        strokes: 270,
        world_ranking: 1
      },
      {
        position: 2,
        player_name: "Rory McIlroy",
        country: "NIR",
        score: -15,
        today: -4,
        thru: "F",
        strokes: 273,
        world_ranking: 2
      },
      {
        position: 3,
        player_name: "Jon Rahm",
        country: "ESP",
        score: -14,
        today: -2,
        thru: "F",
        strokes: 274,
        world_ranking: 3
      },
      {
        position: "T4",
        player_name: "Viktor Hovland",
        country: "NOR",
        score: -12,
        today: -5,
        thru: "F",
        strokes: 276,
        world_ranking: 5
      },
      {
        position: "T4",
        player_name: "Xander Schauffele",
        country: "USA",
        score: -12,
        today: -3,
        thru: "F",
        strokes: 276,
        world_ranking: 6
      }
    ]
  };

  return NextResponse.json(mockData);
}
