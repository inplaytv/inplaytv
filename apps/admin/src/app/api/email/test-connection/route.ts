import { NextResponse } from 'next/server';
import { testSMTPConnection } from '@/lib/smtp';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await testSMTPConnection();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'SMTP connection verified successfully! ✅',
        details: {
          server: process.env.SMTP_HOST || 'mail.inplay.tv',
          port: process.env.SMTP_PORT || '465',
          user: process.env.SMTP_USER || 'admin@inplay.tv',
          secure: true,
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        message: 'Failed to connect to SMTP server',
        troubleshooting: [
          'Verify SMTP credentials in .env.local',
          'Check that admin@inplay.tv email exists in Bluehost',
          'Ensure password is correct',
          'Check firewall allows outbound port 465',
        ]
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Connection test failed'
    }, { status: 500 });
  }
}
