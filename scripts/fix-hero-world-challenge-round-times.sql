/* ===================================================================
   FIX: Hero World Challenge Round 4 Tee Time and Final Strike Registration
   Problem: Round 4 tee time reset to 00:00, causing Final Strike to close incorrectly
   =================================================================== */

/* STEP 1: Reset Round 4 Start Time
   Hero World Challenge runs Dec 4-7, 2025
   Assuming first tee time is around 12:00 PM EST (17:00 UTC) */

UPDATE tournaments
SET 
  round_4_start = '2025-12-07T17:00:00+00:00',
  updated_at = NOW()
WHERE slug = 'hero-world-challenge';

/* Result should show: 1 row updated */

/* Result should show: 1 row updated */

/* STEP 2: Update Final Strike Registration Close Time
   Should close 15 minutes before Round 4 starts */

UPDATE tournament_competitions tc
SET 
  reg_close_at = t.round_4_start - INTERVAL '15 minutes',
  status = CASE 
    WHEN (t.round_4_start - INTERVAL '15 minutes') > NOW() THEN 'reg_open'
    ELSE 'in_play'
  END,
  updated_at = NOW()
FROM tournaments t, competition_types ct
WHERE tc.tournament_id = t.id
  AND tc.competition_type_id = ct.id
  AND t.slug = 'hero-world-challenge'
  AND ct.slug = 'final-strike';

/* Result should show: 1 row updated */

/* STEP 3: Update ONE 2 ONE Template Instances
   Make sure Round 4 template closes at Round 4 start */

UPDATE competition_instances ci
SET 
  reg_close_at = t.round_4_start - INTERVAL '15 minutes',
  updated_at = NOW()
FROM tournaments t, competition_templates ct
WHERE ci.tournament_id = t.id
  AND ci.template_id = ct.id
  AND t.slug = 'hero-world-challenge'
  AND ct.reg_close_round = 4;

/* Result should show: number of ONE 2 ONE Round 4 instances updated */

/* STEP 4: Verify the fixes */

SELECT 
  t.name as tournament,
  t.round_4_start,
  ct.name as competition,
  tc.reg_close_at,
  tc.status,
  CASE 
    WHEN tc.reg_close_at > NOW() THEN 'OPEN - Closes in ' || 
      ROUND(EXTRACT(EPOCH FROM (tc.reg_close_at - NOW()))/3600, 1) || ' hours'
    ELSE 'CLOSED'
  END as registration_status
FROM tournament_competitions tc
JOIN tournaments t ON tc.tournament_id = t.id
JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE t.slug = 'hero-world-challenge'
  AND ct.slug IN ('final-strike', 'the-weekender')
ORDER BY ct.name;
