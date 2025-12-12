import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

async function checkUsers() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
  
  console.log('🔍 Checking database users...\n');
  
  // Get auth users
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('❌ Auth error:', authError);
  } else {
    console.log(`✅ Total Auth Users: ${authData.users.length}\n`);
    authData.users.forEach(user => {
      console.log(`📧 ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Last Sign In: ${user.last_sign_in_at || 'Never'}`);
      console.log('');
    });
  }
  
  // Get profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (profileError) {
    console.error('❌ Profile error:', profileError);
  } else {
    console.log(`\n✅ Total Profiles: ${profiles.length}\n`);
    profiles.forEach(profile => {
      console.log(`👤 ${profile.email || 'No email'}`);
      console.log(`   Username: ${profile.username || 'None'}`);
      console.log(`   Created: ${profile.created_at}`);
      console.log('');
    });
  }
}

checkUsers().catch(console.error);
