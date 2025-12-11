-- ===================================================================
-- EMAIL MANAGEMENT SYSTEM
-- ===================================================================

-- 1. Email Templates Table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'General',
  subject VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  variables TEXT[], -- Array of available variables like %%%website_name%%%, %%%email%%%, etc.
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Email Outbox (Sent Emails)
CREATE TABLE IF NOT EXISTS public.email_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by_user_id UUID REFERENCES auth.users(id),
  sent_by_name VARCHAR(255),
  sent_by_email VARCHAR(255) NOT NULL,
  reply_to_email VARCHAR(255),
  recipients TEXT[] NOT NULL, -- Array of recipient emails
  cc_recipients TEXT[],
  bcc_recipients TEXT[],
  subject VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  template_id UUID REFERENCES email_templates(id),
  status VARCHAR(50) DEFAULT 'sent', -- 'sent', 'delivered', 'bounced', 'failed'
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  bounce_reason TEXT,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Email Inbox (Form Submissions & Inquiries)
CREATE TABLE IF NOT EXISTS public.email_inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_name VARCHAR(100),
  sender_name VARCHAR(255),
  sender_email VARCHAR(255) NOT NULL,
  sender_phone VARCHAR(50),
  sender_ip VARCHAR(45),
  subject VARCHAR(500),
  message TEXT NOT NULL,
  web_page VARCHAR(500),
  status VARCHAR(50) DEFAULT 'unread', -- 'unread', 'read', 'replied', 'archived'
  assigned_to UUID REFERENCES auth.users(id),
  replied_at TIMESTAMPTZ,
  internal_notes TEXT,
  metadata JSONB,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Contact List
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255),
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  company VARCHAR(255),
  tags TEXT[],
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'bounced', 'unsubscribed'
  forms_submitted INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  last_contact_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Email Activity Log
CREATE TABLE IF NOT EXISTS public.email_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID, -- Reference to outbox or inbox
  email_type VARCHAR(20), -- 'outbox' or 'inbox'
  activity_type VARCHAR(50) NOT NULL, -- 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'replied'
  details TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admins can access all
CREATE POLICY "Admins can manage templates"
ON email_templates FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage outbox"
ON email_outbox FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage inbox"
ON email_inbox FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage contacts"
ON contacts FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view activity"
ON email_activity FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_outbox_sent_by ON email_outbox(sent_by_user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_outbox_status ON email_outbox(status, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_inbox_status ON email_inbox(status, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_inbox_email ON email_inbox(sender_email);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_email_activity_email ON email_activity(email_id, email_type);

-- Insert default templates
INSERT INTO email_templates (name, category, subject, content, variables) VALUES
(
  'Admin Invitation',
  'System Email',
  'You''ve been invited to collaborate on %%%website_name%%%',
  E'%%%invited_by%%% invited you to collaborate on a site!\n\nClick the link below to start collaborating as an Admin User of %%%website_name%%%.\n\n%%%invitation_link%%%\n\nThe invitation will expire in 24 hours - please click the link now to accept.',
  ARRAY['%%%website_name%%%', '%%%invited_by%%%', '%%%invitation_link%%%', '%%%invitee_email%%%']
),
(
  'Account Activated',
  'Customer Service',
  '%%%website_name%%% - Your Account is Activated!',
  E'Welcome to the %%%website_name%%% family!\n\nYour account has been activated. You may now add your company information to the online directory.\n\nYour Login Details:\nUsername: %%%email%%%\nPassword: (Entered During Signup)\n\nLogin Here: %%%login_url%%%\n\nIf you need assistance, please reply to this email.\n\nThank you,\nThe %%%website_name%%% Team',
  ARRAY['%%%website_name%%%', '%%%email%%%', '%%%login_url%%%', '%%%first_name%%%', '%%%last_name%%%']
),
(
  'Welcome Email',
  'Customer Service',
  'Welcome to %%%website_name%%%!',
  E'Hi %%%first_name%%%,\n\nWelcome to %%%website_name%%%! We''re excited to have you on board.\n\nIf you have any questions, feel free to reply to this email.\n\nBest regards,\nThe %%%website_name%%% Team',
  ARRAY['%%%website_name%%%', '%%%first_name%%%', '%%%email%%%']
),
(
  'Contact Form Confirmation',
  'Customer Service',
  '%%%website_name%%% - Message Confirmation',
  E'Thank you for contacting %%%website_name%%%!\n\nWe have received your message and someone from our team will respond shortly.\n\nYour message:\n%%%message%%%\n\nBest regards,\nThe %%%website_name%%% Team',
  ARRAY['%%%website_name%%%', '%%%message%%%', '%%%email%%%', '%%%name%%%']
)
ON CONFLICT DO NOTHING;

-- ===================================================================
-- VERIFICATION
-- ===================================================================

SELECT '✅ Email management system created successfully!' as status;

-- Show table counts
SELECT 
  'email_templates' as table_name, 
  COUNT(*) as record_count 
FROM email_templates
UNION ALL
SELECT 'email_outbox', COUNT(*) FROM email_outbox
UNION ALL
SELECT 'email_inbox', COUNT(*) FROM email_inbox
UNION ALL
SELECT 'contacts', COUNT(*) FROM contacts
UNION ALL
SELECT 'email_activity', COUNT(*) FROM email_activity;
