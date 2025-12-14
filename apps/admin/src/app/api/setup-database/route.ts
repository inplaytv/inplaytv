import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    // First, try to create the table using raw SQL query
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(255) UNIQUE NOT NULL,
        setting_value TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { data: createResult, error: createError } = await supabase
      .rpc('exec_sql', {
        query: createTableQuery
      });

    // If RPC doesn't work, try direct table insertion to test connection
    const { data: testData, error: testError } = await supabase
      .from('settings')
      .insert({
        setting_key: 'tournament_page_background',
        setting_value: '/backgrounds/golf-course-green.jpg'
      })
      .select();

    if (testError && testError.message.includes('does not exist')) {
      return NextResponse.json({ 
        error: 'Settings table needs to be created manually',
        sql: `
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default setting
INSERT INTO settings (setting_key, setting_value)
VALUES ('tournament_page_background', '/backgrounds/golf-course-green.jpg')
ON CONFLICT (setting_key) DO NOTHING;
        `
      }, { status: 400 });
    }

    if (testError && !testError.message.includes('duplicate key')) {
      return NextResponse.json({ error: testError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Table exists or was created successfully',
      data: testData
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}