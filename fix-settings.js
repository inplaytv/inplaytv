const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI';

async function fixSettings() {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('Fixing coming soon settings...');
    
    // Update headline
    const { data: headlineData, error: headlineError } = await supabase
        .from('site_settings')
        .upsert({
            setting_key: 'coming_soon_headline',
            setting_value: 'COMING SOON',
            updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' })
        .select();
        
    if (headlineError) {
        console.error('Error updating headline:', headlineError);
    } else {
        console.log('✅ Headline updated:', headlineData);
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
        console.error('Error clearing background:', bgError);
    } else {
        console.log('✅ Background cleared:', bgData);
    }
    
    // Verify current settings
    const { data: currentData, error: fetchError } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['coming_soon_headline', 'coming_soon_background_image']);
        
    if (fetchError) {
        console.error('Error fetching settings:', fetchError);
    } else {
        console.log('Current settings:', currentData);
    }
}

fixSettings();