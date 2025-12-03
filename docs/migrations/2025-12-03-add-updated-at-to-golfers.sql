-- Migration: Add updated_at column to golfers table
-- Date: 2025-12-03
-- Reason: Required by database trigger for golfer updates
--         Enables world rankings sync feature

-- Add updated_at column with default value and auto-update trigger
ALTER TABLE golfers 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add comment for documentation
COMMENT ON COLUMN golfers.updated_at IS 'Automatically updated timestamp when golfer record is modified';

-- Note: The trigger to auto-update this column should already exist on the golfers table
-- If not, create it with:
-- 
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.updated_at = NOW();
--   RETURN NEW;
-- END;
-- $$ language 'plpgsql';
--
-- CREATE TRIGGER update_golfers_updated_at
--   BEFORE UPDATE ON golfers
--   FOR EACH ROW
--   EXECUTE FUNCTION update_updated_at_column();
