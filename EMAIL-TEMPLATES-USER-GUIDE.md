# 📧 Email Templates Management Guide

## Quick Access
**URL**: http://localhost:3002/email/templates

## Overview
The Email Templates system lets you create, manage, and organize reusable email templates with dynamic variable substitution. Perfect for admin invitations, user notifications, marketing emails, and automated responses.

---

## 🎯 Getting Started

### 1. Access the Templates Page
1. Start the admin app: `pnpm dev:admin` (or `pnpm dev` for all apps)
2. Navigate to http://localhost:3002/email/templates
3. Login with your admin credentials

### 2. Understanding the Interface

The templates page has three main sections:
- **Search & Filter Bar**: Find templates by name/subject or filter by category
- **Templates Grid**: Visual cards showing all your templates
- **Action Buttons**: Add new templates or compose emails

---

## 📝 Creating Email Templates

### Step-by-Step: Create a New Template

1. **Click "Add Template"** button (top right)
2. **Fill in the required fields**:

   **Template Name** * (required)
   - Internal name for reference (e.g., "Welcome Email", "Password Reset")
   - Only admins see this name

   **Category** * (required)
   - Organize templates (e.g., "Admin", "User", "Marketing")
   - Used for filtering
   - Examples: `Admin`, `User`, `Marketing`, `Transactional`

   **Subject Line** * (required)
   - Email subject that recipients see
   - Supports variables (see below)
   - Example: `Welcome to %%%website_name%%%!`

   **Content** * (required)
   - The email body text
   - Supports multi-line text
   - Supports variables
   - Plain text format (no HTML yet)

   **Variables** (optional)
   - Dynamic placeholders replaced at send time
   - Format: `%%%variable_name%%%`
   - Add by typing and clicking "Add"
   - Examples: `%%%email%%%`, `%%%name%%%`, `%%%website_name%%%`

   **Active Status**
   - Toggle ON (default) to make template available for use
   - Toggle OFF to disable without deleting

3. **Click "Save"** to create the template

---

## 🔧 Managing Templates

### Edit a Template
1. Find the template card in the grid
2. Click **"Edit"** button at the bottom
3. Make your changes
4. Click **"Save"**

### Duplicate a Template
1. Click **"Duplicate"** on any template
2. A copy is created with "(Copy)" added to the name
3. New copy is set to Inactive by default
4. Edit the copy to customize it

### Delete a Template
1. Click **"Delete"** on the template
2. Confirm the deletion
3. Template is permanently removed

### Toggle Active/Inactive
- Click the **green "Active"** or **gray "Inactive"** badge at the top of each card
- Active templates can be selected in the Compose page
- Inactive templates are hidden from selection but not deleted

---

## 🎨 Understanding Variables

### What Are Variables?
Variables are dynamic placeholders in your emails that get replaced with real data when the email is sent.

### Variable Format
- Must be wrapped in triple percent signs: `%%%variable_name%%%`
- Case-sensitive
- Use underscores for multi-word variables: `%%%first_name%%%`

### Common Variables

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `%%%website_name%%%` | Your site name | "InPlayTV" |
| `%%%email%%%` | Recipient's email | "user@example.com" |
| `%%%name%%%` | Recipient's name | "John Smith" |
| `%%%first_name%%%` | First name only | "John" |
| `%%%activation_link%%%` | Account activation URL | "https://..." |
| `%%%invitation_link%%%` | Admin invite URL | "https://..." |
| `%%%reset_link%%%` | Password reset URL | "https://..." |
| `%%%admin_email%%%` | Support email | "admin@inplaytv.com" |

### Example Template with Variables

**Subject**: 
```
Welcome to %%%website_name%%%!
```

**Content**:
```
Hi %%%name%%%,

Thank you for joining %%%website_name%%%!

Your account (%%%email%%%) is now active and ready to use.

Questions? Contact us at %%%admin_email%%%

Best regards,
The %%%website_name%%% Team
```

**When Sent**:
```
Subject: Welcome to InPlayTV!

Hi John Smith,

Thank you for joining InPlayTV!

Your account (john@example.com) is now active and ready to use.

Questions? Contact us at admin@inplaytv.com

Best regards,
The InPlayTV Team
```

---

## 🔍 Finding Templates

### Search by Name or Subject
- Type in the search box at the top
- Searches template names and subject lines
- Updates results in real-time

### Filter by Category
- Use the dropdown next to the search box
- Select "All Categories" to see everything
- Select specific category to narrow results

### View Template Details
Each template card shows:
- **Name** (top, bold)
- **Active/Inactive status** (badge, top right)
- **Category** (gray text below name)
- **Subject line** (full text)
- **Content preview** (first 150 characters)
- **Variables** (blue pills showing all variables used)
- **Action buttons** (Edit, Duplicate, Delete)

---

## 📋 Default Templates

Your system comes with pre-installed templates:

### 1. Admin Invitation
- **Category**: Admin
- **Used For**: Inviting new administrators
- **Variables**: `website_name`, `email`, `invitation_link`

### 2. Account Activated
- **Category**: Admin
- **Used For**: Confirming admin account activation
- **Variables**: `website_name`, `email`, `name`, `admin_email`

### 3. Welcome Email
- **Category**: User
- **Used For**: First-time user welcome
- **Variables**: `website_name`, `name`

### 4. Contact Form Confirmation
- **Category**: User
- **Used For**: Auto-reply to form submissions
- **Variables**: `website_name`, `name`

### 5. Coming Soon Waitlist
- **Category**: Marketing
- **Used For**: Confirming waitlist signup
- **Variables**: `website_name`, `email`

### 6. Launch Notification
- **Category**: Marketing
- **Used For**: Notifying waitlist when site launches
- **Variables**: `website_name`

---

## 💡 Best Practices

### Template Naming
✅ **Good**: "Welcome Email - New Users", "Password Reset Request"  
❌ **Bad**: "Template 1", "Email", "test"

### Subject Lines
✅ **Good**: Clear, actionable, includes key info  
❌ **Bad**: Too long (over 60 chars), all caps, misleading

### Content Guidelines
- Keep it concise (300-500 words max)
- Use clear paragraph breaks
- Include a clear call-to-action
- Add contact information
- Be friendly and professional
- Test all variables before sending

### Variable Usage
- Document all variables in the Variables section
- Use consistent naming (e.g., always `%%%email%%%`, not sometimes `%%%user_email%%%`)
- Test with real data before mass sending
- Don't use too many variables (5-7 max per template)

### Organization
- Use meaningful categories
- Keep Active templates under 20 for easy selection
- Archive old templates by setting to Inactive
- Duplicate templates when creating variations

---

## 📧 Using Templates in Emails

### From the Compose Page
1. Go to http://localhost:3002/email/compose
2. Click the **"Select Template"** dropdown
3. Choose your template
4. Subject and content auto-populate
5. Variables remain as placeholders (you'll replace them manually for now)
6. Edit as needed
7. Send

### Via API (For Developers)
```typescript
// Fetch all active templates
GET /api/email/templates

// Send email with template
POST /api/email/send
{
  "template_id": "template-uuid",
  "recipients": ["user@example.com"],
  "variables": {
    "name": "John Smith",
    "email": "user@example.com",
    "website_name": "InPlayTV"
  }
}
```

---

## 🔒 Security & Permissions

- Only authenticated admins can access templates
- Row Level Security (RLS) enforced on database
- No public access to template content
- Variables are sanitized before sending
- Deleted templates cannot be recovered

---

## 🐛 Troubleshooting

### Templates Not Loading
**Solution**: 
- Check browser console for errors (F12)
- Verify admin app is running on port 3002
- Refresh the page

### Can't Save Template
**Possible causes**:
- Missing required fields (Name, Category, Subject, Content)
- Invalid variable format
- Network connection issues

**Solution**:
- Fill all required fields (marked with *)
- Use correct variable format: `%%%variable%%%`
- Check network tab in browser DevTools

### Variables Not Replacing
**Note**: Variable replacement happens when emails are sent via API, not in the template editor. The Compose page shows placeholders that you replace manually for now.

### Template Disappeared
- Check if it was set to "Inactive" (change Category filter to "All")
- Check if it was deleted (check with other admins)
- Search by name in case it was renamed

---

## 📊 API Reference (For Developers)

### Fetch All Templates
```typescript
GET /api/email/templates
Response: { templates: Template[] }
```

### Create Template
```typescript
POST /api/email/templates
Body: {
  name: string
  category: string
  subject: string
  content: string
  variables: string[]
  is_active: boolean
}
```

### Update Template
```typescript
PUT /api/email/templates/[id]
Body: { ...template fields }
```

### Delete Template
```typescript
DELETE /api/email/templates/[id]
```

---

## 🎯 Common Use Cases

### Scenario 1: Creating a Welcome Email Series
1. Create "Welcome Day 1" template with greeting
2. Create "Welcome Day 3" with tips
3. Create "Welcome Week 1" with advanced features
4. Set all to same category: "User Onboarding"
5. Use in automated email campaigns

### Scenario 2: Admin Invitations
1. Use the pre-built "Admin Invitation" template
2. Or create custom version with your branding
3. Include `%%%invitation_link%%%` variable
4. API automatically sends when admin added

### Scenario 3: Transactional Emails
1. Create templates for each transaction type
2. Category: "Transactional"
3. Include relevant variables (order number, amount, etc.)
4. Keep Active for automated use

### Scenario 4: Seasonal Campaigns
1. Create holiday/seasonal templates
2. Category: "Marketing - Seasonal"
3. Set to Inactive when season ends
4. Duplicate and update for next year

---

## 🎉 Quick Tips

- **Keyboard Shortcut**: Press Enter when typing a variable to add it
- **Bulk Creation**: Duplicate existing templates to save time
- **Testing**: Create a "Test" category for experimental templates
- **Backup**: Download important templates by copying content to text files
- **Preview**: Content preview shows first 150 chars - expand in edit mode
- **Sorting**: Templates are displayed newest first

---

## 📞 Need Help?

- Check [EMAIL-SYSTEM-COMPLETE.md](./EMAIL-SYSTEM-COMPLETE.md) for system architecture
- Review database schema: [DATABASE-SCHEMA-REFERENCE.md](./DATABASE-SCHEMA-REFERENCE.md)
- API issues: Check `/apps/admin/src/app/api/email/` directory
- Feature requests: Create an issue in the project repository

---

**Last Updated**: December 23, 2025  
**Version**: 1.0  
**Status**: ✅ Fully Functional (UI Complete, APIs Pending)
