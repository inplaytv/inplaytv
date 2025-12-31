import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/smtp';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { to } = await request.json();

    if (!to) {
      return NextResponse.json({
        success: false,
        error: 'Recipient email address is required'
      }, { status: 400 });
    }

    // Send test email
    const result = await sendEmail({
      to,
      subject: 'InPlayTV Email Test - Success! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .success-badge {
              background: #10b981;
              color: white;
              padding: 10px 20px;
              border-radius: 20px;
              display: inline-block;
              font-weight: 600;
              margin: 20px 0;
            }
            .info-box {
              background: white;
              border-left: 4px solid #667eea;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✅ Email Test Successful!</h1>
          </div>
          <div class="content">
            <div class="success-badge">
              🎉 Your email system is working!
            </div>
            
            <h2>What does this mean?</h2>
            <p>If you're reading this email, it means:</p>
            <ul>
              <li>✅ Your Bluehost SMTP server connection is working</li>
              <li>✅ Your DNS records are properly configured</li>
              <li>✅ Emails can be sent from admin@inplay.tv</li>
              <li>✅ Your email system is ready for production use</li>
            </ul>

            <div class="info-box">
              <strong>📧 Email Configuration:</strong>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>Server: mail.inplay.tv</li>
                <li>Port: 465 (SSL)</li>
                <li>From: admin@inplay.tv</li>
                <li>Provider: Bluehost</li>
              </ul>
            </div>

            <h3>Next Steps:</h3>
            <ol>
              <li>Send a few more test emails to different providers (Gmail, Yahoo, Outlook)</li>
              <li>Check if they land in inbox or spam folder</li>
              <li>If in spam, verify SPF, DKIM, and DMARC records in Vercel</li>
              <li>Start using the email system for your InPlayTV platform!</li>
            </ol>

            <div class="info-box" style="border-left-color: #10b981;">
              <strong>💡 Pro Tip:</strong> Send emails from your custom domain (admin@inplay.tv) 
              to improve deliverability and avoid spam filters.
            </div>
          </div>
          <div class="footer">
            <p>Sent from InPlayTV Admin Panel</p>
            <p>Powered by Bluehost SMTP • <a href="https://inplay.tv">inplay.tv</a></p>
          </div>
        </body>
        </html>
      `
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${to}! Check your inbox (and spam folder).`,
        messageId: result.messageId,
        tip: 'If the email doesn\'t arrive within a few minutes, check your spam folder and verify DNS records.'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        message: 'Failed to send test email',
        troubleshooting: [
          'Verify SMTP connection test passes first',
          'Check recipient email address is valid',
          'Review server logs for detailed error messages',
        ]
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to send test email'
    }, { status: 500 });
  }
}
