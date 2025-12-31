import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/smtp';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Send email via compose form
export async function POST(request: NextRequest) {
  console.log('[Email Send] POST request received');
  
  try {
    const body = await request.json();
    console.log('[Email Send] Request body:', {
      from: body.from_email,
      recipients: body.recipients,
      subject: body.subject
    });
    
    const {
      from_name,
      from_email,
      reply_to,
      recipients,
      subject,
      content,
      template_id
    } = body;

    // Validate required fields
    if (!from_email || !recipients || recipients.length === 0 || !subject || !content) {
      console.log('[Email Send] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('[Email Send] Sending emails via SMTP...');

    // Send actual emails via SMTP
    const sendResults = [];
    for (const recipient of recipients) {
      try {
        const emailResult = await sendEmail({
          from: {
            name: from_name || 'InPlayTV',
            address: from_email,
          },
          to: recipient,
          subject: subject,
          html: content,
          replyTo: reply_to || from_email,
        });

        if (!emailResult.success) {
          console.error(`[Email Send] Failed to send to ${recipient}:`, emailResult.error);
          sendResults.push({ recipient, success: false, error: emailResult.error });
        } else {
          console.log(`[Email Send] Successfully sent to ${recipient}`);
          sendResults.push({ recipient, success: true, messageId: emailResult.messageId });
        }
      } catch (error) {
        console.error(`[Email Send] Exception sending to ${recipient}:`, error);
        sendResults.push({ recipient, success: false, error: String(error) });
      }
    }

    const successCount = sendResults.filter(r => r.success).length;
    console.log(`[Email Send] Sent ${successCount}/${recipients.length} emails successfully`);

    console.log('[Email Send] Storing in outbox...');

    // Store in outbox for each recipient (tracking only)
    const outboxInserts = recipients.map((recipient: string) => ({
      sent_by_name: from_name,
      sent_by_email: from_email,
      recipients: [recipient],
      subject: subject,
      content: content,
      status: 'sent',
      sent_at: new Date().toISOString()
    }));

    const { error: outboxError } = await supabase
      .from('email_outbox')
      .insert(outboxInserts);

    if (outboxError) {
      console.error('[Email Send] Outbox error:', outboxError);
      return NextResponse.json(
        { error: `Failed to store email: ${outboxError.message}` },
        { status: 500 }
      );
    }

    console.log('[Email Send] Updating contacts...');

    // Update contacts
    for (const recipient of recipients) {
      const { data: contactData } = await supabase
        .from('contacts')
        .select('emails_sent')
        .eq('email', recipient)
        .single();

      if (contactData) {
        await supabase
          .from('contacts')
          .update({
            emails_sent: (contactData.emails_sent || 0) + 1,
            last_contact: new Date().toISOString()
          })
          .eq('email', recipient);
      } else {
        // Create new contact if doesn't exist
        await supabase
          .from('contacts')
          .insert({
            email: recipient,
            emails_sent: 1,
            last_contact: new Date().toISOString(),
            tags: ['email-sent']
          });
      }
    }

    console.log('[Email Send] Success! Email(s) sent to:', recipients.length, 'recipient(s)');

    return NextResponse.json({
      success: true,
      message: `Email sent to ${recipients.length} recipient(s)`,
      sent_count: recipients.length
    });
  } catch (error: any) {
    console.error('[Email Send] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
