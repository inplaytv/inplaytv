# Waitlist Email System - Troubleshooting & Image Guide

## 🐛 Common Error: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

### What This Means
The API endpoint is returning **HTML** instead of **JSON**. This usually happens when:

1. **Missing Email Template** - The required template doesn't exist in the database
2. **Server Error** - Something crashed and returned an error page
3. **Route Not Found** - The API endpoint doesn't exist (404 page)
4. **Auth/Middleware Issue** - Redirected to login page

### Fix Steps

#### 1. Check Email Templates Exist
Navigate to: http://localhost:3002/email/templates

You MUST have these two templates:
- **"Coming Soon Waitlist"** - Auto-sent when someone joins
- **"Launch Notification"** - Sent from waitlist manager

**If missing**, run this SQL in Supabase SQL Editor:
```sql
-- Add waitlist email templates
INSERT INTO email_templates (name, subject, content, category, is_active)
VALUES 
  (
    'Coming Soon Waitlist',
    'Thanks for joining the InPlayTV waitlist! 🎉',
    '<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #667eea;">Welcome to InPlayTV!</h1>
  <p>Hi there,</p>
  <p>Thanks for joining our waitlist at <strong>%%%website_name%%%</strong>! We''re excited to have you.</p>
  <p>You''ll be among the first to know when we launch. Stay tuned!</p>
  <hr style="border: 1px solid #eee; margin: 30px 0;">
  <p style="color: #888; font-size: 12px;">
    You''re receiving this because you signed up at %%%website_name%%%<br>
    Email: %%%email%%%
  </p>
</body>
</html>',
    'waitlist',
    true
  ),
  (
    'Launch Notification',
    'InPlayTV is now LIVE! 🚀',
    '<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #667eea;">We''re LIVE! 🎉</h1>
  <p>Hi %%%email%%%,</p>
  <p>Great news! <strong>%%%website_name%%%</strong> is now officially live!</p>
  <p>As a waitlist member, you''re one of the first to get access.</p>
  <p style="text-align: center; margin: 30px 0;">
    <a href="https://inplaytv.com" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
      Launch InPlayTV →
    </a>
  </p>
  <p>Thanks for your patience!</p>
  <hr style="border: 1px solid #eee; margin: 30px 0;">
  <p style="color: #888; font-size: 12px;">
    You received this because you joined our waitlist at %%%website_name%%%
  </p>
</body>
</html>',
    'waitlist',
    true
  )
ON CONFLICT (name) DO NOTHING;
```

#### 2. Check API Routes
Make sure these files exist in `apps/admin/src/app/api/waitlist/`:
- ✅ `route.ts` (GET /api/waitlist)
- ✅ `notify/route.ts` (POST /api/waitlist/notify)
- ✅ `notify-all/route.ts` (POST /api/waitlist/notify-all)
- ✅ `[id]/route.ts` (DELETE /api/waitlist/[id])

#### 3. Check Environment Variables
In `apps/admin/.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

#### 4. Check Browser Console
Open Developer Tools (F12) → Console tab
Look for the actual error message and URL being called

#### 5. Test API Directly
Open this in your browser:
```
http://localhost:3002/api/waitlist
```

Should return JSON like:
```json
{
  "entries": [...]
}
```

If you see HTML, the route isn't working.

---

## 🖼️ Adding Images & Logos to Email Templates

### Method 1: Hosted Images (Recommended)
Use publicly accessible image URLs:

```html
<img 
  src="https://yourdomain.com/logo.png" 
  alt="InPlayTV Logo" 
  style="width: 200px; height: auto;"
/>
```

**Where to host images:**
- Your website's public folder (`/public/images/logo.png`)
- Supabase Storage (create public bucket)
- CDN service (Cloudinary, ImgBB, etc.)
- Email-specific services (SendGrid, Mailgun image hosting)

### Method 2: Supabase Storage

1. **Create Public Bucket**
   - Go to Supabase Dashboard → Storage
   - Create new bucket: `email-assets`
   - Set to **Public**

2. **Upload Images**
   - Upload logo.png, banner.jpg, etc.
   - Get public URL: `https://[project].supabase.co/storage/v1/object/public/email-assets/logo.png`

3. **Use in Templates**
   ```html
   <img src="https://[project].supabase.co/storage/v1/object/public/email-assets/logo.png" 
        alt="Logo" 
        style="width: 150px;" />
   ```

### Method 3: Base64 Embedded (Not Recommended)
Convert image to base64 and embed directly:

```html
<img src="data:image/png;base64,iVBORw0KG..." alt="Logo" />
```

**Pros:** No external hosting needed
**Cons:** 
- Makes email MUCH larger
- Can trigger spam filters
- Poor mobile performance

### Professional Email Template Example

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          
          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding: 40px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <img 
                src="https://yourdomain.com/logo-white.png" 
                alt="InPlayTV Logo" 
                style="width: 180px; height: auto; display: block;"
              />
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h1 style="margin: 0 0 20px; color: #333; font-size: 28px;">
                Welcome to InPlayTV! 🎉
              </h1>
              <p style="margin: 0 0 15px; color: #555; font-size: 16px; line-height: 1.6;">
                Hi %%%email%%%,
              </p>
              <p style="margin: 0 0 15px; color: #555; font-size: 16px; line-height: 1.6;">
                Thanks for joining our waitlist! You'll be among the first to experience the future of fantasy golf.
              </p>
              
              <!-- Banner Image -->
              <img 
                src="https://yourdomain.com/email-banner.jpg" 
                alt="Golf Tournament" 
                style="width: 100%; height: auto; border-radius: 8px; margin: 20px 0;"
              />
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://inplaytv.com" 
                       style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      Visit InPlayTV →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 15px; color: #555; font-size: 16px; line-height: 1.6;">
                Stay tuned for updates!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f8f8f8; text-align: center;">
              <!-- Social Icons -->
              <div style="margin-bottom: 15px;">
                <a href="https://twitter.com/inplaytv" style="text-decoration: none; margin: 0 10px;">
                  <img src="https://yourdomain.com/twitter-icon.png" alt="Twitter" style="width: 24px; height: 24px;" />
                </a>
                <a href="https://facebook.com/inplaytv" style="text-decoration: none; margin: 0 10px;">
                  <img src="https://yourdomain.com/facebook-icon.png" alt="Facebook" style="width: 24px; height: 24px;" />
                </a>
              </div>
              
              <p style="margin: 0; color: #888; font-size: 12px; line-height: 1.5;">
                © 2025 InPlayTV. All rights reserved.<br>
                You're receiving this because you joined our waitlist.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### Email Template Best Practices

1. **Use Tables for Layout** - Not divs (better email client support)
2. **Inline CSS** - Email clients strip `<style>` tags
3. **600px Max Width** - Optimal for most email clients
4. **Alt Text** - Always include for images
5. **Test Everywhere** - Gmail, Outlook, Apple Mail, Mobile
6. **Responsive Images** - Use `width: 100%; height: auto;`
7. **Fallback Text** - In case images don't load

### Template Variables You Can Use

- `%%%website_name%%%` - Replaced with "InPlayTV"
- `%%%email%%%` - Recipient's email address
- `%%%first_name%%%` - (If you add to contacts table)
- `%%%last_name%%%` - (If you add to contacts table)

### Creating Template in Admin Panel

1. Go to http://localhost:3002/email/templates
2. Click "Create Template"
3. Fill in:
   - **Name:** "My Custom Template"
   - **Category:** Choose category
   - **Subject:** Email subject line
   - **Content:** Paste HTML (with images)
4. Click "Create Template"
5. Test by sending to yourself

---

## 🧪 Testing Email Templates

### Test Single Email
```typescript
// In admin panel or via API
fetch('/api/waitlist/notify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'your-test@email.com' })
});
```

### Test in Browser
1. Create template with images
2. Go to http://localhost:3002/email/templates
3. Click "Preview" on your template
4. Check if images load

### Common Image Issues

❌ **Images not loading:**
- Check URL is publicly accessible
- No authentication required
- HTTPS (not HTTP)
- CORS headers allowed

❌ **Broken in Gmail:**
- Gmail caches images
- Use Gmail's "View Original" to see raw HTML
- Check image dimensions aren't too large

---

## 📧 When Emails Actually Send

**Current Setup:** Emails are **tracked but not actually sent**

The system currently:
✅ Stores email in `email_outbox` table
✅ Marks status as 'sent'
✅ Tracks in contacts
❌ Does NOT send real emails

**To Send Real Emails:**

You need to integrate an email service:

### Option 1: Resend (Recommended - Simple)
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'InPlayTV <noreply@inplaytv.com>',
  to: email,
  subject: emailSubject,
  html: emailContent,
});
```

### Option 2: SendGrid
```typescript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
  to: email,
  from: 'noreply@inplaytv.com',
  subject: emailSubject,
  html: emailContent,
});
```

### Option 3: AWS SES
Cheapest for high volume, more setup required.

---

## ✅ Quick Fix Checklist

1. ✓ Run SQL to add email templates
2. ✓ Check templates exist in admin panel
3. ✓ Verify API routes exist
4. ✓ Check environment variables
5. ✓ Test API endpoints directly
6. ✓ Check browser console for errors
7. ✓ Host images publicly (Supabase Storage or your domain)
8. ✓ Use inline CSS in email HTML
9. ✓ Test email on your own email first

---

## 🆘 Still Having Issues?

Check the browser console (F12) and share:
1. The exact error message
2. The URL being called
3. The response (Network tab)

This will help identify the exact problem!
