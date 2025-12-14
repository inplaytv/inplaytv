const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetBackgroundImage() {
    console.log('🔍 Checking current background image value...');
    
    // First check what's currently stored
    const { data: currentData, error: fetchError } = await supabase
        .from('site_settings')
        .select('*')
        .eq('setting_key', 'coming_soon_background_image');
    
    if (fetchError) {
        console.error('❌ Error fetching data:', fetchError);
        return;
    }
    
    if (currentData && currentData.length > 0) {
        console.log('📊 Current value:', JSON.stringify(currentData[0].setting_value));
        console.log('📏 Length:', currentData[0].setting_value?.length);
    } else {
        console.log('❓ No current value found');
    }
    
    // Delete the row completely
    console.log('🗑️ Deleting background image setting...');
    const { error: deleteError } = await supabase
        .from('site_settings')
        .delete()
        .eq('setting_key', 'coming_soon_background_image');
    
    if (deleteError) {
        console.error('❌ Error deleting:', deleteError);
        return;
    }
    
    console.log('✅ Background image setting deleted');
    console.log('📝 Now set your desired background image in the admin panel');
    console.log('💡 The value should persist without reverting');
}

resetBackgroundImage().catch(console.error);