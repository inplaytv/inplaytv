import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/smtp';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Send launch notification to all pending waitlist entries
export async function POST(request: NextRequest) {
  console.log('[Notify All] POST request received');
  
  try {
    console.log('[Notify All] Fetching pending entries...');
    
    // Get all pending entries
    const { data: entries, error: fetchError } = await supabase
      .from('waitlist')
      .select('email')
      .eq('notified', false);

    if (fetchError) {
      console.error('[Notify All] Fetch error:', fetchError);
      throw fetchError;
    }

    console.log(`[Notify All] Found ${entries?.length || 0} pending entries`);

    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { message: 'No pending entries to notify', results: [] },
        { status: 200 }
      );
    }

    console.log('[Notify All] Looking for Launch Notification template...');

    // Get the Launch Notification template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', 'Launch Notification')
      .eq('is_active', true)
      .single();

    if (templateError) {
      console.error('[Notify All] Template error:', templateError);
      return NextResponse.json(
        { error: `Database error: ${templateError.message}` },
        { status: 500 }
      );
    }

    if (!template) {
      console.log('[Notify All] Template not found');
      return NextResponse.json(
        { error: 'Launch Notification template not found. Please run: scripts/fix-waitlist-email-templates.sql' },
        { status: 404 }
      );
    }

    console.log('[Notify All] Template found, processing entries...');

    // Send to each email
    const results = [];
    for (const entry of entries) {
      try {
        console.log(`[Notify All] Processing: ${entry.email}`);
        
        // Replace variables
        let emailContent = template.content
          .replace(/%%%website_name%%%/g, 'InPlayTV')
          .replace(/%%%email%%%/g, entry.email);

        let emailSubject = template.subject
          .replace(/%%%website_name%%%/g, 'InPlayTV');

        console.log(`[Notify All] Sending email via SMTP to: ${entry.email}`);
        
        // Send actual email via SMTP
        const emailResult = await sendEmail({
          from: {
            name: 'InPlayTV',
            address: 'admin@inplay.tv',
          },
          to: entry.email,
          subject: emailSubject,
          html: emailContent,
          replyTo: 'admin@inplay.tv',
        });

        if (!emailResult.success) {
          console.error(`[Notify All] Email failed for ${entry.email}:`, emailResult.error);
          throw new Error(emailResult.error);
        }

        console.log(`[Notify All] Email sent to ${entry.email}, storing in outbox...`);
        
        // Store in outbox (for tracking)
        await supabase.from('email_outbox').insert({
          sent_by_name: 'InPlayTV',
          sent_by_email: 'admin@inplay.tv',
          recipients: [entry.email],
          subject: emailSubject,
          content: emailContent,
          status: 'sent',
          sent_at: new Date().toISOString()
        });

        console.log(`[Notify All] Updating waitlist entry for: ${entry.email}`);
        
        // Update waitlist entry
        await supabase
          .from('waitlist')
          .update({
            notified: true,
            notified_at: new Date().toISOString()
          })
          .eq('email', entry.email);

        console.log(`[Notify All] Updating contact for: ${entry.email}`);
        
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

        console.log(`[Notify All] Successfully processed: ${entry.email}`);
        results.push({ email: entry.email, success: true });
      } catch (err) {
        console.error(`[Notify All] Error processing ${entry.email}:`, err);
        results.push({ email: entry.email, success: false, error: String(err) });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`[Notify All] Complete. ${successCount}/${entries.length} successful`);

    return NextResponse.json({
      success: true,
      message: `Sent ${successCount} of ${entries.length} notifications`,
      results
    });
  } catch (error: any) {
    console.error('[Notify All] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send notifications' },
      { status: 500 }
    );
  }
}
