# Email Management System - Complete Setup Guide

## ✅ Overview

Complete email management system for the admin panel with:
- **Forms Inbox**: View form submissions with internal notes
- **Email Outbox**: Track sent emails with delivery status
- **Compose Email**: Send emails with template support
- **Templates**: Manage pre-made email templates
- **Contacts**: Track contact list with form/email history

## 📁 Files Created

### Database Schema
1. **`scripts/setup-email-system.sql`** (180 lines)
   - 5 tables: `email_templates`, `email_outbox`, `email_inbox`, `contacts`, `email_activity`
   - RLS policies for admin-only access
   - Indexes for performance
   - 4 default templates included

2. **`scripts/setup-admin-invitations.sql`**
   - `admin_invitations` table for tracking invites
   - Token generation function
   - Cleanup function for expired invitations

### Admin Pages
3. **`apps/admin/src/app/email/inbox/page.tsx`** (370 lines)
   - View form submissions
   - Filter by status (unread/read/replied)
   - Internal notes system
   - Reply button routes to compose
   - Mark as read functionality

4. **`apps/admin/src/app/email/outbox/page.tsx`** (380 lines)
   - Sent emails tracking
   - Status filtering (sent/delivered/bounced)
   - Date picker and keyword search
   - Activity tracking (delivered, opened, bounced)
   - Email preview modal
   - Hard bounce warnings

5. **`apps/admin/src/app/email/compose/page.tsx`** (420 lines)
   - Template selector dropdown
   - Multiple recipients (max 5)
   - From name/email configuration
   - Reply-to option
   - Subject and content fields
   - Character counter
   - Email preview
   - Send functionality

6. **`apps/admin/src/app/email/templates/page.tsx`** (540 lines)
   - Grid view of all templates
   - Add/Edit/Delete/Duplicate templates
   - Category and search filtering
   - Variable management (%%%variable%%%)
   - Active/Inactive toggle
   - Template preview

7. **`apps/admin/src/app/email/contacts/page.tsx`** (600 lines)
   - Contact list with full details
   - Status tracking (active/bounced/unsubscribed)
   - Tags system
   - Forms submitted count
   - Emails sent count
   - Last contact date
   - Search/filter by status/tags
   - Stats dashboard

### Navigation
8. **Updated `apps/admin/src/components/Sidebar.tsx`**
   - Added "Email" section with 5 menu items

## 🗄️ Database Structure

### email_templates
- Template management with variable substitution
- Categories for organization
- Active/inactive status
- Variables array (e.g., `['%%%email%%%', '%%%website_name%%%']`)

### email_outbox
- All sent emails tracking
- Status: `sent`, `delivered`, `bounced`
- Recipient tracking
- Sent timestamp

### email_inbox
- Form submissions
- Status: `unread`, `read`, `replied`
- Internal notes field
- Sender IP tracking

### contacts
- Contact information (email, name, phone, company)
- Status tracking
- Tags array
- Forms submitted count
- Emails sent count
- Last contact timestamp

### email_activity
- Delivery tracking
- Opens tracking
- Click tracking
- Bounce tracking
- Event timestamps

### admin_invitations
- Token-based invitation system
- Expiration tracking (7 days)
- Acceptance status

## 🚀 Setup Instructions

### Step 1: Run Database Setup
```sql
-- In Supabase SQL Editor:
-- 1. Copy contents of scripts/setup-email-system.sql
-- 2. Execute the query
-- 3. Expected: "✅ Email management system created successfully!"
```

### Step 2: Run Admin Invitations Setup (Optional)
```sql
-- In Supabase SQL Editor:
-- 1. Copy contents of scripts/setup-admin-invitations.sql
-- 2. Execute the query
-- 3. Expected: "✅ Admin invitations system created successfully!"
```

### Step 3: Test Navigation
- Restart dev server: `pnpm --filter admin dev`
- Login to admin panel
- Check sidebar for "Email" section
- Click each menu item to verify pages load

### Step 4: Verify Default Templates
After running SQL, you should have 4 default templates:
1. **Admin Invitation** - Send to new admins
2. **Account Activated** - Notify users of activation
3. **Welcome Email** - First-time user welcome
4. **Contact Form Confirmation** - Auto-reply to form submissions

## 📋 Next Steps: API Implementation

### Required API Endpoints

#### Inbox APIs
```typescript
GET  /api/email/inbox              // Fetch all inbox messages
PUT  /api/email/inbox/[id]/note    // Save internal note
PUT  /api/email/inbox/[id]/status  // Update status (read/replied)
```

#### Outbox APIs
```typescript
GET  /api/email/outbox             // Fetch sent emails with filtering
GET  /api/email/outbox/[id]        // Get single email details
```

#### Compose/Send APIs
```typescript
POST /api/email/send               // Send email with template support
                                   // Body: { from_name, from_email, reply_to, recipients, subject, content, template_id }
```

#### Templates APIs
```typescript
GET    /api/email/templates           // Fetch all templates
POST   /api/email/templates           // Create new template
PUT    /api/email/templates/[id]      // Update template
DELETE /api/email/templates/[id]      // Delete template
```

#### Contacts APIs
```typescript
GET    /api/email/contacts            // Fetch all contacts
POST   /api/email/contacts            // Create new contact
PUT    /api/email/contacts/[id]       // Update contact
DELETE /api/email/contacts/[id]       // Delete contact
```

## 🎨 Features Implemented

### Inbox
- ✅ View all form submissions
- ✅ Filter by status (unread/read/replied)
- ✅ Internal notes with save functionality
- ✅ Mark as read
- ✅ Reply button (routes to compose with pre-filled recipient)
- ✅ IP address tracking
- ✅ Timestamp display

### Outbox
- ✅ View all sent emails
- ✅ Status filtering (all/sent/delivered/bounced)
- ✅ Date picker for filtering
- ✅ Keyword search (recipients/subject)
- ✅ Activity tracking display
- ✅ Email preview modal
- ✅ Hard bounce warnings
- ✅ Status badges with color coding

### Compose
- ✅ Template selector dropdown
- ✅ Multiple recipient input (max 5)
- ✅ From name and email customization
- ✅ Reply-to address option
- ✅ Subject and content fields
- ✅ Character counter
- ✅ Email preview
- ✅ Send button with validation
- ✅ Success/error alerts

### Templates
- ✅ Grid view of all templates
- ✅ Add/Edit/Delete/Duplicate functionality
- ✅ Category system
- ✅ Search filtering
- ✅ Category filtering
- ✅ Variable management
- ✅ Active/Inactive toggle
- ✅ Template preview

### Contacts
- ✅ Full contact list with table view
- ✅ Status tracking (active/bounced/unsubscribed)
- ✅ Tags system
- ✅ Forms submitted counter
- ✅ Emails sent counter
- ✅ Last contact date
- ✅ Search by name/email
- ✅ Filter by status
- ✅ Filter by tags
- ✅ Stats dashboard (total/active/bounced)
- ✅ Add/Edit/Delete contacts

## 🔧 Technical Details

### Variable Substitution System
Templates support variable replacement using `%%%variable_name%%%` syntax:
- `%%%website_name%%%` - Your site name
- `%%%email%%%` - User's email
- `%%%name%%%` - User's name
- `%%%activation_link%%%` - Account activation URL
- `%%%invitation_link%%%` - Admin invitation URL
- `%%%admin_email%%%` - Admin contact email

### Status Flow
**Inbox**: `unread` → `read` → `replied`
**Outbox**: `sent` → `delivered` → (tracked opens/clicks)
**Outbox (bounces)**: `sent` → `bounced` (with reason)
**Contacts**: `active` / `bounced` / `unsubscribed`

### Security
- All tables have RLS policies
- Admin-only access enforced
- User ID automatically set from auth context
- No public access to email data

## 🎯 Integration Points

### Admin Invitation Flow
1. Super admin adds new admin in `/settings/admins`
2. System calls `/api/admins/add`
3. API generates invitation token
4. Stores in `admin_invitations` table
5. Sends email using "Admin Invitation" template
6. New admin clicks link to accept
7. System marks invitation as accepted
8. Sends "Account Activated" email

### Contact Form Submissions
1. User submits form on website
2. Form data stored in `email_inbox`
3. Auto-reply sent using "Contact Form Confirmation" template
4. Contact added/updated in `contacts` table
5. `forms_submitted` counter incremented
6. Admin views in Inbox and can reply

### Email Tracking
1. Email sent via `/api/email/send`
2. Stored in `email_outbox` with status `sent`
3. Email service provider webhooks update status
4. Activity recorded in `email_activity` table
5. Outbox displays real-time delivery status
6. Bounce events update contact status

## 📊 Default Templates

### 1. Admin Invitation
**Category**: Admin  
**Subject**: You're invited to join %%%website_name%%% as an administrator  
**Variables**: `website_name`, `email`, `invitation_link`

### 2. Account Activated
**Category**: Admin  
**Subject**: Your administrator account has been activated  
**Variables**: `website_name`, `email`, `name`, `admin_email`

### 3. Welcome Email
**Category**: User  
**Subject**: Welcome to %%%website_name%%%!  
**Variables**: `website_name`, `name`

### 4. Contact Form Confirmation
**Category**: User  
**Subject**: We received your message  
**Variables**: `website_name`, `name`

## 🐛 Troubleshooting

### Pages Not Loading
- Verify all files created in correct locations
- Check for TypeScript errors: `pnpm --filter admin build`
- Restart dev server

### Database Errors
- Ensure SQL scripts ran successfully
- Check Supabase logs for RLS errors
- Verify admin user has correct permissions

### Missing Templates
- Re-run `scripts/setup-email-system.sql`
- Check `email_templates` table in Supabase

### Sidebar Not Updated
- Clear browser cache
- Check `Sidebar.tsx` for Email section
- Verify no import errors

## 📝 TODO

### Critical (Required for functionality)
- [ ] Create all API endpoints listed above
- [ ] Integrate email service (Resend/SendGrid)
- [ ] Add email sending utility function
- [ ] Implement webhook handlers for delivery tracking
- [ ] Connect admin invitation system to email sending
- [ ] Add variable replacement logic
- [ ] Create contact form submission handler

### Enhancement (Optional)
- [ ] Rich text editor for email content
- [ ] Email templates with HTML support
- [ ] Draft save functionality
- [ ] Scheduled email sending
- [ ] Email signature system
- [ ] Bulk email operations
- [ ] Export contacts to CSV
- [ ] Email analytics dashboard
- [ ] Attachment support

## 🎉 Success Criteria

You'll know the system is working when:
1. ✅ All 5 pages load without errors
2. ✅ Sidebar shows "Email" section with 5 items
3. ✅ Database has 5 email tables + admin_invitations
4. ✅ 4 default templates visible in Templates page
5. ⏳ Can send email via Compose page
6. ⏳ Sent emails appear in Outbox
7. ⏳ Form submissions appear in Inbox
8. ⏳ Contacts tracked automatically
9. ⏳ Admin invitations send emails

## 📚 Related Documentation

- **MFA System**: `docs/USER-SECURITY-MFA-GUIDE.md`
- **Admin Management**: `scripts/fix-admins-rls-recursion.sql`
- **Super Admin**: `scripts/make-super-admin.sql`
- **Database Schema**: `docs/06-DATABASE-SCHEMA.md`

---

**Created**: ${new Date().toISOString().split('T')[0]}  
**Status**: Database + UI Complete, APIs Pending  
**Pages**: 5/5 ✅  
**APIs**: 0/15 ⏳  
**Integration**: 0% ⏳
