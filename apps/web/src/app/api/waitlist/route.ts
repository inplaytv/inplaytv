import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Check if waitlist table exists, if not create it
    // Store email in waitlist table
    const { data, error } = await supabase
      .from('waitlist')
      .insert([
        {
          email: email.toLowerCase().trim(),
          created_at: new Date().toISOString(),
          source: 'coming-soon-page'
        }
      ])
      .select()
      .single();

    if (error) {
      // Handle duplicate email error
      if (error.code === '23505') {
        return NextResponse.json(
          { error: "You're already on the list!" },
          { status: 400 }
        );
      }

      console.error('Waitlist error:', error);
      return NextResponse.json(
        { error: 'Failed to save email. Please try again.' },
        { status: 500 }
      );
    }

    // Send welcome email using template
    try {
      // Get the "Coming Soon Waitlist" template
      const { data: template } = await supabase
        .from('email_templates')
        .select('*')
        .eq('name', 'Coming Soon Waitlist')
        .eq('is_active', true)
        .single();

      if (template) {
        // Replace variables in template
        let emailContent = template.content
          .replace(/%%%website_name%%%/g, 'InPlayTV')
          .replace(/%%%email%%%/g, email.toLowerCase().trim());

        let emailSubject = template.subject
          .replace(/%%%website_name%%%/g, 'InPlayTV');

        // Store in outbox (for tracking)
        await supabase.from('email_outbox').insert({
          from_name: 'InPlayTV',
          from_email: 'noreply@inplaytv.com',
          to_email: email.toLowerCase().trim(),
          subject: emailSubject,
          content: emailContent,
          template_id: template.id,
          status: 'sent', // In production, integrate with actual email service
          sent_at: new Date().toISOString()
        });

        // Add to contacts
        await supabase.from('contacts').upsert({
          email: email.toLowerCase().trim(),
          tags: ['waitlist', 'coming-soon'],
          status: 'active',
          forms_submitted: 1,
          emails_sent: 1,
          last_contact: new Date().toISOString()
        }, {
          onConflict: 'email',
          ignoreDuplicates: false
        });
      }
    } catch (emailError) {
      // Don't fail the waitlist signup if email fails
      console.error('Email send error:', emailError);
    }

    return NextResponse.json(
      { 
        success: true,
        message: 'Successfully added to waitlist',
        data 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Waitlist API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
