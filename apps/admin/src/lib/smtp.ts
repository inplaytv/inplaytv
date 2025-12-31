import nodemailer from 'nodemailer';

export interface EmailOptions {
  from?: {
    name: string;
    address: string;
  };
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

// Create SMTP transporter using Bluehost settings
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'mail.inplay.tv',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true, // true for port 465
    auth: {
      user: process.env.SMTP_USER || 'admin@inplay.tv',
      pass: process.env.SMTP_PASSWORD || '',
    },
  });
}

// Send email via SMTP (Bluehost)
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const fromAddress = options.from || {
    name: 'InPlayTV',
    address: process.env.SMTP_USER || 'admin@inplay.tv',
  };
  
  try {
    const transporter = createTransporter();

    // Send email
    const info = await transporter.sendMail({
      from: `"${fromAddress.name}" <${fromAddress.address}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo || fromAddress.address,
    });

    console.log('[SMTP] Email sent successfully:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('[SMTP] Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Test SMTP connection
export async function testSMTPConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('[SMTP] Connection verified successfully');
    return { success: true };
  } catch (error) {
    console.error('[SMTP] Connection failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
