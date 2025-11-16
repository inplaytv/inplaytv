-- ===================================================================
-- CREATE DEV NOTES TABLE FOR ADMIN PANEL
-- Task management and reminders for development team
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.dev_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'deferred')),
  is_completed BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_dev_notes_status ON public.dev_notes(status);
CREATE INDEX IF NOT EXISTS idx_dev_notes_priority ON public.dev_notes(priority);
CREATE INDEX IF NOT EXISTS idx_dev_notes_category ON public.dev_notes(category);

-- Add initial note about RLS security
INSERT INTO public.dev_notes (title, description, category, priority, status)
VALUES (
  'Re-enable RLS Security Policies',
  'IMPORTANT: We temporarily disabled Row Level Security (RLS) on all database tables to fix infinite recursion issues. This needs to be properly fixed by creating non-recursive policies.

Tables affected:
- competition_entries
- entry_picks
- wallets
- wallet_transactions
- admins
- ALL other tables

Action needed:
1. Analyze which policies are causing recursion
2. Rewrite policies without circular references
3. Re-enable RLS table by table
4. Test thoroughly

See scripts: disable-all-rls.sql, fix-admins-rls-policy.sql',
  'security',
  'critical',
  'pending'
);

SELECT 'Dev notes table created with initial security reminder' AS status;
