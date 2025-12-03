import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Creating player_round_stats table...');

    // Create player_round_stats table
    const { error: table1Error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS player_round_stats (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          player_id UUID NOT NULL,
          tournament_id TEXT NOT NULL,
          tournament_name TEXT,
          round_number INTEGER NOT NULL,
          date DATE NOT NULL,
          score INTEGER,
          to_par INTEGER,
          course_par INTEGER DEFAULT 72,
          sg_total DECIMAL(10,3),
          sg_ott DECIMAL(10,3),
          sg_app DECIMAL(10,3),
          sg_arg DECIMAL(10,3),
          sg_putt DECIMAL(10,3),
          sg_t2g DECIMAL(10,3),
          driving_dist DECIMAL(10,2),
          driving_acc DECIMAL(10,2),
          gir DECIMAL(10,2),
          scrambling DECIMAL(10,2),
          birdies INTEGER DEFAULT 0,
          bogies INTEGER DEFAULT 0,
          pars INTEGER DEFAULT 0,
          eagles_or_better INTEGER DEFAULT 0,
          doubles_or_worse INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_player_round_stats_player_id ON player_round_stats(player_id);
        CREATE INDEX IF NOT EXISTS idx_player_round_stats_date ON player_round_stats(date DESC);
        CREATE INDEX IF NOT EXISTS idx_player_round_stats_tournament ON player_round_stats(tournament_id, round_number);
      `
    });

    if (table1Error) {
      console.error('Error creating player_round_stats:', table1Error);
      return NextResponse.json({ error: 'Failed to create player_round_stats table', details: table1Error }, { status: 500 });
    }

    console.log('Creating player_sg_aggregates table...');

    // Create player_sg_aggregates table
    const { error: table2Error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS player_sg_aggregates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          player_id UUID NOT NULL,
          period TEXT NOT NULL CHECK (period IN ('l5', 'l10', 'l20', 'career')),
          avg_sg_total DECIMAL(10,3),
          avg_sg_ott DECIMAL(10,3),
          avg_sg_app DECIMAL(10,3),
          avg_sg_arg DECIMAL(10,3),
          avg_sg_putt DECIMAL(10,3),
          rounds_count INTEGER,
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(player_id, period)
        );

        CREATE INDEX IF NOT EXISTS idx_player_sg_aggregates_player_id ON player_sg_aggregates(player_id);
      `
    });

    if (table2Error) {
      console.error('Error creating player_sg_aggregates:', table2Error);
      return NextResponse.json({ error: 'Failed to create player_sg_aggregates table', details: table2Error }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database tables created successfully!' 
    });

  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
