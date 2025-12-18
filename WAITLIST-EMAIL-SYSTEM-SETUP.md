# Coming Soon Waitlist Email System Setup

## ✅ What's Been Created

### 1. Email Templates (SQL)
**File:** `scripts/add-waitlist-email-templates.sql`

Two new email templates:
- **Coming Soon Waitlist** - Auto-sent when someone joins waitlist
- **Launch Notification** - Sent when you're ready to launch

### 2. Waitlist Management Page
**Location:** `http://localhost:3002/waitlist`

Features:
- View all waitlist entries
- See stats (Total, Notified, Pending)
- Search and filter entries
- Send launch notifications (individual or bulk)
- Export to CSV
- Delete entries
- Direct link to email individual contacts

### 3. Updated Waitlist API
**File:** `apps/web/src/app/api/waitlist/route.ts`

Now automatically:
- Sends welcome email using template
- Adds to contacts table with tags
- Tracks in email outbox

### 4. Admin API Routes Created
- `GET  /api/waitlist` - Fetch all entries
- `POST /api/waitlist/notify` - Send launch email to one person
- `POST /api/waitlist/notify-all` - Send launch email to everyone
- `DELETE /api/waitlist/[id]` - Remove entry

## 🚀 Setup Instructions

### Step 1: Run the SQL Script
```bash
# In Supabase SQL Editor, run:
scripts/add-waitlist-email-templates.sql
```

Or via psql:
```bash
psql -h your-db-host -U postgres -d postgres -f scripts/add-waitlist-email-templates.sql
```

### Step 2: Access the Waitlist Manager
Navigate to: **http://localhost:3002/waitlist**

### Step 3: Customize Email Templates (Optional)
Go to **http://localhost:3002/email/templates** and edit:
- "Coming Soon Waitlist" - Welcome message
- "Launch Notification" - Launch announcement

## 📧 How It Works

### When Someone Joins Waitlist:
1. Email saved to `waitlist` table
2. Welcome email auto-sent using "Coming Soon Waitlist" template
3. Added to `contacts` with tags: `['waitlist', 'coming-soon']`
4. Email logged in `email_outbox` for tracking

### When You Launch:
1. Go to `/waitlist` in admin
2. Click "Notify All" button
3. Launch notification sent to all pending entries
4. Each entry marked as `notified`
5. Emails logged in outbox
6. Contacts updated with tag: `launch-notified`

## 🎨 Template Variables

Both templates support:
- `%%%website_name%%%` - Replaced with "InPlayTV"
- `%%%email%%%` - Replaced with subscriber's email

Edit templates to add more content or change messaging!

## 📊 Waitlist Management Features

### Stats Dashboard
- Total signups
- Already notified count
- Pending notification count

### Filters
- Search by email
- Filter by notification status (All/Pending/Notified)

### Actions Per Entry
- **Notify** - Send launch email to this person
- **Email** - Opens compose with their email pre-filled
- **Delete** - Remove from waitlist

### Bulk Actions
- **Export CSV** - Download all entries
- **Notify All** - Send launch email to all pending

## 🔄 Integration with Existing Email System

The waitlist system integrates seamlessly with your email templates:

1. **Templates** - Managed in `/email/templates`
2. **Outbox** - All sent emails tracked in `/email/outbox`
3. **Contacts** - Subscribers added to `/email/contacts`
4. **Compose** - Direct link to email individuals

## 🎯 Next Steps

1. Run the SQL script to add templates
2. Test the welcome email by joining waitlist
3. Customize templates to match your brand
4. When ready to launch, use "Notify All" button

## 💡 Pro Tips

**Test the welcome email:**
```
Visit: http://localhost:3000/coming-soon
Enter your test email
Check `/email/outbox` to see the sent email
```

**Preview templates before launch:**
Visit `/email/templates` and click on "Launch Notification" to review content

**Export before notifying:**
Use "Export CSV" to backup your list before sending launch emails

**Track deliverability:**
Check `/email/outbox` for sent email status and activity

## 🔗 Quick Links

- Waitlist Manager: http://localhost:3002/waitlist
- Email Templates: http://localhost:3002/email/templates
- Email Outbox: http://localhost:3002/email/outbox
- Contacts: http://localhost:3002/email/contacts
- Coming Soon Page: http://localhost:3000/coming-soon

---

🎉 Your coming soon waitlist email system is ready!
