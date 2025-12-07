-- COMPREHENSIVE DIAGNOSTIC: What entries exist and why are they showing?

-- 1. Show ALL entries with full details
SELECT 
    ce.id,
    ce.user_id,
    ce.entry_name,
    ce.competition_id,
    ce.instance_id,
    ce.created_at,
    tc.id as comp_id_exists,
    tc.competition_type_id,
    ci.id as instance_id_exists,
    ci.status as instance_status,
    CASE 
        WHEN ce.instance_id IS NOT NULL THEN 'ONE_2_ONE'
        WHEN ce.competition_id IS NOT NULL THEN 'REGULAR'
        ELSE 'ORPHANED'
    END as entry_type,
    CASE 
        WHEN ce.competition_id IS NOT NULL AND tc.id IS NULL THEN 'ORPHANED_COMP'
        WHEN ce.instance_id IS NOT NULL AND ci.id IS NULL THEN 'ORPHANED_INSTANCE'
        WHEN ce.instance_id IS NOT NULL AND ci.status = 'full' THEN 'COMPLETED_MATCH'
        WHEN ce.instance_id IS NOT NULL AND ci.status IN ('open', 'active') THEN 'ACTIVE_MATCH'
        WHEN ce.competition_id IS NOT NULL THEN 'REGULAR_COMP'
        ELSE 'UNKNOWN'
    END as status_category
FROM competition_entries ce
LEFT JOIN tournament_competitions tc ON ce.competition_id = tc.id
LEFT JOIN competition_instances ci ON ce.instance_id = ci.id
ORDER BY ce.created_at DESC;

-- 2. Count by category
SELECT 
    CASE 
        WHEN ce.competition_id IS NOT NULL AND tc.id IS NULL THEN 'ORPHANED_COMP'
        WHEN ce.instance_id IS NOT NULL AND ci.id IS NULL THEN 'ORPHANED_INSTANCE'
        WHEN ce.instance_id IS NOT NULL AND ci.status = 'full' THEN 'COMPLETED_MATCH'
        WHEN ce.instance_id IS NOT NULL AND ci.status IN ('open', 'active') THEN 'ACTIVE_MATCH'
        WHEN ce.competition_id IS NOT NULL THEN 'REGULAR_COMP'
        ELSE 'UNKNOWN'
    END as category,
    COUNT(*) as count
FROM competition_entries ce
LEFT JOIN tournament_competitions tc ON ce.competition_id = tc.id
LEFT JOIN competition_instances ci ON ce.instance_id = ci.id
GROUP BY category
ORDER BY count DESC;

-- 3. Show which user owns these entries
SELECT 
    ce.user_id,
    COUNT(*) as entry_count
FROM competition_entries ce
GROUP BY ce.user_id
ORDER BY entry_count DESC;
