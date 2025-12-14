// ULTIMATE DEBUG SCRIPT - Find the source of background image revert
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function ultimateDebug() {
    console.log('🔍 ULTIMATE BACKGROUND IMAGE DEBUG');
    console.log('=====================================');
    
    // Step 1: Check database value
    console.log('\n1️⃣ DATABASE CHECK:');
    const { data: dbData, error: dbError } = await supabase
        .from('site_settings')
        .select('*')
        .eq('setting_key', 'coming_soon_background_image');
    
    if (dbError) {
        console.log('❌ Database Error:', dbError);
    } else if (dbData && dbData.length > 0) {
        const value = dbData[0].setting_value;
        console.log('📊 Raw DB Value:', JSON.stringify(value));
        console.log('📏 Length:', value?.length || 0);
        console.log('🧪 Trimmed:', JSON.stringify(value?.trim()));
        console.log('🔍 Contains inplay_bg-01?', value?.includes('inplay_bg-01') ? '⚠️ YES' : '✅ NO');
        console.log('🔍 Contains inplay_bg-02?', value?.includes('inplay_bg-02') ? '✅ YES' : '❌ NO');
    } else {
        console.log('❓ No database value found');
    }
    
    // Step 2: Check admin API response
    console.log('\n2️⃣ ADMIN API CHECK:');
    try {
        const adminResponse = await fetch('http://localhost:3002/api/settings/coming-soon');
        if (adminResponse.ok) {
            const adminData = await adminResponse.json();
            console.log('📡 Admin API Response:', JSON.stringify(adminData.backgroundImage));
            console.log('🔍 Admin API contains inplay_bg-01?', adminData.backgroundImage?.includes('inplay_bg-01') ? '⚠️ YES' : '✅ NO');
            console.log('🔍 Admin API contains inplay_bg-02?', adminData.backgroundImage?.includes('inplay_bg-02') ? '✅ YES' : '❌ NO');
        } else {
            console.log('❌ Admin API failed:', adminResponse.status);
        }
    } catch (err) {
        console.log('❌ Admin API error:', err.message);
    }
    
    // Step 3: Check web API response
    console.log('\n3️⃣ WEB API CHECK:');
    try {
        const webResponse = await fetch('http://localhost:3000/api/settings/coming-soon');
        if (webResponse.ok) {
            const webData = await webResponse.json();
            console.log('🌐 Web API Response:', JSON.stringify(webData.backgroundImage));
            console.log('🔍 Web API contains inplay_bg-01?', webData.backgroundImage?.includes('inplay_bg-01') ? '⚠️ YES' : '✅ NO');
            console.log('🔍 Web API contains inplay_bg-02?', webData.backgroundImage?.includes('inplay_bg-02') ? '✅ YES' : '❌ NO');
        } else {
            console.log('❌ Web API failed:', webResponse.status);
        }
    } catch (err) {
        console.log('❌ Web API error:', err.message);
    }
    
    // Step 4: Set a test value and immediately check
    console.log('\n4️⃣ LIVE TEST - Setting inplay_bg-02.png:');
    const { error: updateError } = await supabase
        .from('site_settings')
        .upsert({
            setting_key: 'coming_soon_background_image',
            setting_value: '/backgrounds/inplay_bg-02.png',
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'setting_key'
        });
    
    if (updateError) {
        console.log('❌ Update Error:', updateError);
    } else {
        console.log('✅ Updated to inplay_bg-02.png');
        
        // Immediately check what was saved
        const { data: checkData } = await supabase
            .from('site_settings')
            .select('*')
            .eq('setting_key', 'coming_soon_background_image');
            
        if (checkData && checkData.length > 0) {
            console.log('🔍 Immediate check after save:', JSON.stringify(checkData[0].setting_value));
        }
    }
    
    console.log('\n🎯 CONCLUSION:');
    console.log('If database shows inplay_bg-02.png but admin reverts to inplay_bg-01.png,');
    console.log('then there is client-side state management or caching causing the issue.');
}

ultimateDebug().catch(console.error);