-- ============================================================================
-- DEBUG AND FIX BMW AUSTRALIAN PGA CHAMPIONSHIP
-- ============================================================================

-- Check tournament details
SELECT 
    id,
    name,
    tour,
    status,
    start_date,
    end_date
FROM tournaments
WHERE name LIKE '%BMW Australian PGA%';

-- Check golfers linked to tournament
SELECT COUNT(*) as golfer_count
FROM tournament_golfers
WHERE tournament_id = (
    SELECT id FROM tournaments WHERE name LIKE '%BMW Australian PGA%' LIMIT 1
);

-- Check golfer groups for this tournament
SELECT 
    gg.id,
    gg.name,
    gg.slug,
    COUNT(ggm.golfer_id) as golfers_in_group
FROM golfer_groups gg
LEFT JOIN golfer_group_members ggm ON ggm.group_id = gg.id
WHERE gg.slug LIKE '%bmw-australian-pga%'
GROUP BY gg.id, gg.name, gg.slug;

-- Check competitions for this tournament
SELECT 
    tc.id,
    tc.status,
    ct.name as competition_type,
    tc.reg_open_at,
    tc.reg_close_at,
    tc.start_at,
    tc.end_at
FROM tournament_competitions tc
JOIN competition_types ct ON ct.id = tc.competition_type_id
WHERE tc.tournament_id = (
    SELECT id FROM tournaments WHERE name LIKE '%BMW Australian PGA%' LIMIT 1
);

-- Check which competitions have golfer groups assigned
SELECT 
    tc.id as competition_id,
    ct.name as competition_type,
    gg.name as golfer_group,
    tc.assigned_golfer_group_id,
    COUNT(ggm.golfer_id) as golfers_available
FROM tournament_competitions tc
JOIN competition_types ct ON ct.id = tc.competition_type_id
LEFT JOIN golfer_groups gg ON gg.id = tc.assigned_golfer_group_id
LEFT JOIN golfer_group_members ggm ON ggm.group_id = gg.id
WHERE tc.tournament_id = (
    SELECT id FROM tournaments WHERE name LIKE '%BMW Australian PGA%' LIMIT 1
)
GROUP BY tc.id, ct.name, gg.name, tc.assigned_golfer_group_id;

-- ============================================================================
-- FIX 1: UPDATE COMPETITION STATUS TO LIVE
-- ============================================================================
-- Update first 4 competitions to 'live' (tournament is currently live)
UPDATE tournament_competitions
SET status = 'live'
WHERE tournament_id = (
    SELECT id FROM tournaments WHERE name LIKE '%BMW Australian PGA%' LIMIT 1
)
AND id IN (
    SELECT tc.id 
    FROM tournament_competitions tc
    JOIN competition_types ct ON ct.id = tc.competition_type_id
    WHERE tc.tournament_id = (
        SELECT id FROM tournaments WHERE name LIKE '%BMW Australian PGA%' LIMIT 1
    )
    AND ct.name NOT IN ('FINAL STRIKE', 'ONE 2 ONE')
);

-- Update FINAL STRIKE and ONE 2 ONE to 'reg_open'
UPDATE tournament_competitions
SET status = 'reg_open'
WHERE tournament_id = (
    SELECT id FROM tournaments WHERE name LIKE '%BMW Australian PGA%' LIMIT 1
)
AND id IN (
    SELECT tc.id 
    FROM tournament_competitions tc
    JOIN competition_types ct ON ct.id = tc.competition_type_id
    WHERE tc.tournament_id = (
        SELECT id FROM tournaments WHERE name LIKE '%BMW Australian PGA%' LIMIT 1
    )
    AND ct.name IN ('FINAL STRIKE', 'ONE 2 ONE')
);

-- Verify status updates
SELECT 
    ct.name as competition_type,
    tc.status
FROM tournament_competitions tc
JOIN competition_types ct ON ct.id = tc.competition_type_id
WHERE tc.tournament_id = (
    SELECT id FROM tournaments WHERE name LIKE '%BMW Australian PGA%' LIMIT 1
)
ORDER BY tc.created_at;
