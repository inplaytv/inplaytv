import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/smtp';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Send launch notification to single email
export async function POST(request: NextRequest) {
  console.log('[Waitlist Notify] POST request received');
  
  try {
    const body = await request.json();
    console.log('[Waitlist Notify] Request body:', body);
    
    const { email } = body;

    if (!email) {
      console.log('[Waitlist Notify] No email provided');
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('[Waitlist Notify] Looking for Launch Notification template...');
    
    // Get the Launch Notification template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', 'Launch Notification')
      .eq('is_active', true)
      .single();

    if (templateError) {
      console.error('[Waitlist Notify] Template query error:', templateError);
      return NextResponse.json(
        { error: `Database error: ${templateError.message}` },
        { status: 500 }
      );
    }

    if (!template) {
      console.log('[Waitlist Notify] Template not found');
      return NextResponse.json(
        { error: 'Launch Notification template not found. Please run: scripts/fix-waitlist-email-templates.sql' },
        { status: 404 }
      );
    }

    console.log('[Waitlist Notify] Template found:', template.name);

    // Replace variables
    const emailContent = template.content
      .replace(/%%%website_name%%%/g, 'InPlayTV')
      .replace(/%%%email%%%/g, email);

    const emailSubject = template.subject
      .replace(/%%%website_name%%%/g, 'InPlayTV');

    console.log('[Waitlist Notify] Sending email via SMTP...');

    // Send actual email via SMTP
    const emailResult = await sendEmail({
      from: {
        name: 'InPlayTV',
        address: 'admin@inplay.tv',
      },
      to: email,
      subject: emailSubject,
      html: emailContent,
      replyTo: 'admin@inplay.tv',
    });

    if (!emailResult.success) {
      console.error('[Waitlist Notify] Email sending failed:', emailResult.error);
      return NextResponse.json(
        { error: `Failed to send email: ${emailResult.error}` },
        { status: 500 }
      );
    }

    console.log('[Waitlist Notify] Email sent successfully:', emailResult.messageId);
    console.log('[Waitlist Notify] Storing in outbox...');

    // Store in outbox (for tracking)
    await supabase.from('email_outbox').insert({
      sent_by_name: 'InPlayTV',
      sent_by_email: 'admin@inplay.tv',
      recipients: [email],
      subject: emailSubject,
      content: emailContent,
      status: 'sent',
      sent_at: new Date().toISOString()
    });

    console.log('[Waitlist Notify] Updating waitlist entry...');

    // Update waitlist entry
    await supabase
      .from('waitlist')
      .update({
        notified: true,
        notified_at: new Date().toISOString()
      })
      .eq('email', email);

    console.log('[Waitlist Notify] Updating contact...');

    // Update contact - get current count and increment
    const { data: contactData } = await supabase
      .from('contacts')
      .select('emails_sent')
      .eq('email', email)
      .single();
    
    if (contactData) {
      await supabase
        .from('contacts')
        .update({
          emails_sent: (contactData.emails_sent || 0) + 1,
          last_contact: new Date().toISOString()
        })
        .eq('email', email);
    }

    console.log('[Waitlist Notify] Success! Returning response...');

    return NextResponse.json({ 
      success: true,
      message: 'Notification sent successfully'
    });
  } catch (error: any) {
    console.error('[Waitlist Notify] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send notification' },
      { status: 500 }
    );
  }
}
