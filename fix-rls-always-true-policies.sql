-- ============================================================================
-- Fix All RLS Policy "Always True" Security Issues
-- ============================================================================
-- Step 1: First, let's see which policies actually have the issue
-- Copy and run this query first to see what needs fixing
-- ============================================================================

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual as using_clause,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual = 'true' OR with_check = 'true')
  AND cmd IN ('UPDATE', 'DELETE', 'INSERT')
ORDER BY tablename, policyname;

-- ============================================================================
-- Step 2: DYNAMIC FIX - Generates proper RLS policies for all problematic ones
-- Run this after seeing the results above
-- ============================================================================

DO $$
DECLARE
    policy_record RECORD;
    table_has_user_id BOOLEAN;
    fix_statement TEXT;
    fixed_count INTEGER := 0;
BEGIN
    FOR policy_record IN 
        SELECT 
            schemaname,
            tablename,
            policyname,
            cmd,
            qual,
            with_check,
            roles
        FROM pg_policies
        WHERE schemaname = 'public'
          AND (qual = 'true' OR with_check = 'true')
          AND cmd IN ('UPDATE', 'DELETE', 'INSERT')
    LOOP
        -- Check if table has user_id column
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = policy_record.schemaname
              AND table_name = policy_record.tablename
              AND column_name = 'user_id'
        ) INTO table_has_user_id;
        
        BEGIN
            -- Drop the problematic policy
            fix_statement := format('DROP POLICY IF EXISTS %I ON %I.%I', 
                policy_record.policyname, 
                policy_record.schemaname, 
                policy_record.tablename
            );
            RAISE NOTICE 'Dropping: %', fix_statement;
            EXECUTE fix_statement;
            
            -- Recreate with proper security
            IF table_has_user_id THEN
                -- Table has user_id column - use direct check
                IF policy_record.cmd = 'INSERT' THEN
                    fix_statement := format(
                        'CREATE POLICY %I ON %I.%I FOR INSERT WITH CHECK (user_id = auth.uid())',
                        policy_record.policyname,
                        policy_record.schemaname,
                        policy_record.tablename
                    );
                ELSIF policy_record.cmd IN ('UPDATE', 'DELETE') THEN
                    fix_statement := format(
                        'CREATE POLICY %I ON %I.%I FOR %s USING (user_id = auth.uid())',
                        policy_record.policyname,
                        policy_record.schemaname,
                        policy_record.tablename,
                        policy_record.cmd
                    );
                END IF;
            ELSE
                -- Table doesn't have user_id - likely a picks table, check via entry_id
                IF policy_record.tablename LIKE '%_picks' OR policy_record.tablename LIKE '%picks' THEN
                    DECLARE
                        parent_table TEXT;
                    BEGIN
                        -- Determine parent entries table name
                        parent_table := REPLACE(policy_record.tablename, '_picks', 's');
                        
                        IF policy_record.cmd = 'INSERT' THEN
                            fix_statement := format(
                                'CREATE POLICY %I ON %I.%I FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM %I WHERE id = %I.entry_id AND user_id = auth.uid()))',
                                policy_record.policyname,
                                policy_record.schemaname,
                                policy_record.tablename,
                                parent_table,
                                policy_record.tablename
                            );
                        ELSIF policy_record.cmd IN ('UPDATE', 'DELETE') THEN
                            fix_statement := format(
                                'CREATE POLICY %I ON %I.%I FOR %s USING (EXISTS (SELECT 1 FROM %I WHERE id = %I.entry_id AND user_id = auth.uid()))',
                                policy_record.policyname,
                                policy_record.schemaname,
                                policy_record.tablename,
                                policy_record.cmd,
                                parent_table,
                                policy_record.tablename
                            );
                        END IF;
                    END;
                ELSE
                    -- Unknown table structure - skip with warning
                    RAISE NOTICE 'Skipping %: no user_id column and not a picks table', policy_record.tablename;
                    CONTINUE;
                END IF;
            END IF;
            
            RAISE NOTICE 'Creating: %', fix_statement;
            EXECUTE fix_statement;
            fixed_count := fixed_count + 1;
            
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Failed to fix %.%: %', policy_record.tablename, policy_record.policyname, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Successfully fixed % policies!', fixed_count;
END $$;

-- ============================================================================
-- Step 3: Verify all policies are now secure
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual as using_clause,
    with_check,
    CASE 
        WHEN qual = 'true' OR with_check = 'true' THEN '❌ STILL INSECURE'
        ELSE '✅ SECURE'
    END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd IN ('UPDATE', 'DELETE', 'INSERT')
ORDER BY 
    CASE WHEN qual = 'true' OR with_check = 'true' THEN 0 ELSE 1 END,
    tablename;
