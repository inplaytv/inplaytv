-- Add Coming Soon Waitlist email template
INSERT INTO email_templates (
  name,
  category,
  subject,
  content,
  variables,
  is_active
) VALUES (
  'Coming Soon Waitlist',
  'Marketing',
  'Welcome to %%%website_name%%% - You''re on the list! 🎉',
  'Hi there!

Thank you for joining our exclusive waitlist for %%%website_name%%%!

You''re now among the first to know when we launch. We''re working hard to bring you an amazing fantasy golf experience, and we can''t wait to share it with you.

What happens next:
• You''ll receive an email as soon as we go live
• You''ll get early access to create your first team
• You''ll be first in line for exclusive launch offers

In the meantime:
• Follow us on social media for updates
• Spread the word to your golf-loving friends
• Keep an eye on your inbox for launch announcements

Questions? Just reply to this email - we''d love to hear from you!

See you on the course,
The InPlayTV Team

P.S. Make sure to add %%%email%%% to your contacts so our launch email doesn''t end up in spam!',
  ARRAY['%%%website_name%%%', '%%%email%%%'],
  true
);

-- Add Launch Notification template
INSERT INTO email_templates (
  name,
  category,
  subject,
  content,
  variables,
  is_active
) VALUES (
  'Launch Notification',
  'Marketing',
  '🚀 We''re LIVE! %%%website_name%%% is now open',
  'The wait is over!

%%%website_name%%% is officially live and ready for you to play!

🎯 What you can do right now:
• Browse active golf tournaments
• Build your dream fantasy golf team
• Enter competitions and win prizes
• Track live scores in real-time

👉 Get started now: https://inplaytv.com

As an early waitlist member, you''re eligible for:
✓ 1000 bonus coins to get started
✓ Exclusive "Founding Member" badge
✓ Priority support for your first 30 days

Don''t wait - the first tournaments are already underway!

Ready to Strike?
The InPlayTV Team

---
Questions? Reply to this email or visit our help center.',
  ARRAY['%%%website_name%%%'],
  true
);
