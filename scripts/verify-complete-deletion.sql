-- Verify all entries are deleted
SELECT COUNT(*) as remaining_entries FROM competition_entries;
SELECT COUNT(*) as remaining_instances FROM competition_instances;
SELECT COUNT(*) as remaining_picks FROM entry_picks;
SELECT COUNT(*) as remaining_results FROM competition_results;
