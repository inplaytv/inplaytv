-- Add DELETE and UPDATE policies for clubhouse_entry_picks
-- This allows users to edit their own entries

-- Allow users to delete their own entry picks
DROP POLICY IF EXISTS "Users can delete own entry picks" ON clubhouse_entry_picks;
CREATE POLICY "Users can delete own entry picks" ON clubhouse_entry_picks 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM clubhouse_entries 
      WHERE id = entry_id AND user_id = auth.uid()
    )
  );

-- Allow users to update their own entry picks
DROP POLICY IF EXISTS "Users can update own entry picks" ON clubhouse_entry_picks;
CREATE POLICY "Users can update own entry picks" ON clubhouse_entry_picks 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM clubhouse_entries 
      WHERE id = entry_id AND user_id = auth.uid()
    )
  );
