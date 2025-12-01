-- ============================================================================
-- Migrate Tournament Scores from tournament_golfers to tournament_round_scores
-- ============================================================================
-- This script copies scores from denormalized columns (r1_score, r2_score, etc.)
-- in tournament_golfers table to the normalized tournament_round_scores table
-- ============================================================================

-- Delete existing entries to avoid conflicts (optional - comment out if you want to preserve existing data)
-- DELETE FROM public.tournament_round_scores WHERE data_source = 'datagolf' OR data_source = 'manual';

-- Round 1 Scores
INSERT INTO public.tournament_round_scores (
  tournament_id,
  golfer_id,
  round_number,
  score,
  to_par,
  status,
  holes_completed,
  data_source,
  is_manual_override,
  created_at,
  updated_at
)
SELECT 
  tg.tournament_id,
  tg.golfer_id,
  1 as round_number,
  tg.r1_score,
  tg.r1_score - 72 as to_par, -- Assuming par 72, adjust if needed
  CASE 
    WHEN tg.r1_score IS NOT NULL THEN 'completed'
    ELSE 'not_started'
  END as status,
  CASE WHEN tg.r1_score IS NOT NULL THEN 18 ELSE 0 END as holes_completed,
  'datagolf' as data_source,
  false as is_manual_override,
  tg.created_at,
  NOW() as updated_at
FROM public.tournament_golfers tg
WHERE tg.r1_score IS NOT NULL
ON CONFLICT (tournament_id, golfer_id, round_number) 
DO UPDATE SET
  score = EXCLUDED.score,
  to_par = EXCLUDED.to_par,
  status = EXCLUDED.status,
  holes_completed = EXCLUDED.holes_completed,
  updated_at = EXCLUDED.updated_at;

-- ============================================================================
-- Round 2 Scores
INSERT INTO public.tournament_round_scores (
  tournament_id,
  golfer_id,
  round_number,
  score,
  to_par,
  status,
  holes_completed,
  data_source,
  is_manual_override,
  created_at,
  updated_at
)
SELECT 
  tg.tournament_id,
  tg.golfer_id,
  2 as round_number,
  tg.r2_score,
  tg.r2_score - 72 as to_par,
  CASE 
    WHEN tg.r2_score IS NOT NULL THEN 'completed'
    ELSE 'not_started'
  END as status,
  CASE WHEN tg.r2_score IS NOT NULL THEN 18 ELSE 0 END as holes_completed,
  'datagolf' as data_source,
  false as is_manual_override,
  tg.created_at,
  NOW() as updated_at
FROM public.tournament_golfers tg
WHERE tg.r2_score IS NOT NULL
ON CONFLICT (tournament_id, golfer_id, round_number) 
DO UPDATE SET
  score = EXCLUDED.score,
  to_par = EXCLUDED.to_par,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;

-- ============================================================================
-- Round 3 Scores
-- Round 3 Scores
INSERT INTO public.tournament_round_scores (
  tournament_id,
  golfer_id,
  round_number,
  score,
  to_par,
  status,
  holes_completed,
  data_source,
  is_manual_override,
  created_at,
  updated_at
)
SELECT 
  tg.tournament_id,
  tg.golfer_id,
  3 as round_number,
  tg.r3_score,
  tg.r3_score - 72 as to_par,
  CASE 
    WHEN tg.r3_score IS NOT NULL THEN 'completed'
    ELSE 'not_started'
  END as status,
  CASE WHEN tg.r3_score IS NOT NULL THEN 18 ELSE 0 END as holes_completed,
  'datagolf' as data_source,
  false as is_manual_override,
  tg.created_at,
  NOW() as updated_at
FROM public.tournament_golfers tg
WHERE tg.r3_score IS NOT NULL
ON CONFLICT (tournament_id, golfer_id, round_number) 
DO UPDATE SET
  score = EXCLUDED.score,
  to_par = EXCLUDED.to_par,
  status = EXCLUDED.status,
  holes_completed = EXCLUDED.holes_completed,
  updated_at = EXCLUDED.updated_at;

-- Round 4 Scores
INSERT INTO public.tournament_round_scores (
  tournament_id,
  golfer_id,
  round_number,
  score,
  to_par,
  status,
  holes_completed,
  data_source,
  is_manual_override,
  created_at,
  updated_at
)
SELECT 
  tg.tournament_id,
  tg.golfer_id,
  4 as round_number,
  tg.r4_score,
  tg.r4_score - 72 as to_par,
  CASE 
    WHEN tg.r4_score IS NOT NULL THEN 'completed'
    ELSE 'not_started'
  END as status,
  CASE WHEN tg.r4_score IS NOT NULL THEN 18 ELSE 0 END as holes_completed,
  'datagolf' as data_source,
  false as is_manual_override,
  tg.created_at,
  NOW() as updated_at
FROM public.tournament_golfers tg
WHERE tg.r4_score IS NOT NULL
ON CONFLICT (tournament_id, golfer_id, round_number) 
DO UPDATE SET
  score = EXCLUDED.score,
  to_par = EXCLUDED.to_par,
  status = EXCLUDED.status,
  holes_completed = EXCLUDED.holes_completed,
  updated_at = EXCLUDED.updated_at;

-- Verify the migration
SELECT 
  t.name as tournament_name,
  COUNT(DISTINCT trs.golfer_id) as golfers_with_scores,
  COUNT(*) as total_round_scores,
  COUNT(CASE WHEN trs.round_number = 1 THEN 1 END) as round1_count,
  COUNT(CASE WHEN trs.round_number = 2 THEN 1 END) as round2_count,
  COUNT(CASE WHEN trs.round_number = 3 THEN 1 END) as round3_count,
  COUNT(CASE WHEN trs.round_number = 4 THEN 1 END) as round4_count
FROM public.tournaments t
LEFT JOIN public.tournament_round_scores trs ON trs.tournament_id = t.id
GROUP BY t.id, t.name
ORDER BY t.start_date DESC
LIMIT 10;
