-- ============================================================
-- RLS FIX v2 — Run this in Supabase SQL Editor
-- ============================================================
-- This version is more aggressive: it drops ALL policies on
-- customers and transactions regardless of name, then creates
-- fresh ones with the ::text cast.
-- ============================================================

-- Step 1: Drop ALL policies on customers (any name)
DO $$ 
DECLARE 
    rec RECORD;
BEGIN
    FOR rec IN SELECT policyname FROM pg_policies WHERE tablename = 'customers' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || rec.policyname || '" ON customers';
    END LOOP;
END $$;

-- Step 2: Drop ALL policies on transactions (any name)
DO $$ 
DECLARE 
    rec RECORD;
BEGIN
    FOR rec IN SELECT policyname FROM pg_policies WHERE tablename = 'transactions' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || rec.policyname || '" ON transactions';
    END LOOP;
END $$;

-- Step 3: Create fresh policies for customers
CREATE POLICY "customers_select" ON customers FOR SELECT
    USING (created_by = auth.uid()::text);

CREATE POLICY "customers_insert" ON customers FOR INSERT
    WITH CHECK (created_by = auth.uid()::text);

CREATE POLICY "customers_update" ON customers FOR UPDATE
    USING (created_by = auth.uid()::text);

CREATE POLICY "customers_delete" ON customers FOR DELETE
    USING (created_by = auth.uid()::text);

-- Step 4: Create fresh policies for transactions
CREATE POLICY "transactions_select" ON transactions FOR SELECT
    USING (
        created_by = auth.uid()::text
        OR customer_id IN (
            SELECT id FROM customers WHERE created_by = auth.uid()::text
        )
    );

CREATE POLICY "transactions_insert" ON transactions FOR INSERT
    WITH CHECK (created_by = auth.uid()::text);

CREATE POLICY "transactions_update" ON transactions FOR UPDATE
    USING (created_by = auth.uid()::text);

CREATE POLICY "transactions_delete" ON transactions FOR DELETE
    USING (created_by = auth.uid()::text);

-- Step 5: Verify
SELECT '✅ DONE. Active policies:' AS status;
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, cmd;