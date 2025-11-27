-- Create ideas_suggestions table
CREATE TABLE IF NOT EXISTS ideas_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'feature',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'considering', 'approved', 'rejected', 'implemented')),
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  implemented_at TIMESTAMPTZ
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ideas_suggestions_priority ON ideas_suggestions(priority);
CREATE INDEX IF NOT EXISTS idx_ideas_suggestions_status ON ideas_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_ideas_suggestions_created_at ON ideas_suggestions(created_at);

-- Add RLS policies (adjust as needed for your security requirements)
ALTER TABLE ideas_suggestions ENABLE ROW LEVEL SECURITY;

-- Policy to allow admins to do everything
CREATE POLICY "Admins can manage ideas"
  ON ideas_suggestions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ideas_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Set implemented_at when status changes to 'implemented'
  IF NEW.status = 'implemented' AND OLD.status != 'implemented' THEN
    NEW.implemented_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ideas_suggestions_timestamp
  BEFORE UPDATE ON ideas_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_ideas_suggestions_updated_at();
