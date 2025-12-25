import { assertAdminOrRedirect } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabaseAdminServer';

export const dynamic = 'force-dynamic';

async function getAdvertisementSettings() {
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from('advertisement_settings')
    .select('*')
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching advertisement settings:', error);
    return null;
  }
  
  return data;
}

export default async function AdvertisementsPage() {
  await assertAdminOrRedirect();
  const settings = await getAdvertisementSettings();

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', fontWeight: 700 }}>Advertisement Manager</h1>
      
      <div style={{
        display: 'grid',
        gap: '1.5rem',
      }}>
        {/* Tournament Featured Card Ad */}
        <div style={{
          padding: '1.5rem',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
        }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 600 }}>
            <i className="fas fa-trophy" style={{ marginRight: '0.5rem', color: '#3b82f6' }}></i>
            Tournament Featured Card Ad
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>
            Displayed in the large featured tournament card on the tournaments page
          </p>
          
          <form method="POST" action="/api/advertisements">
            <input type="hidden" name="ad_type" value="tournament_featured" />
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                Partner Label
              </label>
              <input
                type="text"
                name="partner_label"
                defaultValue={settings?.tournament_featured_partner_label || 'OFFICIAL PARTNER'}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
                placeholder="OFFICIAL PARTNER"
              />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                Company Name
              </label>
              <input
                type="text"
                name="company_name"
                defaultValue={settings?.tournament_featured_company_name || 'Premium Golf Equipment'}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
                placeholder="Premium Golf Equipment"
              />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                Tagline
              </label>
              <input
                type="text"
                name="tagline"
                defaultValue={settings?.tournament_featured_tagline || 'Elevate Your Game'}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
                placeholder="Elevate Your Game"
              />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                CTA Button Text
              </label>
              <input
                type="text"
                name="cta_text"
                defaultValue={settings?.tournament_featured_cta_text || 'Shop Now'}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
                placeholder="Shop Now"
              />
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                Link URL
              </label>
              <input
                type="url"
                name="link_url"
                defaultValue={settings?.tournament_featured_link_url || ''}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
                placeholder="https://example.com"
              />
            </div>
            
            <button
              type="submit"
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <i className="fas fa-save" style={{ marginRight: '0.5rem' }}></i>
              Save Changes
            </button>
          </form>
        </div>

        {/* Scorecard Confirmation Ads */}
        <div style={{
          padding: '1.5rem',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
        }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 600 }}>
            <i className="fas fa-clipboard-check" style={{ marginRight: '0.5rem', color: '#10b981' }}></i>
            Scorecard Confirmation Page Ads
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem' }}>
            Three ad slots shown after users submit their scorecards
          </p>
          
          <form method="POST" action="/api/advertisements">
            <input type="hidden" name="ad_type" value="scorecard_confirmation" />
            
            {[1, 2, 3].map(slot => (
              <div key={slot} style={{
                padding: '1rem',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '8px',
                marginBottom: '1rem',
              }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 600, color: '#3b82f6' }}>
                  Ad Slot {slot}
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      Company Name
                    </label>
                    <input
                      type="text"
                      name={`slot${slot}_company_name`}
                      defaultValue={settings?.[`scorecard_ad${slot}_company_name`] || `Sponsor ${slot}`}
                      style={{
                        width: '100%',
                        padding: '0.625rem',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '4px',
                        color: '#fff',
                      }}
                      placeholder={`Sponsor ${slot}`}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                      Tagline
                    </label>
                    <input
                      type="text"
                      name={`slot${slot}_tagline`}
                      defaultValue={settings?.[`scorecard_ad${slot}_tagline`] || 'Your tagline here'}
                      style={{
                        width: '100%',
                        padding: '0.625rem',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '4px',
                        color: '#fff',
                      }}
                      placeholder="Your tagline here"
                    />
                  </div>
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    name={`slot${slot}_image_url`}
                    defaultValue={settings?.[`scorecard_ad${slot}_image_url`] || ''}
                    style={{
                      width: '100%',
                      padding: '0.625rem',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '4px',
                      color: '#fff',
                    }}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    Link URL
                  </label>
                  <input
                    type="url"
                    name={`slot${slot}_link_url`}
                    defaultValue={settings?.[`scorecard_ad${slot}_link_url`] || ''}
                    style={{
                      width: '100%',
                      padding: '0.625rem',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '4px',
                      color: '#fff',
                    }}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            ))}
            
            <button
              type="submit"
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <i className="fas fa-save" style={{ marginRight: '0.5rem' }}></i>
              Save All Ads
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
