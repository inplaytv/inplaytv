import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const REGISTRATION_CLOSE_BUFFER_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data: tournament } = await supabase
      .from("tournaments")
      .select("id, name, registration_opens_at, registration_closes_at, round_1_start, round_2_start, round_3_start, round_4_start, end_date")
      .eq("id", params.id)
      .single();

    if (!tournament) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: competitions } = await supabase
      .from("tournament_competitions")
      .select("id, competition_types!inner(name, round_start)")
      .eq("tournament_id", params.id);

    if (!competitions) return NextResponse.json({ message: "No competitions", updated: 0 });

    const updates = [];
    const now = new Date();

    for (const comp of competitions) {
      const roundStart = (comp.competition_types as any).round_start || 1;
      const teeTime = tournament[`round_${roundStart}_start` as keyof typeof tournament];

      if (!teeTime) {
        updates.push({
          id: comp.id,
          reg_open_at: tournament.registration_opens_at,
          reg_close_at: tournament.registration_closes_at,
          start_at: null,
          end_at: tournament.end_date,
          status: "reg_open",
        });
        continue;
      }

      const regCloseAt = new Date(new Date(teeTime as string).getTime() - REGISTRATION_CLOSE_BUFFER_MS);
      const status = now >= regCloseAt ? "reg_closed" : (tournament.registration_opens_at && now >= new Date(tournament.registration_opens_at)) ? "reg_open" : "upcoming";

      updates.push({
        id: comp.id,
        reg_open_at: tournament.registration_opens_at,
        reg_close_at: regCloseAt.toISOString(),
        start_at: teeTime,
        end_at: tournament.end_date,
        status,
      });
    }

    for (const update of updates) {
      await supabase.from("tournament_competitions").update(update).eq("id", update.id);
    }

    return NextResponse.json({ message: "Synced", tournament: tournament.name, updated: updates.length });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}