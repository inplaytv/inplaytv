import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Send launch notification to single email
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
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
        { error: 'Launch Notification template not found. Please create it in Email Templates.' },
        { status: 404 }
      );
    }

    // Replace variables
    let emailContent = template.content
      .replace(/%%%website_name%%%/g, 'InPlayTV')
      .replace(/%%%email%%%/g, email);

    let emailSubject = template.subject
      .replace(/%%%website_name%%%/g, 'InPlayTV');

    // Store in outbox
    await supabase.from('email_outbox').insert({
      from_name: 'InPlayTV',
      from_email: 'noreply@inplaytv.com',
      to_email: email,
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
      .eq('email', email);

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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('POST notify error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send notification' },
      { status: 500 }
    );
  }
}
