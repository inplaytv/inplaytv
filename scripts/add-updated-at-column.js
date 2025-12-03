const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addUpdatedAtColumn() {
  console.log('\n🔧 Adding updated_at column to golfers table...\n');
  
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE golfers 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      
      -- Create trigger to auto-update updated_at
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
      
      DROP TRIGGER IF EXISTS update_golfers_updated_at ON golfers;
      
      CREATE TRIGGER update_golfers_updated_at
        BEFORE UPDATE ON golfers
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `
  });

  if (error) {
    console.error('❌ Failed to add column:', error);
    console.log('\n📋 Please run this SQL manually in Supabase Dashboard → SQL Editor:\n');
    console.log(`
ALTER TABLE golfers 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    `);
  } else {
    console.log('✅ Successfully added updated_at column and trigger');
  }
}

addUpdatedAtColumn();
