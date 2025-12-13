const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI';

async function debugBackgroundImage() {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🔍 DEBUGGING BACKGROUND IMAGE...');
    
    // First, check current database state
    const { data: currentData, error: fetchError } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['coming_soon_headline', 'coming_soon_background_image']);
        
    if (fetchError) {
        console.error('❌ Error fetching settings:', fetchError);
        return;
    }
    
    console.log('📋 Current database state:');
    currentData.forEach(setting => {
        console.log(`   ${setting.setting_key}: '${setting.setting_value}'`);
    });
    
    // Now set the background image
    console.log('\n🎨 Setting background image...');
    const { data: bgData, error: bgError } = await supabase
        .from('site_settings')
        .upsert({
            setting_key: 'coming_soon_background_image',
            setting_value: '/backgrounds/golf-course-teal.jpg',
            updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' })
        .select();
        
    if (bgError) {
        console.error('❌ Error setting background:', bgError);
    } else {
        console.log('✅ Background image set:', bgData[0]);
    }
    
    // Verify the update
    console.log('\n📋 After update:');
    const { data: verifyData, error: verifyError } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value')
        .eq('setting_key', 'coming_soon_background_image')
        .single();
        
    if (verifyError) {
        console.error('❌ Error verifying:', verifyError);
    } else {
        console.log(`✅ Verified: ${verifyData.setting_key} = '${verifyData.setting_value}'`);
    }
}

debugBackgroundImage();