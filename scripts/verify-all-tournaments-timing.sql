/* ===================================================================
   VERIFICATION: Check All Tournament Registration Timings
   This ensures nothing was broken by the Hero World Challenge fix
   =================================================================== */

/* Check all active tournaments and their round times */
SELECT 
  t.name as tournament,
  t.slug,
  t.status,
  t.current_round,
  t.round_1_start,
  t.round_2_start,
  t.round_3_start,
  t.round_4_start,
  CASE 
    WHEN t.round_4_start IS NULL THEN '❌ Missing R4'
    WHEN EXTRACT(HOUR FROM t.round_4_start) = 0 AND EXTRACT(MINUTE FROM t.round_4_start) = 0 THEN '⚠️  R4 at midnight'
    ELSE '✅ R4 OK'
  END as round4_check
FROM tournaments t
WHERE t.status NOT IN ('completed', 'cancelled')
ORDER BY t.start_date;

/* Check Final Strike registrations for all active tournaments */
SELECT 
  t.name as tournament,
  t.slug,
  ct.name as competition,
  t.round_4_start,
  tc.reg_close_at,
  EXTRACT(EPOCH FROM (t.round_4_start - tc.reg_close_at))/60 as minutes_before_start,
  tc.status,
  CASE 
    WHEN tc.reg_close_at > NOW() THEN '✅ OPEN'
    WHEN tc.status = 'in_play' THEN '🎮 IN PLAY'
    ELSE '❌ CLOSED'
  END as current_status
FROM tournament_competitions tc
JOIN tournaments t ON tc.tournament_id = t.id
JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE t.status NOT IN ('completed', 'cancelled')
  AND ct.slug = 'final-strike'
ORDER BY t.start_date;

/* Check if registration close times are correct (should be 15 min before round start) */
SELECT 
  t.name as tournament,
  ct.name as competition,
  ROUND(EXTRACT(EPOCH FROM (
    CASE ct.slug
      WHEN 'final-strike' THEN t.round_4_start
      WHEN 'the-weekender' THEN t.round_3_start
      WHEN 'first-to-strike' THEN t.round_1_start
      WHEN 'beat-the-cut' THEN t.round_1_start
      WHEN 'full-course' THEN t.round_1_start
    END - tc.reg_close_at
  ))/60) as minutes_before_start,
  CASE 
    WHEN ROUND(EXTRACT(EPOCH FROM (
      CASE ct.slug
        WHEN 'final-strike' THEN t.round_4_start
        WHEN 'the-weekender' THEN t.round_3_start
        ELSE t.round_1_start
      END - tc.reg_close_at
    ))/60) = 15 THEN '✅ Correct'
    ELSE '⚠️  Wrong timing'
  END as timing_check
FROM tournament_competitions tc
JOIN tournaments t ON tc.tournament_id = t.id
JOIN competition_types ct ON tc.competition_type_id = ct.id
WHERE t.status NOT IN ('completed', 'cancelled')
  AND ct.slug IN ('final-strike', 'the-weekender', 'first-to-strike', 'beat-the-cut', 'full-course')
ORDER BY t.name, ct.name;
