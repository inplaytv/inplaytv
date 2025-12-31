-- Fix Waitlist Email Templates
-- Run this in Supabase SQL Editor if you're getting "template not found" errors

-- First, check if templates exist
SELECT name, is_active FROM email_templates WHERE name IN ('Coming Soon Waitlist', 'Launch Notification');

-- Add or update the waitlist email templates
INSERT INTO email_templates (name, subject, content, category, is_active)
VALUES 
  (
    'Coming Soon Waitlist',
    'Thanks for joining the InPlayTV waitlist! 🎉',
    '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                ⛳ InPlayTV
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #333; font-size: 24px;">
                Welcome to the Waitlist! 🎉
              </h2>
              <p style="margin: 0 0 15px; color: #555; font-size: 16px; line-height: 1.6;">
                Hi there,
              </p>
              <p style="margin: 0 0 15px; color: #555; font-size: 16px; line-height: 1.6;">
                Thanks for joining our waitlist at <strong>%%%website_name%%%</strong>! We are excited to have you on board.
              </p>
              <p style="margin: 0 0 15px; color: #555; font-size: 16px; line-height: 1.6;">
                You will be among the first to know when we launch. Stay tuned for updates!
              </p>
              
              <div style="margin: 30px 0; padding: 20px; background-color: #f8f8f8; border-left: 4px solid #667eea; border-radius: 4px;">
                <p style="margin: 0; color: #666; font-size: 14px;">
                  <strong>💡 What to expect:</strong><br>
                  • Early access notification<br>
                  • Exclusive launch offers<br>
                  • Premium fantasy golf experience
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f8f8f8; text-align: center;">
              <p style="margin: 0 0 10px; color: #888; font-size: 12px; line-height: 1.5;">
                © 2025 InPlayTV. All rights reserved.
              </p>
              <p style="margin: 0; color: #888; font-size: 12px; line-height: 1.5;">
                You are receiving this because you signed up at %%%website_name%%%<br>
                Email: <span style="color: #667eea;">%%%email%%%</span>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
    'waitlist',
    true
  ),
  (
    'Launch Notification',
    'InPlayTV is now LIVE! 🚀',
    '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <div style="font-size: 48px; margin-bottom: 10px;">🚀</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                We are LIVE!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #333; font-size: 24px;">
                Great News! 🎉
              </h2>
              <p style="margin: 0 0 15px; color: #555; font-size: 16px; line-height: 1.6;">
                Hi <strong>%%%email%%%</strong>,
              </p>
              <p style="margin: 0 0 15px; color: #555; font-size: 16px; line-height: 1.6;">
                <strong>%%%website_name%%%</strong> is now officially live and ready for you!
              </p>
              <p style="margin: 0 0 15px; color: #555; font-size: 16px; line-height: 1.6;">
                As a waitlist member, you are one of the first to get access to our premium fantasy golf platform.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://inplaytv.com" 
                       style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);">
                      Launch InPlayTV →
                    </a>
                  </td>
                </tr>
              </table>
              
              <div style="margin: 30px 0; padding: 20px; background-color: #f0f7ff; border-left: 4px solid #667eea; border-radius: 4px;">
                <p style="margin: 0 0 10px; color: #333; font-size: 16px; font-weight: bold;">
                  🎁 Launch Special
                </p>
                <p style="margin: 0; color: #666; font-size: 14px;">
                  Join now and get exclusive early-bird benefits!
                </p>
              </div>
              
              <p style="margin: 0 0 15px; color: #555; font-size: 16px; line-height: 1.6;">
                Thanks for your patience and support!
              </p>
              <p style="margin: 0; color: #555; font-size: 16px; line-height: 1.6;">
                The InPlayTV Team
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f8f8f8; text-align: center;">
              <p style="margin: 0 0 10px; color: #888; font-size: 12px; line-height: 1.5;">
                © 2025 InPlayTV. All rights reserved.
              </p>
              <p style="margin: 0; color: #888; font-size: 12px; line-height: 1.5;">
                You received this because you joined our waitlist at %%%website_name%%%
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
    'waitlist',
    true
  )
ON CONFLICT (name) 
DO UPDATE SET 
  subject = EXCLUDED.subject,
  content = EXCLUDED.content,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Verify templates were created
SELECT name, subject, is_active, created_at 
FROM email_templates 
WHERE name IN ('Coming Soon Waitlist', 'Launch Notification');
