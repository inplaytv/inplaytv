import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Send launch notification to all pending waitlist entries
export async function POST(request: NextRequest) {
  try {
    // Get all pending entries
    const { data: entries, error: fetchError } = await supabase
      .from('waitlist')
      .select('email')
      .eq('notified', false);

    if (fetchError) throw fetchError;

    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { message: 'No pending entries to notify' },
        { status: 200 }
      );
    }

    // Get the Launch Notification template
    const { data: template } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', 'Launch Notification')
      .eq('is_active', true)
      .single();

    if (!template) {
      return NextResponse.json(
        { error: 'Launch Notification template not found' },
        { status: 404 }
      );
    }

    // Send to each email
    const results = [];
    for (const entry of entries) {
      try {
        // Replace variables
        let emailContent = template.content
          .replace(/%%%website_name%%%/g, 'InPlayTV')
          .replace(/%%%email%%%/g, entry.email);

        let emailSubject = template.subject
          .replace(/%%%website_name%%%/g, 'InPlayTV');

        // Store in outbox
        await supabase.from('email_outbox').insert({
          from_name: 'InPlayTV',
          from_email: 'noreply@inplaytv.com',
          to_email: entry.email,
          subject: emailSubject,
          content: emailContent,
          template_id: template.id,
          status: 'sent',
          sent_at: new Date().toISOString()
        });

        // Update waitlist entry
        await supabase
          .from('waitlist')
          .update({
            notified: true,
            notified_at: new Date().toISOString()
          })
          .eq('email', entry.email);

        // Update contact
        await supabase
          .from('contacts')
          .upsert({
            email: entry.email,
            emails_sent: 1,
            last_contact: new Date().toISOString(),
            tags: ['waitlist', 'launch-notified']
          }, {
            onConflict: 'email'
          });

        results.push({ email: entry.email, success: true });
      } catch (err) {
        console.error(`Error notifying ${entry.email}:`, err);
        results.push({ email: entry.email, success: false });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      message: `Sent ${successCount} of ${entries.length} notifications`,
      results
    });
  } catch (error: any) {
    console.error('POST notify-all error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send notifications' },
      { status: 500 }
    );
  }
}
