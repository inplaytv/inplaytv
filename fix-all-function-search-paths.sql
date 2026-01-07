-- ============================================================================
-- Fix All Function Search Path Security Issues - DYNAMIC VERSION
-- ============================================================================
-- Sets search_path = '' on ALL public functions
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Generate ALTER FUNCTION statements for ALL public functions
DO $$
DECLARE
    func_record RECORD;
    alter_statement TEXT;
    fixed_count INTEGER := 0;
BEGIN
    FOR func_record IN 
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as identity_args
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.prokind = 'f'
          AND p.proname NOT LIKE 'pg_%'
        ORDER BY p.proname
    LOOP
        BEGIN
            alter_statement := format(
                'ALTER FUNCTION %I.%I(%s) SET search_path = '''';',
                func_record.schema_name,
                func_record.function_name,
                func_record.identity_args
            );
            
            RAISE NOTICE '%', alter_statement;
            EXECUTE alter_statement;
            fixed_count := fixed_count + 1;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Failed to alter %: %', func_record.function_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Successfully set search_path for % functions!', fixed_count;
END $$;
