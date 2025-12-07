-- Check if ANY entries exist at all
SELECT COUNT(*) as total_entries FROM competition_entries;

-- Check if ANY instances exist
SELECT COUNT(*) as total_instances FROM competition_instances;

-- Check if ANY picks exist
SELECT COUNT(*) as total_picks FROM entry_picks;

-- Check if ANY results exist
SELECT COUNT(*) as total_results FROM competition_results;
