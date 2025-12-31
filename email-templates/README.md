# InPlay TV Email Templates

Professional HTML email templates for the InPlay TV Fantasy Golf platform.

## Templates Included

### 1. **Modern Header Template** (`modern-header-template.html`)
- Clean, professional design with gradient header
- Prominent logo placement area
- Perfect for: Welcome emails, account notifications, general announcements

**Variables:**
- `%%%SUBJECT%%%` - Email subject
- `%%%HEADING%%%` - Main heading text
- `%%%FIRST_NAME%%%` - User's first name
- `%%%CONTENT%%%` - Main email content (HTML supported)
- `%%%CTA_TEXT%%%` - Call-to-action button text
- `%%%CTA_LINK%%%` - Call-to-action button URL

### 2. **Promotional Banner Template** (`promotional-banner-template.html`)
- Eye-catching hero banner image area
- Bold design for marketing campaigns
- Includes features/benefits section
- Perfect for: Product launches, tournament announcements, promotional offers

**Variables:**
- `%%%SUBJECT%%%` - Email subject
- `%%%HEADING%%%` - Main heading (also used in hero banner)
- `%%%FIRST_NAME%%%` - User's first name
- `%%%CONTENT%%%` - Main email content
- `%%%CTA_TEXT%%%` - Call-to-action button text
- `%%%CTA_LINK%%%` - Call-to-action button URL
- `%%%UNSUBSCRIBE_LINK%%%` - Unsubscribe page URL

**Note:** Replace the hero banner image URL with your own:
```html
<img src="YOUR_IMAGE_URL_HERE" alt="..." />
```

### 3. **Clean Minimal Template** (`clean-minimal-template.html`)
- Elegant, minimalist design
- Serif typography for sophistication
- Perfect for: Official communications, formal announcements, VIP messages

**Variables:**
- `%%%SUBJECT%%%` - Email subject
- `%%%HEADING%%%` - Main heading
- `%%%FIRST_NAME%%%` - User's first name
- `%%%LAST_NAME%%%` - User's last name
- `%%%CONTENT%%%` - Main email content
- `%%%CTA_TEXT%%%` - Call-to-action button text
- `%%%CTA_LINK%%%` - Call-to-action button URL

### 4. **Tournament Alert Template** (`tournament-alert-template.html`)
- Urgent, attention-grabbing design
- Tournament info card with structured data
- Alert badge for priority messaging
- Perfect for: Registration reminders, tee time notifications, urgent updates

**Variables:**
- `%%%SUBJECT%%%` - Email subject
- `%%%ALERT_TYPE%%%` - Type of alert (e.g., "URGENT", "REMINDER", "NOTIFICATION")
- `%%%HEADING%%%` - Main heading
- `%%%FIRST_NAME%%%` - User's first name
- `%%%TOURNAMENT_NAME%%%` - Tournament name
- `%%%TOURNAMENT_DATE%%%` - Tournament dates
- `%%%VENUE%%%` - Tournament venue/location
- `%%%CLOSING_TIME%%%` - Registration closing time
- `%%%CONTENT%%%` - Additional message content
- `%%%CTA_TEXT%%%` - Call-to-action button text
- `%%%CTA_LINK%%%` - Call-to-action button URL

## Customization Guide

### Adding Your Logo

Replace placeholder logo URLs in each template:

```html
<!-- Find this line in each template: -->
<img src="https://via.placeholder.com/..." alt="InPlay TV" />

<!-- Replace with your actual logo: -->
<img src="https://yourdomain.com/logo.png" alt="InPlay TV" />
```

**Logo Recommendations:**
- **Modern Header**: 200x60px (white logo on gradient background)
- **Promotional**: 180x50px (dark or colored logo)
- **Clean Minimal**: 160x45px (dark logo on white)
- **Tournament Alert**: 180x50px (white logo on blue background)

### Customizing Colors

Each template uses specific color schemes:

**Modern Header (Purple Gradient):**
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

**Promotional (Green/Black):**
```css
Primary: #10b981 (Emerald green)
Secondary: #000000 (Black)
```

**Clean Minimal (Black/White):**
```css
Primary: #1a1a1a (Almost black)
Background: #ffffff (White)
```

**Tournament Alert (Blue/Red):**
```css
Background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
Alert: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
```

### Adding to Database

To add these templates to your email system:

1. Copy the HTML content
2. Go to Admin → Email → Templates
3. Click "Create New Template"
4. Paste the HTML into the content field
5. Add variables list (comma-separated): `SUBJECT,HEADING,FIRST_NAME,CONTENT,CTA_TEXT,CTA_LINK`
6. Set category and activate

## Email Client Compatibility

All templates use:
- ✅ Inline CSS (required for email clients)
- ✅ Table-based layouts (best compatibility)
- ✅ Web-safe fonts with fallbacks
- ✅ Responsive design (mobile-friendly)
- ✅ No external CSS files
- ✅ Limited use of modern CSS (for older clients)

**Tested with:**
- Gmail (Web, iOS, Android)
- Outlook (Desktop, Web)
- Apple Mail (macOS, iOS)
- Yahoo Mail
- Proton Mail

## Variable System

Your email system replaces `%%%VARIABLE%%%` placeholders with actual values:

```html
<!-- In template: -->
<p>Hi %%%FIRST_NAME%%%,</p>

<!-- Becomes: -->
<p>Hi John,</p>
```

**Best Practices:**
- Always include fallback text for optional variables
- Test all variable replacements before sending
- Use `%%%CONTENT%%%` for dynamic HTML content blocks

## Tips for Success

1. **Test Before Sending**: Always send test emails to multiple email clients
2. **Mobile First**: 60%+ of emails are opened on mobile devices
3. **Keep It Short**: Long emails get truncated or ignored
4. **Clear CTAs**: One primary call-to-action per email
5. **Alt Text**: Always include alt text for images (accessibility + deliverability)
6. **Unsubscribe Links**: Required by law in many jurisdictions

## Support

For questions or custom template requests, contact the dev team or check the main documentation at `EMAIL-SMTP-SETUP-COMPLETE.md`.

---

**Created for InPlay TV Fantasy Golf Platform**  
© 2025 InPlay TV. All rights reserved.
