-- Fix registration close dates for Hero World Challenge and Crown Australian Open
-- All three tournaments run Dec 4-7, 2025
-- Nedbank already has correct dates, copying that pattern to the other two

-- HERO WORLD CHALLENGE: Update to match Nedbank's correct pattern

-- THE WEEKENDER closes before R3 (Dec 6)
UPDATE tournament_competitions
SET reg_close_at = '2025-12-06T00:00:00+00:00'
WHERE tournament_id = (SELECT id FROM tournaments WHERE slug = 'hero-world-challenge')
  AND competition_type_id = (SELECT id FROM competition_types WHERE name = 'THE WEEKENDER');

-- Final Strike closes before R4 (Dec 7)
UPDATE tournament_competitions
SET reg_close_at = '2025-12-07T00:00:00+00:00'
WHERE tournament_id = (SELECT id FROM tournaments WHERE slug = 'hero-world-challenge')
  AND competition_type_id = (SELECT id FROM competition_types WHERE name = 'Final Strike');

-- ONE 2 ONE stays open until end of tournament (Dec 7 11:59pm)
UPDATE tournament_competitions
SET reg_close_at = '2025-12-07T23:59:00+00:00'
WHERE tournament_id = (SELECT id FROM tournaments WHERE slug = 'hero-world-challenge')
  AND competition_type_id = (SELECT id FROM competition_types WHERE name = 'ONE 2 ONE');

-- CROWN AUSTRALIAN OPEN: Update to match Nedbank's correct pattern

-- THE WEEKENDER closes before R3 (Dec 6)
UPDATE tournament_competitions
SET reg_close_at = '2025-12-06T00:00:00+00:00'
WHERE tournament_id = (SELECT id FROM tournaments WHERE slug = 'crown-australian-open')
  AND competition_type_id = (SELECT id FROM competition_types WHERE name = 'THE WEEKENDER');

-- Final Strike closes before R4 (Dec 7)
UPDATE tournament_competitions
SET reg_close_at = '2025-12-07T00:00:00+00:00'
WHERE tournament_id = (SELECT id FROM tournaments WHERE slug = 'crown-australian-open')
  AND competition_type_id = (SELECT id FROM competition_types WHERE name = 'Final Strike');

-- ONE 2 ONE stays open until end of tournament (Dec 7 11:59pm)
UPDATE tournament_competitions
SET reg_close_at = '2025-12-07T23:59:00+00:00'
WHERE tournament_id = (SELECT id FROM tournaments WHERE slug = 'crown-australian-open')
  AND competition_type_id = (SELECT id FROM competition_types WHERE name = 'ONE 2 ONE');

-- Verify the changes
SELECT 
  t.name as tournament,
  ct.name as competition,
  tc.reg_close_at
FROM tournaments t
JOIN tournament_competitions tc ON tc.tournament_id = t.id
JOIN competition_types ct ON ct.id = tc.competition_type_id
WHERE t.slug IN ('hero-world-challenge', 'crown-australian-open', 'nedbank-golf-challenge-in-honour-of-gary-player')
ORDER BY t.name, ct.name;
