const { createClient } = require('@supabase/supabase-js');

// Production Supabase config - same as local for this project
const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI';

async function fixProductionSettings() {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🔧 Fixing production coming soon settings...');
    
    // Update headline to correct text
    const { data: headlineData, error: headlineError } = await supabase
        .from('site_settings')
        .upsert({
            setting_key: 'coming_soon_headline',
            setting_value: 'COMING SOON',
            updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' })
        .select();
        
    if (headlineError) {
        console.error('❌ Error updating headline:', headlineError);
    } else {
        console.log('✅ Headline updated to: COMING SOON');
    }
    
    // Clear background image
    const { data: bgData, error: bgError } = await supabase
        .from('site_settings')
        .upsert({
            setting_key: 'coming_soon_background_image',
            setting_value: '',
            updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' })
        .select();
        
    if (bgError) {
        console.error('❌ Error clearing background:', bgError);
    } else {
        console.log('✅ Background image cleared');
    }
    
    // Verify current settings
    const { data: currentData, error: fetchError } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['coming_soon_headline', 'coming_soon_background_image']);
        
    if (fetchError) {
        console.error('❌ Error fetching settings:', fetchError);
    } else {
        console.log('📋 Current production settings:');
        currentData.forEach(setting => {
            console.log(`   ${setting.setting_key}: '${setting.setting_value}'`);
        });
    }
    
    console.log('🎉 Production database updated successfully!');
}

fixProductionSettings().catch(console.error);