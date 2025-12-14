console.log(`
==========================================
SUPABASE SQL SETUP REQUIRED
==========================================

Please run this SQL in your Supabase dashboard:

1. Go to https://qemosikbhrnstcormhuz.supabase.co
2. Navigate to "SQL Editor"
3. Run the following SQL:

--------------------------------------------------

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default tournament background setting
INSERT INTO settings (setting_key, setting_value)
VALUES ('tournament_page_background', '/backgrounds/golf-course-green.jpg')
ON CONFLICT (setting_key) DO NOTHING;

-- Verify the table was created
SELECT * FROM settings;

--------------------------------------------------

After running this SQL:
1. The settings table will be created
2. A default background will be set 
3. The admin background selector will work
4. The tournaments page will show backgrounds

==========================================
`);