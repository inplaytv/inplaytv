-- Migration: Add entry_fee_pennies to competition_instances
-- This allows each ONE 2 ONE challenge to have a custom entry fee (£5-£100)

ALTER TABLE competition_instances
ADD COLUMN IF NOT EXISTS entry_fee_pennies INT NOT NULL DEFAULT 500;

-- Update existing instances to use their template's entry fee
UPDATE competition_instances ci
SET entry_fee_pennies = ct.entry_fee_pennies
FROM competition_templates ct
WHERE ci.template_id = ct.id AND ci.entry_fee_pennies = 500;
