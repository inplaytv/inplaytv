-- ===================================================================
-- CHECK WALLET TRANSACTIONS TABLE STRUCTURE
-- See what columns actually exist
-- ===================================================================

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'wallet_transactions'
ORDER BY ordinal_position;
